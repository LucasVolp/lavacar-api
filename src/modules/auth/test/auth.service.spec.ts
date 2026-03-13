import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { RegisterUseCase } from '../use-cases/register.use-case';
import { LoginUseCase } from '../use-cases/login.use-case';
import { CompleteRegistrationUseCase } from '../use-cases/complete-registration.use-case';
import { PrismaService } from 'src/shared/databases/prisma.database';

jest.mock('axios', () => ({
  get: jest.fn(),
}));
import axios from 'axios';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  vehicle: {
    create: jest.fn(),
  },
  appointment: {
    findUnique: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-token'),
  verify: jest.fn(),
};

const mockConfigService = {
  get: jest.fn().mockReturnValue('http://localhost:3001'),
};

const mockRegisterUseCase = { execute: jest.fn() };
const mockLoginUseCase = { execute: jest.fn() };
const mockCompleteRegistrationUseCase = { execute: jest.fn() };
const mockLogger = { error: jest.fn(), log: jest.fn(), warn: jest.fn(), debug: jest.fn() };

// ---------------------------------------------------------------------------
// Helpers / fixtures
// ---------------------------------------------------------------------------
const validUser = {
  id: 'u1',
  email: 'alice@example.com',
  phone: '+5511999999999',
  role: 'USER',
  firstName: 'Alice',
  lastName: 'Smith',
  picture: null,
  isGuest: false,
  createdAt: new Date('2025-01-01'),
};

const guestUser = {
  id: 'g1',
  email: null,
  phone: '+5511900000000',
  role: 'USER',
  firstName: 'Guest',
  lastName: null,
  isGuest: true,
};

const registeredUser = {
  id: 'r1',
  phone: '+5511900000000',
  email: 'registered@example.com',
  isGuest: false,
  role: 'OWNER',
};

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------
describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: RegisterUseCase, useValue: mockRegisterUseCase },
        { provide: LoginUseCase, useValue: mockLoginUseCase },
        { provide: CompleteRegistrationUseCase, useValue: mockCompleteRegistrationUseCase },
        { provide: Logger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    // Manually inject prisma since it uses PrismaService token
    (service as any).prisma = mockPrismaService;
    (service as any).logger = mockLogger;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // =========================================================================
  // generateJwt
  // =========================================================================
  describe('generateJwt', () => {
    it('should sign a JWT with the correct payload structure', () => {
      const user = { id: 'u1', email: 'a@b.com', phone: '+5511999999999', role: 'USER' };
      const result = service.generateJwt(user);

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'u1',
        email: 'a@b.com',
        phone: '+5511999999999',
        role: 'USER',
      });
      expect(result).toBe('mock-token');
    });

    it('should map user.id to sub claim (not id)', () => {
      service.generateJwt({ id: 'abc-123', email: '', phone: '', role: '' });

      const payload = mockJwtService.sign.mock.calls[0][0];
      expect(payload).toHaveProperty('sub', 'abc-123');
      expect(payload).not.toHaveProperty('id');
    });

    it('should include role in JWT payload for RBAC enforcement', () => {
      const roles = ['USER', 'OWNER', 'EMPLOYEE', 'MANAGER', 'ADMIN'];
      roles.forEach((role) => {
        mockJwtService.sign.mockClear();
        service.generateJwt({ id: 'u1', email: 'e', phone: 'p', role });
        expect(mockJwtService.sign).toHaveBeenCalledWith(
          expect.objectContaining({ role }),
        );
      });
    });

    it('should handle user with null/undefined optional fields', () => {
      const user = { id: 'u1', email: null, phone: undefined, role: 'USER' };
      service.generateJwt(user);

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'u1',
        email: null,
        phone: undefined,
        role: 'USER',
      });
    });

    // SECURITY: The JWT payload should never include the password
    it('should NOT include password or sensitive fields in token payload', () => {
      const user = { id: 'u1', email: 'a@b.com', phone: '+55', role: 'USER', password: 'hashed' };
      service.generateJwt(user);

      const payload = mockJwtService.sign.mock.calls[0][0];
      expect(payload).not.toHaveProperty('password');
      expect(payload).not.toHaveProperty('firstName');
      expect(payload).not.toHaveProperty('lastName');
    });
  });

  // =========================================================================
  // guestLogin
  // =========================================================================
  describe('guestLogin', () => {
    // --- Happy paths ---
    it('should return existing guest user and token', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(guestUser);

      const result = await service.guestLogin({ phone: '+5511900000000' });

      expect(result).toEqual({ user: guestUser, access_token: 'mock-token' });
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { phone: '+5511900000000' },
      });
    });

    it('should create new guest user via $transaction when user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      const createdUser = { id: 'g2', phone: '+5511900000000', isGuest: true, role: 'USER' };
      mockPrismaService.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          user: { create: jest.fn().mockResolvedValue(createdUser) },
          vehicle: { create: jest.fn().mockResolvedValue({}) },
        };
        return cb(tx);
      });

      const dto = {
        phone: '+5511900000000',
        firstName: 'Lucas',
        vehicle: { type: 'CAR' as any, brand: 'Toyota', model: 'Corolla', size: 'MEDIUM' as any },
      };
      const result = await service.guestLogin(dto);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(result.user).toEqual(createdUser);
      expect(result.access_token).toBe('mock-token');
    });

    it('should create new guest user WITHOUT vehicle when vehicle not provided', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      const createdUser = { id: 'g3', phone: '+5511900000000', isGuest: true, role: 'USER' };
      const mockVehicleCreate = jest.fn();
      mockPrismaService.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          user: { create: jest.fn().mockResolvedValue(createdUser) },
          vehicle: { create: mockVehicleCreate },
        };
        return cb(tx);
      });

      await service.guestLogin({ phone: '+5511900000000', firstName: 'Lucas' });

      expect(mockVehicleCreate).not.toHaveBeenCalled();
    });

    it('should add vehicle for existing guest user when vehicle is provided', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(guestUser);
      mockPrismaService.vehicle.create.mockResolvedValue({});

      const dto = {
        phone: '+5511900000000',
        vehicle: { type: 'CAR' as any, brand: 'Toyota', model: 'Corolla', size: 'MEDIUM' as any },
      };
      const result = await service.guestLogin(dto);

      expect(mockPrismaService.vehicle.create).toHaveBeenCalledWith({
        data: { ...dto.vehicle, userId: guestUser.id },
      });
      expect(result.access_token).toBe('mock-token');
    });

    it('should set isGuest to true and role to USER for new guest users', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      let capturedData: any;
      mockPrismaService.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          user: {
            create: jest.fn().mockImplementation(({ data }) => {
              capturedData = data;
              return { id: 'g4', ...data };
            }),
          },
          vehicle: { create: jest.fn() },
        };
        return cb(tx);
      });

      await service.guestLogin({ phone: '+5511900000000', firstName: 'Test' });

      expect(capturedData).toEqual(
        expect.objectContaining({ isGuest: true, role: 'USER' }),
      );
    });

    // --- Validation / error paths ---
    it('should throw UnauthorizedException when non-guest user tries guest login', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(registeredUser);

      await expect(
        service.guestLogin({ phone: '+5511900000000' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException when new user has no firstName', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.guestLogin({ phone: '+5511900000000' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException with descriptive message for missing firstName', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.guestLogin({ phone: '+5511900000000' }),
      ).rejects.toThrow('O nome é obrigatório para novos clientes.');
    });

    // --- SECURITY: Guest login abuse ---
    it('SECURITY: should block guest login for fully registered user (account takeover prevention)', async () => {
      // A registered user with isGuest=false should never be accessible via guest flow.
      // This prevents an attacker from using the guest endpoint to get a JWT for a
      // fully registered account by merely knowing the phone number.
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'r1',
        phone: '+5511900000000',
        isGuest: false,
        role: 'ADMIN',
      });

      await expect(
        service.guestLogin({ phone: '+5511900000000', firstName: 'Hacker' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('SECURITY: guest login error message should not reveal user details', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'r1',
        phone: '+5511900000000',
        isGuest: false,
        role: 'OWNER',
        email: 'secret@owner.com',
      });

      try {
        await service.guestLogin({ phone: '+5511900000000' });
        fail('Expected UnauthorizedException');
      } catch (err: any) {
        // The error message should NOT leak the email, role, or any PII
        expect(err.message).not.toContain('secret@owner.com');
        expect(err.message).not.toContain('OWNER');
      }
    });

    // SECURITY: Phone enumeration - the guest flow inherently reveals whether
    // a phone is registered (returns user vs. asks for firstName). This is documented
    // as an accepted trade-off, but rate limiting should mitigate abuse.
    // NOTE: No rate limiting is currently enforced on POST /auth/guest.
    // Recommendation: Add throttle guard (@Throttle) to guestLogin endpoint.

    it('SECURITY: SQL injection pattern in phone should be passed to Prisma safely', async () => {
      // Prisma parameterises queries, so injection patterns should not cause issues.
      // This test verifies the input is forwarded as-is to the parameterised query.
      const maliciousPhone = "'+OR+1=1--";
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.guestLogin({ phone: maliciousPhone }),
      ).rejects.toThrow(BadRequestException); // No firstName => BadRequest

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { phone: maliciousPhone },
      });
    });

    it('SECURITY: XSS payload in firstName should be stored as-is (output encoding responsibility)', async () => {
      // XSS payloads should be stored but rendered safely on the frontend.
      // The service layer should not sanitise — that is the view layer's job.
      const xssName = '<script>alert("xss")</script>';
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      let capturedData: any;
      mockPrismaService.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          user: {
            create: jest.fn().mockImplementation(({ data }) => {
              capturedData = data;
              return { id: 'x1', ...data };
            }),
          },
          vehicle: { create: jest.fn() },
        };
        return cb(tx);
      });

      await service.guestLogin({ phone: '+5511900000000', firstName: xssName });

      expect(capturedData.firstName).toBe(xssName);
    });

    it('SECURITY: extremely long firstName should be passed through (DB constraints apply)', async () => {
      const longName = 'A'.repeat(10_000);
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          user: { create: jest.fn().mockResolvedValue({ id: 'ln1', firstName: longName }) },
          vehicle: { create: jest.fn() },
        };
        return cb(tx);
      });

      // Should not throw at service level — DB constraints handle limits
      const result = await service.guestLogin({ phone: '+5511900000000', firstName: longName });
      expect(result.user.firstName).toBe(longName);
    });

    it('SECURITY: emoji in firstName should be accepted', async () => {
      const emojiName = 'Lucas 🚗';
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          user: { create: jest.fn().mockResolvedValue({ id: 'e1', firstName: emojiName }) },
          vehicle: { create: jest.fn() },
        };
        return cb(tx);
      });

      const result = await service.guestLogin({ phone: '+5511900000000', firstName: emojiName });
      expect(result.user.firstName).toBe(emojiName);
    });
  });

  // =========================================================================
  // googleLogin
  // =========================================================================
  describe('googleLogin', () => {
    it('should return message when no user in request', () => {
      const result = service.googleLogin({ user: null });
      expect(result).toBe('No user from google');
    });

    it('should return message when user is undefined', () => {
      const result = service.googleLogin({ user: undefined });
      expect(result).toBe('No user from google');
    });

    it('should return user and access_token when user exists', () => {
      const user = { id: 'u1', email: 'a@b.com', phone: '+55', role: 'USER' };
      const result = service.googleLogin({ user });

      expect(result).toEqual({ user, access_token: 'mock-token' });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'u1',
        email: 'a@b.com',
        phone: '+55',
        role: 'USER',
      });
    });

    it('should sign JWT with correct payload format for google user', () => {
      const user = { id: 'g-u1', email: 'google@gmail.com', phone: '+5511999999999', role: 'USER' };
      service.googleLogin({ user });

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'g-u1',
        email: 'google@gmail.com',
        phone: '+5511999999999',
        role: 'USER',
      });
    });

    // SECURITY: The req.user object comes from the Google strategy guard.
    // If an attacker could manipulate req.user they could escalate privileges.
    // This is mitigated by the AuthGuard('google') on the route.
    it('SECURITY: should reflect whatever role is on req.user into JWT (guard must validate)', () => {
      const user = { id: 'u1', email: 'a@b.com', phone: '+55', role: 'ADMIN' };
      const result = service.googleLogin({ user }) as any;

      expect(result.user.role).toBe('ADMIN');
      // NOTE: The service trusts the user object from the guard.
      // If the guard does not validate roles properly, privilege escalation is possible.
    });
  });

  // =========================================================================
  // getProfile
  // =========================================================================
  describe('getProfile', () => {
    it('should return user profile with selected fields and a fresh token', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(validUser);

      const result = await service.getProfile('u1');

      expect(result).toEqual({ user: validUser, access_token: 'mock-token' });
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'u1' },
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
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('missing')).rejects.toThrow(UnauthorizedException);
    });

    it('should NOT select password field (prevents leaking hash)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(validUser);
      await service.getProfile('u1');

      const selectArg = mockPrismaService.user.findUnique.mock.calls[0][0].select;
      expect(selectArg).not.toHaveProperty('password');
    });

    it('should issue a fresh JWT on every profile request (token refresh)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(validUser);

      await service.getProfile('u1');

      expect(mockJwtService.sign).toHaveBeenCalledTimes(1);
    });

    // SECURITY: IDOR — an attacker could call getProfile with another user's ID.
    // The controller should ensure the userId comes from the JWT (CurrentUser decorator).
    // At the service level, it trusts the provided userId.
    it('SECURITY: getProfile accepts any userId (IDOR protection must be at controller/guard level)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(validUser);

      const result = await service.getProfile('any-id');

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'any-id' } }),
      );
      expect(result).toBeDefined();
    });

    it('SECURITY: should not leak error details when user is not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      try {
        await service.getProfile('missing-id');
        fail('Expected UnauthorizedException');
      } catch (err: any) {
        expect(err).toBeInstanceOf(UnauthorizedException);
        expect(err.message).toBe('User not found');
        // Should NOT contain stack trace or DB details
        expect(err.message).not.toContain('prisma');
        expect(err.message).not.toContain('SELECT');
      }
    });
  });

  // =========================================================================
  // register
  // =========================================================================
  describe('register', () => {
    it('should delegate to registerUseCase and return user + token', async () => {
      const user = { id: 'u1', email: 'a@b.com', phone: '+55', role: 'USER' };
      mockRegisterUseCase.execute.mockResolvedValue(user);

      const dto = { firstName: 'A', phone: '+5511999999999', password: '123456' } as any;
      const result = await service.register(dto);

      expect(mockRegisterUseCase.execute).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ user, access_token: 'mock-token' });
    });

    it('should propagate BadRequestException from registerUseCase', async () => {
      mockRegisterUseCase.execute.mockRejectedValue(new BadRequestException('Email in use'));

      await expect(service.register({} as any)).rejects.toThrow(BadRequestException);
    });

    it('should generate JWT for newly registered user', async () => {
      const user = { id: 'new1', email: 'new@b.com', phone: '+5511999999999', role: 'USER' };
      mockRegisterUseCase.execute.mockResolvedValue(user);

      await service.register({ firstName: 'New', phone: '+5511999999999', password: 'secret123' } as any);

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ sub: 'new1', role: 'USER' }),
      );
    });

    // NOTE: No rate limiting is currently enforced on POST /auth/register.
    // An attacker could automate mass registrations. Recommendation: Add @Throttle.
  });

  // =========================================================================
  // login
  // =========================================================================
  describe('login', () => {
    it('should delegate to loginUseCase and return user + token', async () => {
      const user = { id: 'u1', email: 'a@b.com', phone: '+55', role: 'USER' };
      mockLoginUseCase.execute.mockResolvedValue(user);

      const dto = { email: 'a@b.com', password: '123456' };
      const result = await service.login(dto);

      expect(mockLoginUseCase.execute).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ user, access_token: 'mock-token' });
    });

    it('should propagate UnauthorizedException from loginUseCase', async () => {
      mockLoginUseCase.execute.mockRejectedValue(new UnauthorizedException('Email ou senha inválidos.'));

      await expect(service.login({ email: 'x', password: 'x' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('SECURITY: should not reveal whether email exists on login failure', async () => {
      // The login use-case throws the same message for both "user not found"
      // and "wrong password" — this is correct to prevent user enumeration.
      mockLoginUseCase.execute.mockRejectedValue(
        new UnauthorizedException('Email ou senha inválidos.'),
      );

      try {
        await service.login({ email: 'nonexistent@example.com', password: 'anything' });
        fail('Expected UnauthorizedException');
      } catch (err: any) {
        expect(err.message).toBe('Email ou senha inválidos.');
        // The message should be the same regardless of whether the email exists
      }
    });

    // NOTE: No rate limiting is currently enforced on POST /auth/login.
    // An attacker could brute-force credentials. Recommendation: Add @Throttle
    // or implement progressive delays after failed attempts.

    // NOTE: No account lockout mechanism exists. After N failed login attempts,
    // the account should be temporarily locked. This is not implemented.
  });

  // =========================================================================
  // completeRegistration
  // =========================================================================
  describe('completeRegistration', () => {
    it('should delegate to completeRegistrationUseCase and return token', async () => {
      const user = { id: 'u1', email: 'a@b.com', phone: '+55', role: 'USER' };
      mockCompleteRegistrationUseCase.execute.mockResolvedValue(user);

      const dto = { phone: '+5511999999999', email: 'a@b.com', firstName: 'A' } as any;
      const result = await service.completeRegistration(dto);

      expect(mockCompleteRegistrationUseCase.execute).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ user, access_token: 'mock-token' });
    });

    it('should propagate errors from completeRegistrationUseCase', async () => {
      mockCompleteRegistrationUseCase.execute.mockRejectedValue(
        new BadRequestException('Phone taken'),
      );

      await expect(service.completeRegistration({} as any)).rejects.toThrow(BadRequestException);
    });
  });

  // =========================================================================
  // validateGoogleAccessToken
  // =========================================================================
  describe('validateGoogleAccessToken', () => {
    beforeEach(() => {
      process.env.GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';
    });

    it('should return google user data on success', async () => {
      const googleData = { email: 'g@google.com', name: 'G User' };
      (axios.get as jest.Mock).mockResolvedValue({ data: googleData });

      const result = await service.validateGoogleAccessToken('valid-token');

      expect(result).toEqual(googleData);
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('valid-token'),
        expect.objectContaining({
          headers: { Authorization: 'Bearer valid-token' },
        }),
      );
    });

    it('should throw UnauthorizedException on axios failure', async () => {
      (axios.get as jest.Mock).mockRejectedValue(new Error('network'));

      await expect(service.validateGoogleAccessToken('bad-token')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException with generic message (no leak of google error)', async () => {
      (axios.get as jest.Mock).mockRejectedValue(new Error('401 Unauthorized: Token revoked'));

      try {
        await service.validateGoogleAccessToken('revoked-token');
        fail('Expected UnauthorizedException');
      } catch (err: any) {
        expect(err).toBeInstanceOf(UnauthorizedException);
        expect(err.message).toBe('Invalid Google access token');
        // Should NOT leak the upstream error message
        expect(err.message).not.toContain('401');
        expect(err.message).not.toContain('revoked');
      }
    });

    it('should log the original error for debugging', async () => {
      const originalError = new Error('SSL handshake failed');
      (axios.get as jest.Mock).mockRejectedValue(originalError);

      await expect(service.validateGoogleAccessToken('bad')).rejects.toThrow();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error validating Google access token',
        originalError,
      );
    });

    it('SECURITY: should pass access token as both query param and Bearer header', async () => {
      (axios.get as jest.Mock).mockResolvedValue({ data: {} });

      await service.validateGoogleAccessToken('my-token');

      const callArgs = (axios.get as jest.Mock).mock.calls[0];
      expect(callArgs[0]).toContain('access_token=my-token');
      expect(callArgs[1].headers.Authorization).toBe('Bearer my-token');
    });

    it('SECURITY: should handle missing GOOGLE_USERINFO_URL env var', async () => {
      delete process.env.GOOGLE_USERINFO_URL;
      (axios.get as jest.Mock).mockResolvedValue({ data: { email: 'test@test.com' } });

      await service.validateGoogleAccessToken('token');

      // The URL will contain "undefined" but axios should still be called
      expect(axios.get).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // generateTrackingToken
  // =========================================================================
  describe('generateTrackingToken', () => {
    it('should sign token with purpose=tracking, correct issuer, and 30d expiry', () => {
      const result = service.generateTrackingToken('appt-1');

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        { sub: 'appt-1', purpose: 'tracking', iss: 'nexocar:tracking' },
        { expiresIn: '30d' },
      );
      expect(result).toBe('mock-token');
    });

    it('should use the appointmentId as the sub claim', () => {
      service.generateTrackingToken('appointment-xyz');

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ sub: 'appointment-xyz' }),
        expect.any(Object),
      );
    });
  });

  // =========================================================================
  // buildTrackingUrl
  // =========================================================================
  describe('buildTrackingUrl', () => {
    it('should build URL using FRONTEND_URL from config', () => {
      const url = service.buildTrackingUrl('appt-1');

      expect(mockConfigService.get).toHaveBeenCalledWith('FRONTEND_URL', 'http://localhost:3001');
      expect(url).toBe('http://localhost:3001/track?token=mock-token');
    });

    it('should use custom FRONTEND_URL when configured', () => {
      mockConfigService.get.mockReturnValue('https://myapp.example.com');

      const url = service.buildTrackingUrl('appt-2');

      expect(url).toBe('https://myapp.example.com/track?token=mock-token');
    });

    it('should include the JWT token as a query parameter', () => {
      mockJwtService.sign.mockReturnValue('special-tracking-jwt');

      const url = service.buildTrackingUrl('appt-3');

      expect(url).toContain('token=special-tracking-jwt');
    });
  });

  // =========================================================================
  // validateTrackingToken
  // =========================================================================
  describe('validateTrackingToken', () => {
    const validTrackingPayload = {
      sub: 'appt-1',
      purpose: 'tracking',
      iss: 'nexocar:tracking',
    };

    const mockAppointment = {
      id: 'appt-1',
      status: 'CONFIRMED',
      vehicle: { id: 'v1', brand: 'Toyota', model: 'Corolla', plate: 'ABC1234', color: 'White', type: 'CAR' },
      shop: { id: 's1', name: 'LavaCar', slug: 'lavacar' },
      services: [{ id: 'sv1', serviceName: 'Wash', servicePrice: 50, duration: 30 }],
    };

    it('should return appointment when token is valid', async () => {
      mockJwtService.verify.mockReturnValue(validTrackingPayload);
      mockPrismaService.appointment.findUnique.mockResolvedValue(mockAppointment);

      const result = await service.validateTrackingToken('valid-token');

      expect(mockJwtService.verify).toHaveBeenCalledWith('valid-token');
      expect(result).toEqual(mockAppointment);
    });

    it('should include vehicle, shop, and services in the query', async () => {
      mockJwtService.verify.mockReturnValue(validTrackingPayload);
      mockPrismaService.appointment.findUnique.mockResolvedValue(mockAppointment);

      await service.validateTrackingToken('valid-token');

      const queryArg = mockPrismaService.appointment.findUnique.mock.calls[0][0];
      expect(queryArg.include).toHaveProperty('vehicle');
      expect(queryArg.include).toHaveProperty('shop');
      expect(queryArg.include).toHaveProperty('services');
    });

    it('should throw UnauthorizedException for expired JWT', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(service.validateTrackingToken('expired')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for malformed JWT', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('jwt malformed');
      });

      await expect(service.validateTrackingToken('not.a.jwt')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when purpose is not tracking', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'appt-1', purpose: 'auth', iss: 'nexocar:tracking' });

      await expect(service.validateTrackingToken('wrong-purpose')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when issuer is wrong', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'appt-1', purpose: 'tracking', iss: 'attacker' });

      await expect(service.validateTrackingToken('wrong-iss')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when purpose is missing', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'appt-1', iss: 'nexocar:tracking' });

      await expect(service.validateTrackingToken('no-purpose')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when iss is missing', async () => {
      mockJwtService.verify.mockReturnValue({ sub: 'appt-1', purpose: 'tracking' });

      await expect(service.validateTrackingToken('no-iss')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when appointment not found', async () => {
      mockJwtService.verify.mockReturnValue(validTrackingPayload);
      mockPrismaService.appointment.findUnique.mockResolvedValue(null);

      await expect(service.validateTrackingToken('valid-but-no-appt')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    // SECURITY: Token reuse — tracking tokens can be reused within 30 days.
    // There is no blacklist or one-time-use enforcement. This is acceptable
    // for tracking but would be a concern for sensitive operations.

    it('SECURITY: should reject a regular auth JWT used as tracking token', async () => {
      // A regular JWT from login will not have purpose=tracking or iss=nexocar:tracking
      mockJwtService.verify.mockReturnValue({
        sub: 'user-id',
        email: 'a@b.com',
        phone: '+55',
        role: 'USER',
      });

      await expect(service.validateTrackingToken('regular-auth-jwt')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('SECURITY: should not expose appointment data if token purpose is wrong', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'appt-1',
        purpose: 'password-reset',
        iss: 'nexocar:tracking',
      });

      await expect(service.validateTrackingToken('cross-purpose')).rejects.toThrow(
        UnauthorizedException,
      );
      // appointment.findUnique should NOT be called
      expect(mockPrismaService.appointment.findUnique).not.toHaveBeenCalled();
    });

    it('SECURITY: should not expose appointment data if token issuer is wrong', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'appt-1',
        purpose: 'tracking',
        iss: 'malicious:issuer',
      });

      await expect(service.validateTrackingToken('wrong-issuer')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockPrismaService.appointment.findUnique).not.toHaveBeenCalled();
    });

    it('SECURITY: error message for expired token should not leak internal details', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired at 1700000000');
      });

      try {
        await service.validateTrackingToken('expired-token');
        fail('Expected UnauthorizedException');
      } catch (err: any) {
        expect(err).toBeInstanceOf(UnauthorizedException);
        expect(err.message).toBe('Token expirado ou inválido.');
        expect(err.message).not.toContain('1700000000');
      }
    });

    it('SECURITY: empty string token should throw', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('jwt must be provided');
      });

      await expect(service.validateTrackingToken('')).rejects.toThrow(UnauthorizedException);
    });
  });

  // =========================================================================
  // Cross-cutting security tests
  // =========================================================================
  describe('Security — Cross-cutting', () => {
    it('should not include password field in getProfile select', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(validUser);
      await service.getProfile('u1');

      const query = mockPrismaService.user.findUnique.mock.calls[0][0];
      expect(query.select.password).toBeUndefined();
    });

    it('JWT payload should use "sub" claim per RFC 7519 (not custom "id")', () => {
      service.generateJwt({ id: 'test', email: 'e', phone: 'p', role: 'USER' });

      const payload = mockJwtService.sign.mock.calls[0][0];
      expect(payload).toHaveProperty('sub');
      expect(payload).not.toHaveProperty('id');
    });

    it('tracking token should have separate issuer from auth tokens', () => {
      service.generateTrackingToken('appt-1');

      const payload = mockJwtService.sign.mock.calls[0][0];
      expect(payload.iss).toBe('nexocar:tracking');
    });

    it('error responses should use NestJS HTTP exceptions (not raw Error)', async () => {
      // Verifying that all service methods throw NestJS exceptions
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      try {
        await service.getProfile('missing');
      } catch (err: any) {
        expect(err).toBeInstanceOf(UnauthorizedException);
        expect(err.getStatus).toBeDefined();
        expect(err.getStatus()).toBe(401);
      }
    });

    it('guestLogin should set role to USER (not ADMIN or OWNER)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      let capturedRole: string | undefined;
      mockPrismaService.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          user: {
            create: jest.fn().mockImplementation(({ data }) => {
              capturedRole = data.role;
              return { id: 'g', ...data };
            }),
          },
          vehicle: { create: jest.fn() },
        };
        return cb(tx);
      });

      await service.guestLogin({ phone: '+5511900000000', firstName: 'Attacker' });

      expect(capturedRole).toBe('USER');
    });

    // SECURITY: There is no CSRF protection documented at the service level.
    // The @Public() endpoints (guest, register, login, complete-registration)
    // rely on CORS + SameSite cookies at the framework level.

    // SECURITY: No audit logging for security-sensitive events.
    // Recommendation: Log failed login attempts, guest login for registered users,
    // and token validation failures to a security audit log.
  });
});
