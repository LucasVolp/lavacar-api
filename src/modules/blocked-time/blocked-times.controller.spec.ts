import { Test, TestingModule } from '@nestjs/testing';
import { BlockedTimesController } from './blocked-times.controller';
import { BlockedTimesService } from './blocked-times.service';

describe('BlockedTimesController', () => {
  let controller: BlockedTimesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BlockedTimesController],
      providers: [BlockedTimesService],
    }).compile();

    controller = module.get<BlockedTimesController>(BlockedTimesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
