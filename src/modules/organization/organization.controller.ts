import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto';
import { OrganizationMetricsPeriod } from './repository';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/modules/users/types/Role';
import { Public } from 'src/shared/decorators/public.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { StorageService } from '../storage/storage.service';

@Controller('organizations')
// @Roles(Role.ADMIN, Role.OWNER, Role.MANAGER)
export class OrganizationController {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly storageService: StorageService,
  ) {}

  @Post()
  create(@Body() data: CreateOrganizationDto) {
    return this.organizationService.create(data);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    return this.organizationService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      perPage: perPage ? parseInt(perPage, 10) : undefined,
    });
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.organizationService.findById(id);
  }

  @Get(':id/dashboard-metrics')
  findDashboardMetrics(
    @Param('id') id: string,
    @Query('period') period?: OrganizationMetricsPeriod,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.organizationService.findDashboardMetrics(id, {
      period,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('slug/:slug')
  @Public()
  findBySlug(@Param('slug') slug: string) {
    return this.organizationService.findBySlug(slug);
  }

  @Get('owner/:ownerId')
  findByOwner(@Param('ownerId') ownerId: string) {
    return this.organizationService.findByOwner(ownerId);
  }
  
  @Patch(':id')
  update(@Param('id') id: string, @Body() data: UpdateOrganizationDto) {
    return this.organizationService.update(id, data);
  }

  @Post(':id/upload/logo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 8 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Apenas imagens sao permitidas'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadLogo(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Arquivo nao enviado');

    const org = await this.organizationService.findById(id);
    const url = await this.storageService.uploadFile({
      file,
      fileType: 'IMAGE',
      context: {
        type: 'ORGANIZATION',
        organizationId: org.id,
        category: 'logo',
      },
    });

    if (org.logoUrl) {
      await this.storageService.deleteFile(org.logoUrl).catch(() => undefined);
    }

    await this.organizationService.update(id, { logoUrl: url });
    return { url };
  }

  @Delete(':id/upload/logo')
  async deleteLogo(@Param('id') id: string) {
    const org = await this.organizationService.findById(id);
    if (org.logoUrl) {
      await this.storageService.deleteFile(org.logoUrl);
    }

    await this.organizationService.update(id, { logoUrl: null as any });
    return { success: true };
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.organizationService.delete(id);
  }
}
