from datetime import datetime

from fpdf import FPDF


def _money(n) -> str:
    return f"Rs. {float(n or 0):.2f}"


def _clean(s) -> str:
    return str(s or "").replace("₹", "Rs. ").replace("·", "-").encode("latin-1", "replace").decode("latin-1")


def invoice_pdf(inv: dict) -> bytes:
    pdf = FPDF(unit="mm", format="A4")
    pdf.set_auto_page_break(False)
    pdf.add_page()
    W = 210
    t = lambda x, y, s, align="L": pdf.text(x - (pdf.get_string_width(_clean(s)) if align == "R" else 0), y, _clean(s))
    pdf.set_fill_color(11, 26, 58); pdf.rect(0, 0, W, 34, "F")
    pdf.set_text_color(245, 180, 0); pdf.set_font("helvetica", "BI", 22); t(15, 20, "FlexoCards")
    pdf.set_text_color(255, 255, 255); pdf.set_font("helvetica", "B", 16); t(W - 15, 16, inv["title"].upper(), "R")
    pdf.set_font("helvetica", "", 9)
    date = (inv.get("date") or "")[:10]
    try:
        date = datetime.fromisoformat(date).strftime("%d/%m/%Y")
    except ValueError:
        pass
    t(W - 15, 23, f"No. {inv['number']}", "R"); t(W - 15, 28, f"Date: {date}", "R")
    pdf.set_text_color(30, 41, 59)
    s, b = inv["seller"], inv["buyer"]
    pdf.set_font("helvetica", "B", 9); t(15, 46, "FROM"); t(110, 46, "BILL TO")
    pdf.set_font("helvetica", "", 10)
    left = [s["legal_name"], *([s["address"][i:i + 48] for i in range(0, len(s["address"]), 48)] if s.get("address") else []),
            s.get("state") and f"State: {s['state']}{' (' + s['state_code'] + ')' if s.get('state_code') else ''}",
            s.get("gstin") and f"GSTIN: {s['gstin']}", s.get("email"), s.get("phone")]
    right = [b.get("name"), b.get("email") != b.get("name") and b.get("email"), b.get("state") and f"State: {b['state']}", b.get("gstin") and f"GSTIN: {b['gstin']}"]
    left, right = [x for x in left if x], [x for x in right if x]
    for i, line in enumerate(left):
        t(15, 52 + i * 5, line)
    for i, line in enumerate(right):
        t(110, 52 + i * 5, line)
    y = 58 + max(len(left), len(right)) * 5
    pdf.set_fill_color(241, 245, 249); pdf.rect(15, y, W - 30, 8, "F")
    pdf.set_font("helvetica", "B", 9)
    for h, x in (("Description", 18), ("SAC", 110), ("Price", 130), ("Discount", 152)):
        t(x, y + 5.5, h)
    t(W - 18, y + 5.5, "Taxable", "R")
    pdf.set_font("helvetica", "", 9)
    y += 14
    for ln in inv["lines"]:
        t(18, y, ln["desc"][:52]); t(110, y, ln.get("sac") or ""); t(130, y, _money(ln["list_price"])); t(152, y, _money(ln["discount"])); t(W - 18, y, _money(ln["taxable"]), "R")
        y += 7
    pdf.set_draw_color(203, 213, 225); pdf.line(110, y, W - 15, y)
    y += 7

    def row(k, v, bold=False):
        nonlocal y
        pdf.set_font("helvetica", "B" if bold else "", pdf.font_size_pt)
        t(130, y, k); t(W - 18, y, v, "R")
        y += 6
    row("Taxable value", _money(inv["taxable"]))
    for tx in inv["taxes"]:
        row(tx["name"], _money(tx["amount"]))
    if inv.get("coupon"):
        row(f"Coupon {inv['coupon']}", "applied")
    pdf.set_font_size(12); row("Total paid", _money(inv["total"]), True); pdf.set_font("helvetica", "", 9)
    y += 6
    pdf.set_text_color(100, 116, 139)
    t(15, y, f"Payment ID: {inv.get('payment_id') or '-'} - Status: {inv['status']}")
    if not s.get("gstin"):
        t(15, y + 5, "This is a payment receipt. A GST tax invoice is issued once the seller's GSTIN is registered.")
    t(15, 285, "This is a computer-generated document and does not need a signature.")
    return bytes(pdf.output())
