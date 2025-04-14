import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserUseCase, DeleteUserUseCase, FindAllUserUseCase, FindUserByEmailUseCase, FindUserUseCase } from './use-cases';
import { UpdateUserUseCase } from './use-cases/update-user.use-case';

@Injectable()
export class UsersService {
  constructor(
    private readonly CreateUserUseCase: CreateUserUseCase,
    private readonly FindAllUserUseCase: FindAllUserUseCase,
    private readonly FindUserUseCase: FindUserUseCase,
    private readonly UpdateUserUseCase: UpdateUserUseCase,
    private readonly DeleteUserUsecase: DeleteUserUseCase,
    private readonly FindUserByEmailUseCase: FindUserByEmailUseCase
  ){}

  async create(data: CreateUserDto) {
    return this.CreateUserUseCase.execute(data);
  }

  async findAll() {
    return this.FindAllUserUseCase.execute();
  }

  async findOne(id: string) {
    return await this.FindUserUseCase.execute(id);
  }

  async FindByEmail(email: string) {
    return await this.FindUserByEmailUseCase.execute(email);
  }

  async update(id: string, data: UpdateUserDto) {
    return await this.UpdateUserUseCase.execute(id, data);
  }

  async remove(id: string) {
    return await this.DeleteUserUsecase.execute(id)
  }
}
