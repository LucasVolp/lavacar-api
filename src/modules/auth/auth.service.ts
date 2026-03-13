import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from 'src/shared/databases/prisma.database';
import { GuestLoginDto } from './dto/guest-login.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CompleteRegistrationDto } from './dto/complete-registration.dto';
import { RegisterUseCase } from './use-cases/register.use-case';
import { LoginUseCase } from './use-cases/login.use-case';
import { CompleteRegistrationUseCase } from './use-cases/complete-registration.use-case';

const TRACKING_TOKEN_ISSUER = 'nexocar:tracking';
const TRACKING_TOKEN_EXPIRY = '30d';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly completeRegistrationUseCase: CompleteRegistrationUseCase,
    private readonly logger: Logger = new Logger()
  ){}

  generateJwt(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }

  async guestLogin(dto: GuestLoginDto) {
    let user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    
    if (user && !user.isGuest) {
        throw new UnauthorizedException('Por favor, faça login com sua conta para continuar.');
    }

    if (!user) {
        if (!dto.firstName) throw new BadRequestException('O nome é obrigatório para novos clientes.');
        
        user = await this.prisma.$transaction(async (tx) => {
             const newUser = await tx.user.create({
                 data: {
                     firstName: dto.firstName as string,
                     lastName: dto.lastName,
                     phone: dto.phone,
                     isGuest: true,
                     role: 'USER',
                 }
             });
             
             if (dto.vehicle) {
                 await tx.vehicle.create({
                     data: {
                         ...dto.vehicle,
                         userId: newUser.id
                     }
                 });
             }
             
             return newUser;
        });
    } else if (dto.vehicle) {
        await this.prisma.vehicle.create({
            data: {
                ...dto.vehicle,
                userId: user.id
            }
        });
    }
    
    const token = this.generateJwt(user);
    
    return {
        user,
        access_token: token,
    };
  }

  googleLogin(req: { user?: { id: string; email: string; phone: string; role: string } }) {
    if (!req.user) {
      return 'No user from google';
    }

    const payload = {
      sub: req.user.id,
      email: req.user.email,
      phone: req.user.phone,
      role: req.user.role,
    };

    return {
      user: req.user,
      access_token: this.jwtService.sign(payload),
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        picture: true,
        role: true,
        isGuest: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      user,
      access_token: this.generateJwt(user),
    };
  }

  async register(dto: RegisterDto) {
    const user = await this.registerUseCase.execute(dto);
    const token = this.generateJwt(user);
    return { user, access_token: token };
  }

  async login(dto: LoginDto) {
    const user = await this.loginUseCase.execute(dto);
    const token = this.generateJwt(user);
    return { user, access_token: token };
  }

  async completeRegistration(dto: CompleteRegistrationDto) {
    const user = await this.completeRegistrationUseCase.execute(dto);
    const token = this.generateJwt(user);
    return { user, access_token: token };
  }

  async validateGoogleAccessToken(accessToken: string): Promise<any> {
    const googleUserInfoUrl = process.env.GOOGLE_USERINFO_URL;

    try {
      const response = await axios.get(
        `${googleUserInfoUrl}?access_token=${accessToken}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error('Error validating Google access token', error);
      throw new UnauthorizedException('Invalid Google access token');
    }
  }

  generateTrackingToken(appointmentId: string): string {
    return this.jwtService.sign(
      { sub: appointmentId, purpose: 'tracking', iss: TRACKING_TOKEN_ISSUER },
      { expiresIn: TRACKING_TOKEN_EXPIRY },
    );
  }

  buildTrackingUrl(appointmentId: string): string {
    const token = this.generateTrackingToken(appointmentId);
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3001');
    return `${frontendUrl}/track?token=${token}`;
  }

  async validateTrackingToken(token: string) {
    let payload: { sub: string; purpose?: string; iss?: string };

    try {
      payload = this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Token expirado ou inválido.');
    }

    if (payload.purpose !== 'tracking' || payload.iss !== TRACKING_TOKEN_ISSUER) {
      throw new UnauthorizedException('Token inválido.');
    }

    const appointment = await this.prisma.appointment.findUnique({
      where: { id: payload.sub },
      include: {
        vehicle: {
          select: { id: true, brand: true, model: true, plate: true, color: true, type: true },
        },
        shop: {
          select: {
            id: true, name: true, slug: true, phone: true, logoUrl: true,
            street: true, number: true, neighborhood: true, city: true, state: true,
          },
        },
        services: {
          select: { id: true, serviceName: true, servicePrice: true, duration: true },
        },
      },
    });

    if (!appointment) {
      throw new UnauthorizedException('Agendamento não encontrado.');
    }

    return appointment;
  }
}
