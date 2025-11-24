import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  getUserById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }
}
