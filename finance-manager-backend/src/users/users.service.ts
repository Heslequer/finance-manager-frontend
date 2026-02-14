import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async create(createUserDto: CreateUserDto, authId: string) {
    const existingUser = await this.usersRepository.findByEmail(createUserDto.email)
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }
    return await this.usersRepository.create(createUserDto, authId);
  }

  async findPublicIdByAuthId(authId: string) {
    const user = await this.usersRepository.findByAuthId(authId);
    return user?.id ?? null;
  }

  findAll() {
    return this.usersRepository.findAll();
  }

  findOne(id: string) {
    
    return this.usersRepository.findOne(id);
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    return this.usersRepository.update(id, updateUserDto);
  }

  remove(id: string) {
    return this.usersRepository.remove(id);
  }
}
