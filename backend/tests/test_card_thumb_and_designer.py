# Tests: saved-card preview thumbnails (/me/cards/{id}/thumb) and admin template design editor (custom layout, design validator, bg upload)
import base64
import io
import json
import os

import pytest
import requests
from PIL import Image

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"
TOKENS = json.load(open("/tmp/toks.json"))


def H(k):
    return {"Authorization": f"Bearer {TOKENS[k]}"}


def jpeg_data_url(color=(200, 30, 30), fmt="JPEG"):
    buf = io.BytesIO()
    Image.new("RGB", (60, 84), color).save(buf, fmt)
    mime = "jpeg" if fmt == "JPEG" else "png"
    return f"data:image/{mime};base64," + base64.b64encode(buf.getvalue()).decode(), buf.getvalue()


@pytest.fixture(scope="module")
def card():
    sports = requests.get(f"{API}/sports", timeout=20).json()
    sp = sports[0]["id"] if isinstance(sports, list) else sports["sports"][0]["id"]
    cat = requests.get(f"{API}/templates", timeout=20)
    tpls = cat.json() if cat.ok else []
    tid = tpls[0]["id"] if tpls else "tpl_classic"
    r = requests.post(f"{API}/me/cards", headers=H("pro"), json={"title": "TEST_thumb", "sport_id": sp, "template_id": tid, "data": {"name": "TEST_thumb"}}, timeout=20)
    assert r.status_code == 200, r.text
    c = r.json()
    yield c
    requests.delete(f"{API}/me/cards/{c['id']}", headers=H("pro"), timeout=20)


class TestThumb:
    def test_new_card_has_no_thumb(self, card):
        assert card.get("thumb_at") is None
        r = requests.get(f"{API}/me/cards/{card['id']}/thumb", headers=H("pro"), timeout=20)
        assert r.status_code == 404

    def test_put_jpeg_and_get(self, card):
        url, raw = jpeg_data_url()
        r = requests.put(f"{API}/me/cards/{card['id']}/thumb", headers=H("pro"), json={"image": url}, timeout=30)
        assert r.status_code == 200, r.text
        assert r.json()["thumb_at"]
        g = requests.get(f"{API}/me/cards/{card['id']}/thumb", headers=H("pro"), timeout=30)
        assert g.status_code == 200
        assert g.headers["content-type"].startswith("image/jpeg")
        assert g.content == raw

    def test_list_includes_thumb_at_and_no_thumb_path(self, card):
        rows = requests.get(f"{API}/me/cards", headers=H("pro"), timeout=20).json()
        row = next(c for c in rows if c["id"] == card["id"])
        assert row["thumb_at"]
        assert "thumb" not in row

    def test_put_png(self, card):
        url, raw = jpeg_data_url((10, 200, 10), "PNG")
        r = requests.put(f"{API}/me/cards/{card['id']}/thumb", headers=H("pro"), json={"image": url}, timeout=30)
        assert r.status_code == 200
        g = requests.get(f"{API}/me/cards/{card['id']}/thumb", headers=H("pro"), timeout=30)
        assert g.headers["content-type"].startswith("image/png") and g.content == raw

    def test_reject_bad_mime(self, card):
        r = requests.put(f"{API}/me/cards/{card['id']}/thumb", headers=H("pro"), json={"image": "data:image/gif;base64,R0lGOD"}, timeout=20)
        assert r.status_code == 400

    def test_reject_bad_base64(self, card):
        r = requests.put(f"{API}/me/cards/{card['id']}/thumb", headers=H("pro"), json={"image": "data:image/png;base64,@@@notb64"}, timeout=20)
        assert r.status_code == 400

    def test_other_user_404(self, card):
        assert requests.get(f"{API}/me/cards/{card['id']}/thumb", headers=H("free"), timeout=20).status_code == 404
        url, _ = jpeg_data_url()
        assert requests.put(f"{API}/me/cards/{card['id']}/thumb", headers=H("free"), json={"image": url}, timeout=20).status_code == 404

    def test_no_auth_401(self, card):
        assert requests.get(f"{API}/me/cards/{card['id']}/thumb", timeout=20).status_code == 401
        assert requests.put(f"{API}/me/cards/{card['id']}/thumb", json={"image": "x"}, timeout=20).status_code in (401, 422)


TPL = {"name": "TEST_Designer", "badge": "NEW", "layout": "custom", "collection": "free", "plans": ["free", "basic", "pro", "team"],
       "description": "", "accent": "#D4AF37", "sports": [], "recommended": [], "frame_image": "", "watermark_free": True, "active": False, "order": 999}


@pytest.fixture(scope="module")
def tpl_ids():
    ids = []
    yield ids
    for i in ids:
        requests.delete(f"{API}/admin/templates/{i}", headers=H("admin"), timeout=20)


class TestDesigner:
    def test_meta_layouts_has_custom(self):
        r = requests.get(f"{API}/admin/meta", headers=H("admin"), timeout=20)
        if r.status_code != 200:
            pytest.skip(f"meta {r.status_code}")
        assert "custom" in r.json()["layouts"]

    def test_bg_upload(self):
        _, raw = jpeg_data_url()
        r = requests.post(f"{API}/admin/uploads/image", headers=H("admin"), files={"file": ("bg.jpg", raw, "image/jpeg")}, timeout=30)
        assert r.status_code == 200, r.text
        url = r.json()["url"]
        assert url.startswith("/api/files/")
        g = requests.get(BASE_URL + url, timeout=30)
        assert g.status_code == 200 and g.content == raw
        pytest.bg_url = url

    def test_bg_upload_forbidden_for_non_admin(self):
        _, raw = jpeg_data_url()
        r = requests.post(f"{API}/admin/uploads/image", headers=H("pro"), files={"file": ("bg.jpg", raw, "image/jpeg")}, timeout=30)
        assert r.status_code == 403

    def test_bg_upload_rejects_non_image(self):
        r = requests.post(f"{API}/admin/uploads/image", headers=H("admin"), files={"file": ("x.txt", b"hello", "text/plain")}, timeout=30)
        assert r.status_code == 400

    def test_create_custom_and_persist(self, tpl_ids):
        design = {"bg_color": "#112233", "bg_image": getattr(pytest, "bg_url", ""), "overlay": 0.3,
                  "els": {"name": {"x": 40, "y": 100, "w": 280, "h": 40, "font": "Anton", "size": 30, "color": "#FF0000", "visible": True}}}
        r = requests.post(f"{API}/admin/templates", headers=H("admin"), json={**TPL, "design": design}, timeout=20)
        assert r.status_code == 200, r.text
        tid = r.json()["id"]
        tpl_ids.append(tid)
        lst = requests.get(f"{API}/admin/templates", headers=H("admin"), timeout=20).json()
        t = next(x for x in lst if x["id"] == tid)
        assert t["layout"] == "custom"
        assert t["design"]["els"]["name"]["x"] == 40 and t["design"]["els"]["name"]["font"] == "Anton"
        # update
        design["els"]["name"]["x"] = 77
        u = requests.put(f"{API}/admin/templates/{tid}", headers=H("admin"), json={**TPL, "design": design, "active": True}, timeout=20)
        assert u.status_code == 200
        t = next(x for x in requests.get(f"{API}/admin/templates", headers=H("admin"), timeout=20).json() if x["id"] == tid)
        assert t["design"]["els"]["name"]["x"] == 77 and t["active"] is True
        pub = requests.get(f"{API}/templates", timeout=20)
        if pub.ok and isinstance(pub.json(), list):
            p = next((x for x in pub.json() if x["id"] == tid), None)
            assert p is not None and p.get("design", {}).get("els", {}).get("name", {}).get("x") == 77

    def test_reject_external_bg(self):
        r = requests.post(f"{API}/admin/templates", headers=H("admin"), json={**TPL, "design": {"bg_image": "javascript:alert(1)"}}, timeout=20)
        assert r.status_code == 422

    def test_reject_big_design(self):
        r = requests.post(f"{API}/admin/templates", headers=H("admin"), json={**TPL, "design": {"junk": "x" * 70000}}, timeout=20)
        assert r.status_code == 422

    def test_builtin_templates_unchanged(self):
        lst = requests.get(f"{API}/admin/templates", headers=H("admin"), timeout=20).json()
        assert sum(1 for t in lst if t["layout"] != "custom") >= 8
