# Iteration 3: 70 sports templates, AI photo entitlements/gating, demo images, google config regression
import json
import os
import subprocess
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
TINY_PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="


@pytest.fixture(scope="module")
def tokens():
    return json.loads(subprocess.check_output(["python", "qa_users.py", "tokens"], cwd="/app/backend"))


def sess(tok):
    s = requests.Session()
    s.headers.update({"Authorization": f"Bearer {tok}"})
    return s


@pytest.fixture(scope="module")
def templates():
    r = requests.get(f"{BASE_URL}/api/templates")
    assert r.status_code == 200
    return r.json()


# --- Templates ---
class TestTemplates:
    def test_count_and_layout(self, templates):
        assert len(templates) == 70
        assert all(t["layout"] == "custom" for t in templates)
        assert all("_id" not in t for t in templates)

    def test_bg_images_exist(self, templates):
        bad = []
        for t in templates:
            bg = t.get("design", {}).get("bg_image", "")
            if not bg.startswith("/templates/") or not bg.endswith(".jpg"):
                bad.append((t["id"], bg))
                continue
            r = requests.get(f"{BASE_URL}{bg}")
            if r.status_code != 200 or "image" not in r.headers.get("content-type", ""):
                bad.append((t["id"], bg, r.status_code, r.headers.get("content-type")))
        assert not bad, bad

    def test_tiers_mixed(self, templates):
        tiers = {t["tier"] for t in templates}
        assert "free" in tiers and len(tiers) >= 3
        for t in templates:
            if t["tier"] == "free":
                assert "free" in t["plans"]
            else:
                assert "free" not in t["plans"], t["id"]

    def test_unique_ids(self, templates):
        ids = [t["id"] for t in templates]
        assert len(set(ids)) == len(ids)


# --- AI photo ---
class TestAiPhoto:
    @pytest.mark.parametrize("who,limit", [("free", 0), ("basic", 10), ("pro", 30), ("team", 100)])
    def test_entitlements(self, tokens, who, limit):
        e = sess(tokens[who]).get(f"{BASE_URL}/api/me").json()["entitlements"]
        assert e["ai_photo_limit"] == limit
        assert e["ai_photos_remaining"] == max(0, limit - e["ai_photos_used"])

    def test_free_gets_402(self, tokens):
        r = sess(tokens["free"]).post(f"{BASE_URL}/api/tools/ai-photo", json={"request_id": "TESTfree0001", "image": TINY_PNG, "style": "comic"})
        assert r.status_code == 402, r.text

    def test_unauth_401(self):
        r = requests.post(f"{BASE_URL}/api/tools/ai-photo", json={"request_id": "TESTanon0001", "image": TINY_PNG, "style": "comic"})
        assert r.status_code == 401

    def test_bad_style_422(self, tokens):
        r = sess(tokens["pro"]).post(f"{BASE_URL}/api/tools/ai-photo", json={"request_id": "TESTpro00001", "image": TINY_PNG, "style": "bogus"})
        assert r.status_code == 422

    def test_non_image_400_no_credit(self, tokens):
        s = sess(tokens["pro"])
        before = s.get(f"{BASE_URL}/api/me").json()["entitlements"]["ai_photos_used"]
        r = s.post(f"{BASE_URL}/api/tools/ai-photo", json={"request_id": "TESTpro00002", "image": "data:text/plain;base64,aGk=", "style": "comic"})
        assert r.status_code == 400
        assert s.get(f"{BASE_URL}/api/me").json()["entitlements"]["ai_photos_used"] == before


# --- Demo images & google regression ---
def test_demo_images_exist():
    for f in ["cricket", "football", "basketball", "tennis", "esports", "stadium"]:
        r = requests.get(f"{BASE_URL}/demo/{f}.jpg")
        assert r.status_code == 200 and "image" in r.headers.get("content-type", ""), f


def test_backgrounds_use_local_templates():
    r = requests.get(f"{BASE_URL}/api/backgrounds")
    if r.status_code == 404:
        pytest.skip("no /api/backgrounds endpoint")
    assert r.status_code == 200
    txt = r.text
    assert "unsplash" not in txt and "pexels" not in txt


def test_auth_config_emergent():
    assert requests.get(f"{BASE_URL}/api/auth/config").json()["google"] == "emergent"
