import { Test, TestingModule } from '@nestjs/testing';
import { ShopManagerController } from '../shop-manager.controller';
import { ShopManagerService } from '../shop-manager.service';

describe('ShopManagerController', () => {
  let controller: ShopManagerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShopManagerController],
      providers: [ShopManagerService],
    }).compile();

    controller = module.get<ShopManagerController>(ShopManagerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
