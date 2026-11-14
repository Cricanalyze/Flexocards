import glob
import io
import os
import urllib.request

from PIL import Image

B = "https://static.prod-images.emergentagent.com/jobs/f5591e54-a975-4816-8fd3-a46c2ab3846b/images/"
# name: (hash, inset fraction to trim baked-in frames)
IMGS = {
    "stadium": ("3d63ce223aa2abee035d3ba30773acacfd506b033430c57d9353b85fad9182d2", 0),
    "pitch": ("38fba971ec1670aaa2298f76a0f49a94a6566cfa993b8a86d3cfee64d4ac2dad", 0),
    "track": ("9ca09768af1e894828d9f12852af93b2ad1f08d72282557570f32464df56e3f8", 0),
    "ice_rink": ("c80f8a6c926b216605d8e6c51bee55babb9d8e7e32b5c298682dcdaef68b4392", 0),
    "carbon": ("c625885507efb5a4da03f708d0e9e15faa624b9ef92f1d312af95a7ec6ab03cf", 0),
    "hardwood": ("6cfe17030dc9bac23ea09af3e613c87f6f945d9aa6e66638b95c435965c7eee6", 0),
    "cricket": ("063cee0d7bfefab6d4abe2ea54abc1144eeea01aae6bee84c81937c7d85b23fa", 0),
    "jersey": ("60d904fda1481d5f53e18b416af0f76f48fc3e3f96b35e18a6c9dd6f2f9975d1", 0),
    "prizm_silver": ("e23ee2500a3576432e0c6063e2730847f00e56e482ac8bfa13aedcf4da7570a0", 0.09),
    "prizm_gold": ("b1cfd943a5d1f9d0642d13e6db35f096a7c3b26d13e3eedb64c693f384b88caf", 0.03),
    "red_wave": ("ce5c3ce38ddb4256ff6a9a9d6a8c2863ec4849d71151be12a21e5915932b3915", 0.09),
    "green_pulsar": ("3e530d072c1f4617e8ed41d5514fa5398b12732f81306fa0622210498c0bc1a2", 0.07),
    "locker": ("13989df0a4c76275e2244b8fd6326b810e3e9f30898ab44ba98248ec361952ab", 0),
    "confetti": ("bc0a5039aadb5c60e6523f4cd08833565592a412a2da59d34c889663d8deb4dc", 0),
    "black_gold": ("f73f202d90098e6ca4454d0724e6e7655104fe80d6a096c44bad1ad19b6094ea", 0.1),
    "led_board": ("7660e6e3ccf998bb9d461fc0d72e84608f98633db1ab3c3a1db915bdcde58377", 0),
    "superfractor": ("e57cdc38a9b9e8a951e3fb97e51cb39ac522f655b6792d130deedecc8f1137ad", 0.08),
    "clay": ("a689913d9da5d91e7787589f55234e976b583b5d25744d417ca40510a8ab25e9", 0),
    "blue_shimmer": ("f78e26403cb9b1c14eeabc121fd43e5465a223d733b390daa05932043decaf66", 0.2),
    "ring": ("7848054c9814a54588c7fa4576a0d25aea069d80b5c97783a603ceec0ed13873", 0),
}
OUT = "/app/frontend/public/templates"
os.makedirs(OUT, exist_ok=True)
for f in glob.glob(f"{OUT}/*.jpg"):
    os.remove(f)
for k, (h, inset) in IMGS.items():
    im = Image.open(io.BytesIO(urllib.request.urlopen(B + h + ".jpeg", timeout=60).read())).convert("RGB")
    w, ht = im.size
    if inset:
        im = im.crop((int(w * inset), int(ht * inset * 0.75), int(w * (1 - inset)), int(ht * (1 - inset * 0.75))))
        w, ht = im.size
    tw, th = (int(ht * 5 / 7), ht) if w / ht > 5 / 7 else (w, int(w * 7 / 5))
    im = im.crop(((w - tw) // 2, (ht - th) // 2, (w - tw) // 2 + tw, (ht - th) // 2 + th)).resize((720, 1008), Image.LANCZOS)
    im.save(f"{OUT}/{k}.jpg", "JPEG", quality=82, optimize=True, progressive=True)
    print(k, os.path.getsize(f"{OUT}/{k}.jpg") // 1024, "KB")
