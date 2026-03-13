import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  guestLogin: jest.fn(),
  completeRegistration: jest.fn(),
  getProfile: jest.fn(),
  generateJwt: jest.fn().mockReturnValue('mock-token'),
  googleLogin: jest.fn(),
  validateGoogleAccessToken: jest.fn(),
  validateTrackingToken: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // -----------------------------------------------------------
  // POST /auth/register
  // -----------------------------------------------------------
  describe('register', () => {
    it('should delegate to authService.register and return result', async () => {
      const dto = { firstName: 'Lucas', phone: '+5511999999999', password: '123456' } as any;
      const expected = { user: { id: 'u1' }, access_token: 'tok' };
      mockAuthService.register.mockResolvedValue(expected);

      const result = await controller.register(dto);

      expect(mockAuthService.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });

    it('should propagate errors from authService.register', async () => {
      mockAuthService.register.mockRejectedValue(new BadRequestException('Phone in use'));

      await expect(controller.register({} as any)).rejects.toThrow(BadRequestException);
    });
  });

  // -----------------------------------------------------------
  // POST /auth/login
  // -----------------------------------------------------------
  describe('login', () => {
    it('should delegate to authService.login and return result', async () => {
      const dto = { email: 'a@b.com', password: '123456' };
      const expected = { user: { id: 'u1' }, access_token: 'tok' };
      mockAuthService.login.mockResolvedValue(expected);

      const result = await controller.login(dto);

      expect(mockAuthService.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });

    it('should propagate errors from authService.login', async () => {
      mockAuthService.login.mockRejectedValue(new Error('Invalid credentials'));

      await expect(controller.login({ email: 'x', password: 'x' })).rejects.toThrow();
    });
  });

  // -----------------------------------------------------------
  // POST /auth/guest
  // -----------------------------------------------------------
  describe('guestLogin', () => {
    it('should delegate to authService.guestLogin and return result', async () => {
      const dto = { phone: '+5511900000000', firstName: 'Guest' } as any;
      const expected = { user: { id: 'g1' }, access_token: 'tok' };
      mockAuthService.guestLogin.mockResolvedValue(expected);

      const result = await controller.guestLogin(dto);

      expect(mockAuthService.guestLogin).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });

    it('should propagate errors from authService.guestLogin', async () => {
      mockAuthService.guestLogin.mockRejectedValue(new BadRequestException());

      await expect(controller.guestLogin({} as any)).rejects.toThrow(BadRequestException);
    });
  });

  // -----------------------------------------------------------
  // POST /auth/complete-registration
  // -----------------------------------------------------------
  describe('completeRegistration', () => {
    it('should delegate to authService.completeRegistration and return result', async () => {
      const dto = { phone: '+5511999999999', email: 'a@b.com', firstName: 'A' } as any;
      const expected = { user: { id: 'u1' }, access_token: 'tok' };
      mockAuthService.completeRegistration.mockResolvedValue(expected);

      const result = await controller.completeRegistration(dto);

      expect(mockAuthService.completeRegistration).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });

    it('should propagate errors from authService.completeRegistration', async () => {
      mockAuthService.completeRegistration.mockRejectedValue(new Error('fail'));

      await expect(controller.completeRegistration({} as any)).rejects.toThrow();
    });
  });

  // -----------------------------------------------------------
  // GET /auth/me
  // -----------------------------------------------------------
  describe('getProfile', () => {
    it('should call authService.getProfile with user id from JWT', async () => {
      const jwtPayload = { id: 'u1', email: 'a@b.com', phone: '+55', role: 'USER' };
      const expected = { user: { id: 'u1', firstName: 'A' }, access_token: 'tok' };
      mockAuthService.getProfile.mockResolvedValue(expected);

      const result = await controller.getProfile(jwtPayload);

      expect(mockAuthService.getProfile).toHaveBeenCalledWith('u1');
      expect(result).toEqual(expected);
    });

    it('should propagate UnauthorizedException from authService.getProfile', async () => {
      mockAuthService.getProfile.mockRejectedValue(new Error('User not found'));

      await expect(
        controller.getProfile({ id: 'missing', email: '', phone: '', role: '' }),
      ).rejects.toThrow();
    });
  });

  // -----------------------------------------------------------
  // GET /auth/google (googleAuth)
  // -----------------------------------------------------------
  describe('googleAuth', () => {
    it('should be defined and return void (guard handles redirect)', async () => {
      const result = await controller.googleAuth();
      expect(result).toBeUndefined();
    });
  });

  // -----------------------------------------------------------
  // GET /auth/google/redirect (googleAuthRedirect)
  // -----------------------------------------------------------
  describe('googleAuthRedirect', () => {
    it('should redirect to complete-registration when needsRegistration is true', () => {
      const req = {
        user: {
          needsRegistration: true,
          googleProfile: { email: 'a@b.com', name: 'A' },
        },
      };
      const res = { redirect: jest.fn() };
      process.env.FRONTEND_URL = 'http://localhost:3000';

      controller.googleAuthRedirect(req as any, res as any);

      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining('/auth/complete-registration?profile='),
      );
    });

    it('should redirect with access_token when user already registered', () => {
      const req = {
        user: { id: 'u1', email: 'a@b.com', phone: '+55', role: 'USER', needsRegistration: false },
      };
      const res = { redirect: jest.fn() };
      process.env.FRONTEND_URL = 'http://localhost:3000';

      controller.googleAuthRedirect(req as any, res as any);

      expect(mockAuthService.generateJwt).toHaveBeenCalledWith(req.user);
      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining('/auth/callback?access_token='),
      );
    });
  });

  // -----------------------------------------------------------
  // GET /auth/track/validate
  // -----------------------------------------------------------
  describe('validateTrackingToken', () => {
    it('should call authService.validateTrackingToken with query token', async () => {
      const appointment = { id: 'appt-1', status: 'CONFIRMED' };
      mockAuthService.validateTrackingToken.mockResolvedValue(appointment);

      const result = await controller.validateTrackingToken('some-token');

      expect(mockAuthService.validateTrackingToken).toHaveBeenCalledWith('some-token');
      expect(result).toEqual(appointment);
    });

    it('should throw BadRequestException when token is empty string', () => {
      expect(() => controller.validateTrackingToken('')).toThrow(BadRequestException);
    });

    it('should throw BadRequestException when token is undefined', () => {
      expect(() => controller.validateTrackingToken(undefined as any)).toThrow(
        BadRequestException,
      );
    });

    it('should propagate errors from authService.validateTrackingToken', async () => {
      mockAuthService.validateTrackingToken.mockRejectedValue(new Error('invalid'));

      await expect(controller.validateTrackingToken('bad')).rejects.toThrow();
    });
  });

  // -----------------------------------------------------------
  // Edge cases
  // -----------------------------------------------------------
  describe('Edge cases', () => {
    it('register should pass DTO through unchanged', async () => {
      const dto = {
        firstName: 'A',
        lastName: 'B',
        email: 'a@b.com',
        password: 'secret',
        phone: '+5511999999999',
      };
      mockAuthService.register.mockResolvedValue({ user: {}, access_token: '' });

      await controller.register(dto);

      expect(mockAuthService.register).toHaveBeenCalledWith(dto);
    });

    it('guestLogin should pass vehicle data through to service', async () => {
      const dto = {
        phone: '+5511900000000',
        firstName: 'Guest',
        vehicle: { type: 'CAR', brand: 'Toyota', model: 'Corolla', size: 'MEDIUM' },
      };
      mockAuthService.guestLogin.mockResolvedValue({ user: {}, access_token: '' });

      await controller.guestLogin(dto as any);

      expect(mockAuthService.guestLogin).toHaveBeenCalledWith(dto);
    });
  });
});
