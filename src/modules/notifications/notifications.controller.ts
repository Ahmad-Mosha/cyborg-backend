import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  Put,
} from '@nestjs/common';
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
    @Request() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return await this.notificationsService.getUserNotifications(
      req.user,
      page,
      limit,
    );
  }

  @Get('unread')
  async getUnreadNotifications(@Request() req) {
    return await this.notificationsService.getUnreadNotifications(req.user);
  }

  @Put(':id/read')
  async markAsRead(@Request() req, @Param('id') id: string) {
    return await this.notificationsService.markAsRead(req.user, id);
  }

  @Put('mark-all-read')
  async markAllAsRead(@Request() req) {
    return await this.notificationsService.markAllAsRead(req.user);
  }

  @Delete(':id')
  async deleteNotification(@Request() req, @Param('id') id: string) {
    return await this.notificationsService.deleteNotification(req.user, id);
  }

  @Put('preferences')
  async updateNotificationPreferences(
    @Request() req,
    @Body() updatePreferencesDto: UpdateNotificationPreferencesDto,
  ) {
    return await this.notificationsService.updateNotificationPreferences(
      req.user,
      updatePreferencesDto,
    );
  }

  // Admin endpoints
  @Post('announcements')
  @UseGuards(RolesGuard)
  @Roles(ROLES.ADMIN)
  async createGlobalAnnouncement(
    @Request() req,
    @Body() createNotificationDto: CreateNotificationDto,
  ) {
    return await this.notificationsService.createGlobalAnnouncement(
      req.user,
      createNotificationDto,
    );
  }
}
