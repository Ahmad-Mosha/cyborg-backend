import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserData } from '../entities/user-data.entity';
import { UserDataDto } from '../dto/user-data.dto';

@Injectable()
export class UserDataService {
  constructor(
    @InjectRepository(UserData)
    private readonly userHealthRepository: Repository<UserData>,
  ) {}

  async findOne(userId: string): Promise<UserData> {
    return this.userHealthRepository.findOne({
      where: { user: { id: userId } },
    });
  }

  async create(userId: string): Promise<UserData> {
    const userData = this.userHealthRepository.create({
      user: { id: userId },
    });
    return this.userHealthRepository.save(userData);
  }

  async update(
    userId: string,
    userDataDto: UserDataDto ,
  ): Promise<UserData> {
    let userData = await this.findOne(userId);
    if (!userData) {
      userData = await this.create(userId);
    }

    Object.assign(userData, userDataDto);
    return this.userHealthRepository.save(userData);
  }

  async remove(userId: string): Promise<void> {
    await this.userHealthRepository.delete({ user: { id: userId } });
  }
}
