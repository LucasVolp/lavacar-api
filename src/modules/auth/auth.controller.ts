import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { Public } from 'src/shared/decorators/public.decorator';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  @Public()
  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(@Req() req, @Res() res) {
    const user = req.user;
    const accessToken = this.authService.generateJwt(user);

    const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?access_token=${accessToken}`;
    res.redirect(redirectUrl);
  }

  @Get('me')
  getProfile(@CurrentUser() user: JwtPayload) {
    return this.authService.getProfile(user.id);
  }
}
