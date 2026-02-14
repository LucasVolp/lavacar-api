import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { FipeApiService } from './fipe-api.service';
import { Public } from 'src/shared/decorators/public.decorator';

@Controller('fipe-api')
export class FipeApiController {
  constructor(private readonly fipeApiService: FipeApiService) {}

  @Public()
  @Get('brands/:type')
  getBrands(@Param('type', ParseIntPipe) type: number) {
    return this.fipeApiService.getBrands(type);
  }

  @Public()
  @Get('models/:brandId')
  getModels(@Param('brandId', ParseIntPipe) brandId: number) {
    return this.fipeApiService.getModels(brandId);
  }
}
