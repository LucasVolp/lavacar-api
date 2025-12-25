import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationMemberService } from '../organization-member.service';

describe('OrganizationMemberService', () => {
  let service: OrganizationMemberService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrganizationMemberService],
    }).compile();

    service = module.get<OrganizationMemberService>(OrganizationMemberService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
