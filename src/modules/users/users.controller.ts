import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Public } from 'src/shared/decorators/public.decorator';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { JwtPayload } from 'src/shared/types/jwt-payload.interface';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Post()
  create(@Body() data: CreateUserDto) {
    return this.usersService.create(data);
  }

  @Get()
  findAll(
    // @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    // if (user.role !== 'ADMIN') {
    //   throw new ForbiddenException('Only ADMIN can list all users');
    // }
    return this.usersService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      perPage: perPage ? parseInt(perPage, 10) : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string, 
  // @CurrentUser() user: JwtPayload
) {
    // if (user.id !== id && user.role !== 'ADMIN') {
    //   throw new ForbiddenException('You can only view your own profile');
    // }
    return this.usersService.findOne(id);
  }

  @Get('email/:email')
  FindOneByEmail(@Param('email') email: string) {
    return this.usersService.FindByEmail(email);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: UpdateUserDto, 
  // @CurrentUser() user: JwtPayload
) {
    // if (user.id !== id && user.role !== 'ADMIN') {
    //   throw new ForbiddenException('You can only update your own profile');
    // }
    return this.usersService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Only ADMIN can delete users');
    }
    return this.usersService.remove(id);
  }
}
