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
      passReqToCallback: true,
    });
  }

  async validate(
    req: any,
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      // Valida o token de acesso do Google e obtém os dados do usuário
      const googleUser = await this.authService.validateGoogleAccessToken(accessToken);
  
      if (!googleUser || !googleUser.email) {
        throw new Error('Invalid Google user data');
      }
  
      const email = googleUser.email;
  
      // Verifica se o usuário já existe no banco de dados
      let user = await this.findUserByEmailRepository.findUserByEmail(email);
  
      // Se o usuário não existir, cria um novo
      if (!user) {
        user = await this.createUserRepository.create({
          email,
          firstName: googleUser.given_name || profile.name.givenName,
          lastName: googleUser.family_name || profile.name.familyName,
          picture: googleUser.picture || profile.photos[0]?.value,
          password: '', // Senha vazia para usuários do Google
        });
      }
  
      // Retorna o usuário para o Passport
      done(null, user);
    } catch (error) {
      // Loga o erro e retorna false para o Passport
      console.error('Error in GoogleStrategy validate method:', error);
      done(error, false);
    }
  }
}
