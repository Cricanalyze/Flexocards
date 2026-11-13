# Tests: own auth (email OTP + session cookie + logout + admin revoke/suspend + google 503) and invoices for captured payments
import hashlib
import json
import os
import subprocess
import sys
import time
import uuid
from datetime import datetime, timedelta, timezone

import pytest
import requests
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv("/app/backend/.env")
BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"
db = MongoClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]
TOKENS = json.loads(subprocess.check_output([sys.executable, "/app/backend/qa_users.py", "tokens"]).decode().strip().splitlines()[-1])
ADMIN_EMAIL = "qa.admin+clerk_test@example.com"
RUN = uuid.uuid4().hex[:8]


def C(k):
    return {"Cookie": f"fc_session={TOKENS[k]}"}


def now():
    return datetime.now(timezone.utc)


def put_code(email, code="123456", minutes=10, tries=0):
    db.otp_codes.delete_many({"email": email})
    db.otp_codes.insert_one({"email": email, "code_hash": hashlib.sha256(f"{email}:{code}".encode()).hexdigest(), "tries": tries,
                             "created_at": now(), "expires_at": now() + timedelta(minutes=minutes)})


def sign_in(email, code="424200", send_as=None):
    put_code(email.lower(), code)
    s = requests.Session()
    r = s.post(f"{API}/auth/otp/verify", json={"email": send_as or email, "code": code}, timeout=20)
    return s, r


@pytest.fixture(scope="module")
def created_users():
    ids = []
    yield ids
    for uid in ids:
        db.sessions.delete_many({"user_id": uid})
        db.users.delete_one({"user_id": uid, "email": {"$regex": "^test_"}})


# ---- config / google ----
class TestConfig:
    def test_config(self):
        r = requests.get(f"{API}/auth/config", timeout=20)
        assert r.status_code == 200
        assert r.json() == {"google": False, "code_minutes": 10}

    def test_google_start_503(self):
        r = requests.get(f"{API}/auth/google/start", allow_redirects=False, timeout=20)
        assert r.status_code == 503
        assert "Google" in r.json()["detail"]

    def test_me_401_without_cookie(self):
        r = requests.get(f"{API}/me", timeout=20)
        assert r.status_code == 401

    def test_session_signed_out(self):
        assert requests.get(f"{API}/auth/session", timeout=20).json() == {"signed_in": False}


# ---- otp request validation + rate limits (no real sends) ----
class TestOtpRequest:
    @pytest.mark.parametrize("email", ["notanemail", "a@b", "x y@ex.com", ""])
    def test_invalid_email_422(self, email):
        r = requests.post(f"{API}/auth/otp/request", json={"email": email}, timeout=20)
        assert r.status_code == 422

    def test_email_rate_limit_429_and_ip_spoof_check(self):
        email = f"test_rl_{RUN}@example.com"
        for _ in range(5):
            db.auth_rate.insert_one({"key": f"otp-mail:{email}", "at": time.time(), "exp": now() + timedelta(minutes=15)})
        spoof = f"203.0.113.{int(RUN[:2], 16) % 250}"
        r = requests.post(f"{API}/auth/otp/request", json={"email": email.upper()}, headers={"X-Forwarded-For": spoof}, timeout=20)
        assert r.status_code == 429, r.text
        assert db.otp_codes.count_documents({"email": email}) == 0  # nothing sent
        spoofed = db.auth_rate.count_documents({"key": f"otp-ip:{spoof}"})
        print(f"IP key stored as spoofed XFF value: {bool(spoofed)}")
        assert not spoofed, "client-supplied X-Forwarded-For is trusted for IP rate limiting (bypassable)"
        db.auth_rate.delete_many({"key": {"$in": [f"otp-mail:{email}", f"otp-ip:{spoof}"]}})


# ---- otp verify ----
class TestOtpVerify:
    def test_no_code_400(self):
        r = requests.post(f"{API}/auth/otp/verify", json={"email": f"test_none_{RUN}@example.com", "code": "111111"}, timeout=20)
        assert r.status_code == 400 and "expired" in r.json()["detail"]

    def test_bad_code_format_422(self):
        r = requests.post(f"{API}/auth/otp/verify", json={"email": f"test_x_{RUN}@example.com", "code": "12ab56"}, timeout=20)
        assert r.status_code == 422

    def test_expired_400(self):
        email = f"test_exp_{RUN}@example.com"
        put_code(email, "222222", minutes=-1)
        r = requests.post(f"{API}/auth/otp/verify", json={"email": email, "code": "222222"}, timeout=20)
        assert r.status_code == 400 and "expired" in r.json()["detail"]
        db.otp_codes.delete_many({"email": email})

    def test_wrong_codes_lockout(self):
        email = f"test_lock_{RUN}@example.com"
        put_code(email, "333333")
        msgs = []
        for _ in range(5):
            r = requests.post(f"{API}/auth/otp/verify", json={"email": email, "code": "000000"}, timeout=20)
            assert r.status_code == 400
            msgs.append(r.json()["detail"])
        assert "4 tries left" in msgs[0] and "1 try left" in msgs[3] and "Too many" in msgs[4]
        r = requests.post(f"{API}/auth/otp/verify", json={"email": email, "code": "333333"}, timeout=20)
        assert r.status_code == 429  # correct code rejected after 5 wrong
        assert db.otp_codes.count_documents({"email": email}) == 0

    def test_new_user_success_cookie_session_logout(self, created_users):
        email = f"test_new_{RUN}@example.com"
        s, r = sign_in(email, send_as=email.upper())
        assert r.status_code == 200, r.text
        assert r.json() == {"ok": True, "new": True}
        sc = r.headers.get("set-cookie", "")
        assert "fc_session=" in sc and "HttpOnly" in sc and "Secure" in sc  # SameSite rewritten by preview ingress to None; Partitioned
        sess = s.get(f"{API}/auth/session", timeout=20).json()
        assert sess["signed_in"] and sess["email"] == email and sess["user_id"].startswith("u_")
        created_users.append(sess["user_id"])
        me = s.get(f"{API}/me", timeout=20)
        assert me.status_code == 200 and me.json()["member"]["email"] == email and me.json()["member"]["role"] == "user"
        # code is single-use
        r2 = requests.post(f"{API}/auth/otp/verify", json={"email": email, "code": "424200"}, timeout=20)
        assert r2.status_code == 400
        # logout
        tok = s.cookies.get("fc_session")
        lo = s.post(f"{API}/auth/logout", timeout=20)
        assert lo.status_code == 200 and 'fc_session=""' in lo.headers.get("set-cookie", "") or "Max-Age=0" in lo.headers.get("set-cookie", "")
        assert db.sessions.count_documents({"token_hash": hashlib.sha256(tok.encode()).hexdigest()}) == 0
        assert requests.get(f"{API}/me", headers={"Cookie": f"fc_session={tok}"}, timeout=20).status_code == 401

    def test_existing_admin_matched_by_email(self):
        s, r = sign_in(ADMIN_EMAIL)
        assert r.status_code == 200 and r.json()["new"] is False
        me = s.get(f"{API}/me", timeout=20).json()["member"]
        assert me["user_id"].startswith("user_") and me["role"] == "super_admin"
        assert s.get(f"{API}/admin/users", timeout=20).status_code == 200
        s.post(f"{API}/auth/logout", timeout=20)

    def test_bearer_also_accepted(self):
        r = requests.get(f"{API}/me", headers={"Authorization": f"Bearer {TOKENS['pro']}"}, timeout=20)
        assert r.status_code == 200


# ---- admin revoke / suspend ----
class TestAdminSessions:
    def test_revoke_sessions(self, created_users):
        email = f"test_rev_{RUN}@example.com"
        s, r = sign_in(email)
        assert r.status_code == 200
        uid = s.get(f"{API}/auth/session", timeout=20).json()["user_id"]
        created_users.append(uid)
        s.get(f"{API}/me", timeout=20)  # materialise user row
        rv = requests.post(f"{API}/admin/users/{uid}/revoke-sessions", headers=C("admin"), timeout=20)
        assert rv.status_code == 200 and rv.json()["revoked"] >= 1
        assert s.get(f"{API}/auth/session", timeout=20).json() == {"signed_in": False}
        assert s.get(f"{API}/me", timeout=20).status_code == 401

    def test_non_admin_cannot_revoke(self):
        r = requests.post(f"{API}/admin/users/u_nope/revoke-sessions", headers=C("free"), timeout=20)
        assert r.status_code in (403, 404)

    def test_suspend_revokes_and_blocks(self, created_users):
        email = f"test_sus_{RUN}@example.com"
        s, r = sign_in(email)
        uid = s.get(f"{API}/auth/session", timeout=20).json()["user_id"]
        created_users.append(uid)
        s.get(f"{API}/me", timeout=20)
        p = requests.patch(f"{API}/admin/users/{uid}", headers=C("admin"), json={"status": "suspended", "reason": "TEST"}, timeout=20)
        assert p.status_code == 200 and p.json()["sessions_revoked"] >= 1
        assert s.get(f"{API}/me", timeout=20).status_code == 401
        s2, r2 = sign_in(email, "555111")
        assert r2.status_code == 200  # can get a cookie...
        assert s2.get(f"{API}/me", timeout=20).status_code == 403  # ...but account is blocked


# ---- invoices ----
@pytest.fixture(scope="module")
def pro_payment():
    me = requests.get(f"{API}/me", headers=C("pro"), timeout=20).json()["member"]
    pid = f"test_pay_{RUN}"
    doc = {"id": pid, "user_id": me["user_id"], "user_email": me["email"], "kind": "watermark", "item_label": "TEST_ Watermark pass x1", "qty": 1,
           "amount_inr": 5, "list_price_inr": 5, "discount_inr": 0, "currency": "INR", "status": "captured", "invoice_no": f"TEST-2026-{RUN}",
           "razorpay_payment_id": "pay_TEST123", "paid_at": now().isoformat(), "created_at": now().isoformat(), "billing": {}, "history": []}
    db.payments.insert_one(doc)
    yield doc
    db.payments.delete_one({"id": pid})


class TestInvoices:
    def test_my_invoice(self, pro_payment):
        r = requests.get(f"{API}/me/payments/{pro_payment['id']}/invoice", headers=C("pro"), timeout=20)
        assert r.status_code == 200, r.text
        inv = r.json()
        assert inv["number"] == pro_payment["invoice_no"] and inv["total"] == 5.0 and inv["status"] == "captured"
        assert inv["lines"][0]["desc"] == "TEST_ Watermark pass x1"
        assert inv["buyer"]["email"] == pro_payment["user_email"]

    def test_other_user_404(self, pro_payment):
        assert requests.get(f"{API}/me/payments/{pro_payment['id']}/invoice", headers=C("free"), timeout=20).status_code == 404

    def test_admin_invoice(self, pro_payment):
        r = requests.get(f"{API}/admin/payments/{pro_payment['id']}/invoice", headers=C("admin"), timeout=20)
        assert r.status_code == 200 and r.json()["number"] == pro_payment["invoice_no"]

    def test_listed_in_me_payments(self, pro_payment):
        pays = requests.get(f"{API}/me", headers=C("pro"), timeout=20).json()["payments"]
        assert any(p["id"] == pro_payment["id"] and p["invoice_no"] == pro_payment["invoice_no"] for p in pays)

    def test_pdf_builds_for_all_kinds(self, pro_payment):
        sys.path.insert(0, "/app/backend")
        from invoice_pdf import invoice_pdf
        inv = requests.get(f"{API}/me/payments/{pro_payment['id']}/invoice", headers=C("pro"), timeout=20).json()
        for label in ("Pro plan", "Card pack ₹9 · 5 cards", "Watermark pass", "Storybook · 30 days"):
            pdf = invoice_pdf({**inv, "lines": [{**inv["lines"][0], "desc": label}]})
            assert pdf[:5] == b"%PDF-" and len(pdf) > 1000
