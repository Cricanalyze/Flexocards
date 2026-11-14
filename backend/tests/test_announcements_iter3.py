# Iteration 3: extra announcement checks (status codes, edge validations, legal pages)
import json
import os
import subprocess
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")


@pytest.fixture(scope="module")
def tokens():
    return json.loads(subprocess.check_output(["python", "qa_users.py", "tokens"], cwd="/app/backend"))


def sess(tok):
    s = requests.Session()
    s.headers.update({"Authorization": f"Bearer {tok}"})
    return s


def test_signed_out_is_401():
    for m in ("get", "post"):
        r = getattr(requests, m)(f"{BASE_URL}/api/admin/announcements", json={"text": "TEST_x"} if m == "post" else None)
        assert r.status_code == 401, (m, r.status_code)
    assert requests.put(f"{BASE_URL}/api/admin/announcements/x", json={"text": "TEST_x"}).status_code == 401
    assert requests.delete(f"{BASE_URL}/api/admin/announcements/x").status_code == 401


def test_owner_announcements_present_and_order():
    data = requests.get(f"{BASE_URL}/api/site/announcements").json()
    orders = [a["order"] for a in data]
    assert orders == sorted(orders)
    assert all(a["tone"] in ("amber", "cyan", "green", "red") for a in data)


@pytest.mark.parametrize("url,ok", [("", True), ("/blog", True), ("https://x.io/a?b=1", True),
                                    ("//evil.com", True), ("data:text/html,x", False), ("/ space", False), ("ftp://a", False)])
def test_link_validation(tokens, url, ok):
    s = sess(tokens["admin"])
    r = s.post(f"{BASE_URL}/api/admin/announcements", json={"text": "TEST_link check", "link_url": url, "active": False})
    if r.status_code == 200:
        s.delete(f"{BASE_URL}/api/admin/announcements/{r.json()['id']}")
    assert (r.status_code == 200) == ok, (url, r.status_code)
