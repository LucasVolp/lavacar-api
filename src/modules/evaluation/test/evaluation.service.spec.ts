import { Test, TestingModule } from '@nestjs/testing';
import { EvaluationService } from '../evaluation.service';
import {
    CreateEvaluationUseCase,
    FindAllEvaluationUseCase,
    FindEvaluationByIdUseCase,
    GetShopStatsUseCase,
    UpdateEvaluationUseCase,
    DeleteEvaluationUseCase,
} from '../use-cases';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';
import { CreateEvaluationDto } from '../dto/create-evaluation.dto';
import { UpdateEvaluationDto } from '../dto/update-evaluation.dto';
import {
    BadRequestException,
    ConflictException,
    NotFoundException,
    ServiceUnavailableException,
} from '@nestjs/common';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockCreateEvaluationUseCase = { execute: jest.fn() };
const mockFindAllEvaluationUseCase = { execute: jest.fn(), executePublic: jest.fn() };
const mockFindEvaluationByIdUseCase = { execute: jest.fn() };
const mockGetShopStatsUseCase = { execute: jest.fn(), executePublic: jest.fn() };
const mockUpdateEvaluationUseCase = { execute: jest.fn() };
const mockDeleteEvaluationUseCase = { execute: jest.fn() };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const adminUser: JwtPayload = { id: 'admin-1', email: 'admin@test.com', phone: '+5511900000000', role: 'ADMIN' };
const ownerUser: JwtPayload = { id: 'owner-1', email: 'owner@test.com', phone: '+5511900000001', role: 'OWNER' };
const managerUser: JwtPayload = { id: 'manager-1', email: 'mgr@test.com', phone: '+5511900000002', role: 'MANAGER' };
const employeeUser: JwtPayload = { id: 'emp-1', email: 'emp@test.com', phone: '+5511900000003', role: 'EMPLOYEE' };
const regularUser: JwtPayload = { id: 'user-1', email: 'user@test.com', phone: '+5511900000004', role: 'USER' };
const anotherUser: JwtPayload = { id: 'user-2', email: 'user2@test.com', phone: '+5511900000005', role: 'USER' };

const validCreateDto: CreateEvaluationDto = {
    rating: 5,
    comment: 'Excellent service!',
    appointmentId: 'appointment-1',
    userId: 'user-1',
    photos: ['https://cdn.example.com/photo1.jpg'],
};

const sampleEvaluation = {
    id: 'eval-1',
    rating: 5,
    comment: 'Excellent service!',
    appointmentId: 'appointment-1',
    userId: 'user-1',
    photos: ['https://cdn.example.com/photo1.jpg'],
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    appointment: {
        id: 'appointment-1',
        shopId: 'shop-1',
        shop: { id: 'shop-1', name: 'Lava Car Centro' },
        vehicle: { id: 'vehicle-1', plate: 'ABC-1234' },
    },
    user: {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        picture: null,
    },
};

const sampleStats = {
    averageRating: 4.5,
    totalEvaluations: 10,
    ratingDistribution: { 1: 0, 2: 1, 3: 1, 4: 3, 5: 5 },
};

const paginatedResult = {
    data: [sampleEvaluation],
    meta: { total: 1, page: 1, perPage: 10, totalPages: 1 },
};

describe('EvaluationService', () => {
    let service: EvaluationService;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EvaluationService,
                { provide: CreateEvaluationUseCase, useValue: mockCreateEvaluationUseCase },
                { provide: FindAllEvaluationUseCase, useValue: mockFindAllEvaluationUseCase },
                { provide: FindEvaluationByIdUseCase, useValue: mockFindEvaluationByIdUseCase },
                { provide: GetShopStatsUseCase, useValue: mockGetShopStatsUseCase },
                { provide: UpdateEvaluationUseCase, useValue: mockUpdateEvaluationUseCase },
                { provide: DeleteEvaluationUseCase, useValue: mockDeleteEvaluationUseCase },
            ],
        }).compile();

        service = module.get<EvaluationService>(EvaluationService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    // =======================================================================
    // create
    // =======================================================================
    describe('create', () => {
        it('should delegate to CreateEvaluationUseCase with dto and user', async () => {
            mockCreateEvaluationUseCase.execute.mockResolvedValue(sampleEvaluation);

            const result = await service.create(validCreateDto, regularUser);

            expect(mockCreateEvaluationUseCase.execute).toHaveBeenCalledWith(validCreateDto, regularUser);
            expect(result).toEqual(sampleEvaluation);
        });

        it('should pass admin user context to the use case', async () => {
            mockCreateEvaluationUseCase.execute.mockResolvedValue(sampleEvaluation);

            await service.create(validCreateDto, adminUser);

            expect(mockCreateEvaluationUseCase.execute).toHaveBeenCalledWith(validCreateDto, adminUser);
        });

        it('should forward DTO with minimal fields (no comment, no photos)', async () => {
            const minimalDto: CreateEvaluationDto = {
                rating: 3,
                appointmentId: 'appointment-2',
                userId: 'user-1',
            };
            mockCreateEvaluationUseCase.execute.mockResolvedValue({ ...sampleEvaluation, ...minimalDto });

            await service.create(minimalDto, regularUser);

            expect(mockCreateEvaluationUseCase.execute).toHaveBeenCalledWith(minimalDto, regularUser);
        });

        it('should propagate NotFoundException from use case', async () => {
            mockCreateEvaluationUseCase.execute.mockRejectedValue(
                new NotFoundException('Appointment not found'),
            );

            await expect(service.create(validCreateDto, regularUser)).rejects.toThrow(NotFoundException);
            await expect(service.create(validCreateDto, regularUser)).rejects.toThrow('Appointment not found');
        });

        it('should propagate BadRequestException from use case', async () => {
            mockCreateEvaluationUseCase.execute.mockRejectedValue(
                new BadRequestException('Can only evaluate completed appointments'),
            );

            await expect(service.create(validCreateDto, regularUser)).rejects.toThrow(BadRequestException);
            await expect(service.create(validCreateDto, regularUser)).rejects.toThrow(
                'Can only evaluate completed appointments',
            );
        });

        it('should propagate ConflictException for duplicate evaluation', async () => {
            mockCreateEvaluationUseCase.execute.mockRejectedValue(
                new ConflictException('This appointment has already been evaluated'),
            );

            await expect(service.create(validCreateDto, regularUser)).rejects.toThrow(ConflictException);
            await expect(service.create(validCreateDto, regularUser)).rejects.toThrow(
                'This appointment has already been evaluated',
            );
        });

        it('should propagate ServiceUnavailableException from use case', async () => {
            mockCreateEvaluationUseCase.execute.mockRejectedValue(
                new ServiceUnavailableException('Something bad happened!'),
            );

            await expect(service.create(validCreateDto, regularUser)).rejects.toThrow(ServiceUnavailableException);
        });

        it('should propagate generic errors from use case', async () => {
            mockCreateEvaluationUseCase.execute.mockRejectedValue(new Error('DB connection failed'));

            await expect(service.create(validCreateDto, regularUser)).rejects.toThrow('DB connection failed');
        });
    });

    // =======================================================================
    // findAll
    // =======================================================================
    describe('findAll', () => {
        it('should delegate to FindAllEvaluationUseCase with filters and user', async () => {
            mockFindAllEvaluationUseCase.execute.mockResolvedValue(paginatedResult);

            const filters = { shopId: 'shop-1', page: 1, perPage: 10 };
            const result = await service.findAll(filters, adminUser);

            expect(mockFindAllEvaluationUseCase.execute).toHaveBeenCalledWith(filters, adminUser);
            expect(result).toEqual(paginatedResult);
        });

        it('should work with empty filters', async () => {
            mockFindAllEvaluationUseCase.execute.mockResolvedValue({ data: [], meta: { total: 0, page: 1, perPage: 10, totalPages: 0 } });

            const result = await service.findAll({}, regularUser);

            expect(mockFindAllEvaluationUseCase.execute).toHaveBeenCalledWith({}, regularUser);
            expect(result.data).toHaveLength(0);
        });

        it('should pass rating filter', async () => {
            mockFindAllEvaluationUseCase.execute.mockResolvedValue(paginatedResult);

            await service.findAll({ rating: 5 }, regularUser);

            expect(mockFindAllEvaluationUseCase.execute).toHaveBeenCalledWith({ rating: 5 }, regularUser);
        });

        it('should pass userId filter', async () => {
            mockFindAllEvaluationUseCase.execute.mockResolvedValue(paginatedResult);

            await service.findAll({ userId: 'user-1' }, adminUser);

            expect(mockFindAllEvaluationUseCase.execute).toHaveBeenCalledWith({ userId: 'user-1' }, adminUser);
        });

        it('should pass all filters simultaneously', async () => {
            mockFindAllEvaluationUseCase.execute.mockResolvedValue(paginatedResult);

            const filters = { shopId: 'shop-1', userId: 'user-1', rating: 4, page: 2, perPage: 5 };
            await service.findAll(filters, ownerUser);

            expect(mockFindAllEvaluationUseCase.execute).toHaveBeenCalledWith(filters, ownerUser);
        });

        it('should propagate errors from FindAllEvaluationUseCase', async () => {
            mockFindAllEvaluationUseCase.execute.mockRejectedValue(
                new ServiceUnavailableException('Something bad happened!'),
            );

            await expect(service.findAll({}, regularUser)).rejects.toThrow(ServiceUnavailableException);
        });
    });

    // =======================================================================
    // findPublicByShop
    // =======================================================================
    describe('findPublicByShop', () => {
        it('should delegate to FindAllEvaluationUseCase.executePublic with filters', async () => {
            mockFindAllEvaluationUseCase.executePublic.mockResolvedValue(paginatedResult);

            const filters = { shopId: 'shop-1', page: 1, perPage: 10 };
            const result = await service.findPublicByShop(filters);

            expect(mockFindAllEvaluationUseCase.executePublic).toHaveBeenCalledWith(filters);
            expect(result).toEqual(paginatedResult);
        });

        it('should pass rating filter for public endpoint', async () => {
            mockFindAllEvaluationUseCase.executePublic.mockResolvedValue(paginatedResult);

            await service.findPublicByShop({ shopId: 'shop-1', rating: 5 });

            expect(mockFindAllEvaluationUseCase.executePublic).toHaveBeenCalledWith({
                shopId: 'shop-1',
                rating: 5,
            });
        });

        it('should not require user context (public endpoint)', async () => {
            mockFindAllEvaluationUseCase.executePublic.mockResolvedValue(paginatedResult);

            await service.findPublicByShop({ shopId: 'shop-1' });

            expect(mockFindAllEvaluationUseCase.executePublic).toHaveBeenCalledTimes(1);
            // executePublic is called with only filters, no user parameter
            expect(mockFindAllEvaluationUseCase.executePublic).toHaveBeenCalledWith({ shopId: 'shop-1' });
        });

        it('should propagate errors from executePublic', async () => {
            mockFindAllEvaluationUseCase.executePublic.mockRejectedValue(
                new ServiceUnavailableException('Something bad happened!'),
            );

            await expect(service.findPublicByShop({ shopId: 'shop-1' })).rejects.toThrow(
                ServiceUnavailableException,
            );
        });
    });

    // =======================================================================
    // findOne
    // =======================================================================
    describe('findOne', () => {
        it('should delegate to FindEvaluationByIdUseCase with id and user', async () => {
            mockFindEvaluationByIdUseCase.execute.mockResolvedValue(sampleEvaluation);

            const result = await service.findOne('eval-1', regularUser);

            expect(mockFindEvaluationByIdUseCase.execute).toHaveBeenCalledWith('eval-1', regularUser);
            expect(result).toEqual(sampleEvaluation);
        });

        it('should propagate NotFoundException when evaluation does not exist', async () => {
            mockFindEvaluationByIdUseCase.execute.mockRejectedValue(
                new NotFoundException('Evaluation not found'),
            );

            await expect(service.findOne('nonexistent-id', regularUser)).rejects.toThrow(NotFoundException);
            await expect(service.findOne('nonexistent-id', regularUser)).rejects.toThrow('Evaluation not found');
        });

        it('should propagate ServiceUnavailableException', async () => {
            mockFindEvaluationByIdUseCase.execute.mockRejectedValue(
                new ServiceUnavailableException('Something bad happened!'),
            );

            await expect(service.findOne('eval-1', regularUser)).rejects.toThrow(ServiceUnavailableException);
        });

        it('should pass different user roles to use case', async () => {
            mockFindEvaluationByIdUseCase.execute.mockResolvedValue(sampleEvaluation);

            for (const user of [adminUser, ownerUser, managerUser, employeeUser, regularUser]) {
                await service.findOne('eval-1', user);
                expect(mockFindEvaluationByIdUseCase.execute).toHaveBeenCalledWith('eval-1', user);
            }
        });
    });

    // =======================================================================
    // getShopStats
    // =======================================================================
    describe('getShopStats', () => {
        it('should delegate to GetShopStatsUseCase with shopId and user', async () => {
            mockGetShopStatsUseCase.execute.mockResolvedValue(sampleStats);

            const result = await service.getShopStats('shop-1', adminUser);

            expect(mockGetShopStatsUseCase.execute).toHaveBeenCalledWith('shop-1', adminUser);
            expect(result).toEqual(sampleStats);
        });

        it('should propagate errors from GetShopStatsUseCase', async () => {
            mockGetShopStatsUseCase.execute.mockRejectedValue(
                new ServiceUnavailableException('Something bad happened!'),
            );

            await expect(service.getShopStats('shop-1', adminUser)).rejects.toThrow(ServiceUnavailableException);
        });

        it('should pass user context for authorization', async () => {
            mockGetShopStatsUseCase.execute.mockResolvedValue(sampleStats);

            await service.getShopStats('shop-1', ownerUser);

            expect(mockGetShopStatsUseCase.execute).toHaveBeenCalledWith('shop-1', ownerUser);
        });
    });

    // =======================================================================
    // getPublicShopStats
    // =======================================================================
    describe('getPublicShopStats', () => {
        it('should delegate to GetShopStatsUseCase.executePublic with shopId', async () => {
            mockGetShopStatsUseCase.executePublic.mockResolvedValue(sampleStats);

            const result = await service.getPublicShopStats('shop-1');

            expect(mockGetShopStatsUseCase.executePublic).toHaveBeenCalledWith('shop-1');
            expect(result).toEqual(sampleStats);
        });

        it('should not require user context (public endpoint)', async () => {
            mockGetShopStatsUseCase.executePublic.mockResolvedValue(sampleStats);

            await service.getPublicShopStats('shop-1');

            expect(mockGetShopStatsUseCase.executePublic).toHaveBeenCalledTimes(1);
            expect(mockGetShopStatsUseCase.executePublic).toHaveBeenCalledWith('shop-1');
        });

        it('should propagate errors from executePublic', async () => {
            mockGetShopStatsUseCase.executePublic.mockRejectedValue(
                new ServiceUnavailableException('Something bad happened!'),
            );

            await expect(service.getPublicShopStats('shop-1')).rejects.toThrow(ServiceUnavailableException);
        });
    });

    // =======================================================================
    // update
    // =======================================================================
    describe('update', () => {
        it('should delegate to UpdateEvaluationUseCase with id, data, and user', async () => {
            const updateDto: UpdateEvaluationDto = { rating: 4, comment: 'Updated comment' };
            const updated = { ...sampleEvaluation, rating: 4, comment: 'Updated comment' };
            mockUpdateEvaluationUseCase.execute.mockResolvedValue(updated);

            const result = await service.update('eval-1', updateDto, regularUser);

            expect(mockUpdateEvaluationUseCase.execute).toHaveBeenCalledWith('eval-1', updateDto, regularUser);
            expect(result).toEqual(updated);
        });

        it('should allow updating only the rating', async () => {
            const updateDto: UpdateEvaluationDto = { rating: 3 };
            mockUpdateEvaluationUseCase.execute.mockResolvedValue({ ...sampleEvaluation, rating: 3 });

            await service.update('eval-1', updateDto, regularUser);

            expect(mockUpdateEvaluationUseCase.execute).toHaveBeenCalledWith('eval-1', updateDto, regularUser);
        });

        it('should allow updating only the comment', async () => {
            const updateDto: UpdateEvaluationDto = { comment: 'New comment' };
            mockUpdateEvaluationUseCase.execute.mockResolvedValue({ ...sampleEvaluation, comment: 'New comment' });

            await service.update('eval-1', updateDto, regularUser);

            expect(mockUpdateEvaluationUseCase.execute).toHaveBeenCalledWith('eval-1', updateDto, regularUser);
        });

        it('should allow updating photos', async () => {
            const updateDto: UpdateEvaluationDto = { photos: ['https://cdn.example.com/new-photo.jpg'] };
            mockUpdateEvaluationUseCase.execute.mockResolvedValue({
                ...sampleEvaluation,
                photos: ['https://cdn.example.com/new-photo.jpg'],
            });

            await service.update('eval-1', updateDto, regularUser);

            expect(mockUpdateEvaluationUseCase.execute).toHaveBeenCalledWith('eval-1', updateDto, regularUser);
        });

        it('should propagate NotFoundException when evaluation does not exist', async () => {
            mockUpdateEvaluationUseCase.execute.mockRejectedValue(
                new NotFoundException('Evaluation not found'),
            );

            await expect(service.update('nonexistent', { rating: 4 }, regularUser)).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should propagate ServiceUnavailableException', async () => {
            mockUpdateEvaluationUseCase.execute.mockRejectedValue(
                new ServiceUnavailableException('Something bad happened!'),
            );

            await expect(service.update('eval-1', { rating: 4 }, regularUser)).rejects.toThrow(
                ServiceUnavailableException,
            );
        });
    });

    // =======================================================================
    // remove
    // =======================================================================
    describe('remove', () => {
        it('should delegate to DeleteEvaluationUseCase with id and user', async () => {
            mockDeleteEvaluationUseCase.execute.mockResolvedValue(sampleEvaluation);

            const result = await service.remove('eval-1', regularUser);

            expect(mockDeleteEvaluationUseCase.execute).toHaveBeenCalledWith('eval-1', regularUser);
            expect(result).toEqual(sampleEvaluation);
        });

        it('should propagate NotFoundException when evaluation does not exist', async () => {
            mockDeleteEvaluationUseCase.execute.mockRejectedValue(
                new NotFoundException('Evaluation not found'),
            );

            await expect(service.remove('nonexistent', regularUser)).rejects.toThrow(NotFoundException);
            await expect(service.remove('nonexistent', regularUser)).rejects.toThrow('Evaluation not found');
        });

        it('should propagate ServiceUnavailableException', async () => {
            mockDeleteEvaluationUseCase.execute.mockRejectedValue(
                new ServiceUnavailableException('Something bad happened!'),
            );

            await expect(service.remove('eval-1', regularUser)).rejects.toThrow(ServiceUnavailableException);
        });

        it('should pass user context for authorization during deletion', async () => {
            mockDeleteEvaluationUseCase.execute.mockResolvedValue(sampleEvaluation);

            await service.remove('eval-1', adminUser);

            expect(mockDeleteEvaluationUseCase.execute).toHaveBeenCalledWith('eval-1', adminUser);
        });
    });

    // =======================================================================
    // Security Tests
    // =======================================================================
    describe('Security', () => {
        // -------------------------------------------------------------------
        // Rating manipulation - values outside 1-5 range, NaN, negative
        // -------------------------------------------------------------------
        describe('Rating manipulation', () => {
            it('should forward rating of 0 (below minimum) to use case for validation', async () => {
                const dto: CreateEvaluationDto = { ...validCreateDto, rating: 0 };
                mockCreateEvaluationUseCase.execute.mockResolvedValue({ ...sampleEvaluation, rating: 0 });

                await service.create(dto, regularUser);

                expect(mockCreateEvaluationUseCase.execute).toHaveBeenCalledWith(dto, regularUser);
            });

            it('should forward negative rating to use case for validation', async () => {
                const dto: CreateEvaluationDto = { ...validCreateDto, rating: -1 };
                mockCreateEvaluationUseCase.execute.mockResolvedValue({ ...sampleEvaluation, rating: -1 });

                await service.create(dto, regularUser);

                expect(mockCreateEvaluationUseCase.execute).toHaveBeenCalledWith(dto, regularUser);
            });

            it('should forward rating above 5 to use case for validation', async () => {
                const dto: CreateEvaluationDto = { ...validCreateDto, rating: 10 };
                mockCreateEvaluationUseCase.execute.mockResolvedValue({ ...sampleEvaluation, rating: 10 });

                await service.create(dto, regularUser);

                expect(mockCreateEvaluationUseCase.execute).toHaveBeenCalledWith(dto, regularUser);
            });

            it('should forward NaN rating to use case for validation', async () => {
                const dto: CreateEvaluationDto = { ...validCreateDto, rating: NaN };
                mockCreateEvaluationUseCase.execute.mockResolvedValue(sampleEvaluation);

                await service.create(dto, regularUser);

                expect(mockCreateEvaluationUseCase.execute).toHaveBeenCalledWith(
                    expect.objectContaining({ rating: NaN }),
                    regularUser,
                );
            });

            it('should forward float rating to use case (DTO class-validator enforces @IsInt)', async () => {
                const dto: CreateEvaluationDto = { ...validCreateDto, rating: 3.7 };
                mockCreateEvaluationUseCase.execute.mockResolvedValue(sampleEvaluation);

                await service.create(dto, regularUser);

                expect(mockCreateEvaluationUseCase.execute).toHaveBeenCalledWith(
                    expect.objectContaining({ rating: 3.7 }),
                    regularUser,
                );
            });

            it('should forward extremely large rating to use case for validation', async () => {
                const dto: CreateEvaluationDto = { ...validCreateDto, rating: 999999 };
                mockCreateEvaluationUseCase.execute.mockResolvedValue(sampleEvaluation);

                await service.create(dto, regularUser);

                expect(mockCreateEvaluationUseCase.execute).toHaveBeenCalledWith(
                    expect.objectContaining({ rating: 999999 }),
                    regularUser,
                );
            });

            it('should forward negative rating in update DTO to use case for validation', async () => {
                const updateDto: UpdateEvaluationDto = { rating: -5 };
                mockUpdateEvaluationUseCase.execute.mockResolvedValue(sampleEvaluation);

                await service.update('eval-1', updateDto, regularUser);

                expect(mockUpdateEvaluationUseCase.execute).toHaveBeenCalledWith(
                    'eval-1',
                    expect.objectContaining({ rating: -5 }),
                    regularUser,
                );
            });

            it('should forward rating of 6 in update DTO to use case for validation', async () => {
                const updateDto: UpdateEvaluationDto = { rating: 6 };
                mockUpdateEvaluationUseCase.execute.mockResolvedValue(sampleEvaluation);

                await service.update('eval-1', updateDto, regularUser);

                expect(mockUpdateEvaluationUseCase.execute).toHaveBeenCalledWith(
                    'eval-1',
                    expect.objectContaining({ rating: 6 }),
                    regularUser,
                );
            });
        });

        // -------------------------------------------------------------------
        // IDOR - evaluating other users' appointments
        // -------------------------------------------------------------------
        describe('IDOR - evaluating other users appointments', () => {
            it('should pass user context for ownership verification during create', async () => {
                mockCreateEvaluationUseCase.execute.mockRejectedValue(
                    new BadRequestException('You can only evaluate your own appointments'),
                );

                const dto: CreateEvaluationDto = {
                    ...validCreateDto,
                    userId: 'other-user-id',
                    appointmentId: 'other-appointment',
                };

                await expect(service.create(dto, regularUser)).rejects.toThrow(BadRequestException);
                await expect(service.create(dto, regularUser)).rejects.toThrow(
                    'You can only evaluate your own appointments',
                );
            });

            it('should always pass user context to findOne for scoped access', async () => {
                mockFindEvaluationByIdUseCase.execute.mockResolvedValue(sampleEvaluation);

                await service.findOne('eval-1', anotherUser);

                expect(mockFindEvaluationByIdUseCase.execute).toHaveBeenCalledWith('eval-1', anotherUser);
            });

            it('should always pass user context to update for scoped access', async () => {
                mockUpdateEvaluationUseCase.execute.mockResolvedValue(sampleEvaluation);

                await service.update('eval-1', { rating: 4 }, anotherUser);

                expect(mockUpdateEvaluationUseCase.execute).toHaveBeenCalledWith('eval-1', { rating: 4 }, anotherUser);
            });

            it('should always pass user context to remove for scoped access', async () => {
                mockDeleteEvaluationUseCase.execute.mockResolvedValue(sampleEvaluation);

                await service.remove('eval-1', anotherUser);

                expect(mockDeleteEvaluationUseCase.execute).toHaveBeenCalledWith('eval-1', anotherUser);
            });

            it('should pass user context to findAll so repository can scope results', async () => {
                mockFindAllEvaluationUseCase.execute.mockResolvedValue(paginatedResult);

                await service.findAll({ userId: 'other-user-id' }, regularUser);

                expect(mockFindAllEvaluationUseCase.execute).toHaveBeenCalledWith(
                    { userId: 'other-user-id' },
                    regularUser,
                );
            });

            it('should pass user context to getShopStats for authorization', async () => {
                mockGetShopStatsUseCase.execute.mockResolvedValue(sampleStats);

                await service.getShopStats('shop-1', regularUser);

                expect(mockGetShopStatsUseCase.execute).toHaveBeenCalledWith('shop-1', regularUser);
            });
        });

        // -------------------------------------------------------------------
        // Comment injection - XSS/SQL in evaluation comments
        // -------------------------------------------------------------------
        describe('Comment injection - XSS/SQL in evaluation comments', () => {
            it('should forward XSS script tag in comment to use case (DTO validation responsibility)', async () => {
                const dto: CreateEvaluationDto = {
                    ...validCreateDto,
                    comment: '<script>alert("xss")</script>',
                };
                mockCreateEvaluationUseCase.execute.mockResolvedValue({ ...sampleEvaluation, ...dto });

                await service.create(dto, regularUser);

                expect(mockCreateEvaluationUseCase.execute).toHaveBeenCalledWith(dto, regularUser);
            });

            it('should forward SVG onload XSS in comment to use case', async () => {
                const dto: CreateEvaluationDto = {
                    ...validCreateDto,
                    comment: '<svg/onload=alert(document.cookie)>',
                };
                mockCreateEvaluationUseCase.execute.mockResolvedValue({ ...sampleEvaluation, ...dto });

                await service.create(dto, regularUser);

                expect(mockCreateEvaluationUseCase.execute).toHaveBeenCalledWith(dto, regularUser);
            });

            it('should forward img onerror XSS in comment to use case', async () => {
                const dto: CreateEvaluationDto = {
                    ...validCreateDto,
                    comment: '"><img src=x onerror=alert(1)>',
                };
                mockCreateEvaluationUseCase.execute.mockResolvedValue({ ...sampleEvaluation, ...dto });

                await service.create(dto, regularUser);

                expect(mockCreateEvaluationUseCase.execute).toHaveBeenCalledWith(dto, regularUser);
            });

            it('should forward SQL injection in comment to use case', async () => {
                const dto: CreateEvaluationDto = {
                    ...validCreateDto,
                    comment: "'; DROP TABLE evaluations; --",
                };
                mockCreateEvaluationUseCase.execute.mockResolvedValue({ ...sampleEvaluation, ...dto });

                await service.create(dto, regularUser);

                expect(mockCreateEvaluationUseCase.execute).toHaveBeenCalledWith(dto, regularUser);
            });

            it('should forward SQL UNION injection in comment to use case', async () => {
                const dto: CreateEvaluationDto = {
                    ...validCreateDto,
                    comment: "' UNION SELECT id, email, password FROM users --",
                };
                mockCreateEvaluationUseCase.execute.mockResolvedValue({ ...sampleEvaluation, ...dto });

                await service.create(dto, regularUser);

                expect(mockCreateEvaluationUseCase.execute).toHaveBeenCalledWith(dto, regularUser);
            });

            it('should forward XSS in update comment to use case', async () => {
                const updateDto: UpdateEvaluationDto = {
                    comment: '<iframe src="javascript:alert(1)"></iframe>',
                };
                mockUpdateEvaluationUseCase.execute.mockResolvedValue({ ...sampleEvaluation, ...updateDto });

                await service.update('eval-1', updateDto, regularUser);

                expect(mockUpdateEvaluationUseCase.execute).toHaveBeenCalledWith('eval-1', updateDto, regularUser);
            });

            it('should forward null byte injection in comment to use case', async () => {
                const dto: CreateEvaluationDto = {
                    ...validCreateDto,
                    comment: 'Normal comment\x00<script>alert(1)</script>',
                };
                mockCreateEvaluationUseCase.execute.mockResolvedValue({ ...sampleEvaluation, ...dto });

                await service.create(dto, regularUser);

                expect(mockCreateEvaluationUseCase.execute).toHaveBeenCalledWith(dto, regularUser);
            });
        });

        // -------------------------------------------------------------------
        // Duplicate evaluation prevention
        // -------------------------------------------------------------------
        describe('Duplicate evaluation prevention', () => {
            it('should propagate ConflictException for duplicate evaluation', async () => {
                mockCreateEvaluationUseCase.execute.mockRejectedValue(
                    new ConflictException('This appointment has already been evaluated'),
                );

                await expect(service.create(validCreateDto, regularUser)).rejects.toThrow(ConflictException);
                await expect(service.create(validCreateDto, regularUser)).rejects.toThrow(
                    'This appointment has already been evaluated',
                );
            });

            it('should call use case only once per create invocation (no retry)', async () => {
                mockCreateEvaluationUseCase.execute.mockRejectedValue(
                    new ConflictException('This appointment has already been evaluated'),
                );

                try {
                    await service.create(validCreateDto, regularUser);
                } catch {
                    // expected
                }

                expect(mockCreateEvaluationUseCase.execute).toHaveBeenCalledTimes(1);
            });
        });

        // -------------------------------------------------------------------
        // Authorization - only appointment owner can evaluate
        // -------------------------------------------------------------------
        describe('Authorization - only appointment owner can evaluate', () => {
            it('should propagate BadRequestException when non-owner tries to evaluate', async () => {
                mockCreateEvaluationUseCase.execute.mockRejectedValue(
                    new BadRequestException('You can only evaluate your own appointments'),
                );

                const dto: CreateEvaluationDto = { ...validCreateDto, userId: 'attacker-user' };

                await expect(service.create(dto, anotherUser)).rejects.toThrow(BadRequestException);
                await expect(service.create(dto, anotherUser)).rejects.toThrow(
                    'You can only evaluate your own appointments',
                );
            });

            it('should pass user context to all mutating operations for auth enforcement', async () => {
                mockCreateEvaluationUseCase.execute.mockResolvedValue(sampleEvaluation);
                mockUpdateEvaluationUseCase.execute.mockResolvedValue(sampleEvaluation);
                mockDeleteEvaluationUseCase.execute.mockResolvedValue(sampleEvaluation);

                await service.create(validCreateDto, regularUser);
                await service.update('eval-1', { rating: 4 }, regularUser);
                await service.remove('eval-1', regularUser);

                expect(mockCreateEvaluationUseCase.execute).toHaveBeenCalledWith(validCreateDto, regularUser);
                expect(mockUpdateEvaluationUseCase.execute).toHaveBeenCalledWith(
                    'eval-1',
                    { rating: 4 },
                    regularUser,
                );
                expect(mockDeleteEvaluationUseCase.execute).toHaveBeenCalledWith('eval-1', regularUser);
            });

            it('should ensure every role passes user context to create', async () => {
                mockCreateEvaluationUseCase.execute.mockResolvedValue(sampleEvaluation);

                for (const user of [adminUser, ownerUser, managerUser, employeeUser, regularUser]) {
                    jest.clearAllMocks();
                    await service.create(validCreateDto, user);
                    expect(mockCreateEvaluationUseCase.execute).toHaveBeenCalledWith(validCreateDto, user);
                }
            });
        });

        // -------------------------------------------------------------------
        // Data leakage - sensitive user info in evaluation responses
        // -------------------------------------------------------------------
        describe('Data leakage - sensitive user info in evaluation responses', () => {
            it('should return whatever the use case returns (leakage prevention is use case/repo responsibility)', async () => {
                const safeEvaluation = {
                    ...sampleEvaluation,
                    user: {
                        id: 'user-1',
                        firstName: 'John',
                        lastName: 'Doe',
                        picture: null,
                        // No email, phone, password, etc.
                    },
                };
                mockFindEvaluationByIdUseCase.execute.mockResolvedValue(safeEvaluation);

                const result = await service.findOne('eval-1', regularUser);

                expect(result.user).not.toHaveProperty('email');
                expect(result.user).not.toHaveProperty('phone');
                expect(result.user).not.toHaveProperty('password');
                expect(result.user).not.toHaveProperty('role');
            });

            it('should confirm public endpoint does not leak user context', async () => {
                const publicEvaluation = {
                    id: 'eval-1',
                    rating: 5,
                    comment: 'Great service!',
                    photos: [],
                    createdAt: new Date('2025-01-01'),
                    updatedAt: new Date('2025-01-01'),
                    user: {
                        id: 'user-1',
                        firstName: 'John',
                        lastName: 'Doe',
                        picture: null,
                    },
                };
                mockFindAllEvaluationUseCase.executePublic.mockResolvedValue({
                    data: [publicEvaluation],
                    meta: { total: 1, page: 1, perPage: 10, totalPages: 1 },
                });

                const result = await service.findPublicByShop({ shopId: 'shop-1' });

                expect(result.data[0].user).not.toHaveProperty('email');
                expect(result.data[0].user).not.toHaveProperty('phone');
                expect(result.data[0].user).not.toHaveProperty('password');
                expect(result.data[0]).not.toHaveProperty('userId');
                expect(result.data[0]).not.toHaveProperty('appointmentId');
            });

            it('should confirm public stats endpoint returns only aggregate data', async () => {
                mockGetShopStatsUseCase.executePublic.mockResolvedValue(sampleStats);

                const result = await service.getPublicShopStats('shop-1');

                expect(result).toHaveProperty('averageRating');
                expect(result).toHaveProperty('totalEvaluations');
                expect(result).toHaveProperty('ratingDistribution');
                expect(result).not.toHaveProperty('users');
                expect(result).not.toHaveProperty('evaluations');
            });
        });
    });
});
