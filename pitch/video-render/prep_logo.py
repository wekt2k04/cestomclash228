"""Recadre pitch/CreaAfrica_logo.png (fourni par l'utilisateur, sur un immense fond blanc,
540x1170 avec le vrai logo minuscule au centre) en un asset propre, fond blanc rendu transparent
(seuil de luminosite simple - le logo n'a aucune zone blanche significative en son sein, donc pas
de risque de trouer le dessin lui-meme), pret a etre compose sur un fond sombre."""
from pathlib import Path
from PIL import Image

SRC = Path(__file__).parent.parent / "CreaAfrica_logo.png"
OUT = Path(__file__).parent / "assets" / "creaafrica_logo.png"

im = Image.open(SRC).convert("RGBA")
bbox = im.convert("L").point(lambda p: 0 if p > 245 else 255).getbbox()
im = im.crop(bbox)

pixels = im.load()
w, h = im.size
for y in range(h):
    for x in range(w):
        r, g, b, a = pixels[x, y]
        if r > 245 and g > 245 and b > 245:
            pixels[x, y] = (r, g, b, 0)

im.save(OUT)
print(f"Logo recadre : {im.size}, sauve dans {OUT}")
