import { Test, TestingModule } from '@nestjs/testing';
import { SalesGoalService } from './sales-goal.service';

describe('SalesGoalService', () => {
  let service: SalesGoalService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SalesGoalService],
    }).compile();

    service = module.get<SalesGoalService>(SalesGoalService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
