import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

// Extrait de sponsorship/dto/create-sponsorship-request.dto.ts le 2026-09-10 (2e usage reel,
// preuve de paiement bounty-interests - voir bounty-interests/dto/submit-proof.dto.ts) plutot
// que duplique : c'est un controle de securite (voir raisonnement complet ci-dessous), une
// divergence entre 2 copies serait un vrai risque, pas juste un manque de DRY cosmetique.
//
// Trouve par security-review avant le commit d'origine : @IsUrl() seul accepte les hotes
// prives/loopback/link-local litteraux (http://127.0.0.1/..., 169.254.169.254 - metadata cloud
// -, 10.x/172.16-31.x/192.168.x, ::1). Deux risques concrets pour ce type de champ (une image a
// consulter par un tiers pour juger une preuve) : (1) deanonymisation de la personne qui
// consulte - le flux existe justement pour qu'elle charge cette image, un hote controle par
// l'auteur de la preuve y apprendrait son IP/User-Agent/horodatage exact de consultation ; (2)
// SSRF latent si un futur traitement serveur (miniature, antivirus) vient lire cette URL.
// Verification statique sur le libelle litteral uniquement (pas de resolution DNS, reste
// synchrone) - un domaine qui RESOUT vers une IP privee est un angle mort connu, a traiter si
// une vraie recuperation serveur de cette URL est ajoutee.
const PRIVATE_HOST_PATTERN =
  /^(localhost|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|0\.0\.0\.0|\[?::1\]?)/i;

@ValidatorConstraint({ name: 'isPublicHttpsUrl', async: false })
export class IsPublicHttpsUrlConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'string') return false;
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      return false;
    }
    return (
      url.protocol === 'https:' && !PRIVATE_HOST_PATTERN.test(url.hostname)
    );
  }

  defaultMessage(): string {
    return "L'URL doit être une URL https publique (pas une adresse locale/privée).";
  }
}
