# Probe: notify_paid builds invoice details + PDF attachment for every payment kind (email send is captured, not sent)
import asyncio
import os
import sys
import uuid

sys.path.insert(0, "/app/backend")
os.chdir("/app/backend")
import server  # noqa: E402

captured = []
server.notify = lambda to, tpl, kind="notice", attachments=None: captured.append((to, tpl, kind, attachments))


async def main():
    for fn in ("load_settings", "startup"):
        pass
    try:
        await server.settings_store.load(server.cfg_db)
    except Exception as e:
        print("settings load:", e)
    ET = server.ET
    kinds = {"plan": ET.receipt("Pro", "month", 199, 50, "2026-12-01", "pay_T"), "pack": ET.purchase("Card pack", 9, [("Added", "5 cards")], "pay_T"),
             "watermark": ET.purchase("Watermark pass", 5, [("Added", "1 passes")], "pay_T"), "storybook": ET.purchase("Storybook", 49, [], "pay_T")}
    ids = []
    for k, tpl in kinds.items():
        pid = "test_np_" + uuid.uuid4().hex[:8]
        ids.append(pid)
        await server.db.payments.insert_one({"id": pid, "user_id": "u_test_np", "user_email": "test_np@example.com", "kind": k, "plan_name": "Pro",
                                             "item_label": None if k == "plan" else f"TEST {k}", "amount_inr": 5, "status": "captured",
                                             "invoice_no": f"TEST-{pid}", "paid_at": server.iso(), "razorpay_payment_id": "pay_T", "billing": {}})
        await server.notify_paid(pid, tpl)
    await server.db.payments.delete_many({"id": {"$in": ids}})
    for to, tpl, kind, att in captured:
        det = dict(tpl["details"])
        print(kind, to, "invoice_no" if det.get("Invoice no", "").startswith("TEST-") else "NO INVOICE", [(a[0], a[1][:5], a[2]) for a in att or []], tpl["paras"][-1][:60])
    print("count", len(captured))


asyncio.run(main())
