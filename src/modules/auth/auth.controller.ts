import { Controller, Get, Post, Body, UseGuards, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { Public } from 'src/shared/decorators/public.decorator';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';
import { GuestLoginDto } from './dto/guest-login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  @Public()
  @Post('guest')
  async guestLogin(@Body() dto: GuestLoginDto) {
    return this.authService.guestLogin(dto);
  }

  @Public()
  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(@Req() req, @Res() res) {
    const user = req.user;

    // Usuário novo via Google — precisa completar cadastro com telefone
    if (user.needsRegistration) {
      const profile = encodeURIComponent(JSON.stringify(user.googleProfile));
      const redirectUrl = `${process.env.FRONTEND_URL}/auth/complete-registration?profile=${profile}`;
      return res.redirect(redirectUrl);
    }

    const accessToken = this.authService.generateJwt(user);
    const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?access_token=${accessToken}`;
    res.redirect(redirectUrl);
  }

  @Get('me')
  getProfile(@CurrentUser() user: JwtPayload) {
    return this.authService.getProfile(user.id);
  }
}
