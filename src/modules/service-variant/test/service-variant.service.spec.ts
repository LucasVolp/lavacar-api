import { Test, TestingModule } from '@nestjs/testing';
import { ServiceVariantService } from '../service-variant.service';

describe('ServiceVariantService', () => {
  let service: ServiceVariantService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServiceVariantService],
    }).compile();

    service = module.get<ServiceVariantService>(ServiceVariantService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
