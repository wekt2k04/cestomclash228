# Genere le QR code pointant vers l'appli en ligne, pour la slide de conclusion du pitch
# (generate-deck.mjs l'embarque ensuite via addImage). Noir sur blanc, marge (quiet zone)
# standard conservee - un QR sans marge suffisante echoue a scanner sur certains appareils,
# surtout depuis une photo d'ecran partage (cas d'usage reel ici : concours en ligne).
import qrcode

APP_URL = "https://cestomclash228.web.app"
OUT_PATH = "qr-app-link.png"

qr = qrcode.QRCode(
    version=None,  # taille auto-ajustee au contenu
    error_correction=qrcode.constants.ERROR_CORRECT_M,
    box_size=20,
    border=4,  # quiet zone en modules, minimum standard recommande
)
qr.add_data(APP_URL)
qr.make(fit=True)

img = qr.make_image(fill_color="black", back_color="white")
img.save(OUT_PATH)
print(f"QR code ecrit : {OUT_PATH} ({img.size[0]}x{img.size[1]}px) -> {APP_URL}")
