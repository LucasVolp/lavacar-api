import { Test, TestingModule } from '@nestjs/testing';
import { ServiceVariantController } from '../service-variant.controller';
import { ServiceVariantService } from '../service-variant.service';

describe('ServiceVariantController', () => {
  let controller: ServiceVariantController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServiceVariantController],
      providers: [ServiceVariantService],
    }).compile();

    controller = module.get<ServiceVariantController>(ServiceVariantController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
