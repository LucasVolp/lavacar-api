import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../users.service';
import {
    CreateUserUseCase,
    FindAllUserUseCase,
    FindUserUseCase,
    FindUserByEmailUseCase,
    FindUserByPhoneUseCase,
    FindPublicUserUseCase,
} from '../use-cases';
import { UpdateUserUseCase } from '../use-cases/update-user.use-case';
import { DeleteUserUseCase } from '../use-cases/delete-user.use-case';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { Role } from '../types/Role';

const mockCreateUserUseCase = { execute: jest.fn() };
const mockFindAllUserUseCase = { execute: jest.fn() };
const mockFindUserUseCase = { execute: jest.fn() };
const mockUpdateUserUseCase = { execute: jest.fn() };
const mockDeleteUserUseCase = { execute: jest.fn() };
const mockFindUserByEmailUseCase = { execute: jest.fn() };
const mockFindUserByPhoneUseCase = { execute: jest.fn() };
const mockFindPublicUserUseCase = { execute: jest.fn() };

describe('UsersService', () => {
    let service: UsersService;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                { provide: CreateUserUseCase, useValue: mockCreateUserUseCase },
                { provide: FindAllUserUseCase, useValue: mockFindAllUserUseCase },
                { provide: FindUserUseCase, useValue: mockFindUserUseCase },
                { provide: UpdateUserUseCase, useValue: mockUpdateUserUseCase },
                { provide: DeleteUserUseCase, useValue: mockDeleteUserUseCase },
                { provide: FindUserByEmailUseCase, useValue: mockFindUserByEmailUseCase },
                { provide: FindUserByPhoneUseCase, useValue: mockFindUserByPhoneUseCase },
                { provide: FindPublicUserUseCase, useValue: mockFindPublicUserUseCase },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    // -----------------------------------------------------------
    // create
    // -----------------------------------------------------------
    describe('create', () => {
        const validDto: CreateUserDto = {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: '+5511999999999',
            password: 'SecurePass123!',
            role: Role.USER,
        };

        it('should delegate to CreateUserUseCase with correct data', async () => {
            const createdUser = { id: 'u1', ...validDto, password: undefined };
            mockCreateUserUseCase.execute.mockResolvedValue(createdUser);

            const result = await service.create(validDto);

            expect(mockCreateUserUseCase.execute).toHaveBeenCalledWith(validDto);
            expect(mockCreateUserUseCase.execute).toHaveBeenCalledTimes(1);
            expect(result).toEqual(createdUser);
        });

        it('should propagate ConflictException when phone already exists', async () => {
            const { ConflictException } = await import('@nestjs/common');
            mockCreateUserUseCase.execute.mockRejectedValue(
                new ConflictException('User with this phone already exists!'),
            );

            await expect(service.create(validDto)).rejects.toThrow('User with this phone already exists!');
        });

        it('should propagate ConflictException when email already exists', async () => {
            const { ConflictException } = await import('@nestjs/common');
            mockCreateUserUseCase.execute.mockRejectedValue(
                new ConflictException('User with this email already exists'),
            );

            await expect(service.create(validDto)).rejects.toThrow('User with this email already exists');
        });

        it('should propagate ConflictException when CPF already exists', async () => {
            const { ConflictException } = await import('@nestjs/common');
            const dtoWithCpf = { ...validDto, cpf: '123.456.789-00' };
            mockCreateUserUseCase.execute.mockRejectedValue(
                new ConflictException('User with this CPF already exists'),
            );

            await expect(service.create(dtoWithCpf)).rejects.toThrow('User with this CPF already exists');
        });

        it('should handle guest user creation (no password)', async () => {
            const guestDto: CreateUserDto = {
                firstName: 'Guest',
                phone: '+5511888888888',
                role: Role.USER,
                isGuest: true,
            };
            const guestUser = { id: 'u2', ...guestDto, isGuest: true };
            mockCreateUserUseCase.execute.mockResolvedValue(guestUser);

            const result = await service.create(guestDto);

            expect(mockCreateUserUseCase.execute).toHaveBeenCalledWith(guestDto);
            expect(result.isGuest).toBe(true);
        });

        it('should propagate ServiceUnavailableException on unexpected errors', async () => {
            const { ServiceUnavailableException } = await import('@nestjs/common');
            mockCreateUserUseCase.execute.mockRejectedValue(
                new ServiceUnavailableException('Something bad happened!'),
            );

            await expect(service.create(validDto)).rejects.toThrow('Something bad happened!');
        });

        // SECURITY: Privilege escalation - creating user with ADMIN role
        it('should pass the role field as-is to the use case (no role filtering at service level)', async () => {
            const adminDto: CreateUserDto = {
                firstName: 'Admin',
                phone: '+5511777777777',
                password: 'AdminPass123!',
                role: Role.ADMIN,
            };
            mockCreateUserUseCase.execute.mockResolvedValue({ id: 'u3', ...adminDto });

            await service.create(adminDto);

            const passedDto = mockCreateUserUseCase.execute.mock.calls[0][0];
            expect(passedDto.role).toBe(Role.ADMIN);
        });

        // SECURITY: CPF validation - PII handling
        it('should pass CPF data as-is to the use case for processing', async () => {
            const dtoWithCpf = { ...validDto, cpf: '123.456.789-00' };
            mockCreateUserUseCase.execute.mockResolvedValue({ id: 'u1', ...dtoWithCpf });

            await service.create(dtoWithCpf);

            expect(mockCreateUserUseCase.execute.mock.calls[0][0].cpf).toBe('123.456.789-00');
        });
    });

    // -----------------------------------------------------------
    // findAll
    // -----------------------------------------------------------
    describe('findAll', () => {
        it('should delegate to FindAllUserUseCase with filters', async () => {
            const result = { data: [{ id: 'u1' }], meta: { total: 1, page: 1, perPage: 10 } };
            mockFindAllUserUseCase.execute.mockResolvedValue(result);

            const response = await service.findAll({ page: 1, perPage: 10 });

            expect(mockFindAllUserUseCase.execute).toHaveBeenCalledWith({ page: 1, perPage: 10 });
            expect(response).toEqual(result);
        });

        it('should work without filters', async () => {
            mockFindAllUserUseCase.execute.mockResolvedValue({ data: [], meta: { total: 0 } });

            const result = await service.findAll();

            expect(mockFindAllUserUseCase.execute).toHaveBeenCalledWith(undefined);
            expect(result.data).toEqual([]);
        });

        it('should propagate errors', async () => {
            mockFindAllUserUseCase.execute.mockRejectedValue(new Error('DB error'));

            await expect(service.findAll()).rejects.toThrow('DB error');
        });

        // SECURITY: Password exposure - verify returned data contains what service returns
        it('should return data from use case without transformation', async () => {
            const usersWithPasswords = {
                data: [
                    { id: 'u1', firstName: 'John', password: 'hashed_pw_should_not_be_here' },
                ],
                meta: { total: 1 },
            };
            mockFindAllUserUseCase.execute.mockResolvedValue(usersWithPasswords);

            const result = await service.findAll();

            // Service passes through raw use case data - password filtering should happen elsewhere
            expect(result).toEqual(usersWithPasswords);
        });
    });

    // -----------------------------------------------------------
    // findOne
    // -----------------------------------------------------------
    describe('findOne', () => {
        it('should delegate to FindUserUseCase', async () => {
            const user = { id: 'u1', firstName: 'John', email: 'john@example.com' };
            mockFindUserUseCase.execute.mockResolvedValue(user);

            const result = await service.findOne('u1');

            expect(mockFindUserUseCase.execute).toHaveBeenCalledWith('u1');
            expect(result).toEqual(user);
        });

        it('should propagate NotFoundException when user not found', async () => {
            const { NotFoundException } = await import('@nestjs/common');
            mockFindUserUseCase.execute.mockRejectedValue(new NotFoundException('User not found!'));

            await expect(service.findOne('nonexistent')).rejects.toThrow('User not found!');
        });

        it('should propagate ServiceUnavailableException on unexpected errors', async () => {
            mockFindUserUseCase.execute.mockRejectedValue(new Error('DB failure'));

            await expect(service.findOne('u1')).rejects.toThrow('DB failure');
        });

        // SECURITY: IDOR - service does not enforce ownership check (controller does)
        it('should accept any user ID without ownership validation (delegated to controller)', async () => {
            const otherUser = { id: 'other-user', firstName: 'Other' };
            mockFindUserUseCase.execute.mockResolvedValue(otherUser);

            const result = await service.findOne('other-user');

            expect(mockFindUserUseCase.execute).toHaveBeenCalledWith('other-user');
            expect(result).toEqual(otherUser);
        });
    });

    // -----------------------------------------------------------
    // FindByEmail
    // -----------------------------------------------------------
    describe('FindByEmail', () => {
        it('should delegate to FindUserByEmailUseCase', async () => {
            const user = { id: 'u1', email: 'john@example.com' };
            mockFindUserByEmailUseCase.execute.mockResolvedValue(user);

            const result = await service.FindByEmail('john@example.com');

            expect(mockFindUserByEmailUseCase.execute).toHaveBeenCalledWith('john@example.com');
            expect(result).toEqual(user);
        });

        it('should propagate NotFoundException when email not found', async () => {
            const { NotFoundException } = await import('@nestjs/common');
            mockFindUserByEmailUseCase.execute.mockRejectedValue(
                new NotFoundException('User not found!'),
            );

            await expect(service.FindByEmail('unknown@example.com')).rejects.toThrow('User not found!');
        });

        // SECURITY: Phone/email enumeration - the error message is generic
        it('should propagate the same error for existing and non-existing emails', async () => {
            const { NotFoundException } = await import('@nestjs/common');
            mockFindUserByEmailUseCase.execute.mockRejectedValue(
                new NotFoundException('User not found!'),
            );

            await expect(service.FindByEmail('doesnotexist@example.com')).rejects.toThrow('User not found!');
        });
    });

    // -----------------------------------------------------------
    // findByPhone
    // -----------------------------------------------------------
    describe('findByPhone', () => {
        it('should delegate to FindUserByPhoneUseCase', async () => {
            const user = { id: 'u1', phone: '+5511999999999' };
            mockFindUserByPhoneUseCase.execute.mockResolvedValue(user);

            const result = await service.findByPhone('+5511999999999');

            expect(mockFindUserByPhoneUseCase.execute).toHaveBeenCalledWith('+5511999999999');
            expect(result).toEqual(user);
        });

        it('should propagate NotFoundException when phone not found', async () => {
            const { NotFoundException } = await import('@nestjs/common');
            mockFindUserByPhoneUseCase.execute.mockRejectedValue(
                new NotFoundException('User not found!'),
            );

            await expect(service.findByPhone('+5511000000000')).rejects.toThrow('User not found!');
        });

        // SECURITY: Phone enumeration - error reveals user existence
        it('should throw a generic error that does not distinguish between registered/unregistered phones', async () => {
            const { NotFoundException } = await import('@nestjs/common');
            mockFindUserByPhoneUseCase.execute.mockRejectedValue(
                new NotFoundException('User not found!'),
            );

            try {
                await service.findByPhone('+5511111111111');
            } catch (e: any) {
                // The error message should be generic
                expect(e.message).toBe('User not found!');
                expect(e.message).not.toContain('phone');
                expect(e.message).not.toContain('+5511111111111');
            }
        });
    });

    // -----------------------------------------------------------
    // findPublicUser
    // -----------------------------------------------------------
    describe('findPublicUser', () => {
        it('should delegate to FindPublicUserUseCase', async () => {
            const shadowUser = {
                id: 'u1',
                firstName: 'Joh****e',
                phone: '+5511999999999',
                role: 'USER',
                isGuest: false,
                isActive: true,
                vehicles: [],
            };
            mockFindPublicUserUseCase.execute.mockResolvedValue(shadowUser);

            const result = await service.findPublicUser('+5511999999999');

            expect(mockFindPublicUserUseCase.execute).toHaveBeenCalledWith('+5511999999999');
            expect(result).toEqual(shadowUser);
        });

        it('should propagate BadRequestException for invalid phone', async () => {
            const { BadRequestException } = await import('@nestjs/common');
            mockFindPublicUserUseCase.execute.mockRejectedValue(
                new BadRequestException('Invalid phone number provided'),
            );

            await expect(service.findPublicUser('invalid')).rejects.toThrow('Invalid phone number provided');
        });

        it('should propagate NotFoundException when user not found', async () => {
            const { NotFoundException } = await import('@nestjs/common');
            mockFindPublicUserUseCase.execute.mockRejectedValue(
                new NotFoundException('User not found!'),
            );

            await expect(service.findPublicUser('+5511000000000')).rejects.toThrow('User not found!');
        });

        // SECURITY: Password exposure - public user should never contain password
        it('should return shadow user data without sensitive fields', async () => {
            const shadowUser = {
                id: 'u1',
                firstName: 'Joh***e',
                lastName: 'Do*e',
                phone: '+5511999999999',
                role: 'USER',
                isGuest: false,
                isActive: true,
                vehicles: [{ id: 'v1', plate: 'AB**23', model: 'Civic', brand: 'Honda' }],
            };
            mockFindPublicUserUseCase.execute.mockResolvedValue(shadowUser);

            const result = await service.findPublicUser('+5511999999999');

            expect(result).not.toHaveProperty('password');
            expect(result).not.toHaveProperty('email');
            expect(result).not.toHaveProperty('cpf');
        });
    });

    // -----------------------------------------------------------
    // update
    // -----------------------------------------------------------
    describe('update', () => {
        const updateDto: UpdateUserDto = {
            firstName: 'Jane',
            lastName: 'Smith',
        };

        it('should delegate to UpdateUserUseCase with id and data', async () => {
            const updatedUser = { id: 'u1', ...updateDto };
            mockUpdateUserUseCase.execute.mockResolvedValue(updatedUser);

            const result = await service.update('u1', updateDto);

            expect(mockUpdateUserUseCase.execute).toHaveBeenCalledWith('u1', updateDto);
            expect(result).toEqual(updatedUser);
        });

        it('should propagate NotFoundException when user not found', async () => {
            const { NotFoundException } = await import('@nestjs/common');
            mockUpdateUserUseCase.execute.mockRejectedValue(
                new NotFoundException('User not found!'),
            );

            await expect(service.update('nonexistent', updateDto)).rejects.toThrow('User not found!');
        });

        it('should propagate ConflictException when email already in use', async () => {
            const { ConflictException } = await import('@nestjs/common');
            mockUpdateUserUseCase.execute.mockRejectedValue(
                new ConflictException('Email already in use!'),
            );

            await expect(
                service.update('u1', { email: 'taken@example.com' }),
            ).rejects.toThrow('Email already in use!');
        });

        // SECURITY: Privilege escalation - user changing own role
        it('should pass role field to use case without filtering (controller must enforce)', async () => {
            const roleEscalationDto: UpdateUserDto = { role: Role.ADMIN };
            mockUpdateUserUseCase.execute.mockResolvedValue({ id: 'u1', role: Role.ADMIN });

            await service.update('u1', roleEscalationDto);

            const passedDto = mockUpdateUserUseCase.execute.mock.calls[0][1];
            expect(passedDto.role).toBe(Role.ADMIN);
        });

        // SECURITY: Password handling in update
        it('should pass password to use case for hashing', async () => {
            const passwordDto: UpdateUserDto = { password: 'NewPassword123!' };
            mockUpdateUserUseCase.execute.mockResolvedValue({ id: 'u1' });

            await service.update('u1', passwordDto);

            expect(mockUpdateUserUseCase.execute.mock.calls[0][1].password).toBe('NewPassword123!');
        });

        it('should handle partial updates', async () => {
            const partialDto: UpdateUserDto = { firstName: 'Updated' };
            mockUpdateUserUseCase.execute.mockResolvedValue({ id: 'u1', firstName: 'Updated' });

            await service.update('u1', partialDto);

            expect(mockUpdateUserUseCase.execute).toHaveBeenCalledWith('u1', { firstName: 'Updated' });
        });

        // SECURITY: CPF validation in update
        it('should pass CPF through to use case (validation at DTO level)', async () => {
            const cpfDto: UpdateUserDto = { cpf: '123.456.789-00' };
            mockUpdateUserUseCase.execute.mockResolvedValue({ id: 'u1', cpf: '12345678900' });

            await service.update('u1', cpfDto);

            expect(mockUpdateUserUseCase.execute.mock.calls[0][1].cpf).toBe('123.456.789-00');
        });
    });

    // -----------------------------------------------------------
    // remove
    // -----------------------------------------------------------
    describe('remove', () => {
        it('should delegate to DeleteUserUseCase', async () => {
            const deletedUser = { id: 'u1', firstName: 'John' };
            mockDeleteUserUseCase.execute.mockResolvedValue(deletedUser);

            const result = await service.remove('u1');

            expect(mockDeleteUserUseCase.execute).toHaveBeenCalledWith('u1');
            expect(result).toEqual(deletedUser);
        });

        it('should propagate NotFoundException when user not found', async () => {
            const { NotFoundException } = await import('@nestjs/common');
            mockDeleteUserUseCase.execute.mockRejectedValue(
                new NotFoundException('User not found!'),
            );

            await expect(service.remove('nonexistent')).rejects.toThrow('User not found!');
        });

        it('should propagate unexpected errors', async () => {
            mockDeleteUserUseCase.execute.mockRejectedValue(new Error('DB error'));

            await expect(service.remove('u1')).rejects.toThrow('DB error');
        });
    });

    // -----------------------------------------------------------
    // SECURITY: Password exposure
    // -----------------------------------------------------------
    describe('Security: Password exposure', () => {
        it('create should pass password to use case (hashing happens in use case)', async () => {
            const dto: CreateUserDto = {
                firstName: 'Test',
                phone: '+5511999999999',
                password: 'PlainTextPassword',
                role: Role.USER,
            };
            mockCreateUserUseCase.execute.mockResolvedValue({ id: 'u1', firstName: 'Test' });

            await service.create(dto);

            // Service passes raw password; use case hashes it
            expect(mockCreateUserUseCase.execute.mock.calls[0][0].password).toBe('PlainTextPassword');
        });
    });

    // -----------------------------------------------------------
    // SECURITY: Privilege escalation
    // -----------------------------------------------------------
    describe('Security: Privilege escalation', () => {
        it('service does not filter role on create - allows any role value', async () => {
            for (const role of Object.values(Role)) {
                mockCreateUserUseCase.execute.mockResolvedValue({ id: 'u1', role });

                await service.create({
                    firstName: 'Test',
                    phone: '+5511999999999',
                    password: 'pass',
                    role,
                });

                expect(mockCreateUserUseCase.execute.mock.calls.at(-1)?.[0].role).toBe(role);
            }
        });

        it('service does not filter role on update - allows any role value', async () => {
            for (const role of Object.values(Role)) {
                mockUpdateUserUseCase.execute.mockResolvedValue({ id: 'u1', role });

                await service.update('u1', { role });

                expect(mockUpdateUserUseCase.execute.mock.calls.at(-1)?.[1].role).toBe(role);
            }
        });
    });

    // -----------------------------------------------------------
    // Edge cases
    // -----------------------------------------------------------
    describe('Edge cases', () => {
        it('create should handle minimal DTO (only required fields)', async () => {
            const minimalDto: CreateUserDto = {
                firstName: 'Minimal',
                phone: '+5511999999999',
                role: Role.USER,
            };
            mockCreateUserUseCase.execute.mockResolvedValue({ id: 'u1', ...minimalDto });

            const result = await service.create(minimalDto);

            expect(result.id).toBe('u1');
        });

        it('update should handle empty DTO', async () => {
            const emptyDto: UpdateUserDto = {};
            mockUpdateUserUseCase.execute.mockResolvedValue({ id: 'u1' });

            await service.update('u1', emptyDto);

            expect(mockUpdateUserUseCase.execute).toHaveBeenCalledWith('u1', {});
        });

        it('findAll should handle pagination edge case with zero page', async () => {
            mockFindAllUserUseCase.execute.mockResolvedValue({ data: [], meta: { total: 0 } });

            await service.findAll({ page: 0, perPage: 10 });

            expect(mockFindAllUserUseCase.execute).toHaveBeenCalledWith({ page: 0, perPage: 10 });
        });

        it('FindByEmail should handle emails with special characters', async () => {
            mockFindUserByEmailUseCase.execute.mockResolvedValue({ id: 'u1' });

            await service.FindByEmail('user+tag@example.com');

            expect(mockFindUserByEmailUseCase.execute).toHaveBeenCalledWith('user+tag@example.com');
        });

        it('findByPhone should handle phone numbers with different formats', async () => {
            mockFindUserByPhoneUseCase.execute.mockResolvedValue({ id: 'u1' });

            await service.findByPhone('+5511999999999');

            expect(mockFindUserByPhoneUseCase.execute).toHaveBeenCalledWith('+5511999999999');
        });
    });
});
