import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { FipeApiService } from './fipe-api.service';

@Controller('fipe-api')
export class FipeApiController {
  constructor(private readonly fipeApiService: FipeApiService) {}

  @Get('brands/:type')
  getBrands(@Param('type', ParseIntPipe) type: number) {
    return this.fipeApiService.getBrands(type);
  }

  @Get('models/:brandId')
  getModels(@Param('brandId', ParseIntPipe) brandId: number) {
    return this.fipeApiService.getModels(brandId);
  }
}
