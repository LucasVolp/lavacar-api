import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationMemberController } from '../organization-member.controller';
import { OrganizationMemberService } from '../organization-member.service';

describe('OrganizationMemberController', () => {
  let controller: OrganizationMemberController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationMemberController],
      providers: [OrganizationMemberService],
    }).compile();

    controller = module.get<OrganizationMemberController>(OrganizationMemberController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
