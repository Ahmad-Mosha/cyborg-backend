import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
  Put,
} from '@nestjs/common';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
import { ROLES } from '../../shared/constants/roles.constant';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getUserNotifications(
    @GetUser() user: User,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return await this.notificationsService.getUserNotifications(
      user,
      page,
      limit,
    );
  }

  @Get('unread')
  async getUnreadNotifications(@GetUser() user: User) {
    return await this.notificationsService.getUnreadNotifications(user);
  }

  @Put(':id/read')
  async markAsRead(@GetUser() user: User, @Param('id') id: string) {
    return await this.notificationsService.markAsRead(user, id);
  }

  @Put('mark-all-read')
  async markAllAsRead(@GetUser() user: User) {
    return await this.notificationsService.markAllAsRead(user);
  }

  @Delete(':id')
  async deleteNotification(@GetUser() user: User, @Param('id') id: string) {
    return await this.notificationsService.deleteNotification(user, id);
  }

  // @Put('preferences')
  // async updateNotificationPreferences(
  //   @GetUser() user: User,
  //   @Body() updatePreferencesDto: UpdateNotificationPreferencesDto,
  // ) {
  //   return await this.notificationsService.updateNotificationPreferences(
  //     user,
  //     updatePreferencesDto,
  //   );
  // }

  // Admin endpoints
  @Post('announcements')
  @UseGuards(RolesGuard)
  @Roles(ROLES.ADMIN)
  async createGlobalAnnouncement(
    @GetUser() user: User,
    @Body() createNotificationDto: CreateNotificationDto,
  ) {
    return await this.notificationsService.createGlobalAnnouncement(
      user,
      createNotificationDto,
    );
  }
}
