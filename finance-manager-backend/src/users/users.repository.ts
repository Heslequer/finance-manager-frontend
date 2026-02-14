import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersRepository {
    constructor(private readonly prisma: PrismaService) {}

    findByEmail(email: string) {
        return this.prisma.users.findUnique({
          where: { email: email },
        });
    }

    findByAuthId(authId: string) {
        return this.prisma.users.findUnique({
          where: { auth_id: authId },
          select: { id: true },
        });
    }

    create(createUserDto: CreateUserDto, authId: string) {
        return this.prisma.users.create({
          data: { ...createUserDto, auth_id: authId },
        });
    }   

    findOne(id: string) {
        return this.prisma.users.findUnique({
          where: { id: id },
        });
    }

    findAll() {
        return this.prisma.users.findMany();
    }

    update(id: string, updateUserDto: UpdateUserDto) {
        return this.prisma.users.update({
          where: { id: id },
          data: updateUserDto,
        });
    }

    remove(id: string) {
        return this.prisma.users.delete({
          where: { id: id },
        });
    }
}