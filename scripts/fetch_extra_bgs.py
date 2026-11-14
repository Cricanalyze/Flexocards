import io
import os
import urllib.request

from PIL import Image

B = "https://static.prod-images.emergentagent.com/jobs/f5591e54-a975-4816-8fd3-a46c2ab3846b/images/"
OUT = "/app/frontend/public/templates"
for line in open("/app/scripts/extra_bgs.txt"):
    parts = line.split()
    if not parts:
        continue
    k, h, inset = parts[0], parts[1], float(parts[2]) if len(parts) > 2 else 0
    if os.path.exists(f"{OUT}/{k}.jpg"):
        continue
    im = Image.open(io.BytesIO(urllib.request.urlopen(B + h + ".jpeg", timeout=60).read())).convert("RGB")
    w, ht = im.size
    if inset:
        im = im.crop((int(w * inset), int(ht * inset * 0.75), int(w * (1 - inset)), int(ht * (1 - inset * 0.75))))
        w, ht = im.size
    tw, th = (int(ht * 5 / 7), ht) if w / ht > 5 / 7 else (w, int(w * 7 / 5))
    im = im.crop(((w - tw) // 2, (ht - th) // 2, (w - tw) // 2 + tw, (ht - th) // 2 + th)).resize((720, 1008), Image.LANCZOS)
    im.save(f"{OUT}/{k}.jpg", "JPEG", quality=80, optimize=True, progressive=True)
print(len(os.listdir(OUT)), "files")
