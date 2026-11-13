# Announcement bar: public list + admin CRUD + permissions + validation
import json
import os
import subprocess
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")


@pytest.fixture(scope="module")
def tokens():
    out = subprocess.check_output(["python", "qa_users.py", "tokens"], cwd="/app/backend")
    return json.loads(out)


def client(tok):
    s = requests.Session()
    s.headers.update({"Authorization": f"Bearer {tok}"})
    return s


@pytest.fixture(scope="module")
def admin(tokens):
    return client(tokens["admin"])


@pytest.fixture(scope="module")
def created():
    ids = []
    yield ids


@pytest.fixture(scope="module", autouse=True)
def cleanup(created, tokens):
    yield
    s = client(tokens["admin"])
    for i in created:
        s.delete(f"{BASE_URL}/api/admin/announcements/{i}")


def test_public_list_only_active():
    r = requests.get(f"{BASE_URL}/api/site/announcements")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert all(a["active"] for a in data)
    assert all("_id" not in a for a in data)
    assert any(a["text"].startswith("New: design your own card templates") for a in data)


def test_unauth_and_nonadmin_forbidden(tokens):
    assert requests.get(f"{BASE_URL}/api/admin/announcements").status_code in (401, 403)
    free = client(tokens["free"])
    assert free.get(f"{BASE_URL}/api/admin/announcements").status_code == 403
    assert free.post(f"{BASE_URL}/api/admin/announcements", json={"text": "TEST_x nope"}).status_code == 403
    assert client(tokens["pro"]).delete(f"{BASE_URL}/api/admin/announcements/whatever").status_code == 403


@pytest.mark.parametrize("payload", [
    {"text": "TEST_bad", "link_url": "javascript:alert(1)"},
    {"text": "TEST_bad", "link_url": "http://insecure.example.com"},
    {"text": "ab"},
    {"text": "TEST_bad", "tone": "purple"},
    {"text": "x" * 181},
])
def test_validation_422(admin, payload):
    r = admin.post(f"{BASE_URL}/api/admin/announcements", json=payload)
    assert r.status_code == 422, r.text


def test_crud_flow(admin, created):
    r = admin.post(f"{BASE_URL}/api/admin/announcements", json={
        "text": "TEST_announce hello", "link_url": "/pricing", "link_label": "See", "tone": "cyan", "order": 50})
    assert r.status_code == 200, r.text
    a = r.json()
    created.append(a["id"])
    assert a["text"] == "TEST_announce hello" and a["tone"] == "cyan" and a["active"] is True
    pub = requests.get(f"{BASE_URL}/api/site/announcements").json()
    assert any(x["id"] == a["id"] for x in pub)
    # admin list
    lst = admin.get(f"{BASE_URL}/api/admin/announcements").json()
    assert any(x["id"] == a["id"] for x in lst)
    # edit -> hide
    r = admin.put(f"{BASE_URL}/api/admin/announcements/{a['id']}", json={**a, "active": False, "text": "TEST_announce edited"})
    assert r.status_code == 200
    e = r.json()
    assert e["active"] is False and e["text"] == "TEST_announce edited"
    assert e["updated_at"] != a["updated_at"]
    pub = requests.get(f"{BASE_URL}/api/site/announcements").json()
    assert not any(x["id"] == a["id"] for x in pub)
    # https link ok
    r = admin.put(f"{BASE_URL}/api/admin/announcements/{a['id']}", json={"text": "TEST_announce ext", "link_url": "https://example.com/x"})
    assert r.status_code == 200
    # bad link on edit
    r = admin.put(f"{BASE_URL}/api/admin/announcements/{a['id']}", json={"text": "TEST_announce ext", "link_url": "javascript:alert(1)"})
    assert r.status_code == 422
    # delete
    assert admin.delete(f"{BASE_URL}/api/admin/announcements/{a['id']}").status_code == 200
    assert admin.delete(f"{BASE_URL}/api/admin/announcements/{a['id']}").status_code == 404
    assert admin.put(f"{BASE_URL}/api/admin/announcements/{a['id']}", json={"text": "TEST_zzz"}).status_code == 404
    created.remove(a["id"])
