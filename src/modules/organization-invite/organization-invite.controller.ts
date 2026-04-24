import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { Role } from 'src/modules/users/types/Role';
import { Roles } from 'src/decorators/roles.decorator';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { Public } from 'src/shared/decorators/public.decorator';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { SendInviteDto } from './dto/send-invite.dto';
import { AcceptInviteUseCase } from './use-cases/accept-invite.use-case';
import { SendInviteUseCase } from './use-cases/send-invite.use-case';
import { ListInvitesUseCase } from './use-cases/list-invites.use-case';
import { RevokeInviteUseCase } from './use-cases/revoke-invite.use-case';
import { GetInviteDetailsUseCase } from './use-cases/get-invite-details.use-case';

@Controller('organization-invites')
export class OrganizationInviteController {
  constructor(
    private readonly sendInviteUseCase: SendInviteUseCase,
    private readonly acceptInviteUseCase: AcceptInviteUseCase,
    private readonly listInvitesUseCase: ListInvitesUseCase,
    private readonly revokeInviteUseCase: RevokeInviteUseCase,
    private readonly getInviteDetailsUseCase: GetInviteDetailsUseCase,
  ) {}

  @Roles(Role.OWNER, Role.MANAGER)
  @Post('send')
  @HttpCode(HttpStatus.CREATED)
  async send(@CurrentUser() currentUser: JwtPayload, @Body() dto: SendInviteDto) {
    return this.sendInviteUseCase.execute(currentUser.id, dto);
  }

  @Public()
  @Post('accept')
  @HttpCode(HttpStatus.OK)
  async accept(@Body() dto: AcceptInviteDto) {
    return this.acceptInviteUseCase.execute(dto);
  }

  @Public()
  @Get('details')
  async getDetails(@Query() dto: AcceptInviteDto) {
    return this.getInviteDetailsUseCase.execute(dto);
  }

  @Roles(Role.OWNER, Role.MANAGER)
  @Get(':organizationId')
  async listInvites(
    @CurrentUser() currentUser: JwtPayload,
    @Param('organizationId') organizationId: string,
  ) {
    return this.listInvitesUseCase.execute(currentUser.id, organizationId);
  }

  @Roles(Role.OWNER, Role.MANAGER)
  @Post(':organizationId/revoke/:inviteId')
  @HttpCode(HttpStatus.OK)
  async revokeInvite(
    @CurrentUser() currentUser: JwtPayload,
    @Param('organizationId') organizationId: string,
    @Param('inviteId') inviteId: string,
  ) {
    return this.revokeInviteUseCase.execute(currentUser.id, organizationId, inviteId);
  }
}
