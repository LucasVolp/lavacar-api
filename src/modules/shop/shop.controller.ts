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
import { ShopService } from './shop.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';
import { Public } from 'src/shared/decorators/public.decorator';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/modules/users/types/Role';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { StorageService } from '../storage/storage.service';

@Controller('shop')
@Roles(Role.ADMIN, Role.OWNER, Role.EMPLOYEE, Role.MANAGER)
export class ShopController {
  constructor(
    private readonly shopService: ShopService,
    private readonly storageService: StorageService,
  ) {}

  @Post()
  create(@Body() data: CreateShopDto, @CurrentUser() user: JwtPayload) {
    return this.shopService.create(data, user);
  }

  @Get()
  findAll(
    @Query('organizationId') organizationId?: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    return this.shopService.findAll({
      organizationId,
      page: page ? parseInt(page, 10) : undefined,
      perPage: perPage ? parseInt(perPage, 10) : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shopService.findOne(id);
  }

  @Get('slug/:slug')
  @Public()
  findBySlug(@Param('slug') slug: string) {
    return this.shopService.findBySlug(slug);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: UpdateShopDto) {
    return this.shopService.update(id, data);
  }

  @Post(':id/upload/logo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 12 * 1024 * 1024 },
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

    const shop = await this.shopService.findOne(id);
    const url = await this.storageService.uploadFile({
      file,
      fileType: 'IMAGE',
      context: {
        type: 'SHOP',
        organizationId: shop.organizationId,
        shopId: shop.id,
        category: 'logo',
      },
    });

    if (shop.logoUrl) {
      await this.storageService.deleteFile(shop.logoUrl).catch(() => undefined);
    }

    await this.shopService.update(id, { logoUrl: url });
    return { url };
  }

  @Delete(':id/upload/logo')
  async deleteLogo(@Param('id') id: string) {
    const shop = await this.shopService.findOne(id);
    if (shop.logoUrl) {
      await this.storageService.deleteFile(shop.logoUrl);
    }
    await this.shopService.update(id, { logoUrl: null as any });
    return { success: true };
  }

  @Post(':id/upload/banner')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 12 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Apenas imagens sao permitidas'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadBanner(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Arquivo nao enviado');

    const shop = await this.shopService.findOne(id);
    const url = await this.storageService.uploadFile({
      file,
      fileType: 'IMAGE',
      context: {
        type: 'SHOP',
        organizationId: shop.organizationId,
        shopId: shop.id,
        category: 'banner',
      },
    });

    if (shop.bannerUrl) {
      await this.storageService.deleteFile(shop.bannerUrl).catch(() => undefined);
    }

    await this.shopService.update(id, { bannerUrl: url });
    return { url };
  }

  @Delete(':id/upload/banner')
  async deleteBanner(@Param('id') id: string) {
    const shop = await this.shopService.findOne(id);
    if (shop.bannerUrl) {
      await this.storageService.deleteFile(shop.bannerUrl);
    }
    await this.shopService.update(id, { bannerUrl: null as any });
    return { success: true };
  }

  @Post(':id/upload/gallery')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 12 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Apenas imagens sao permitidas'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadGallery(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Arquivo nao enviado');

    const shop = await this.shopService.findOne(id);
    const url = await this.storageService.uploadFile({
      file,
      fileType: 'IMAGE',
      context: {
        type: 'SHOP',
        organizationId: shop.organizationId,
        shopId: shop.id,
        category: 'gallery',
      },
    });

    const gallery = Array.from(new Set([...(shop.gallery || []), url]));
    await this.shopService.update(id, { gallery });
    return { url, gallery };
  }

  @Delete(':id/upload/gallery')
  async deleteGalleryImage(@Param('id') id: string, @Query('url') url: string) {
    if (!url) throw new BadRequestException('Informe a url na querystring');

    const shop = await this.shopService.findOne(id);
    const gallery = (shop.gallery || []).filter((item: string) => item !== url);

    await this.storageService.deleteFile(url);
    await this.shopService.update(id, { gallery });

    return { success: true, gallery };
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.shopService.remove(id, user);
  }
}
