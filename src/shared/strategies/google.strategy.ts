import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { config } from 'dotenv';

import { Injectable } from '@nestjs/common';
import { AuthService } from '../../modules/auth/auth.service';
import { CreateUserRepository } from '../../modules/users/repository/create-user.repository';
import { FindUserByEmailRepository } from '../../modules/users/repository/find-user-by-email.repository';

config();

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly authService: AuthService,
    private readonly createUserRepository: CreateUserRepository,
    private readonly findUserByEmailRepository: FindUserByEmailRepository,
  ) {
    const clientID = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const callbackURL = process.env.GOOGLE_CALLBACK_URL;

    if (!clientID || !clientSecret || !callbackURL) {
      throw new Error('Google OAuth environment variables are not properly configured.');
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
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
      const googleUser =
        await this.authService.validateGoogleAccessToken(accessToken);

      const email = googleUser.email;
      let user = await this.findUserByEmailRepository.findUserByEmail(email);

      if (!user) {
        user = await this.createUserRepository.create({
          email,
          firstName: googleUser.given_name,
          lastName: googleUser.family_name,
          picture: googleUser.picture,
          password: '',
        });
      }

      done(null, user);
    } catch (error) {
      done(error, false);
    }
  }
}
