import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';
import { PrismaService } from 'src/shared/databases/prisma.database';
import { GuestLoginDto } from './dto/guest-login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
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

  googleLogin(req) {
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
}
