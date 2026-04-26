import { BadRequestException, Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { Public } from 'src/shared/decorators/public.decorator';
import { StorageService } from './storage.service';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Public()
  @Get('object')
  async getObject(@Query('key') key: string, @Res() res: Response) {
    if (!key) {
      throw new BadRequestException('Parametro key e obrigatorio');
    }

    const file = await this.storageService.getObjectByKey(key);

    if (file.contentType) {
      res.setHeader('Content-Type', file.contentType);
    } else {
      res.setHeader('Content-Type', 'application/octet-stream');
    }
    res.setHeader('Cache-Control', 'public, max-age=300');

    return res.send(file.body);
  }
}

