import { Controller, Body, Put, UseGuards, Request, Get } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { GetUser } from '@modules/auth/decorators/get-user.decorator';
import { User } from './entities/user.entity';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('all')
  @ApiOperation({ summary: 'Get all users' })
  async findAll() {
    return await this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  @ApiOperation({ summary: 'Update user profile, all fields are optional' })
  async updateProfile(
    @GetUser() user: User,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.update(user, updateProfileDto);
  }
}
