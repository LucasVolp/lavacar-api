import { Test, TestingModule } from '@nestjs/testing';
import { ShopClientController } from '../shop-client.controller';
import { ShopClientService } from '../shop-client.service';

describe('ShopClientController', () => {
  let controller: ShopClientController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShopClientController],
      providers: [ShopClientService],
    }).compile();

    controller = module.get<ShopClientController>(ShopClientController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
