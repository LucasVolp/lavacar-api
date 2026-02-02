import { Test, TestingModule } from '@nestjs/testing';
import { FipeApiController } from './fipe-api.controller';
import { FipeApiService } from './fipe-api.service';

describe('FipeApiController', () => {
  let controller: FipeApiController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FipeApiController],
      providers: [FipeApiService],
    }).compile();

    controller = module.get<FipeApiController>(FipeApiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
