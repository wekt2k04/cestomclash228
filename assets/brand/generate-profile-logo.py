# Compose un logo carre (icone du projet + wordmark "CESTOMCLASH228") pour une photo de profil
# Google - genere une fois, jamais lance automatiquement par l'app (script ponctuel).
#
# Corrige le 2026-09-13 : la premiere version dimensionnait le texte pour tenir dans la LARGEUR
# du canevas carre, sans tenir compte du fait que la plupart des avatars Google (confirme sur
# Google Meet par une capture reelle de l'utilisateur) sont recadres en CERCLE, pas en carre -
# un cercle inscrit dans un carre ampute les 4 coins, donc un texte large place loin du centre
# vertical se fait couper sur les cotes meme s'il tenait dans la largeur du carre. Cette version
# calcule geometriquement (Pythagore) la distance au centre du coin le plus eloigne (icone ET
# texte), impose une marge de securite reelle sous le rayon inscrit, et REDUIT tout
# proportionnellement jusqu'a verifier que ça tient - pas une estimation a l'oeil.
from PIL import Image, ImageDraw, ImageFont
import math

BG = (0x1A, 0x07, 0x04)       # couleur EXACTE du fond deja cuit dans icon.png (echantillonnee)
INK = (0xF5, 0xF3, 0xEE)      # "CESTOMCLASH"
GOLD = (0xFF, 0xC9, 0x4D)     # "228"

CANVAS = 1024
CENTER = CANVAS / 2
# Rayon inscrit reel = 512 (coins du cercle tangents aux bords du carre). Marge de securite
# explicite en dessous, pour absorber un recadrage circulaire legerement plus serre que
# l'inscription parfaite (observe sur certaines UI) + l'anti-aliasing du bord du cercle.
SAFE_RADIUS = 440
ICON_SRC = "../../apps/web/src/app/icon.png"
FONT_PATH = "C:/Windows/Fonts/bahnschrift.ttf"
OUT_PATH = "../../cestomclash228-profile-logo.png"

icon_src = Image.open(ICON_SRC).convert("RGB")
text_a, text_b = "CESTOMCLASH", "228"
_measure = ImageDraw.Draw(Image.new("RGB", (10, 10)))


def layout_for(icon_size: float, font_size: int, gap: float):
    font = ImageFont.truetype(FONT_PATH, font_size)
    bbox_a = _measure.textbbox((0, 0), text_a, font=font)
    bbox_b = _measure.textbbox((0, 0), text_b, font=font)
    w_a, h_a = bbox_a[2] - bbox_a[0], bbox_a[3] - bbox_a[1]
    w_b = bbox_b[2] - bbox_b[0]
    total_w = w_a + w_b
    group_h = icon_size + gap + h_a
    # Groupe centre comme un bloc : le coin superieur de l'icone et le coin inferieur du texte
    # partagent la MEME distance verticale au centre (group_h/2), par construction symetrique -
    # seule leur largeur respective differe. Le pire cas est donc le plus large des deux.
    half_h = group_h / 2
    d_icon = math.hypot(icon_size / 2, half_h)
    d_text = math.hypot(total_w / 2, half_h)
    return dict(
        font=font, bbox_a=bbox_a, bbox_b=bbox_b, w_a=w_a, w_b=w_b, h_a=h_a,
        total_w=total_w, group_h=group_h, d_icon=d_icon, d_text=d_text,
    )


icon_size, font_size, gap = 480, 130, 45
layout = layout_for(icon_size, font_size, gap)
worst = max(layout["d_icon"], layout["d_text"])
attempts = 0
while worst > SAFE_RADIUS and attempts < 20:
    scale = (SAFE_RADIUS / worst) * 0.98  # marge supplementaire a chaque iteration, convergence sure
    icon_size *= scale
    font_size = max(20, int(font_size * scale))
    gap *= scale
    layout = layout_for(icon_size, font_size, gap)
    worst = max(layout["d_icon"], layout["d_text"])
    attempts += 1

icon_size = int(icon_size)
gap = int(gap)
print(f"Icone: {icon_size}px, police: {font_size}pt, gap: {gap}px ({attempts} ajustement(s))")
print(f"Distance max au centre (icone={layout['d_icon']:.1f}, texte={layout['d_text']:.1f}) "
      f"<= rayon sûr {SAFE_RADIUS} : {'OK' if worst <= SAFE_RADIUS else 'ECHEC'}")
assert worst <= SAFE_RADIUS, "Le contenu depasse encore la zone sure apres reduction - a revoir."

canvas = Image.new("RGB", (CANVAS, CANVAS), BG)
draw = ImageDraw.Draw(canvas)

icon = icon_src.resize((icon_size, icon_size), Image.LANCZOS)
icon_x = int((CANVAS - icon_size) / 2)
icon_y = int((CANVAS - layout["group_h"]) / 2)
canvas.paste(icon, (icon_x, icon_y))

bbox_a, bbox_b = layout["bbox_a"], layout["bbox_b"]
w_a, w_b, h_a = layout["w_a"], layout["w_b"], layout["h_a"]
text_y = icon_y + icon_size + gap
start_x = (CANVAS - layout["total_w"]) / 2
draw.text((start_x - bbox_a[0], text_y - bbox_a[1]), text_a, font=layout["font"], fill=INK)
draw.text((start_x + w_a - bbox_b[0], text_y - bbox_b[1]), text_b, font=layout["font"], fill=GOLD)

canvas.save(OUT_PATH, "PNG")
print(f"Ecrit : {OUT_PATH} ({CANVAS}x{CANVAS}px)")
