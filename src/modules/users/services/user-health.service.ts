import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserHealth } from '../entities/user-health.entity';
import { UpdateUserHealthDto } from '../dto/update-user-health.dto';

@Injectable()
export class UserHealthService {
  constructor(
    @InjectRepository(UserHealth)
    private readonly userHealthRepository: Repository<UserHealth>,
  ) {}

  async findOne(userId: string): Promise<UserHealth> {
    return this.userHealthRepository.findOne({
      where: { user: { id: userId } },
    });
  }

  async create(userId: string): Promise<UserHealth> {
    const userHealth = this.userHealthRepository.create({
      user: { id: userId },
    });
    return this.userHealthRepository.save(userHealth);
  }

  async update(
    userId: string,
    updateUserHealthDto: UpdateUserHealthDto,
  ): Promise<UserHealth> {
    let userHealth = await this.findOne(userId);
    if (!userHealth) {
      userHealth = await this.create(userId);
    }

    Object.assign(userHealth, updateUserHealthDto);
    return this.userHealthRepository.save(userHealth);
  }

  async calculateBMI(height: number, weight: number): Promise<number> {
    // Height in meters (convert from cm)
    const heightInMeters = height / 100;
    // BMI formula: weight (kg) / (height (m))²
    return weight / (heightInMeters * heightInMeters);
  }

  async calculateBMR(
    weight: number,
    height: number,
    age: number,
    gender: string,
  ): Promise<number> {
    // Using Mifflin-St Jeor Equation
    const bmr =
      10 * weight + 6.25 * height - 5 * age + (gender === 'male' ? 5 : -161);
    return Math.round(bmr);
  }
}
