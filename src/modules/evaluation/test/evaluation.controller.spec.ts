import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { EvaluationController } from '../evaluation.controller';
import { EvaluationService } from '../evaluation.service';
import { StorageService } from '../../storage/storage.service';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';
import { CreateEvaluationDto } from '../dto/create-evaluation.dto';
import { UpdateEvaluationDto } from '../dto/update-evaluation.dto';
import {
    ConflictException,
    NotFoundException,
    ServiceUnavailableException,
} from '@nestjs/common';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockEvaluationService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findPublicByShop: jest.fn(),
    findOne: jest.fn(),
    getShopStats: jest.fn(),
    getPublicShopStats: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
};

const mockStorageService = {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const adminUser: JwtPayload = { id: 'admin-1', email: 'admin@test.com', phone: '+5511900000000', role: 'ADMIN' };
const ownerUser: JwtPayload = { id: 'owner-1', email: 'owner@test.com', phone: '+5511900000001', role: 'OWNER' };
const managerUser: JwtPayload = { id: 'manager-1', email: 'mgr@test.com', phone: '+5511900000002', role: 'MANAGER' };
const employeeUser: JwtPayload = { id: 'emp-1', email: 'emp@test.com', phone: '+5511900000003', role: 'EMPLOYEE' };
const regularUser: JwtPayload = { id: 'user-1', email: 'user@test.com', phone: '+5511900000004', role: 'USER' };
const anotherUser: JwtPayload = { id: 'user-2', email: 'user2@test.com', phone: '+5511900000005', role: 'USER' };

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

const emptyPaginatedResult = {
    data: [],
    meta: { total: 0, page: 1, perPage: 10, totalPages: 0 },
};

const buildMockFile = (overrides?: Partial<Express.Multer.File>): Express.Multer.File =>
    ({
        buffer: Buffer.from('fake-image-data'),
        mimetype: 'image/png',
        originalname: 'photo.png',
        size: 1024,
        fieldname: 'photos',
        encoding: '7bit',
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
        ...overrides,
    }) as Express.Multer.File;

describe('EvaluationController', () => {
    let controller: EvaluationController;

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            controllers: [EvaluationController],
            providers: [
                { provide: EvaluationService, useValue: mockEvaluationService },
                { provide: StorageService, useValue: mockStorageService },
            ],
        }).compile();

        controller = module.get<EvaluationController>(EvaluationController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    // =======================================================================
    // POST /evaluations  (create)
    // =======================================================================
    describe('create', () => {
        const createDto: CreateEvaluationDto = {
            rating: 5,
            comment: 'Great service!',
            appointmentId: 'appointment-1',
            userId: 'user-1',
            photos: ['https://cdn.example.com/photo1.jpg'],
        };

        it('should delegate to evaluationService.create with dto and user', async () => {
            mockEvaluationService.create.mockResolvedValue(sampleEvaluation);

            const result = await controller.create(createDto, regularUser);

            expect(mockEvaluationService.create).toHaveBeenCalledWith(createDto, regularUser);
            expect(result).toEqual(sampleEvaluation);
        });

        it('should propagate errors from evaluationService.create', async () => {
            mockEvaluationService.create.mockRejectedValue(new NotFoundException('Appointment not found'));

            await expect(controller.create(createDto, regularUser)).rejects.toThrow(NotFoundException);
        });

        it('should forward complete DTO including optional fields', async () => {
            const fullDto: CreateEvaluationDto = {
                rating: 4,
                comment: 'Good service',
                appointmentId: 'appointment-2',
                userId: 'user-1',
                photos: ['https://cdn.example.com/photo1.jpg', 'https://cdn.example.com/photo2.jpg'],
            };
            mockEvaluationService.create.mockResolvedValue({ id: 'eval-2', ...fullDto });

            await controller.create(fullDto, regularUser);

            expect(mockEvaluationService.create).toHaveBeenCalledWith(fullDto, regularUser);
        });

        it('should forward minimal DTO (no comment, no photos)', async () => {
            const minimalDto: CreateEvaluationDto = {
                rating: 3,
                appointmentId: 'appointment-3',
                userId: 'user-1',
            };
            mockEvaluationService.create.mockResolvedValue({ id: 'eval-3', ...minimalDto });

            await controller.create(minimalDto, regularUser);

            expect(mockEvaluationService.create).toHaveBeenCalledWith(minimalDto, regularUser);
        });

        it('should propagate ConflictException for duplicate evaluation', async () => {
            mockEvaluationService.create.mockRejectedValue(
                new ConflictException('This appointment has already been evaluated'),
            );

            await expect(controller.create(createDto, regularUser)).rejects.toThrow(ConflictException);
        });

        it('should propagate BadRequestException for incomplete appointment', async () => {
            mockEvaluationService.create.mockRejectedValue(
                new BadRequestException('Can only evaluate completed appointments'),
            );

            await expect(controller.create(createDto, regularUser)).rejects.toThrow(BadRequestException);
        });
    });

    // =======================================================================
    // POST /evaluations/upload/photos  (uploadPhotos)
    // =======================================================================
    describe('uploadPhotos', () => {
        it('should upload files and return urls', async () => {
            const files = [buildMockFile(), buildMockFile({ originalname: 'photo2.png' })];
            mockStorageService.uploadFile
                .mockResolvedValueOnce('https://cdn.example.com/photo1.png')
                .mockResolvedValueOnce('https://cdn.example.com/photo2.png');

            const result = await controller.uploadPhotos(files, regularUser, 'appointment-1');

            expect(mockStorageService.uploadFile).toHaveBeenCalledTimes(2);
            expect(mockStorageService.uploadFile).toHaveBeenCalledWith({
                file: files[0],
                fileType: 'IMAGE',
                context: {
                    type: 'USER',
                    userId: 'user-1',
                    category: 'evaluation',
                    appointmentId: 'appointment-1',
                },
            });
            expect(result).toEqual({
                urls: ['https://cdn.example.com/photo1.png', 'https://cdn.example.com/photo2.png'],
            });
        });

        it('should upload single file successfully', async () => {
            const files = [buildMockFile()];
            mockStorageService.uploadFile.mockResolvedValue('https://cdn.example.com/photo1.png');

            const result = await controller.uploadPhotos(files, regularUser);

            expect(mockStorageService.uploadFile).toHaveBeenCalledTimes(1);
            expect(result).toEqual({ urls: ['https://cdn.example.com/photo1.png'] });
        });

        it('should throw BadRequestException if no files are provided', async () => {
            await expect(controller.uploadPhotos([] as any, regularUser)).rejects.toThrow(BadRequestException);
            await expect(controller.uploadPhotos([] as any, regularUser)).rejects.toThrow('Nenhuma imagem enviada');
        });

        it('should throw BadRequestException if files is null/undefined', async () => {
            await expect(controller.uploadPhotos(null as any, regularUser)).rejects.toThrow(BadRequestException);
            await expect(controller.uploadPhotos(undefined as any, regularUser)).rejects.toThrow(BadRequestException);
        });

        it('should handle missing appointmentId query parameter', async () => {
            const files = [buildMockFile()];
            mockStorageService.uploadFile.mockResolvedValue('https://cdn.example.com/photo1.png');

            const result = await controller.uploadPhotos(files, regularUser, undefined);

            expect(mockStorageService.uploadFile).toHaveBeenCalledWith({
                file: files[0],
                fileType: 'IMAGE',
                context: {
                    type: 'USER',
                    userId: 'user-1',
                    category: 'evaluation',
                    appointmentId: undefined,
                },
            });
            expect(result).toEqual({ urls: ['https://cdn.example.com/photo1.png'] });
        });

        it('should use the authenticated user id in storage context', async () => {
            const files = [buildMockFile()];
            mockStorageService.uploadFile.mockResolvedValue('https://cdn.example.com/photo1.png');

            await controller.uploadPhotos(files, adminUser, 'appt-1');

            expect(mockStorageService.uploadFile).toHaveBeenCalledWith(
                expect.objectContaining({
                    context: expect.objectContaining({ userId: 'admin-1' }),
                }),
            );
        });

        it('should propagate storage errors', async () => {
            const files = [buildMockFile()];
            mockStorageService.uploadFile.mockRejectedValue(new Error('Storage unavailable'));

            await expect(controller.uploadPhotos(files, regularUser)).rejects.toThrow('Storage unavailable');
        });
    });

    // =======================================================================
    // GET /evaluations  (findAll)
    // =======================================================================
    describe('findAll', () => {
        it('should pass parsed query params to evaluationService.findAll', async () => {
            mockEvaluationService.findAll.mockResolvedValue(paginatedResult);

            const result = await controller.findAll(adminUser, 'shop-1', 'user-1', '5', '1', '10');

            expect(mockEvaluationService.findAll).toHaveBeenCalledWith(
                {
                    shopId: 'shop-1',
                    userId: 'user-1',
                    rating: 5,
                    page: 1,
                    perPage: 10,
                },
                adminUser,
            );
            expect(result).toEqual(paginatedResult);
        });

        it('should pass undefined for missing query params', async () => {
            mockEvaluationService.findAll.mockResolvedValue(emptyPaginatedResult);

            await controller.findAll(regularUser);

            expect(mockEvaluationService.findAll).toHaveBeenCalledWith(
                {
                    shopId: undefined,
                    userId: undefined,
                    rating: undefined,
                    page: undefined,
                    perPage: undefined,
                },
                regularUser,
            );
        });

        it('should correctly parse integer strings for rating, page, perPage', async () => {
            mockEvaluationService.findAll.mockResolvedValue(paginatedResult);

            await controller.findAll(adminUser, undefined, undefined, '3', '2', '25');

            expect(mockEvaluationService.findAll).toHaveBeenCalledWith(
                {
                    shopId: undefined,
                    userId: undefined,
                    rating: 3,
                    page: 2,
                    perPage: 25,
                },
                adminUser,
            );
        });

        it('should result in NaN for non-numeric query strings', async () => {
            mockEvaluationService.findAll.mockResolvedValue(emptyPaginatedResult);

            await controller.findAll(regularUser, undefined, undefined, 'abc', 'xyz', 'def');

            expect(mockEvaluationService.findAll).toHaveBeenCalledWith(
                {
                    shopId: undefined,
                    userId: undefined,
                    rating: NaN,
                    page: NaN,
                    perPage: NaN,
                },
                regularUser,
            );
        });

        it('should pass only shopId when other params are missing', async () => {
            mockEvaluationService.findAll.mockResolvedValue(paginatedResult);

            await controller.findAll(ownerUser, 'shop-1');

            expect(mockEvaluationService.findAll).toHaveBeenCalledWith(
                {
                    shopId: 'shop-1',
                    userId: undefined,
                    rating: undefined,
                    page: undefined,
                    perPage: undefined,
                },
                ownerUser,
            );
        });

        it('should propagate errors from evaluationService.findAll', async () => {
            mockEvaluationService.findAll.mockRejectedValue(
                new ServiceUnavailableException('Something bad happened!'),
            );

            await expect(controller.findAll(regularUser)).rejects.toThrow(ServiceUnavailableException);
        });
    });

    // =======================================================================
    // GET /evaluations/stats/:shopId  (getShopStats)
    // =======================================================================
    describe('getShopStats', () => {
        it('should delegate to evaluationService.getShopStats with shopId and user', async () => {
            mockEvaluationService.getShopStats.mockResolvedValue(sampleStats);

            const result = await controller.getShopStats('shop-1', adminUser);

            expect(mockEvaluationService.getShopStats).toHaveBeenCalledWith('shop-1', adminUser);
            expect(result).toEqual(sampleStats);
        });

        it('should propagate errors from evaluationService.getShopStats', async () => {
            mockEvaluationService.getShopStats.mockRejectedValue(
                new ServiceUnavailableException('Something bad happened!'),
            );

            await expect(controller.getShopStats('shop-1', adminUser)).rejects.toThrow(ServiceUnavailableException);
        });

        it('should pass user context for every role', async () => {
            mockEvaluationService.getShopStats.mockResolvedValue(sampleStats);

            for (const user of [adminUser, ownerUser, managerUser, employeeUser, regularUser]) {
                jest.clearAllMocks();
                await controller.getShopStats('shop-1', user);
                expect(mockEvaluationService.getShopStats).toHaveBeenCalledWith('shop-1', user);
            }
        });
    });

    // =======================================================================
    // GET /evaluations/public  (findPublicByShop)
    // =======================================================================
    describe('findPublicByShop', () => {
        it('should delegate to evaluationService.findPublicByShop with parsed filters', async () => {
            mockEvaluationService.findPublicByShop.mockResolvedValue(paginatedResult);

            const result = await controller.findPublicByShop('shop-1', '5', '1', '10');

            expect(mockEvaluationService.findPublicByShop).toHaveBeenCalledWith({
                shopId: 'shop-1',
                rating: 5,
                page: 1,
                perPage: 10,
            });
            expect(result).toEqual(paginatedResult);
        });

        it('should pass undefined for missing optional params', async () => {
            mockEvaluationService.findPublicByShop.mockResolvedValue(emptyPaginatedResult);

            await controller.findPublicByShop('shop-1');

            expect(mockEvaluationService.findPublicByShop).toHaveBeenCalledWith({
                shopId: 'shop-1',
                rating: undefined,
                page: undefined,
                perPage: undefined,
            });
        });

        it('should correctly parse rating filter for public endpoint', async () => {
            mockEvaluationService.findPublicByShop.mockResolvedValue(paginatedResult);

            await controller.findPublicByShop('shop-1', '4');

            expect(mockEvaluationService.findPublicByShop).toHaveBeenCalledWith({
                shopId: 'shop-1',
                rating: 4,
                page: undefined,
                perPage: undefined,
            });
        });

        it('should result in NaN for non-numeric rating string', async () => {
            mockEvaluationService.findPublicByShop.mockResolvedValue(emptyPaginatedResult);

            await controller.findPublicByShop('shop-1', 'invalid');

            expect(mockEvaluationService.findPublicByShop).toHaveBeenCalledWith({
                shopId: 'shop-1',
                rating: NaN,
                page: undefined,
                perPage: undefined,
            });
        });

        it('should propagate errors from evaluationService.findPublicByShop', async () => {
            mockEvaluationService.findPublicByShop.mockRejectedValue(
                new ServiceUnavailableException('Something bad happened!'),
            );

            await expect(controller.findPublicByShop('shop-1')).rejects.toThrow(ServiceUnavailableException);
        });
    });

    // =======================================================================
    // GET /evaluations/public/stats/:shopId  (getPublicShopStats)
    // =======================================================================
    describe('getPublicShopStats', () => {
        it('should delegate to evaluationService.getPublicShopStats with shopId', async () => {
            mockEvaluationService.getPublicShopStats.mockResolvedValue(sampleStats);

            const result = await controller.getPublicShopStats('shop-1');

            expect(mockEvaluationService.getPublicShopStats).toHaveBeenCalledWith('shop-1');
            expect(result).toEqual(sampleStats);
        });

        it('should not require user context (public endpoint)', async () => {
            mockEvaluationService.getPublicShopStats.mockResolvedValue(sampleStats);

            await controller.getPublicShopStats('shop-1');

            expect(mockEvaluationService.getPublicShopStats).toHaveBeenCalledTimes(1);
            expect(mockEvaluationService.getPublicShopStats).toHaveBeenCalledWith('shop-1');
        });

        it('should propagate errors from evaluationService.getPublicShopStats', async () => {
            mockEvaluationService.getPublicShopStats.mockRejectedValue(
                new ServiceUnavailableException('Something bad happened!'),
            );

            await expect(controller.getPublicShopStats('shop-1')).rejects.toThrow(ServiceUnavailableException);
        });
    });

    // =======================================================================
    // GET /evaluations/:id  (findOne)
    // =======================================================================
    describe('findOne', () => {
        it('should delegate to evaluationService.findOne with id and user', async () => {
            mockEvaluationService.findOne.mockResolvedValue(sampleEvaluation);

            const result = await controller.findOne('eval-1', regularUser);

            expect(mockEvaluationService.findOne).toHaveBeenCalledWith('eval-1', regularUser);
            expect(result).toEqual(sampleEvaluation);
        });

        it('should propagate NotFoundException when evaluation does not exist', async () => {
            mockEvaluationService.findOne.mockRejectedValue(new NotFoundException('Evaluation not found'));

            await expect(controller.findOne('nonexistent', regularUser)).rejects.toThrow(NotFoundException);
            await expect(controller.findOne('nonexistent', regularUser)).rejects.toThrow('Evaluation not found');
        });

        it('should propagate ServiceUnavailableException', async () => {
            mockEvaluationService.findOne.mockRejectedValue(
                new ServiceUnavailableException('Something bad happened!'),
            );

            await expect(controller.findOne('eval-1', regularUser)).rejects.toThrow(ServiceUnavailableException);
        });
    });

    // =======================================================================
    // PATCH /evaluations/:id  (update)
    // =======================================================================
    describe('update', () => {
        it('should delegate to evaluationService.update with id, dto, and user', async () => {
            const updateDto: UpdateEvaluationDto = { rating: 4, comment: 'Updated comment' };
            const updated = { ...sampleEvaluation, rating: 4, comment: 'Updated comment' };
            mockEvaluationService.update.mockResolvedValue(updated);

            const result = await controller.update('eval-1', updateDto, regularUser);

            expect(mockEvaluationService.update).toHaveBeenCalledWith('eval-1', updateDto, regularUser);
            expect(result).toEqual(updated);
        });

        it('should allow partial update (only rating)', async () => {
            const updateDto: UpdateEvaluationDto = { rating: 3 };
            mockEvaluationService.update.mockResolvedValue({ ...sampleEvaluation, rating: 3 });

            await controller.update('eval-1', updateDto, regularUser);

            expect(mockEvaluationService.update).toHaveBeenCalledWith('eval-1', updateDto, regularUser);
        });

        it('should allow partial update (only comment)', async () => {
            const updateDto: UpdateEvaluationDto = { comment: 'New comment' };
            mockEvaluationService.update.mockResolvedValue({ ...sampleEvaluation, comment: 'New comment' });

            await controller.update('eval-1', updateDto, regularUser);

            expect(mockEvaluationService.update).toHaveBeenCalledWith('eval-1', updateDto, regularUser);
        });

        it('should allow partial update (only photos)', async () => {
            const updateDto: UpdateEvaluationDto = { photos: ['https://cdn.example.com/new-photo.jpg'] };
            mockEvaluationService.update.mockResolvedValue({
                ...sampleEvaluation,
                photos: ['https://cdn.example.com/new-photo.jpg'],
            });

            await controller.update('eval-1', updateDto, regularUser);

            expect(mockEvaluationService.update).toHaveBeenCalledWith('eval-1', updateDto, regularUser);
        });

        it('should propagate NotFoundException for missing evaluation', async () => {
            mockEvaluationService.update.mockRejectedValue(new NotFoundException('Evaluation not found'));

            await expect(controller.update('nonexistent', { rating: 4 }, regularUser)).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should propagate ServiceUnavailableException', async () => {
            mockEvaluationService.update.mockRejectedValue(
                new ServiceUnavailableException('Something bad happened!'),
            );

            await expect(controller.update('eval-1', { rating: 4 }, regularUser)).rejects.toThrow(
                ServiceUnavailableException,
            );
        });
    });

    // =======================================================================
    // DELETE /evaluations/:id  (remove)
    // =======================================================================
    describe('remove', () => {
        it('should delegate to evaluationService.remove with id and user', async () => {
            mockEvaluationService.remove.mockResolvedValue(sampleEvaluation);

            const result = await controller.remove('eval-1', regularUser);

            expect(mockEvaluationService.remove).toHaveBeenCalledWith('eval-1', regularUser);
            expect(result).toEqual(sampleEvaluation);
        });

        it('should propagate NotFoundException for missing evaluation', async () => {
            mockEvaluationService.remove.mockRejectedValue(new NotFoundException('Evaluation not found'));

            await expect(controller.remove('nonexistent', regularUser)).rejects.toThrow(NotFoundException);
            await expect(controller.remove('nonexistent', regularUser)).rejects.toThrow('Evaluation not found');
        });

        it('should propagate ServiceUnavailableException', async () => {
            mockEvaluationService.remove.mockRejectedValue(
                new ServiceUnavailableException('Something bad happened!'),
            );

            await expect(controller.remove('eval-1', regularUser)).rejects.toThrow(ServiceUnavailableException);
        });

        it('should pass user context to service for authorization check', async () => {
            mockEvaluationService.remove.mockResolvedValue(sampleEvaluation);

            await controller.remove('eval-1', adminUser);

            expect(mockEvaluationService.remove).toHaveBeenCalledWith('eval-1', adminUser);
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
            it('should forward rating of 0 (below minimum) to service (DTO validation responsibility)', async () => {
                const dto: CreateEvaluationDto = {
                    rating: 0,
                    appointmentId: 'appointment-1',
                    userId: 'user-1',
                };
                mockEvaluationService.create.mockResolvedValue({ id: 'eval-x', ...dto });

                await controller.create(dto, regularUser);

                expect(mockEvaluationService.create).toHaveBeenCalledWith(dto, regularUser);
            });

            it('should forward negative rating to service (DTO validation responsibility)', async () => {
                const dto: CreateEvaluationDto = {
                    rating: -5,
                    appointmentId: 'appointment-1',
                    userId: 'user-1',
                };
                mockEvaluationService.create.mockResolvedValue({ id: 'eval-x', ...dto });

                await controller.create(dto, regularUser);

                expect(mockEvaluationService.create).toHaveBeenCalledWith(
                    expect.objectContaining({ rating: -5 }),
                    regularUser,
                );
            });

            it('should forward rating above 5 to service (DTO validation responsibility)', async () => {
                const dto: CreateEvaluationDto = {
                    rating: 100,
                    appointmentId: 'appointment-1',
                    userId: 'user-1',
                };
                mockEvaluationService.create.mockResolvedValue({ id: 'eval-x', ...dto });

                await controller.create(dto, regularUser);

                expect(mockEvaluationService.create).toHaveBeenCalledWith(
                    expect.objectContaining({ rating: 100 }),
                    regularUser,
                );
            });

            it('should forward float rating to service (DTO @IsInt handles)', async () => {
                const dto: CreateEvaluationDto = {
                    rating: 4.5,
                    appointmentId: 'appointment-1',
                    userId: 'user-1',
                };
                mockEvaluationService.create.mockResolvedValue({ id: 'eval-x', ...dto });

                await controller.create(dto, regularUser);

                expect(mockEvaluationService.create).toHaveBeenCalledWith(
                    expect.objectContaining({ rating: 4.5 }),
                    regularUser,
                );
            });

            it('should parse NaN for non-numeric rating in findAll query', async () => {
                mockEvaluationService.findAll.mockResolvedValue(emptyPaginatedResult);

                await controller.findAll(regularUser, undefined, undefined, 'not-a-number');

                expect(mockEvaluationService.findAll).toHaveBeenCalledWith(
                    expect.objectContaining({ rating: NaN }),
                    regularUser,
                );
            });

            it('should parse NaN for non-numeric rating in findPublicByShop query', async () => {
                mockEvaluationService.findPublicByShop.mockResolvedValue(emptyPaginatedResult);

                await controller.findPublicByShop('shop-1', 'invalid');

                expect(mockEvaluationService.findPublicByShop).toHaveBeenCalledWith(
                    expect.objectContaining({ rating: NaN }),
                );
            });

            it('should forward extremely large rating in update to service', async () => {
                const updateDto: UpdateEvaluationDto = { rating: 999999 };
                mockEvaluationService.update.mockResolvedValue(sampleEvaluation);

                await controller.update('eval-1', updateDto, regularUser);

                expect(mockEvaluationService.update).toHaveBeenCalledWith(
                    'eval-1',
                    expect.objectContaining({ rating: 999999 }),
                    regularUser,
                );
            });

            it('should forward Infinity rating in update to service', async () => {
                const updateDto: UpdateEvaluationDto = { rating: Infinity as any };
                mockEvaluationService.update.mockResolvedValue(sampleEvaluation);

                await controller.update('eval-1', updateDto, regularUser);

                expect(mockEvaluationService.update).toHaveBeenCalledWith(
                    'eval-1',
                    expect.objectContaining({ rating: Infinity }),
                    regularUser,
                );
            });
        });

        // -------------------------------------------------------------------
        // IDOR - evaluating other users' appointments
        // -------------------------------------------------------------------
        describe('IDOR - evaluating other users appointments', () => {
            it('should pass user context to create for ownership verification', async () => {
                mockEvaluationService.create.mockRejectedValue(
                    new BadRequestException('You can only evaluate your own appointments'),
                );

                const dto: CreateEvaluationDto = {
                    rating: 5,
                    appointmentId: 'other-users-appointment',
                    userId: 'other-user-id',
                };

                await expect(controller.create(dto, regularUser)).rejects.toThrow(BadRequestException);
                expect(mockEvaluationService.create).toHaveBeenCalledWith(dto, regularUser);
            });

            it('should pass user context to findOne so service can scope by ownership', async () => {
                mockEvaluationService.findOne.mockResolvedValue(sampleEvaluation);

                await controller.findOne('eval-1', anotherUser);

                expect(mockEvaluationService.findOne).toHaveBeenCalledWith('eval-1', anotherUser);
            });

            it('should pass user context to update for ownership verification', async () => {
                mockEvaluationService.update.mockRejectedValue(
                    new NotFoundException('Evaluation not found'),
                );

                await expect(
                    controller.update('eval-1', { rating: 1 }, anotherUser),
                ).rejects.toThrow(NotFoundException);

                expect(mockEvaluationService.update).toHaveBeenCalledWith('eval-1', { rating: 1 }, anotherUser);
            });

            it('should pass user context to remove for ownership verification', async () => {
                mockEvaluationService.remove.mockRejectedValue(
                    new NotFoundException('Evaluation not found'),
                );

                await expect(controller.remove('eval-1', anotherUser)).rejects.toThrow(NotFoundException);
                expect(mockEvaluationService.remove).toHaveBeenCalledWith('eval-1', anotherUser);
            });

            it('should pass user context to findAll so service can scope results by role', async () => {
                mockEvaluationService.findAll.mockResolvedValue(paginatedResult);

                await controller.findAll(regularUser, undefined, 'other-user-id');

                expect(mockEvaluationService.findAll).toHaveBeenCalledWith(
                    expect.objectContaining({ userId: 'other-user-id' }),
                    regularUser,
                );
            });

            it('should pass user context to getShopStats for authorization scoping', async () => {
                mockEvaluationService.getShopStats.mockResolvedValue(sampleStats);

                await controller.getShopStats('shop-1', employeeUser);

                expect(mockEvaluationService.getShopStats).toHaveBeenCalledWith('shop-1', employeeUser);
            });
        });

        // -------------------------------------------------------------------
        // Comment injection - XSS/SQL in evaluation comments
        // -------------------------------------------------------------------
        describe('Comment injection - XSS/SQL in evaluation comments', () => {
            it('should forward XSS script tag in comment to service', async () => {
                const dto: CreateEvaluationDto = {
                    rating: 5,
                    comment: '<script>alert("xss")</script>',
                    appointmentId: 'appointment-1',
                    userId: 'user-1',
                };
                mockEvaluationService.create.mockResolvedValue({ id: 'eval-x', ...dto });

                await controller.create(dto, regularUser);

                expect(mockEvaluationService.create).toHaveBeenCalledWith(dto, regularUser);
            });

            it('should forward SVG onload XSS in comment to service', async () => {
                const dto: CreateEvaluationDto = {
                    rating: 4,
                    comment: '<svg/onload=alert(document.cookie)>',
                    appointmentId: 'appointment-1',
                    userId: 'user-1',
                };
                mockEvaluationService.create.mockResolvedValue({ id: 'eval-x', ...dto });

                await controller.create(dto, regularUser);

                expect(mockEvaluationService.create).toHaveBeenCalledWith(dto, regularUser);
            });

            it('should forward img onerror XSS in comment to service', async () => {
                const dto: CreateEvaluationDto = {
                    rating: 3,
                    comment: '"><img src=x onerror=alert(1)>',
                    appointmentId: 'appointment-1',
                    userId: 'user-1',
                };
                mockEvaluationService.create.mockResolvedValue({ id: 'eval-x', ...dto });

                await controller.create(dto, regularUser);

                expect(mockEvaluationService.create).toHaveBeenCalledWith(dto, regularUser);
            });

            it('should forward SQL injection in comment to service', async () => {
                const dto: CreateEvaluationDto = {
                    rating: 5,
                    comment: "'; DROP TABLE evaluations; --",
                    appointmentId: 'appointment-1',
                    userId: 'user-1',
                };
                mockEvaluationService.create.mockResolvedValue({ id: 'eval-x', ...dto });

                await controller.create(dto, regularUser);

                expect(mockEvaluationService.create).toHaveBeenCalledWith(dto, regularUser);
            });

            it('should forward SQL UNION injection in comment to service', async () => {
                const dto: CreateEvaluationDto = {
                    rating: 1,
                    comment: "' UNION SELECT id, email, password FROM users --",
                    appointmentId: 'appointment-1',
                    userId: 'user-1',
                };
                mockEvaluationService.create.mockResolvedValue({ id: 'eval-x', ...dto });

                await controller.create(dto, regularUser);

                expect(mockEvaluationService.create).toHaveBeenCalledWith(dto, regularUser);
            });

            it('should forward iframe injection in update comment to service', async () => {
                const updateDto: UpdateEvaluationDto = {
                    comment: '<iframe src="javascript:alert(1)"></iframe>',
                };
                mockEvaluationService.update.mockResolvedValue(sampleEvaluation);

                await controller.update('eval-1', updateDto, regularUser);

                expect(mockEvaluationService.update).toHaveBeenCalledWith('eval-1', updateDto, regularUser);
            });

            it('should forward null byte injection in comment to service', async () => {
                const dto: CreateEvaluationDto = {
                    rating: 5,
                    comment: 'Normal\x00<script>alert(1)</script>',
                    appointmentId: 'appointment-1',
                    userId: 'user-1',
                };
                mockEvaluationService.create.mockResolvedValue({ id: 'eval-x', ...dto });

                await controller.create(dto, regularUser);

                expect(mockEvaluationService.create).toHaveBeenCalledWith(dto, regularUser);
            });

            it('should forward CRLF injection in comment to service', async () => {
                const dto: CreateEvaluationDto = {
                    rating: 5,
                    comment: 'Normal comment\r\nX-Injected-Header: value',
                    appointmentId: 'appointment-1',
                    userId: 'user-1',
                };
                mockEvaluationService.create.mockResolvedValue({ id: 'eval-x', ...dto });

                await controller.create(dto, regularUser);

                expect(mockEvaluationService.create).toHaveBeenCalledWith(dto, regularUser);
            });
        });

        // -------------------------------------------------------------------
        // Duplicate evaluation prevention
        // -------------------------------------------------------------------
        describe('Duplicate evaluation prevention', () => {
            it('should propagate ConflictException for duplicate evaluation attempt', async () => {
                mockEvaluationService.create.mockRejectedValue(
                    new ConflictException('This appointment has already been evaluated'),
                );

                const dto: CreateEvaluationDto = {
                    rating: 5,
                    appointmentId: 'appointment-1',
                    userId: 'user-1',
                };

                await expect(controller.create(dto, regularUser)).rejects.toThrow(ConflictException);
                await expect(controller.create(dto, regularUser)).rejects.toThrow(
                    'This appointment has already been evaluated',
                );
            });

            it('should call service.create only once per request', async () => {
                mockEvaluationService.create.mockRejectedValue(
                    new ConflictException('This appointment has already been evaluated'),
                );

                const dto: CreateEvaluationDto = {
                    rating: 5,
                    appointmentId: 'appointment-1',
                    userId: 'user-1',
                };

                try {
                    await controller.create(dto, regularUser);
                } catch {
                    // expected
                }

                expect(mockEvaluationService.create).toHaveBeenCalledTimes(1);
            });
        });

        // -------------------------------------------------------------------
        // Authorization - only appointment owner can evaluate
        // -------------------------------------------------------------------
        describe('Authorization - only appointment owner can evaluate', () => {
            it('should propagate BadRequestException when non-owner attempts evaluation', async () => {
                mockEvaluationService.create.mockRejectedValue(
                    new BadRequestException('You can only evaluate your own appointments'),
                );

                const dto: CreateEvaluationDto = {
                    rating: 5,
                    comment: 'Trying to evaluate someone elses appointment',
                    appointmentId: 'appointment-1',
                    userId: 'attacker-id',
                };

                await expect(controller.create(dto, anotherUser)).rejects.toThrow(BadRequestException);
                await expect(controller.create(dto, anotherUser)).rejects.toThrow(
                    'You can only evaluate your own appointments',
                );
            });

            it('should always include user in create call for auth enforcement', async () => {
                mockEvaluationService.create.mockResolvedValue(sampleEvaluation);

                const dto: CreateEvaluationDto = {
                    rating: 5,
                    appointmentId: 'appointment-1',
                    userId: 'user-1',
                };

                for (const user of [adminUser, ownerUser, managerUser, employeeUser, regularUser]) {
                    jest.clearAllMocks();
                    await controller.create(dto, user);
                    expect(mockEvaluationService.create).toHaveBeenCalledWith(dto, user);
                }
            });

            it('should always include user in update call for auth enforcement', async () => {
                mockEvaluationService.update.mockResolvedValue(sampleEvaluation);

                const updateDto: UpdateEvaluationDto = { rating: 4 };

                for (const user of [adminUser, ownerUser, managerUser, employeeUser, regularUser]) {
                    jest.clearAllMocks();
                    await controller.update('eval-1', updateDto, user);
                    expect(mockEvaluationService.update).toHaveBeenCalledWith('eval-1', updateDto, user);
                }
            });

            it('should always include user in remove call for auth enforcement', async () => {
                mockEvaluationService.remove.mockResolvedValue(sampleEvaluation);

                for (const user of [adminUser, ownerUser, managerUser, employeeUser, regularUser]) {
                    jest.clearAllMocks();
                    await controller.remove('eval-1', user);
                    expect(mockEvaluationService.remove).toHaveBeenCalledWith('eval-1', user);
                }
            });
        });

        // -------------------------------------------------------------------
        // Data leakage - sensitive user info in evaluation responses
        // -------------------------------------------------------------------
        describe('Data leakage - sensitive user info in evaluation responses', () => {
            it('should return only safe user fields from findOne', async () => {
                const safeEvaluation = {
                    ...sampleEvaluation,
                    user: {
                        id: 'user-1',
                        firstName: 'John',
                        lastName: 'Doe',
                        picture: null,
                    },
                };
                mockEvaluationService.findOne.mockResolvedValue(safeEvaluation);

                const result = await controller.findOne('eval-1', regularUser);

                expect(result.user).not.toHaveProperty('email');
                expect(result.user).not.toHaveProperty('phone');
                expect(result.user).not.toHaveProperty('password');
                expect(result.user).not.toHaveProperty('role');
                expect(result.user).not.toHaveProperty('document');
            });

            it('should return only safe fields in public findAll endpoint', async () => {
                const publicData = {
                    data: [
                        {
                            id: 'eval-1',
                            rating: 5,
                            comment: 'Great!',
                            photos: [],
                            createdAt: new Date(),
                            updatedAt: new Date(),
                            user: {
                                id: 'user-1',
                                firstName: 'John',
                                lastName: 'Doe',
                                picture: null,
                            },
                        },
                    ],
                    meta: { total: 1, page: 1, perPage: 10, totalPages: 1 },
                };
                mockEvaluationService.findPublicByShop.mockResolvedValue(publicData);

                const result = await controller.findPublicByShop('shop-1');

                expect(result.data[0].user).not.toHaveProperty('email');
                expect(result.data[0].user).not.toHaveProperty('phone');
                expect(result.data[0].user).not.toHaveProperty('password');
                expect(result.data[0]).not.toHaveProperty('userId');
                expect(result.data[0]).not.toHaveProperty('appointmentId');
            });

            it('should return only aggregate data in public stats endpoint', async () => {
                mockEvaluationService.getPublicShopStats.mockResolvedValue(sampleStats);

                const result = await controller.getPublicShopStats('shop-1');

                expect(result).toHaveProperty('averageRating');
                expect(result).toHaveProperty('totalEvaluations');
                expect(result).toHaveProperty('ratingDistribution');
                expect(result).not.toHaveProperty('users');
                expect(result).not.toHaveProperty('evaluations');
                expect(result).not.toHaveProperty('emails');
            });
        });

        // -------------------------------------------------------------------
        // Upload security
        // -------------------------------------------------------------------
        describe('Upload security', () => {
            it('should throw BadRequestException when no files provided to uploadPhotos', async () => {
                await expect(controller.uploadPhotos([] as any, regularUser)).rejects.toThrow(BadRequestException);
                await expect(controller.uploadPhotos([] as any, regularUser)).rejects.toThrow(
                    'Nenhuma imagem enviada',
                );
            });

            it('should throw BadRequestException when null files provided to uploadPhotos', async () => {
                await expect(controller.uploadPhotos(null as any, regularUser)).rejects.toThrow(BadRequestException);
            });

            it('should propagate storage errors during photo upload', async () => {
                const files = [buildMockFile()];
                mockStorageService.uploadFile.mockRejectedValue(new Error('Storage unavailable'));

                await expect(controller.uploadPhotos(files, regularUser)).rejects.toThrow('Storage unavailable');
            });

            it('should use authenticated user id in upload context, not a user-supplied value', async () => {
                const files = [buildMockFile()];
                mockStorageService.uploadFile.mockResolvedValue('https://cdn.example.com/photo.png');

                await controller.uploadPhotos(files, regularUser, 'appointment-1');

                expect(mockStorageService.uploadFile).toHaveBeenCalledWith(
                    expect.objectContaining({
                        context: expect.objectContaining({
                            userId: regularUser.id,
                        }),
                    }),
                );
            });
        });

        // -------------------------------------------------------------------
        // ID parameter injection
        // -------------------------------------------------------------------
        describe('ID parameter injection', () => {
            it('should pass path-traversal id to service for downstream handling', async () => {
                mockEvaluationService.findOne.mockRejectedValue(new NotFoundException('Evaluation not found'));

                await expect(controller.findOne('../../../etc/passwd', regularUser)).rejects.toThrow(
                    NotFoundException,
                );
                expect(mockEvaluationService.findOne).toHaveBeenCalledWith('../../../etc/passwd', regularUser);
            });

            it('should pass SQL injection id to service for downstream handling', async () => {
                mockEvaluationService.findOne.mockRejectedValue(new NotFoundException('Evaluation not found'));

                await expect(controller.findOne("'; DROP TABLE evaluations; --", regularUser)).rejects.toThrow(
                    NotFoundException,
                );
                expect(mockEvaluationService.findOne).toHaveBeenCalledWith(
                    "'; DROP TABLE evaluations; --",
                    regularUser,
                );
            });

            it('should pass XSS id to remove for downstream handling', async () => {
                mockEvaluationService.remove.mockRejectedValue(new NotFoundException('Evaluation not found'));

                await expect(
                    controller.remove('<script>alert(1)</script>', regularUser),
                ).rejects.toThrow(NotFoundException);
                expect(mockEvaluationService.remove).toHaveBeenCalledWith(
                    '<script>alert(1)</script>',
                    regularUser,
                );
            });

            it('should pass empty string id to service', async () => {
                mockEvaluationService.findOne.mockRejectedValue(new NotFoundException('Evaluation not found'));

                await expect(controller.findOne('', regularUser)).rejects.toThrow(NotFoundException);
                expect(mockEvaluationService.findOne).toHaveBeenCalledWith('', regularUser);
            });
        });

        // -------------------------------------------------------------------
        // shopId parameter injection
        // -------------------------------------------------------------------
        describe('shopId parameter injection', () => {
            it('should pass path-traversal shopId to getShopStats', async () => {
                mockEvaluationService.getShopStats.mockRejectedValue(
                    new ServiceUnavailableException('Something bad happened!'),
                );

                await expect(
                    controller.getShopStats('../../../etc/passwd', adminUser),
                ).rejects.toThrow(ServiceUnavailableException);
                expect(mockEvaluationService.getShopStats).toHaveBeenCalledWith(
                    '../../../etc/passwd',
                    adminUser,
                );
            });

            it('should pass SQL injection shopId to getPublicShopStats', async () => {
                mockEvaluationService.getPublicShopStats.mockRejectedValue(
                    new ServiceUnavailableException('Something bad happened!'),
                );

                await expect(
                    controller.getPublicShopStats("' OR 1=1; --"),
                ).rejects.toThrow(ServiceUnavailableException);
                expect(mockEvaluationService.getPublicShopStats).toHaveBeenCalledWith("' OR 1=1; --");
            });
        });
    });
});
