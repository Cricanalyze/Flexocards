"""20 FlexoCards template designs (layout "custom"), each with painted background art in /templates/<id>.jpg."""

MONO = {"font": "JetBrains Mono", "weight": 500}
SINGLE_WEIGHT = {"Anton", "Bebas Neue", "Permanent Marker", "Russo One"}


def _hero(F, w):
    return {"grad": 0.92, "overlay": 0.05, "els": {
        "photo": {"x": 22, "y": 22, "w": 316, "h": 300, "radius": 14, "fade": 0.3, "border_width": 2, "border_accent": True, "glow": True},
        "rating": {"x": 32, "y": 32, "w": 58, "h": 54, "font": F, "size": 34, "weight": w, "align": "center", "bg_accent": True, "bg_alpha": 1, "radius": 10, "color": "#0B0F17"},
        "jersey": {"x": 226, "y": 26, "w": 104, "h": 70, "font": F, "size": 66, "weight": w, "align": "right", "outline": True, "use_accent": True, "opacity": 0.95},
        "nickname": {"x": 22, "y": 298, "w": 316, "h": 16, **MONO, "size": 10, "letter": 3, "use_accent": True, "shadow": True},
        "name": {"x": 20, "y": 314, "w": 320, "h": 52, "font": F, "size": 48, "weight": w, "shadow": True},
        "meta": {"x": 22, "y": 367, "w": 316, "h": 16, **MONO, "size": 10, "letter": 1.5, "color": "#E2E8F0"},
        "stats": {"x": 16, "y": 392, "w": 328, "h": 82, "blur": True, "box_alpha": 0.12},
        "sport": {"x": 18, "y": 480, "w": 160, "h": 14, **MONO, "size": 9, "letter": 2, "color": "#CBD5E1"},
        "season": {"x": 182, "y": 480, "w": 160, "h": 14, **MONO, "size": 9, "letter": 2, "color": "#CBD5E1", "align": "right"}}}


def _arch(F, w):
    return {"grad": 0.85, "overlay": 0.15, "frame": True, "els": {
        "photo": {"x": 55, "y": 50, "w": 250, "h": 250, "shape": "arch", "border_width": 3, "border_accent": True, "glow": True},
        "jersey": {"x": 0, "y": 30, "w": 360, "h": 230, "font": F, "size": 210, "weight": w, "align": "center", "outline": True, "use_accent": True, "opacity": 0.35, "behind": True},
        "rating": {"x": 18, "y": 18, "w": 58, "h": 52, "font": F, "size": 30, "weight": w, "align": "center", "bg_accent": True, "bg_alpha": 1, "radius": 26, "color": "#0B0F17"},
        "nickname": {"x": 20, "y": 310, "w": 320, "h": 16, **MONO, "size": 10, "letter": 3, "use_accent": True, "align": "center"},
        "name": {"x": 20, "y": 326, "w": 320, "h": 48, "font": F, "size": 44, "weight": w, "align": "center", "shadow": True},
        "meta": {"x": 20, "y": 375, "w": 320, "h": 16, **MONO, "size": 10, "letter": 1.5, "color": "#E2E8F0", "align": "center"},
        "stats": {"x": 26, "y": 400, "w": 308, "h": 70, "style": "plain", "align": "center", "value_accent": True, "size": 18, "label_color": "#CBD5E1"},
        "sport": {"x": 24, "y": 476, "w": 156, "h": 14, **MONO, "size": 9, "letter": 2, "color": "#CBD5E1"},
        "season": {"x": 180, "y": 476, "w": 156, "h": 14, **MONO, "size": 9, "letter": 2, "color": "#CBD5E1", "align": "right"}}}


def _split(F, w):
    return {"grad": 0.8, "overlay": 0.1, "els": {
        "photo": {"x": 146, "y": 0, "w": 214, "h": 350, "shape": "slant", "radius": 0, "fade": 0.15},
        "rating": {"x": 18, "y": 22, "w": 126, "h": 72, "font": F, "size": 68, "weight": w, "use_accent": True, "shadow": True},
        "jersey": {"x": 18, "y": 96, "w": 126, "h": 40, "font": F, "size": 34, "weight": w, "outline": True, "color": "#FFFFFF"},
        "nickname": {"x": 18, "y": 146, "w": 126, "h": 14, **MONO, "size": 9, "letter": 2, "use_accent": True},
        "sport": {"x": 18, "y": 166, "w": 126, "h": 14, **MONO, "size": 9, "letter": 2, "color": "#E2E8F0"},
        "season": {"x": 18, "y": 184, "w": 126, "h": 14, **MONO, "size": 9, "letter": 2, "color": "#E2E8F0"},
        "name": {"x": 18, "y": 350, "w": 324, "h": 50, "font": F, "size": 46, "weight": w, "italic": True, "shadow": True},
        "meta": {"x": 20, "y": 400, "w": 320, "h": 16, **MONO, "size": 10, "letter": 1.5, "color": "#E2E8F0"},
        "stats": {"x": 16, "y": 424, "w": 328, "h": 66, "size": 13, "label_size": 7, "blur": True, "box_alpha": 0.14}}}


def _medal(F, w):
    return {"grad": 0.7, "overlay": 0.2, "els": {
        "photo": {"x": 80, "y": 38, "w": 200, "h": 200, "shape": "circle", "border_width": 4, "border_accent": True, "glow": True},
        "rating": {"x": 22, "y": 26, "w": 56, "h": 50, "font": F, "size": 30, "weight": w, "align": "center", "bg_accent": True, "bg_alpha": 1, "radius": 10, "color": "#0B0F17"},
        "jersey": {"x": 270, "y": 26, "w": 70, "h": 50, "font": F, "size": 40, "weight": w, "align": "right", "shadow": True, "shadow_accent": True},
        "nickname": {"x": 20, "y": 252, "w": 320, "h": 16, **MONO, "size": 10, "letter": 3, "use_accent": True, "align": "center"},
        "name": {"x": 20, "y": 270, "w": 320, "h": 50, "font": F, "size": 44, "weight": w, "align": "center", "shadow": True},
        "meta": {"x": 20, "y": 322, "w": 320, "h": 16, **MONO, "size": 10, "letter": 1.5, "color": "#E2E8F0", "align": "center"},
        "tagline": {"visible": True, "x": 20, "y": 342, "w": 320, "h": 16, "font": "DM Sans", "size": 11, "weight": 500, "upper": False, "italic": True, "align": "center", "color": "#F1F5F9"},
        "stats": {"x": 20, "y": 368, "w": 320, "h": 100, "style": "pills", "align": "center", "blur": True, "box_alpha": 0.16},
        "sport": {"x": 22, "y": 478, "w": 156, "h": 14, **MONO, "size": 9, "letter": 2, "color": "#CBD5E1"},
        "season": {"x": 182, "y": 478, "w": 156, "h": 14, **MONO, "size": 9, "letter": 2, "color": "#CBD5E1", "align": "right"}}}


def _poster(F, w):
    return {"grad": 0.85, "overlay": 0.12, "els": {
        "name": {"x": 16, "y": 16, "w": 328, "h": 58, "font": F, "size": 54, "weight": w, "align": "center", "shadow": True},
        "nickname": {"x": 18, "y": 74, "w": 324, "h": 14, **MONO, "size": 10, "letter": 3, "use_accent": True, "align": "center"},
        "photo": {"x": 40, "y": 96, "w": 280, "h": 256, "shape": "shield", "border_width": 3, "border_accent": True, "glow": True},
        "rating": {"x": 22, "y": 292, "w": 62, "h": 54, "font": F, "size": 32, "weight": w, "align": "center", "bg_accent": True, "bg_alpha": 1, "radius": 10, "color": "#0B0F17"},
        "jersey": {"x": 266, "y": 292, "w": 72, "h": 54, "font": F, "size": 44, "weight": w, "align": "right", "outline": True, "use_accent": True},
        "meta": {"x": 18, "y": 362, "w": 324, "h": 16, **MONO, "size": 10, "letter": 1.5, "color": "#E2E8F0", "align": "center"},
        "stats": {"x": 16, "y": 386, "w": 328, "h": 86, "blur": True, "box_alpha": 0.14},
        "sport": {"x": 18, "y": 480, "w": 160, "h": 14, **MONO, "size": 9, "letter": 2, "color": "#CBD5E1"},
        "season": {"x": 182, "y": 480, "w": 160, "h": 14, **MONO, "size": 9, "letter": 2, "color": "#CBD5E1", "align": "right"}}}


ARCH = {"hero": _hero, "arch": _arch, "split": _split, "medal": _medal, "poster": _poster}

# id, name, badge, archetype, collection, accent, display font, description
_D = [
    ("prizm_silver", "Silver Prizm", "PRIZM", "hero", "free", "#E2E8F0", "Anton", "Chrome silver prizm shards with rainbow refractor glints."),
    ("floodlights", "Floodlights", "MATCHDAY", "hero", "free", "#38BDF8", "Oswald", "Night stadium under blazing floodlights."),
    ("pitch_side", "Pitch Side", "PITCH", "arch", "free", "#A3E635", "Bebas Neue", "Striped green pitch with crisp chalk lines."),
    ("hardwood", "Hardwood", "COURT", "poster", "free", "#F97316", "Big Shoulders Display", "Glossy maple court with painted lines."),
    ("cricket_night", "Cricket Night", "CRICKET", "hero", "free", "#FACC15", "Teko", "Floodlit cricket pitch, stumps and the red ball."),
    ("track_speed", "Track Speed", "SPEED", "split", "free", "#EF4444", "Russo One", "Red running-track lanes in full motion blur."),
    ("jersey_stripe", "Jersey Stripe", "KIT", "medal", "free", "#FBBF24", "Oswald", "Navy jersey mesh with gold and white sleeve stripes."),
    ("gold_prizm", "Gold Prizm", "GOLD /10", "arch", "basic", "#FACC15", "Anton", "Gold refractor prizm — the classic numbered parallel."),
    ("red_wave", "Red Wave", "RED /99", "poster", "basic", "#F43F5E", "Bebas Neue", "Crimson wave refractor with silver shine."),
    ("carbon_strike", "Carbon Strike", "MOTOR", "split", "basic", "#DC2626", "Russo One", "Black carbon fibre with a red racing stripe."),
    ("ice_rink", "Ice Rink", "HOCKEY", "medal", "basic", "#60A5FA", "Big Shoulders Display", "Scratched rink ice with faint lines underneath."),
    ("clay_court", "Clay Court", "TENNIS", "hero", "basic", "#FB923C", "Oswald", "Red clay, a white baseline and the ball's long shadow."),
    ("blue_shimmer", "Blue Shimmer", "BLUE /49", "arch", "pro", "#60A5FA", "Teko", "Deep blue shimmer refractor parallel."),
    ("green_pulsar", "Green Pulsar", "GREEN /25", "medal", "pro", "#34D399", "Anton", "Emerald pulsar refractor with a radiant burst."),
    ("locker_room", "Locker Room", "PRE-GAME", "poster", "pro", "#94A3B8", "Big Shoulders Display", "Moody locker room under a single spotlight."),
    ("jumbotron", "Jumbotron", "ARENA", "split", "pro", "#FB923C", "Russo One", "Glowing arena LED board on match night."),
    ("championship", "Championship", "CHAMPS", "arch", "pro", "#FDE047", "Bebas Neue", "Gold confetti raining down in a packed stadium."),
    ("black_finite", "Black Finite", "BLACK 1/1", "poster", "premium", "#FACC15", "Anton", "Black chrome prism shards edged in gold."),
    ("fight_night", "Fight Night", "RING", "hero", "premium", "#EF4444", "Teko", "Red-rope ring corner under harsh spotlights."),
    ("superfractor", "Superfractor", "SUPER 1/1", "medal", "exclusive", "#FACC15", "Big Shoulders Display", "Swirling gold superfractor — the rarest pull."),
]
_BG = {"prizm_silver": "prizm_silver", "floodlights": "stadium", "pitch_side": "pitch", "cricket_night": "cricket", "track_speed": "track",
       "jersey_stripe": "jersey", "gold_prizm": "prizm_gold", "carbon_strike": "carbon", "clay_court": "clay", "locker_room": "locker",
       "jumbotron": "led_board", "championship": "confetti", "black_finite": "black_gold", "fight_night": "ring"}
_EXTRA = {"prizm_silver": {"overlay": 0.3}, "gold_prizm": {"overlay": 0.3}, "superfractor": {"overlay": 0.3}, "red_wave": {"overlay": 0.25},
          "hardwood": {"overlay": 0.3}, "clay_court": {"overlay": 0.2}, "ice_rink": {"overlay": 0.35}, "black_finite": {"frame": True}}


def build(COLLECTION_PLANS):
    out = []
    for k, (tid, name, badge, arch, coll, accent, font, desc) in enumerate(_D):
        d = ARCH[arch](font, 400 if font in SINGLE_WEIGHT else 900)
        d.update({"bg_image": f"/templates/{_BG.get(tid, tid)}.jpg", "bg_color": "#05070D", "radius": 16, "border_width": 0, **_EXTRA.get(tid, {})})
        out.append({"id": tid, "name": name, "badge": badge, "layout": "custom", "collection": coll, "tier": coll, "accent": accent,
                    "description": desc, "recommended": [], "plans": COLLECTION_PLANS[coll], "sports": [], "watermark_free": True,
                    "frame_image": "", "active": True, "order": k, "design": d})
    return out
