import { Test, TestingModule } from '@nestjs/testing';
import { ShopManagerService } from './shop-manager.service';

describe('ShopManagerService', () => {
  let service: ShopManagerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ShopManagerService],
    }).compile();

    service = module.get<ShopManagerService>(ShopManagerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
