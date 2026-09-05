"""Exporte le VRAI logo CestomClash228 (pin + wordmark) en PNG (transparent) et JPG, a partir
du code source reel du composant React (apps/web/src/components/MindClashMark.tsx) - pas
redessine a l'oeil, la geometrie du pin (cercle+triangle+masque fleche) et le degrade
(rouge->or->vert, memes stops 0%/52%/100%) sont copies exactement de ce fichier.

Usage : python export_product_logo.py
Sortie : assets/cestomclash228_logo.png (transparent), assets/cestomclash228_logo.jpg (fond de
marque), + apps/web/src/app/icon.png (favicon/icone d'appli reelle, convention Next.js App
Router - aucun code a changer, Next la detecte automatiquement par son nom de fichier).
"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).parent
ASSETS = HERE / "assets"
REPO_ROOT = HERE.parent.parent

BG = (26, 7, 4)
INK = (246, 241, 235)
GOLD = (234, 181, 50)
RED = (233, 80, 77)
GREEN = (58, 186, 106)

FONTS_DIR = Path(r"C:\Windows\Fonts")


def font(size, weight="bold"):
    name = {"regular": "segoeui.ttf", "semibold": "seguisb.ttf", "bold": "segoeuib.ttf"}[weight]
    return ImageFont.truetype(str(FONTS_DIR / name), size)


# ---------------------------------------------------------------------------
# Pin - geometrie et degrade copies EXACTEMENT de MindClashMark.tsx
# (viewBox 0 0 100 128, gradient x1=12% y1=6% x2=85% y2=98%, stops 0/52/100%).
# ---------------------------------------------------------------------------
def render_pin(scale=8):
    W, H = 100 * scale, 128 * scale

    # Masque : cercle + triangle en blanc, fleche soustraite en noir (meme
    # semantique que <mask> SVG : luminance blanche = visible).
    mask = Image.new("L", (W, H), 0)
    md = ImageDraw.Draw(mask)
    md.ellipse([(50 - 32) * scale, (40 - 32) * scale, (50 + 32) * scale, (40 + 32) * scale], fill=255)
    md.polygon([(30 * scale, 58 * scale), (70 * scale, 58 * scale), (50 * scale, 116 * scale)], fill=255)
    md.polygon([
        (50 * scale, 22 * scale), (69 * scale, 52 * scale), (60 * scale, 52 * scale),
        (50 * scale, 34 * scale), (40 * scale, 52 * scale), (31 * scale, 52 * scale),
    ], fill=0)

    # Degrade lineaire rouge->or->vert le long de l'axe (12%,6%) -> (85%,98%).
    ax, ay = 0.12 * W, 0.06 * H
    bx, by = 0.85 * W, 0.98 * H
    dx, dy = bx - ax, by - ay
    denom = dx * dx + dy * dy
    yy, xx = np.mgrid[0:H, 0:W]
    t = ((xx - ax) * dx + (yy - ay) * dy) / denom
    t = np.clip(t, 0.0, 1.0)

    def lerp_channel(c1, c2, tt):
        return c1 + (c2 - c1) * tt

    grad = np.zeros((H, W, 3), dtype=np.float64)
    low = t < 0.52
    t_low = np.clip(t / 0.52, 0, 1)
    t_high = np.clip((t - 0.52) / 0.48, 0, 1)
    for ch in range(3):
        seg_low = lerp_channel(RED[ch], GOLD[ch], t_low)
        seg_high = lerp_channel(GOLD[ch], GREEN[ch], t_high)
        grad[:, :, ch] = np.where(low, seg_low, seg_high)
    grad_img = Image.fromarray(grad.astype(np.uint8), "RGB").convert("RGBA")
    grad_img.putalpha(mask)
    return grad_img


def build_lockup():
    pin_h = 260
    pin = render_pin(scale=8)
    pin = pin.resize((int(pin.width * pin_h / pin.height), pin_h), Image.LANCZOS)

    f_word = font(150, "bold")
    tmp = Image.new("RGBA", (10, 10))
    td = ImageDraw.Draw(tmp)
    t1, t2 = "CESTOMCLASH", "228"
    b1 = td.textbbox((0, 0), t1, font=f_word)
    b2 = td.textbbox((0, 0), t2, font=f_word)
    w1, h1 = b1[2] - b1[0], b1[3] - b1[1]
    w2, h2 = b2[2] - b2[0], b2[3] - b2[1]

    gap = 40
    pad = 30
    canvas_w = pad * 2 + pin.width + gap + w1 + w2 + 20
    canvas_h = pad * 2 + max(pin.height, h1)
    canvas = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    canvas.alpha_composite(pin, (pad, (canvas_h - pin.height) // 2))

    draw = ImageDraw.Draw(canvas)
    text_y = (canvas_h - h1) // 2 - b1[1]
    x = pad + pin.width + gap
    draw.text((x, text_y), t1, font=f_word, fill=INK)
    draw.text((x + w1, text_y), t2, font=f_word, fill=GOLD)
    return canvas


def main():
    ASSETS.mkdir(exist_ok=True)
    logo = build_lockup()

    png_path = ASSETS / "cestomclash228_logo.png"
    logo.save(png_path)
    print("PNG (transparent) :", png_path)

    flat = Image.new("RGB", logo.size, BG)
    flat.paste(logo, (0, 0), logo)
    jpg_path = ASSETS / "cestomclash228_logo.jpg"
    flat.save(jpg_path, quality=95)
    print("JPG (fond de marque) :", jpg_path)

    # Icone d'appli reelle - convention Next.js App Router : un fichier
    # nomme icon.png dans apps/web/src/app/ devient l'icone/favicon
    # automatiquement, sans changement de code. Carre, juste le pin (le
    # wordmark ne tiendrait pas lisiblement a la taille d'un favicon).
    pin_square_bg = Image.new("RGBA", (512, 512), (*BG, 255))
    pin_only = render_pin(scale=8)
    ratio = min(380 / pin_only.width, 380 / pin_only.height)
    pin_resized = pin_only.resize((int(pin_only.width * ratio), int(pin_only.height * ratio)), Image.LANCZOS)
    pin_square_bg.alpha_composite(
        pin_resized,
        ((512 - pin_resized.width) // 2, (512 - pin_resized.height) // 2 - 20),
    )
    icon_path = REPO_ROOT / "apps" / "web" / "src" / "app" / "icon.png"
    pin_square_bg.convert("RGB").save(icon_path)
    print("Icone app (favicon reel) :", icon_path)


if __name__ == "__main__":
    main()
