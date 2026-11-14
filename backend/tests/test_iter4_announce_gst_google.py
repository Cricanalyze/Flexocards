# Iteration 4: announcements CRUD, GST publish toggle, Google sign-in mode (emergent/own/off), legal pages
import json
import os
import subprocess
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
GSTIN = "29ABCDE1234F1Z5"


@pytest.fixture(scope="module")
def tokens():
    return json.loads(subprocess.check_output(["python", "qa_users.py", "tokens"], cwd="/app/backend"))


def sess(tok):
    s = requests.Session()
    s.headers.update({"Authorization": f"Bearer {tok}"})
    return s


@pytest.fixture(scope="module")
def admin(tokens):
    return sess(tokens["admin"])


# --- Announcements ---
class TestAnnouncements:
    def test_public_only_active(self):
        r = requests.get(f"{BASE_URL}/api/site/announcements")
        assert r.status_code == 200
        assert all(a["active"] for a in r.json())
        assert all("_id" not in a for a in r.json())

    def test_non_admin_forbidden(self, tokens):
        r = sess(tokens["free"]).get(f"{BASE_URL}/api/admin/announcements")
        assert r.status_code == 403
        r = sess(tokens["free"]).post(f"{BASE_URL}/api/admin/announcements", json={"text": "TEST_nope"})
        assert r.status_code == 403

    def test_crud_flow(self, admin):
        r = admin.post(f"{BASE_URL}/api/admin/announcements", json={"text": "TEST_ann iter4", "link_url": "/pricing", "link_label": "Go", "tone": "cyan", "order": 2, "active": False})
        assert r.status_code == 200, r.text
        a = r.json()
        aid = a["id"]
        try:
            assert a["tone"] == "cyan" and a["active"] is False and a["order"] == 2
            ids = [x["id"] for x in admin.get(f"{BASE_URL}/api/admin/announcements").json()]
            assert aid in ids
            assert aid not in [x["id"] for x in requests.get(f"{BASE_URL}/api/site/announcements").json()]
            r = admin.put(f"{BASE_URL}/api/admin/announcements/{aid}", json={**{k: a[k] for k in ("text", "link_url", "link_label", "tone", "order")}, "active": True, "text": "TEST_ann edited"})
            assert r.status_code == 200 and r.json()["active"] is True and r.json()["text"] == "TEST_ann edited"
            pub = requests.get(f"{BASE_URL}/api/site/announcements").json()
            assert aid in [x["id"] for x in pub]
        finally:
            d = admin.delete(f"{BASE_URL}/api/admin/announcements/{aid}")
        assert d.status_code == 200
        assert admin.delete(f"{BASE_URL}/api/admin/announcements/{aid}").status_code == 404
        assert admin.put(f"{BASE_URL}/api/admin/announcements/{aid}", json={"text": "TEST_x y"}).status_code == 404

    @pytest.mark.parametrize("body", [{"text": "ab"}, {"text": "TEST_ok", "link_url": "http://x.com"}, {"text": "TEST_ok", "link_url": "javascript:alert(1)"},
                                      {"text": "TEST_ok", "tone": "pink"}, {"text": "x" * 181}])
    def test_validation(self, admin, body):
        r = admin.post(f"{BASE_URL}/api/admin/announcements", json={**body, "active": False})
        if r.status_code == 200:
            admin.delete(f"{BASE_URL}/api/admin/announcements/{r.json()['id']}")
        assert r.status_code == 422, (body, r.status_code)


# --- GST publish toggle ---
class TestGst:
    def test_publish_flow(self, admin):
        orig = admin.get(f"{BASE_URL}/api/admin/settings").json()["invoice"]
        assert orig["gst_enabled"] is False
        assert requests.get(f"{BASE_URL}/api/billing/config").json()["gst"] is False
        try:
            r = admin.put(f"{BASE_URL}/api/admin/settings/invoice", json={**orig, "gstin": "", "gst_enabled": True})
            assert r.status_code == 400 and "GSTIN" in r.json()["detail"]
            assert requests.get(f"{BASE_URL}/api/billing/config").json()["gst"] is False
            r = admin.put(f"{BASE_URL}/api/admin/settings/invoice", json={**orig, "gstin": GSTIN, "gst_enabled": False})
            assert r.status_code == 200
            assert requests.get(f"{BASE_URL}/api/billing/config").json()["gst"] is False  # GSTIN alone does not publish
            r = admin.put(f"{BASE_URL}/api/admin/settings/invoice", json={**orig, "gstin": GSTIN, "gst_enabled": True})
            assert r.status_code == 200 and r.json()["gst_enabled"] is True
            assert requests.get(f"{BASE_URL}/api/billing/config").json()["gst"] is True
        finally:
            r = admin.put(f"{BASE_URL}/api/admin/settings/invoice", json=orig)
            assert r.status_code == 200
        after = admin.get(f"{BASE_URL}/api/admin/settings").json()["invoice"]
        assert after["gst_enabled"] is False and after["gstin"] == ""
        assert requests.get(f"{BASE_URL}/api/billing/config").json()["gst"] is False


# --- Google sign-in mode ---
class TestGoogle:
    def test_default_emergent(self):
        assert requests.get(f"{BASE_URL}/api/auth/config").json()["google"] == "emergent"

    def test_bogus_session_401(self):
        r = requests.post(f"{BASE_URL}/api/auth/emergent/session", json={"session_id": "bogus-session-123"})
        assert r.status_code == 401
        assert "detail" in r.json()

    def test_short_session_422(self):
        assert requests.post(f"{BASE_URL}/api/auth/emergent/session", json={"session_id": "x"}).status_code == 422

    def test_toggle_modes(self, admin, tokens):
        g0 = admin.get(f"{BASE_URL}/api/admin/settings").json().get("google", {})
        try:
            r = admin.put(f"{BASE_URL}/api/admin/settings/google-mode", json={"enabled": False, "provider": "emergent"})
            assert r.status_code == 200 and r.json()["enabled"] is False and r.json()["connected"] is False
            assert requests.get(f"{BASE_URL}/api/auth/config").json()["google"] is None
            r = requests.post(f"{BASE_URL}/api/auth/emergent/session", json={"session_id": "bogus-session-123"})
            assert r.status_code == 403
            assert requests.get(f"{BASE_URL}/api/auth/google/start", allow_redirects=False).status_code == 503
            # own without keys -> null
            r = admin.put(f"{BASE_URL}/api/admin/settings/google-mode", json={"enabled": True, "provider": "own"})
            assert r.status_code == 200
            exp = "own" if r.json()["has_keys"] else None
            assert requests.get(f"{BASE_URL}/api/auth/config").json()["google"] == exp
            assert requests.post(f"{BASE_URL}/api/auth/emergent/session", json={"session_id": "bogus-session-123"}).status_code == 403
            assert admin.put(f"{BASE_URL}/api/admin/settings/google-mode", json={"enabled": True, "provider": "foo"}).status_code == 422
            assert sess(tokens["free"]).put(f"{BASE_URL}/api/admin/settings/google-mode", json={"enabled": False, "provider": "emergent"}).status_code == 403
        finally:
            r = admin.put(f"{BASE_URL}/api/admin/settings/google-mode", json={"enabled": True, "provider": "emergent"})
        assert r.status_code == 200 and r.json()["connected"] is True
        assert requests.get(f"{BASE_URL}/api/auth/config").json()["google"] == "emergent"
        print("google view before:", g0)


# --- Regression: session + me ---
def test_session_and_me(tokens):
    s = sess(tokens["pro"])
    assert s.get(f"{BASE_URL}/api/auth/session").status_code == 200
    me = s.get(f"{BASE_URL}/api/me")
    assert me.status_code == 200 and me.json()["member"]["email"].startswith("qa.pro")
