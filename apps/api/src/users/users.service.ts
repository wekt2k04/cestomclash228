import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  findById(id: string): Promise<User | null> {
    return this.users.findOne({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.users.findOne({ where: { email } });
  }

  // Inclut passwordHash (select:false par defaut) - reserve a la verification
  // de mot de passe pendant le login, jamais renvoye tel quel a un client.
  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();
  }

  findByGoogleId(googleId: string): Promise<User | null> {
    return this.users.findOne({ where: { googleId } });
  }

  create(data: Partial<User>): Promise<User> {
    const user = this.users.create(data);
    return this.users.save(user);
  }

  async linkGoogleId(userId: string, googleId: string): Promise<User> {
    await this.users.update({ id: userId }, { googleId });
    return this.findById(userId) as Promise<User>;
  }
}
