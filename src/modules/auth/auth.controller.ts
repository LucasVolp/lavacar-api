import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import { RequestUser } from './types/user';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: RequestUser, @Res() res: Response) {
    const user = req.user;
    const access_token = this.authService.generateJwt(user);

    const isValidToken =
      await this.authService.validateGoogleAccessToken(access_token);

    if (!isValidToken) {
      return res.status(401).json({
        message: 'Invalid Google access token',
      });
    }

    const redirectUrl = `${process.env.FRONTEND_URL}?access_token=${access_token}`;
    return res.redirect(redirectUrl);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req) {
    return this.authService.googleLogin(req);
  }
}
