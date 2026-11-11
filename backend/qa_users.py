"""QA helper: ensures QA users exist (with plans) and prints session tokens. Usage: python qa_users.py [tokens]"""
import hashlib
import json
import secrets
import sys
import os
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv("/app/backend/.env")
db = MongoClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]
USERS = {"admin": "qa.admin+clerk_test@example.com", "free": "qa.free+clerk_test@example.com", "basic": "qa.basic+clerk_test@example.com",
         "pro": "qa.pro+clerk_test@example.com", "team": "qa.team+clerk_test@example.com"}


def now():
    return datetime.now(timezone.utc)


def ensure(kind, email):
    u = db.users.find_one({"email": email, "status": {"$ne": "deleted"}})
    if not u:
        u = {"user_id": "u_qa_" + kind, "email": email, "name": f"QA {kind.title()}", "role": "user", "status": "active", "permissions": None,
             "favorite_templates": [], "created_at": now().isoformat(), "env": "preview"}
        db.users.insert_one(u)
    if kind == "admin":
        db.users.update_one({"user_id": u["user_id"]}, {"$set": {"role": "super_admin", "permissions": None}})
    if kind in ("basic", "pro", "team") and not db.subscriptions.find_one({"user_id": u["user_id"], "plan_id": kind, "status": "active"}):
        plan = db.plans.find_one({"id": kind}, {"_id": 0})
        db.subscriptions.insert_one({"id": secrets.token_hex(8), "user_id": u["user_id"], "plan_id": kind, "status": "active", "source": "complimentary",
                                     "cycle": "month", "start_at": now().isoformat(), "end_at": (now() + timedelta(days=365)).isoformat(), "created_at": now().isoformat(),
                                     "plan_snapshot": {"name": plan["name"], "type": plan["type"], "price_inr": 0, "interval": "month",
                                                       "cards_per_month": plan["cards_per_month"], "entitlements": plan["entitlements"]},
                                     "history": [{"at": now().isoformat(), "event": "granted", "by": "qa"}]})
    return u


def token(u):
    t = secrets.token_urlsafe(32)
    db.sessions.insert_one({"token_hash": hashlib.sha256(t.encode()).hexdigest(), "user_id": u["user_id"], "email": u["email"], "name": u.get("name", ""),
                            "method": "qa", "created_at": now(), "expires_at": now() + timedelta(days=7)})
    return t


if __name__ == "__main__":
    users = {k: ensure(k, e) for k, e in USERS.items()}
    toks = {k: token(u) for k, u in users.items()}
    print(json.dumps(toks if len(sys.argv) > 1 and sys.argv[1] == "tokens" else {k: u["user_id"] for k, u in users.items()}))
