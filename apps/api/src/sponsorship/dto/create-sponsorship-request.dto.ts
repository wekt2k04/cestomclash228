import {
  IsNumber,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  MinLength,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

// Trouve par security-review avant ce commit : @IsUrl() seul accepte les hotes
// prives/loopback/link-local litteraux (http://127.0.0.1/..., 169.254.169.254
// - metadata cloud -, 10.x/172.16-31.x/192.168.x, ::1). Deux risques concrets
// pour CE champ precis : (1) deanonymisation d'un verificateur - le flux existe
// justement pour qu'un verificateur charge cette image pour juger la preuve,
// un hote controle par le demandeur y apprendrait l'IP/User-Agent/horodatage
// exact de consultation d'un role a pouvoir reel ; (2) SSRF latent si un futur
// traitement serveur (miniature, antivirus) vient lire cette URL. Verification
// statique sur le libelle litteral uniquement (pas de resolution DNS, reste
// synchrone) - un domaine qui RESOUT vers une IP privee est un angle mort
// connu, a traiter si une vraie recuperation serveur de cette URL est ajoutee.
const PRIVATE_HOST_PATTERN =
  /^(localhost|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|0\.0\.0\.0|\[?::1\]?)/i;

@ValidatorConstraint({ name: 'isPublicHttpsUrl', async: false })
class IsPublicHttpsUrlConstraint implements ValidatorConstraintInterface {
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
    return "L'URL de preuve doit être une URL https publique (pas une adresse locale/privée).";
  }
}

export class CreateSponsorshipRequestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  description: string;

  @IsNumber()
  @IsPositive()
  // Borne haute alignee sur numeric(10,2) en base (voir
  // entities/sponsorship-request.entity.ts) - sans elle un montant hors bornes
  // declenchait une erreur Postgres non geree (500) plutot qu'un 400 propre.
  @Max(99999999.99)
  amountDeclared: number;

  @IsString()
  @Validate(IsPublicHttpsUrlConstraint)
  proofImageUrl: string;
}
