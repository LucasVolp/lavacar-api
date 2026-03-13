import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable, Logger } from '@nestjs/common';
import { FindUserByEmailRepository } from '../../modules/users/repository/find-user-by-email.repository';
import { AuthService } from '../../modules/auth/auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(
    private readonly findUserByEmailRepository: FindUserByEmailRepository,
    private readonly authService: AuthService,
  ) {
    const clientID = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const callbackURL = process.env.GOOGLE_CALLBACK_URL;

    if (!clientID || !clientSecret || !callbackURL) {
      throw new Error('Google OAuth credentials not configured: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL required');
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
      const email = profile.emails[0].value;
      const firstName = profile.name.givenName;
      const lastName = profile.name.familyName;
      const picture = profile.photos[0].value;

      const user = await this.findUserByEmailRepository.findUserByEmail(email);

      if (user) {
        done(null, user);
        return;
      }

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
      this.logger.error('Google OAuth validation error', error instanceof Error ? error.stack : undefined);
      done(error, false);
    }
  }
}
