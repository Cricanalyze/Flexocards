"""FlexoCards own sign-in: 6-digit email codes + Google OAuth (owner's credentials). Opaque session cookie."""
import hashlib
import hmac
import re
import secrets
import time
import uuid
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.responses import RedirectResponse
from pymongo import ReturnDocument
from pydantic import BaseModel, ConfigDict, Field

router = APIRouter(prefix="/api/auth")
COOKIE = "fc_session"
SESSION_DAYS = 30
CODE_MINUTES = 10
MAX_TRIES = 5
_ctx = {}


def bind(get_db, send_code, get_google):
    _ctx.update(get_db=get_db, send_code=send_code, get_google=get_google)


def _db():
    return _ctx["get_db"]()


def _now():
    return datetime.now(timezone.utc)


def _h(v: str) -> str:
    return hashlib.sha256(v.encode()).hexdigest()


def _norm(email: str) -> str:
    return (email or "").strip().lower()


def _ip(request: Request) -> str:
    return (request.headers.get("x-forwarded-for") or (request.client.host if request.client else "")).split(",")[-1].strip()


def _origin(request: Request) -> str:
    host = (request.headers.get("x-forwarded-host") or request.headers.get("host", "")).split(",")[0].strip()
    proto = (request.headers.get("x-forwarded-proto") or "https").split(",")[0].strip()
    return f"{'http' if proto == 'http' and host.startswith('localhost') else 'https'}://{host}"


def _safe_next(n: str) -> str:
    return n if n and n.startswith("/") and not n.startswith("//") else "/"


async def _rate(key: str, limit: int, window: int):
    t = time.time()
    db = _db()
    await db.auth_rate.insert_one({"key": key, "at": t, "exp": _now() + timedelta(seconds=window)})
    if await db.auth_rate.count_documents({"key": key, "at": {"$gt": t - window}}) > limit:
        raise HTTPException(429, "Too many attempts. Please wait a few minutes and try again.")


async def _user_for(email: str, name: str = "") -> dict:
    db = _db()
    u = await db.users.find_one({"email": {"$regex": f"^{re.escape(email)}$", "$options": "i"}, "status": {"$ne": "deleted"}}, {"_id": 0, "user_id": 1}, sort=[("created_at", 1)])
    if u:
        return {"user_id": u["user_id"], "new": False}
    uid = "u_" + uuid.uuid4().hex
    return {"user_id": uid, "new": True}


async def _start_session(response: Response, request: Request, email: str, name: str, method: str) -> dict:
    u = await _user_for(email, name)
    token = secrets.token_urlsafe(32)
    await _db().sessions.insert_one({"token_hash": _h(token), "user_id": u["user_id"], "email": email, "name": name or email.split("@")[0],
                                     "method": method, "ip": _ip(request), "created_at": _now(), "expires_at": _now() + timedelta(days=SESSION_DAYS)})
    response.set_cookie(COOKIE, token, max_age=SESSION_DAYS * 86400, httponly=True, secure=True, samesite="lax", path="/")
    return u


async def require_user(request: Request) -> dict:
    token = request.cookies.get(COOKIE, "")
    auth = request.headers.get("authorization", "")
    if not token and auth.lower().startswith("bearer "):
        token = auth[7:]
    if not token:
        raise HTTPException(401, "Not signed in")
    s = await _db().sessions.find_one({"token_hash": _h(token)}, {"_id": 0})
    exp = s and s["expires_at"]
    if exp and exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if not s or exp < _now():
        raise HTTPException(401, "Your session has expired. Please sign in again.")
    return {"user_id": s["user_id"], "email": s["email"], "name": s.get("name", ""), "session_hash": s["token_hash"]}


def has_session(request: Request) -> bool:
    return bool(request.cookies.get(COOKIE) or request.headers.get("authorization"))


async def revoke_sessions(user_id: str) -> int:
    return (await _db().sessions.delete_many({"user_id": user_id})).deleted_count


async def prepare_indexes():
    db = _db()
    await db.sessions.create_index("token_hash", unique=True)
    await db.sessions.create_index("user_id")
    await db.sessions.create_index("expires_at", expireAfterSeconds=0)
    await db.otp_codes.create_index("email")
    await db.otp_codes.create_index("expires_at", expireAfterSeconds=0)
    await db.auth_rate.create_index("key")
    await db.auth_rate.create_index("exp", expireAfterSeconds=0)


def _google():
    g = _ctx["get_google"]()
    return g["client_id"].strip(), g["client_secret"].strip()


@router.get("/config")
async def auth_config():
    cid, sec = _google()
    return {"google": bool(cid and sec), "code_minutes": CODE_MINUTES}


class CodeIn(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    email: str = Field(min_length=5, max_length=200, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class VerifyIn(CodeIn):
    code: str = Field(pattern=r"^\d{6}$")


@router.post("/otp/request")
async def otp_request(body: CodeIn, request: Request):
    email = _norm(body.email)
    await _rate(f"otp-ip:{_ip(request)}", 10, 600)
    await _rate(f"otp-mail:{email}", 5, 900)
    code = f"{secrets.randbelow(10 ** 6):06d}"
    db = _db()
    await db.otp_codes.delete_many({"email": email})
    await db.otp_codes.insert_one({"email": email, "code_hash": _h(f"{email}:{code}"), "tries": 0, "created_at": _now(),
                                   "expires_at": _now() + timedelta(minutes=CODE_MINUTES)})
    if not await _ctx["send_code"](email, code, CODE_MINUTES):
        await db.otp_codes.delete_many({"email": email})
        raise HTTPException(502, "We couldn't send the code right now. Please try again in a minute.")
    return {"ok": True, "minutes": CODE_MINUTES}


@router.post("/otp/verify")
async def otp_verify(body: VerifyIn, request: Request, response: Response):
    email = _norm(body.email)
    await _rate(f"otp-verify-ip:{_ip(request)}", 30, 600)
    db = _db()
    rec = await db.otp_codes.find_one({"email": email}, {"_id": 0})
    exp = rec and rec["expires_at"]
    if exp and exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if not rec or exp < _now():
        raise HTTPException(400, "This code has expired. Ask for a new one.")
    rec = await db.otp_codes.find_one_and_update({"email": email}, {"$inc": {"tries": 1}}, projection={"_id": 0}, return_document=ReturnDocument.AFTER)
    if not rec or rec["tries"] > MAX_TRIES:
        await db.otp_codes.delete_many({"email": email})
        raise HTTPException(429, "Too many wrong codes. Ask for a new one.")
    if not hmac.compare_digest(rec["code_hash"], _h(f"{email}:{body.code}")):
        left = MAX_TRIES - rec["tries"]
        raise HTTPException(400, f"That code isn't right. {left} {'try' if left == 1 else 'tries'} left." if left else "Too many wrong codes. Ask for a new one.")
    await db.otp_codes.delete_many({"email": email})
    u = await _start_session(response, request, email, "", "email")
    return {"ok": True, "new": u["new"]}


@router.post("/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get(COOKIE, "")
    if token:
        await _db().sessions.delete_one({"token_hash": _h(token)})
    response.delete_cookie(COOKIE, path="/", secure=True, httponly=True, samesite="lax")
    return {"ok": True}


@router.get("/session")
async def session(request: Request):
    try:
        u = await require_user(request)
    except HTTPException:
        return {"signed_in": False}
    return {"signed_in": True, "user_id": u["user_id"], "email": u["email"], "name": u["name"]}


@router.get("/google/start")
async def google_start(request: Request, next: str = "/"):
    cid, sec = _google()
    if not (cid and sec):
        raise HTTPException(503, "Google sign-in is not set up yet.")
    state = secrets.token_urlsafe(24)
    params = {"client_id": cid, "redirect_uri": f"{_origin(request)}/api/auth/google/callback", "response_type": "code",
              "scope": "openid email profile", "state": state, "prompt": "select_account"}
    r = RedirectResponse("https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params), status_code=302)
    r.set_cookie("fc_gstate", f"{state}|{_safe_next(next)}", max_age=600, httponly=True, secure=True, samesite="lax", path="/api/auth/google")
    return r


@router.get("/google/callback")
async def google_callback(request: Request, code: str = "", state: str = "", error: str = ""):
    saved, _, nxt = request.cookies.get("fc_gstate", "").partition("|")
    fail = lambda msg: RedirectResponse(f"/sign-in?error={msg}", status_code=302)
    if error or not code or not saved or not hmac.compare_digest(saved, state):
        return fail("google_cancelled" if error else "google_state")
    cid, sec = _google()
    try:
        async with httpx.AsyncClient(timeout=15) as c:
            tok = await c.post("https://oauth2.googleapis.com/token", data={"code": code, "client_id": cid, "client_secret": sec,
                               "redirect_uri": f"{_origin(request)}/api/auth/google/callback", "grant_type": "authorization_code"})
            tok.raise_for_status()
            info = await c.get("https://openidconnect.googleapis.com/v1/userinfo", headers={"Authorization": f"Bearer {tok.json()['access_token']}"})
            info.raise_for_status()
            info = info.json()
    except (httpx.HTTPError, KeyError):
        return fail("google_failed")
    if not info.get("email") or not info.get("email_verified"):
        return fail("google_unverified")
    r = RedirectResponse(_safe_next(nxt), status_code=302)
    await _start_session(r, request, _norm(info["email"]), info.get("name", ""), "google")
    r.delete_cookie("fc_gstate", path="/api/auth/google")
    return r
