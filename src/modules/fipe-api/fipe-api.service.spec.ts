import { Test, TestingModule } from '@nestjs/testing';
import { FipeApiService } from './fipe-api.service';

describe('FipeApiService', () => {
  let service: FipeApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FipeApiService],
    }).compile();

    service = module.get<FipeApiService>(FipeApiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
