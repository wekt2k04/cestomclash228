# Verification structurelle + geometrique du pptx genere par generate-deck.mjs.
# Aucun outil de rendu PowerPoint/LibreOffice disponible dans l'environnement de dev (voir
# README.md) - ce script est le seul moyen de detecter un vrai defaut avant depot au jury :
# XML malforme, forme qui depasse le cadre du slide, boites de texte qui se chevauchent
# significativement (>25% de la plus petite des deux). Un pptx est un zip de XML (OOXML) -
# python (conda base : lxml deja installe) suffit, pas besoin de python-pptx.
#
# Usage : python verify_deck.py [chemin/vers/fichier.pptx]  (defaut : CestomClash228-Pitch.pptx
# dans le meme dossier que ce script). Code de sortie 0 si aucun probleme, 1 sinon - utilisable
# apres chaque regeneration (node generate-deck.mjs && python verify_deck.py).
import sys
import zipfile
from pathlib import Path
from lxml import etree

DEFAULT_PPTX = Path(__file__).parent / 'CestomClash228-Pitch.pptx'
PPTX = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_PPTX

NS = {
    'p': 'http://schemas.openxmlformats.org/presentationml/2006/main',
    'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
    'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
}

EMU_PER_IN = 914400
SLIDE_W_IN = 13.333
SLIDE_H_IN = 7.5


def emu_to_in(v):
    return int(v) / EMU_PER_IN


def overlap_area(a, b):
    ax0, ay0, ax1, ay1 = a['x'], a['y'], a['x'] + a['w'], a['y'] + a['h']
    bx0, by0, bx1, by1 = b['x'], b['y'], b['x'] + b['w'], b['y'] + b['h']
    ox = max(0, min(ax1, bx1) - max(ax0, bx0))
    oy = max(0, min(ay1, by1) - max(ay0, by0))
    return ox * oy


def main():
    print(f"=== Vérification structurelle+géométrique : {PPTX} ===\n")

    zf = zipfile.ZipFile(PPTX)
    bad = zf.testzip()
    print(f"Zip integrity (testzip) : {'OK' if bad is None else 'CORROMPU : ' + bad}")

    slide_names = sorted(
        [n for n in zf.namelist() if n.startswith('ppt/slides/slide') and n.endswith('.xml')],
        key=lambda n: int(''.join(filter(str.isdigit, n.split('/')[-1]))),
    )
    print(f"Slides trouvées : {len(slide_names)} -> {slide_names}\n")

    total_issues = 0

    for sname in slide_names:
        data = zf.read(sname)
        try:
            root = etree.fromstring(data)
        except etree.XMLSyntaxError as e:
            print(f"[{sname}] XML MAL FORMÉ : {e}")
            total_issues += 1
            continue

        print(f"--- {sname} ---")

        sptree = root.find('.//p:cSld/p:spTree', NS)
        shapes = []
        for sp in sptree:
            tag = etree.QName(sp).localname
            if tag in ('nvGrpSpPr', 'grpSpPr'):
                continue
            xfrm = sp.find('.//a:xfrm', NS)
            if xfrm is None:
                continue
            off = xfrm.find('a:off', NS)
            ext = xfrm.find('a:ext', NS)
            if off is None or ext is None:
                continue
            x, y = emu_to_in(off.get('x')), emu_to_in(off.get('y'))
            w, h = emu_to_in(ext.get('cx')), emu_to_in(ext.get('cy'))
            texts = sp.findall('.//a:t', NS)
            text = ''.join(t.text or '' for t in texts)[:40]
            shapes.append({'tag': tag, 'x': x, 'y': y, 'w': w, 'h': h, 'text': text})

        print(f"  {len(shapes)} formes avec position/taille")

        # Depassement de cadre - tolerance 0.02in, ignore les accents de fond volontairement
        # hors-cadre (grands, sans texte - voir edgeAccent() dans generate-deck.mjs).
        for s in shapes:
            right, bottom = s['x'] + s['w'], s['y'] + s['h']
            is_decorative = s['text'] == '' and s['w'] > 3.0 and s['h'] > 3.0
            if not is_decorative and (
                s['x'] < -0.02 or s['y'] < -0.02
                or right > SLIDE_W_IN + 0.02 or bottom > SLIDE_H_IN + 0.02
            ):
                print(f"  [DÉPASSEMENT CADRE] {s['tag']} '{s['text']}' -> "
                      f"x={s['x']:.2f} y={s['y']:.2f} w={s['w']:.2f} h={s['h']:.2f} "
                      f"(right={right:.2f}, bottom={bottom:.2f})")
                total_issues += 1

        # Chevauchement entre boites de texte etroites (<3in - exclut les grands panneaux/
        # accents qui se recouvrent legitimement avec le fond).
        text_shapes = [s for s in shapes if s['tag'] == 'sp' and s['text'] and s['w'] < 3.0]
        for i in range(len(text_shapes)):
            for j in range(i + 1, len(text_shapes)):
                a, b = text_shapes[i], text_shapes[j]
                ov = overlap_area(a, b)
                min_area = min(a['w'] * a['h'], b['w'] * b['h'])
                if min_area > 0 and ov / min_area > 0.25:
                    print(f"  [CHEVAUCHEMENT >25%] '{a['text']}' vs '{b['text']}' "
                          f"-> {ov:.3f}in² / min {min_area:.3f}in²")
                    total_issues += 1

        all_text = ' | '.join(
            t.text.strip() for t in root.findall('.//a:t', NS) if t.text and t.text.strip()
        )
        print(f"  Texte (échantillon) : {all_text[:300]}")
        print()

    print(f"=== TOTAL PROBLÈMES DÉTECTÉS : {total_issues} ===")
    return 1 if total_issues > 0 else 0


if __name__ == '__main__':
    sys.exit(main())
