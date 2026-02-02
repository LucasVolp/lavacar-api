import { Test, TestingModule } from '@nestjs/testing';
import { ShopClientService } from './shop-client.service';

describe('ShopClientService', () => {
  let service: ShopClientService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ShopClientService],
    }).compile();

    service = module.get<ShopClientService>(ShopClientService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
