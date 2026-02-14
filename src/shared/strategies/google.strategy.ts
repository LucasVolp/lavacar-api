import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { FindUserByEmailRepository } from '../../modules/users/repository/find-user-by-email.repository';
import { AuthService } from '../../modules/auth/auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
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

      // Busca usuário existente pelo e-mail
      const user = await this.findUserByEmailRepository.findUserByEmail(email);

      if (user) {
        // Usuário já existe — prossegue com login
        done(null, user);
        return;
      }

      // Usuário não existe — retorna dados do Google para o frontend
      // completar o cadastro (informar telefone obrigatório)
      done(null, {
        needsRegistration: true,
        googleProfile: {
          email,
          firstName,
          lastName,
          picture,
        },
      });
    } catch (error) {
      console.error('Error in GoogleStrategy validate:', error);
      done(error, false);
    }
  }
}
