import { User } from './entities/user.entity';

export type PublicUser = Omit<User, 'passwordHash'>;

// Allowlist explicite plutot qu'un destructure-and-discard : un futur champ
// sensible ajoute a User n'est expose que s'il est ajoute ici deliberement.
export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    googleId: user.googleId,
    displayName: user.displayName,
    homeCity: user.homeCity,
    homeCityId: user.homeCityId,
    createdAt: user.createdAt,
  };
}
