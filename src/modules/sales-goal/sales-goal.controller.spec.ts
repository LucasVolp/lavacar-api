import { Test, TestingModule } from '@nestjs/testing';
import { SalesGoalController } from './sales-goal.controller';
import { SalesGoalService } from './sales-goal.service';

describe('SalesGoalController', () => {
  let controller: SalesGoalController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SalesGoalController],
      providers: [SalesGoalService],
    }).compile();

    controller = module.get<SalesGoalController>(SalesGoalController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
