import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { CreateUserRepository } from '../../modules/users/repository/create-user.repository';
import { FindUserByEmailRepository } from '../../modules/users/repository/find-user-by-email.repository';
import { AuthService } from '../../modules/auth/auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly createUserRepository: CreateUserRepository,
    private readonly findUserByEmailRepository: FindUserByEmailRepository,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const email = profile.emails[0].value;
      const firstName = profile.name.givenName;
      const lastName = profile.name.familyName;
      const picture = profile.photos[0].value;

      // Verifica se o usuário já existe
      let user: any = await this.findUserByEmailRepository.findUserByEmail(email);

      // Se não existir, cria um novo
      if (!user) {
        user = await this.createUserRepository.create({
          email,
          firstName,
          lastName,
          picture,
          password: '', // Senha vazia para usuários Google, deve tratar no login manual
        });
      }

      done(null, user);
    } catch (error) {
      console.error('Error in GoogleStrategy validate:', error);
      done(error, false);
    }
  }
}
