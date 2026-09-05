"""Genere les 5 videos "page" (une par moment de pitch/VIDEO_SCRIPT.md) + la video finale
concatenee, avec voix off reelle (edge-tts, gratuit, pas de cle API) et animation programmatique
(Pillow, dessinee image par image en fonction du temps - moviepy assemble et synchronise sur la
duree REELLE de chaque piste audio generee, pas une duree devinee).

Palette et donnees reprises EXACTEMENT des sources reelles du projet (globals.css, VIDEO_SCRIPT.md,
morocco-geo.ts) - rien d'invente. Logo CreaAfrica (pitch/CreaAfrica_logo.png, fourni par
l'utilisateur) recadre par prep_logo.py, compose en petit sur chaque page (credit constant du
concours organisateur) et en grand sur la page finale.

Usage : python build.py
Sortie : out/page1.mp4 ... out/page5.mp4, out/final.mp4, out/audio1.mp3 ... out/audio5.mp3
"""
import asyncio
import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont
import edge_tts
from moviepy import VideoClip, AudioFileClip, concatenate_videoclips

HERE = Path(__file__).parent
OUT = HERE / "out"
OUT.mkdir(exist_ok=True)
ASSETS = HERE / "assets"

W, H = 1080, 1920
FPS = 30
VOICE = "fr-FR-HenriNeural"  # neutre/confiant - voir CREDITS.md pour changer facilement

# --- Palette reelle (apps/web/src/app/globals.css, verifiee le 2026-09-05) ---
BG = (26, 7, 4)
BG_ELEVATED = (36, 19, 15)
BG_CARD = (44, 28, 23)
LINE = (99, 69, 58)
INK = (246, 241, 235)
INK_MUTED = (184, 167, 156)
INK_FAINT = (127, 113, 106)
TERRACOTTA = (237, 121, 64)
TERRACOTTA_INK = (18, 8, 5)
RED = (233, 80, 77)
GOLD = (234, 181, 50)
GREEN = (58, 186, 106)

FONTS_DIR = Path(r"C:\Windows\Fonts")


def font(size, weight="regular"):
    name = {"regular": "segoeui.ttf", "semibold": "seguisb.ttf", "bold": "segoeuib.ttf"}[weight]
    return ImageFont.truetype(str(FONTS_DIR / name), size)


def ease_out_cubic(t):
    t = max(0.0, min(1.0, t))
    return 1 - (1 - t) ** 3


def fade(t, start, end):
    """0->1 progressivement entre start et end (fractions 0..1 du temps de la page)."""
    if end <= start:
        return 1.0 if t >= start else 0.0
    return max(0.0, min(1.0, (t - start) / (end - start)))


def lerp(a, b, t):
    return a + (b - a) * t


def blend(c1, c2, t):
    return tuple(int(lerp(a, b, t)) for a, b in zip(c1, c2))


def with_alpha(color, a):
    return (*color, int(max(0, min(255, a))))


def text_size(draw, text, f):
    box = draw.textbbox((0, 0), text, font=f)
    return box[2] - box[0], box[3] - box[1]


def paste_center_x(base, layer, y, opacity=1.0):
    if opacity <= 0:
        return
    if opacity < 1.0:
        layer = layer.copy()
        alpha = layer.split()[3].point(lambda p: int(p * opacity))
        layer.putalpha(alpha)
    x = (base.width - layer.width) // 2
    base.alpha_composite(layer, (x, y))


CREA_LOGO = Image.open(ASSETS / "creaafrica_logo.png").convert("RGBA")
PRODUCT_LOGO = Image.open(ASSETS / "cestomclash228_logo.png").convert("RGBA")


def draw_creaafrica_credit(img, t, page_duration, big=False):
    """Logo CreaAfrica - petit badge constant bas-droite sur chaque page (credit de
    l'organisateur du concours, visible en permanence sans distraire du contenu), en grand
    et centre sur la page finale (big=True)."""
    op = fade(t, 0.05, 0.35)
    if big:
        scale = 620 / CREA_LOGO.width
        logo = CREA_LOGO.resize((620, int(CREA_LOGO.height * scale)))
        layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        paste_center_x(layer, logo, H - 260, opacity=op)
        img.alpha_composite(layer)
    else:
        scale = 260 / CREA_LOGO.width
        logo = CREA_LOGO.resize((260, int(CREA_LOGO.height * scale)))
        if op < 1.0:
            logo = logo.copy()
            a = logo.split()[3].point(lambda p: int(p * op))
            logo.putalpha(a)
        pad = 36
        img.alpha_composite(logo, (W - logo.width - pad, H - logo.height - pad - 24))


def base_canvas():
    img = Image.new("RGBA", (W, H), (*BG, 255))
    return img


# ---------------------------------------------------------------------------
# Page 1 - Hook : bulles de chat chaotiques -> silhouette debordee.
# ---------------------------------------------------------------------------
BUBBLES = [
    ("quelqu'un sait où on paie la taxe de séjour ??", 130, 360, -6),
    ("[vocal 0:52] · +33 non lus", 640, 470, 4),
    ("URGENT quelqu'un a un logement pour demain", 90, 620, 3),
    ("[image]  [image]  [image]", 660, 760, -4),
    ("c'est déjà répondu plus haut je crois", 100, 1250, 5),
    ("quelqu'un peut réexpliquer la CNSS ?", 630, 1360, -3),
    ("perso j'ai abandonné ce groupe", 140, 1460, -5),
]


def page1_frame(t, duration):
    img = base_canvas()
    draw = ImageDraw.Draw(img)
    f_body = font(28)
    f_head = font(46, "bold")

    n = len(BUBBLES)
    bubble_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    bd = ImageDraw.Draw(bubble_layer)
    for i, (text, x, y, rot) in enumerate(BUBBLES):
        start = 0.08 + i * (0.55 / n)
        pop = ease_out_cubic(fade(t, start, start + 0.18))
        if pop <= 0:
            continue
        end_dim = fade(t, 0.68, 0.92)
        alpha = int(235 * pop * (1 - 0.65 * end_dim))
        tw, th = text_size(bd, text, f_body)
        pad = 26
        bw, bh = min(tw + pad * 2, 560), th + pad * 2
        card = Image.new("RGBA", (bw, bh), (0, 0, 0, 0))
        cd = ImageDraw.Draw(card)
        cd.rounded_rectangle([0, 0, bw - 1, bh - 1], radius=22, fill=with_alpha(BG_ELEVATED, alpha))
        cd.multiline_text((pad, pad - 4), text, font=f_body, fill=with_alpha(INK_MUTED, alpha))
        scale = 0.85 + 0.15 * pop
        card = card.resize((max(1, int(bw * scale)), max(1, int(bh * scale))))
        card = card.rotate(rot, expand=True, resample=Image.BICUBIC)
        bubble_layer.alpha_composite(card, (x - card.width // 2, y - card.height // 2))
    img.alpha_composite(bubble_layer)

    fig_op = fade(t, 0.66, 0.86)
    if fig_op > 0:
        cx, cy = W // 2, 990
        q_op = fade(t, 0.7, 0.9)
        qsize = f_head
        qtext = "?"
        qw, qh = text_size(draw, qtext, qsize)
        draw.text((cx - qw / 2, cy - 220), qtext, font=qsize, fill=with_alpha(INK_FAINT, int(255 * q_op)))
        draw.ellipse([cx - 90, cy - 60, cx + 90, cy + 120], fill=with_alpha(BG_CARD, int(255 * fig_op)), outline=with_alpha(LINE, int(255 * fig_op)), width=3)
        draw.rounded_rectangle([cx - 140, cy + 90, cx + 140, cy + 300], radius=70, fill=with_alpha(BG_CARD, int(255 * fig_op)), outline=with_alpha(LINE, int(255 * fig_op)), width=3)

    cap_op = fade(t, 0.78, 0.98)
    if cap_op > 0:
        title = "Débarquer au Maroc, et devoir tout réapprendre seul."
        sub = "Noyé·e dans des groupes WhatsApp qui n'aident plus personne."
        f_title = font(52, "bold")
        f_sub = font(32)
        y0 = 1420
        lines = wrap_text(draw, title, f_title, W - 140)
        for li, line in enumerate(lines):
            lw, lh = text_size(draw, line, f_title)
            draw.text(((W - lw) / 2, y0 + li * (lh + 14)), line, font=f_title, fill=with_alpha(INK, int(255 * cap_op)))
        y1 = y0 + len(lines) * 70 + 30
        for li, line in enumerate(wrap_text(draw, sub, f_sub, W - 200)):
            lw, lh = text_size(draw, line, f_sub)
            draw.text(((W - lw) / 2, y1 + li * (lh + 8)), line, font=f_sub, fill=with_alpha(INK_FAINT, int(255 * cap_op)))

    tag = "Hook — le problème avant CestomClash228"
    f_tag = font(24)
    tw, th = text_size(draw, tag, f_tag)
    draw.text(((W - tw) / 2, 70), tag, font=f_tag, fill=with_alpha(INK_FAINT, 220))

    draw_creaafrica_credit(img, t, duration)
    return img


def wrap_text(draw, text, f, max_w):
    words = text.split()
    lines, cur = [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if text_size(draw, trial, f)[0] <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


# ---------------------------------------------------------------------------
# Page 2 - Social-Map : 6 vraies villes CESTOM, carte reseau.
# ---------------------------------------------------------------------------
CITY_POINTS = [
    {"name": "Rabat", "x": 506.9, "y": 139.79, "members": 220},
    {"name": "Casablanca", "x": 471.04, "y": 161.25, "members": 180},
    {"name": "Marrakech", "x": 452.3, "y": 254.38, "members": 95},
    {"name": "Fès", "x": 595.12, "y": 139.21, "members": 85},
    {"name": "Tanger", "x": 555.18, "y": 56.48, "members": 40},
    {"name": "Oujda", "x": 743.13, "y": 107.89, "members": 30},
]
CITY_TOTAL = sum(c["members"] for c in CITY_POINTS)
_members = [c["members"] for c in CITY_POINTS]
_min_m, _max_m = min(_members), max(_members)


def tier_color(members):
    tt = (math.sqrt(members) - math.sqrt(_min_m)) / (math.sqrt(_max_m) - math.sqrt(_min_m) or 1)
    if tt < 1 / 3:
        return GREEN
    if tt < 2 / 3:
        return GOLD
    return TERRACOTTA


def page2_frame(t, duration):
    img = base_canvas()
    draw = ImageDraw.Draw(img)

    brand_op = fade(t, 0.0, 0.12)
    brand_logo = PRODUCT_LOGO.resize((int(PRODUCT_LOGO.width * 0.32), int(PRODUCT_LOGO.height * 0.32)), Image.LANCZOS)
    if brand_op < 1.0:
        brand_logo = brand_logo.copy()
        a = brand_logo.split()[3].point(lambda p: int(p * brand_op))
        brand_logo.putalpha(a)
    img.alpha_composite(brand_logo, (70, 80))
    f_tag = font(30, "semibold")
    draw.text((72, 170), "Explore. Partage. Level-up.", font=f_tag, fill=with_alpha(TERRACOTTA, int(255 * brand_op)))

    card_op = fade(t, 0.08, 0.2)
    box = (70, 280, W - 70, 1280)
    if card_op > 0:
        layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        ld = ImageDraw.Draw(layer)
        ld.rounded_rectangle(box, radius=28, fill=with_alpha(BG_CARD, int(255 * card_op)), outline=with_alpha(LINE, int(255 * card_op)), width=2)
        img.alpha_composite(layer)

    xs = [c["x"] for c in CITY_POINTS]
    ys = [c["y"] for c in CITY_POINTS]
    minx, maxx, miny, maxy = min(xs), max(xs), min(ys), max(ys)
    pad = 140
    px0, px1 = box[0] + pad, box[2] - pad
    py0, py1 = box[1] + pad, box[3] - pad - 100
    plotted = []
    for c in CITY_POINTS:
        px = px0 + (c["x"] - minx) / (maxx - minx) * (px1 - px0)
        py = py0 + (c["y"] - miny) / (maxy - miny) * (py1 - py0)
        tt = (math.sqrt(c["members"]) - math.sqrt(_min_m)) / (math.sqrt(_max_m) - math.sqrt(_min_m) or 1)
        r = 22 + tt * 34
        plotted.append({**c, "px": px, "py": py, "r": r})
    ccx = sum(p["px"] for p in plotted) / len(plotted)
    ccy = sum(p["py"] for p in plotted) / len(plotted)

    n = len(plotted)
    for i, c in enumerate(plotted):
        start = 0.24 + i * (0.5 / n)
        pop = ease_out_cubic(fade(t, start, start + 0.14))
        if pop <= 0:
            continue
        line_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        lld = ImageDraw.Draw(line_layer)
        lld.line([(ccx, ccy), (c["px"], c["py"])], fill=with_alpha(TERRACOTTA, int(90 * pop)), width=3)
        img.alpha_composite(line_layer)
        color = tier_color(c["members"])
        rr = c["r"] * pop
        draw.ellipse([c["px"] - rr, c["py"] - rr, c["px"] + rr, c["py"] + rr], fill=with_alpha(color, int(235 * pop)), outline=with_alpha(BG, int(255 * pop)), width=3)
        if pop > 0.6:
            lbl_op = fade(t, start + 0.1, start + 0.3)
            f_c = font(24, "bold")
            cw, ch = text_size(draw, str(c["members"]), f_c)
            draw.text((c["px"] - cw / 2, c["py"] - ch / 2), str(c["members"]), font=f_c, fill=with_alpha(TERRACOTTA_INK, int(255 * lbl_op)))
            f_n = font(22)
            nw, nh = text_size(draw, c["name"], f_n)
            draw.text((c["px"] - nw / 2, c["py"] + rr + 14), c["name"], font=f_n, fill=with_alpha(INK_MUTED, int(255 * lbl_op)))

    bottom_op = fade(t, 0.82, 0.98)
    if bottom_op > 0:
        f_num = font(96, "bold")
        num = str(CITY_TOTAL)
        nw, nh = text_size(draw, num, f_num)
        draw.text(((W - nw) / 2, 1340), num, font=f_num, fill=with_alpha(GOLD, int(255 * bottom_op)))
        f_lbl = font(34)
        lbl = "membres, 6 villes"
        lw, lh = text_size(draw, lbl, f_lbl)
        draw.text(((W - lw) / 2, 1460), lbl, font=f_lbl, fill=with_alpha(INK, int(255 * bottom_op)))
        f_sub = font(28)
        for li, line in enumerate(wrap_text(draw, "Chaque astuce, chaque piège administratif — épinglé, visible par tous.", f_sub, W - 200)):
            lw2, lh2 = text_size(draw, line, f_sub)
            draw.text(((W - lw2) / 2, 1540 + li * 42), line, font=f_sub, fill=with_alpha(INK_MUTED, int(255 * bottom_op)))

    draw_creaafrica_credit(img, t, duration)
    return img


# ---------------------------------------------------------------------------
# Page 3 - Bounty : urgence + notation.
# ---------------------------------------------------------------------------
def page3_frame(t, duration):
    img = base_canvas()
    draw = ImageDraw.Draw(img)

    card_op = fade(t, 0.0, 0.15)
    box = (70, 260, W - 70, 1620)
    if card_op > 0:
        layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        ld = ImageDraw.Draw(layer)
        ld.rounded_rectangle(box, radius=32, fill=with_alpha(BG_CARD, int(255 * card_op)), outline=with_alpha(LINE, int(255 * card_op)), width=2)
        img.alpha_composite(layer)

    top_op = fade(t, 0.1, 0.25)
    if top_op > 0:
        f_pill = font(26, "bold")
        pill_text = "URGENT"
        pw, ph = text_size(draw, pill_text, f_pill)
        pbox = (box[0] + 50, box[1] + 60, box[0] + 50 + pw + 60, box[1] + 60 + ph + 40)
        draw.rounded_rectangle(pbox, radius=(ph + 40) // 2, fill=with_alpha(BG, int(255 * top_op)))
        draw.text((pbox[0] + 30, pbox[1] + 20), pill_text, font=f_pill, fill=with_alpha(TERRACOTTA, int(255 * top_op)))
        f_cd = font(40, "bold")
        cd_text = "02:14:59"
        cw, ch = text_size(draw, cd_text, f_cd)
        draw.text((box[2] - 50 - cw, box[1] + 60), cd_text, font=f_cd, fill=with_alpha(RED, int(255 * top_op)))

    body_op = fade(t, 0.18, 0.4)
    if body_op > 0:
        f_h1 = font(44, "bold")
        for li, line in enumerate(wrap_text(draw, "Besoin d'aide algo en urgence à la BU", f_h1, box[2] - box[0] - 100)):
            draw.text((box[0] + 50, box[1] + 180 + li * 58), line, font=f_h1, fill=with_alpha(INK, int(255 * body_op)))
        f_desc = font(30)
        desc = "Bloqué sur un exo de structures de données avant le rendu de demain matin. Une heure de ton temps peut débloquer toute ma nuit."
        for li, line in enumerate(wrap_text(draw, desc, f_desc, box[2] - box[0] - 100)):
            draw.text((box[0] + 50, box[1] + 340 + li * 44), line, font=f_desc, fill=with_alpha(INK_MUTED, int(255 * body_op)))
        f_meta = font(24)
        draw.text((box[0] + 50, box[1] + 560), "Rabat · publié par Kodjo T. il y a 12 min", font=f_meta, fill=with_alpha(INK_FAINT, int(255 * body_op)))

    div_op = fade(t, 0.4, 0.48)
    if div_op > 0:
        draw.line([(box[0] + 50, box[1] + 640), (box[2] - 50, box[1] + 640)], fill=with_alpha(LINE, int(255 * div_op)), width=2)

    rating_op = fade(t, 0.48, 0.58)
    if rating_op > 0:
        f_rl = font(26)
        draw.text((box[0] + 50, box[1] + 680), "Réputation de qui a déjà aidé sur cette Bounty", font=f_rl, fill=with_alpha(INK_MUTED, int(255 * rating_op)))

    star_w, gap = 100, 20
    n_full = 4
    for i in range(5):
        start = 0.58 + i * 0.07
        pop = ease_out_cubic(fade(t, start, start + 0.08))
        if pop <= 0:
            continue
        sx = box[0] + 50 + i * (star_w + gap)
        sy = box[1] + 750
        on = i < n_full
        fill_c = TERRACOTTA if on else BG
        outline_c = TERRACOTTA if on else LINE
        draw.rounded_rectangle([sx, sy, sx + star_w * pop, sy + star_w * pop], radius=18, fill=with_alpha(fill_c, int(255 * pop)), outline=with_alpha(outline_c, int(255 * pop)), width=2)
        f_num = font(34, "bold")
        num = str(i + 1)
        nw, nh = text_size(draw, num, f_num)
        txt_c = TERRACOTTA_INK if on else INK_MUTED
        draw.text((sx + (star_w * pop) / 2 - nw / 2, sy + (star_w * pop) / 2 - nh / 2), num, font=f_num, fill=with_alpha(txt_c, int(255 * pop)))

    cap_op = fade(t, 0.92, 1.0)
    if cap_op > 0:
        f_cap = font(24)
        draw.text((box[0] + 50, box[1] + 880), "4/5 — noté par l'auteur après résolution", font=f_cap, fill=with_alpha(INK_FAINT, int(255 * cap_op)))

    cta_op = fade(t, 0.85, 1.0)
    if cta_op > 0:
        cbox = (box[0] + 50, box[3] - 130, box[2] - 50, box[3] - 50)
        draw.rounded_rectangle(cbox, radius=20, fill=with_alpha(TERRACOTTA, int(255 * cta_op)))
        f_cta = font(32, "bold")
        txt = "Résoudre cette Bounty"
        tw, th = text_size(draw, txt, f_cta)
        draw.text(((cbox[0] + cbox[2]) / 2 - tw / 2, (cbox[1] + cbox[3]) / 2 - th / 2), txt, font=f_cta, fill=with_alpha(TERRACOTTA_INK, int(255 * cta_op)))

    draw_creaafrica_credit(img, t, duration)
    return img


# ---------------------------------------------------------------------------
# Page 4 - Ghost Mode : toggle Public/Fantome.
# ---------------------------------------------------------------------------
def page4_frame(t, duration):
    img = base_canvas()
    draw = ImageDraw.Draw(img)

    title_op = fade(t, 0.0, 0.2)
    if title_op > 0:
        f_h1 = font(56, "bold")
        txt = "Ton espace, ton rythme"
        tw, th = text_size(draw, txt, f_h1)
        draw.text(((W - tw) / 2, 520), txt, font=f_h1, fill=with_alpha(INK, int(255 * title_op)))
        f_sub = font(30)
        sub = "Pas prêt à publier à visage découvert ? Passe en Fantôme — révèle-toi quand tu veux."
        y = 620
        for line in wrap_text(draw, sub, f_sub, W - 280):
            lw, lh = text_size(draw, line, f_sub)
            draw.text(((W - lw) / 2, y), line, font=f_sub, fill=with_alpha(INK_MUTED, int(255 * title_op)))
            y += 46

    row_op = fade(t, 0.22, 0.36)
    row_box = (200, 850, W - 200, 1120)
    if row_op > 0:
        layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        ld = ImageDraw.Draw(layer)
        ld.rounded_rectangle(row_box, radius=(row_box[3] - row_box[1]) // 2, fill=with_alpha(BG_ELEVATED, int(255 * row_op)), outline=with_alpha(LINE, int(255 * row_op)), width=2)
        img.alpha_composite(layer)

    pub_on = fade(t, 0.4, 0.55)
    slide = ease_out_cubic(fade(t, 0.55, 0.75))
    ghost_on = fade(t, 0.75, 0.88)

    av_d = 150
    pub_cx, pub_cy = row_box[0] + 140, (row_box[1] + row_box[3]) // 2 - 30
    ghost_cx, ghost_cy = row_box[2] - 140, (row_box[1] + row_box[3]) // 2 - 30
    show_row = max(pub_on, row_op)
    if show_row > 0:
        pub_alpha = int(255 * row_op)
        draw.ellipse([pub_cx - av_d / 2, pub_cy - av_d / 2, pub_cx + av_d / 2, pub_cy + av_d / 2],
                     fill=with_alpha(blend(BG_CARD, TERRACOTTA, pub_on), pub_alpha))
        f_lbl = font(26, "semibold")
        lw, lh = text_size(draw, "Public", f_lbl)
        draw.text((pub_cx - lw / 2, pub_cy + av_d / 2 + 24), "Public", font=f_lbl, fill=with_alpha(blend(INK_MUTED, INK, pub_on), pub_alpha))

        draw.ellipse([ghost_cx - av_d / 2, ghost_cy - av_d / 2, ghost_cx + av_d / 2, ghost_cy + av_d / 2],
                     fill=with_alpha(blend(BG_CARD, BG_CARD, 0), pub_alpha), outline=with_alpha(blend(LINE, INK, ghost_on), pub_alpha), width=4)
        lw2, lh2 = text_size(draw, "Fantôme", f_lbl)
        draw.text((ghost_cx - lw2 / 2, ghost_cy + av_d / 2 + 24), "Fantôme", font=f_lbl, fill=with_alpha(blend(INK_MUTED, INK, ghost_on), pub_alpha))

        track_w, track_h = 150, 76
        tx0 = (row_box[0] + row_box[2]) / 2 - track_w / 2
        ty0 = pub_cy - track_h / 2
        draw.rounded_rectangle([tx0, ty0, tx0 + track_w, ty0 + track_h], radius=track_h // 2, fill=with_alpha(BG_CARD, pub_alpha), outline=with_alpha(LINE, pub_alpha), width=2)
        knob_d = 58
        knob_x = lerp(tx0 + 10, tx0 + track_w - knob_d - 10, slide)
        draw.ellipse([knob_x, ty0 + (track_h - knob_d) / 2, knob_x + knob_d, ty0 + (track_h - knob_d) / 2 + knob_d], fill=with_alpha(blend(INK_MUTED, INK, slide), pub_alpha))

    foot_op = fade(t, 0.88, 1.0)
    if foot_op > 0:
        f_b = font(28, "bold")
        f_r = font(28)
        y = 1260
        line1 = "Safe Space :"
        lw, _ = text_size(draw, line1, f_b)
        full = "Safe Space : ton identité reste protégée tant que"
        rest_lines = ["tu ne révèles pas ton post toi-même."]
        draw.text(((W - text_size(draw, line1 + ' ton identité reste', f_r)[0]) / 2, y), "", font=f_r, fill=(0, 0, 0, 0))
        combined = "Safe Space : ton identité reste protégée tant que tu ne révèles pas ton post toi-même."
        y2 = y
        cursor_lines = wrap_text(draw, combined, f_r, W - 320)
        for li, line in enumerate(cursor_lines):
            lw2, lh2 = text_size(draw, line, f_r)
            x0 = (W - lw2) / 2
            if li == 0 and line.startswith("Safe Space :"):
                bw, bh = text_size(draw, "Safe Space :", f_b)
                draw.text((x0, y2), "Safe Space :", font=f_b, fill=with_alpha(GREEN, int(255 * foot_op)))
                draw.text((x0 + bw + 10, y2), line[len("Safe Space :"):], font=f_r, fill=with_alpha(INK_FAINT, int(255 * foot_op)))
            else:
                draw.text((x0, y2), line, font=f_r, fill=with_alpha(INK_FAINT, int(255 * foot_op)))
            y2 += 42

    tag = "Vision — Ghost Mode, anonymat réversible"
    f_tag = font(24)
    tw, th = text_size(draw, tag, f_tag)
    draw.text(((W - tw) / 2, 70), tag, font=f_tag, fill=with_alpha(INK_FAINT, 220))

    draw_creaafrica_credit(img, t, duration)
    return img


# ---------------------------------------------------------------------------
# Page 5 - CTA / Outro.
# ---------------------------------------------------------------------------
def page5_frame(t, duration):
    img = base_canvas()
    draw = ImageDraw.Draw(img)

    glow_op = fade(t, 0.0, 0.15)
    if glow_op > 0:
        layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        ld = ImageDraw.Draw(layer)
        ld.ellipse([W / 2 - 500, 500, W / 2 + 500, 1500], fill=with_alpha(TERRACOTTA, int(30 * glow_op)))
        img.alpha_composite(layer)

    logo_op = ease_out_cubic(fade(t, 0.08, 0.28))
    if logo_op > 0:
        scale = 0.7 + 0.3 * logo_op
        lw = int(PRODUCT_LOGO.width * 0.62 * scale)
        lh = int(PRODUCT_LOGO.height * 0.62 * scale)
        logo_img = PRODUCT_LOGO.resize((lw, lh), Image.LANCZOS)
        paste_center_x(img, logo_img, 460, opacity=logo_op)

    count_op = fade(t, 0.28, 0.4)
    if count_op > 0:
        progress = ease_out_cubic(fade(t, 0.28, 0.55))
        val = int(CITY_TOTAL * progress)
        f_num = font(190, "bold")
        num = str(val)
        nw, nh = text_size(draw, num, f_num)
        draw.text(((W - nw) / 2, 650), num, font=f_num, fill=with_alpha(GOLD, int(255 * count_op)))
        f_lbl = font(34)
        lbl = "étudiants togolais dans le réseau"
        lw, lh = text_size(draw, lbl, f_lbl)
        draw.text(((W - lw) / 2, 900), lbl, font=f_lbl, fill=with_alpha(INK_MUTED, int(255 * count_op)))

    tag_full = "Explore. Partage. Level-up."
    reveal = fade(t, 0.55, 0.78)
    n_chars = int(len(tag_full) * reveal)
    tag_shown = tag_full[:n_chars]
    if tag_shown:
        f_tag = font(52, "bold")
        tw, th = text_size(draw, tag_full, f_tag)
        draw.text(((W - tw) / 2, 1020), tag_shown, font=f_tag, fill=with_alpha(TERRACOTTA, 255))

    cta_op = fade(t, 0.82, 1.0)
    if cta_op > 0:
        f_cta = font(40, "bold")
        txt = "Votez CestomClash228"
        tw, th = text_size(draw, txt, f_cta)
        draw.text(((W - tw) / 2, 1110), txt, font=f_cta, fill=with_alpha(INK, int(255 * cta_op)))

    draw_creaafrica_credit(img, t, duration, big=True)
    return img


PAGES = [
    ("Premier jour au Maroc. Logement, carte de séjour, inscription — tout à apprendre seul, "
     "noyé dans un groupe WhatsApp qui déborde... et qui n'aide jamais à temps.", page1_frame),
    ("CestomClash228 remplace le bruit par une carte vivante — six villes, une communauté. "
     "Chaque astuce, chaque piège administratif : épinglé, là où il sert, visible par tous les "
     "Togolais du Maroc. Fini le fil qui défile sans fin ; place à l'exploration qui a un sens.", page2_frame),
    ("Besoin d'aide avant un examen ? Poste une Bounty. Qui répond est noté — sa réputation "
     "grandit à chaque aide.", page3_frame),
    ("Pas prêt à te montrer ? Le Ghost Mode te protège, le temps qu'il faut.", page4_frame),
    ("Déjà six cent cinquante étudiants togolais dans le réseau — une communauté qui répond, "
     "même à zéro heure du matin. Explore. Partage. Level-up. Votez CestomClash228 pour "
     "CréaAfrica 2026.", page5_frame),
]


async def gen_audio():
    for i, (text, _) in enumerate(PAGES, start=1):
        out_path = OUT / f"audio{i}.mp3"
        comm = edge_tts.Communicate(text, VOICE)
        await comm.save(str(out_path))
        print(f"Audio page {i} genere : {out_path}")


def build_videos():
    clips = []
    for i, (text, frame_fn) in enumerate(PAGES, start=1):
        audio_path = OUT / f"audio{i}.mp3"
        audio = AudioFileClip(str(audio_path))
        duration = audio.duration + 0.6  # marge silencieuse en fin de page

        def make_frame(t, fn=frame_fn, dur=duration):
            img = fn(min(t, dur), dur)
            return np.array(img.convert("RGB"))

        video = VideoClip(make_frame, duration=duration).with_fps(FPS)
        video = video.with_audio(audio)
        page_out = OUT / f"page{i}.mp4"
        video.write_videofile(str(page_out), fps=FPS, codec="libx264", audio_codec="aac", logger=None)
        print(f"Video page {i} ecrite : {page_out} ({duration:.1f}s)")
        clips.append(video)

    final = concatenate_videoclips(clips, method="compose")
    final_out = OUT / "final.mp4"
    final.write_videofile(str(final_out), fps=FPS, codec="libx264", audio_codec="aac", logger=None)
    print(f"Video finale ecrite : {final_out} ({final.duration:.1f}s)")


if __name__ == "__main__":
    asyncio.run(gen_audio())
    build_videos()
