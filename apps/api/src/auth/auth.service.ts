import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';
import { User } from '../users/entities/user.entity';
import { PublicUser, toPublicUser } from '../users/user.mapper';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleProfile } from './strategies/google.strategy';

const BCRYPT_ROUNDS = 12;

export interface AuthResult {
  accessToken: string;
  user: PublicUser;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly roles: RolesService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async signup(dto: SignupDto): Promise<AuthResult> {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Un compte existe déjà avec cet email.');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.users.create({
      email: dto.email,
      passwordHash,
      displayName: dto.displayName,
      homeCityId: dto.homeCityId ?? null,
    });

    await this.maybeBootstrapAdmin(user);
    return this.issueToken(user);
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.users.findByEmailWithPassword(dto.email);
    // Meme erreur generique que le mot de passe soit faux ou le compte
    // inexistant / uniquement Google (passwordHash null) - ne pas laisser
    // deviner quels emails sont inscrits.
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Identifiants invalides.');
    }
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Identifiants invalides.');
    }
    return this.issueToken(user);
  }

  async loginWithGoogle(profile: GoogleProfile): Promise<AuthResult> {
    let user = await this.users.findByGoogleId(profile.googleId);
    if (!user) {
      const byEmail = await this.users.findByEmail(profile.email);
      user = byEmail
        ? await this.users.linkGoogleId(byEmail.id, profile.googleId)
        : await this.users.create({
            email: profile.email,
            googleId: profile.googleId,
            displayName: profile.displayName,
            passwordHash: null,
          });
      await this.maybeBootstrapAdmin(user);
    }
    return this.issueToken(user);
  }

  private async maybeBootstrapAdmin(user: User): Promise<void> {
    const bootstrapEmail = this.config.get<string>('BOOTSTRAP_ADMIN_EMAIL');
    if (bootstrapEmail && user.email === bootstrapEmail) {
      await this.roles.bootstrapNationalRole(user.id);
    }
  }

  private issueToken(user: User): AuthResult {
    const accessToken = this.jwt.sign({ sub: user.id, email: user.email });
    return { accessToken, user: toPublicUser(user) };
  }
}
