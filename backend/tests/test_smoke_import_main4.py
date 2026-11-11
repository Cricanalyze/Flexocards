# Smoke tests for imported FlexoCards (main4): public API, clerk config, auth guards, email default
import os
import sys
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')
S = requests.Session()


# Health / root
def test_root_ok():
    r = S.get(f"{BASE_URL}/api/", timeout=20)
    assert r.status_code == 200
    print(r.json())


# Clerk config
def test_clerk_config():
    r = S.get(f"{BASE_URL}/api/clerk/config", timeout=20)
    assert r.status_code == 200
    d = r.json()
    assert d.get("enabled") is True
    pk = d.get("publishable_key") or d.get("publishableKey")
    assert isinstance(pk, str) and pk.startswith("pk_")


# Public catalog endpoints
@pytest.mark.parametrize("path", ["/api/sports", "/api/templates", "/api/plans", "/api/blog",
                                  "/api/backgrounds", "/api/site/social", "/api/site/status",
                                  "/api/store", "/api/billing/config"])
def test_public_endpoints(path):
    r = S.get(f"{BASE_URL}{path}", timeout=20)
    assert r.status_code == 200, f"{path} -> {r.status_code} {r.text[:200]}"
    d = r.json()
    assert d is not None
    print(path, type(d).__name__, (len(d) if isinstance(d, (list, dict)) else d))


def test_catalog_nonempty():
    for p in ["/api/sports", "/api/templates", "/api/plans"]:
        d = S.get(f"{BASE_URL}{p}", timeout=20).json()
        items = d if isinstance(d, list) else next((v for v in d.values() if isinstance(v, list)), [])
        assert len(items) > 0, f"{p} empty: {str(d)[:200]}"


# Protected routes require auth
@pytest.mark.parametrize("method,path", [("get", "/api/me"), ("get", "/api/me/cards"), ("get", "/api/me/brand"),
                                         ("get", "/api/me/posts"), ("get", "/api/me/referral"),
                                         ("get", "/api/admin/users"), ("get", "/api/admin/settings"),
                                         ("get", "/api/admin/metrics"), ("post", "/api/billing/checkout")])
def test_protected_401(method, path):
    r = getattr(S, method)(f"{BASE_URL}{path}", json={} if method == "post" else None, timeout=20)
    assert r.status_code == 401, f"{path} -> {r.status_code} {r.text[:200]}"


def test_bad_bearer_401():
    r = S.get(f"{BASE_URL}/api/me", headers={"Authorization": "Bearer garbage"}, timeout=20)
    assert r.status_code == 401


# Email default provider (code-level, no email sent)
def test_email_env_default_smtp():
    sys.path.insert(0, "/app/backend")
    from dotenv import load_dotenv
    load_dotenv("/app/backend/.env")
    import settings_store
    d = settings_store.env_defaults("email")
    assert d["provider"] == "smtp"
    assert d["smtp_port"] == 465 and d["smtp_secure"] == "ssl"
    assert d["smtp_from_email"] == "noreply@cricanalyze.in"
