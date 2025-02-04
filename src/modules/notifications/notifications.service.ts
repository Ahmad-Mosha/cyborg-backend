// import {
//   Injectable,
//   NotFoundException,
//   ForbiddenException,
// } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository, LessThanOrEqual } from 'typeorm';
// import { Notification, NotificationType } from './entities/notification.entity';
// import { CreateNotificationDto } from './dto/create-notification.dto';
// import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
// import { User } from '../users/entities/user.entity';
// import { UsersService } from '../users/users.service';
// import { addDays, format } from 'date-fns';

// @Injectable()
// export class NotificationsService {
//   constructor(
//     @InjectRepository(Notification)
//     private notificationRepository: Repository<Notification>,
//     private usersService: UsersService,
//   ) {}

//   async createNotification(
//     user: User,
//     createNotificationDto: CreateNotificationDto,
//   ): Promise<Notification> {
//     const notification = this.notificationRepository.create({
//       ...createNotificationDto,
//       user,
//     });
//     return await this.notificationRepository.save(notification);
//   }

//   async createGlobalAnnouncement(
//     admin: User,
//     createNotificationDto: CreateNotificationDto,
//   ): Promise<void> {
//     if (!admin.isAdmin()) {
//       throw new ForbiddenException(
//         'Only admins can create global announcements',
//       );
//     }

//     const users = await this.usersService.findAll();
//     const notifications = users.map((user) =>
//       this.notificationRepository.create({
//         ...createNotificationDto,
//         type: NotificationType.ADMIN_ANNOUNCEMENT,
//         user,
//       }),
//     );
//     await this.notificationRepository.save(notifications);
//   }

//   async getUserNotifications(
//     user: User,
//     page: number = 1,
//     limit: number = 20,
//   ): Promise<[Notification[], number]> {
//     return await this.notificationRepository.findAndCount({
//       where: { user: { id: user.id } },
//       order: { createdAt: 'DESC' },
//       skip: (page - 1) * limit,
//       take: limit,
//     });
//   }

//   async getUnreadNotifications(user: User): Promise<Notification[]> {
//     return await this.notificationRepository.find({
//       where: { user: { id: user.id }, isRead: false },
//       order: { createdAt: 'DESC' },
//     });
//   }

//   async markAsRead(user: User, notificationId: string): Promise<Notification> {
//     const notification = await this.notificationRepository.findOne({
//       where: { id: notificationId, user: { id: user.id } },
//     });

//     if (!notification) {
//       throw new NotFoundException('Notification not found');
//     }

//     notification.isRead = true;
//     notification.readAt = new Date();
//     return await this.notificationRepository.save(notification);
//   }

//   async markAllAsRead(user: User): Promise<void> {
//     await this.notificationRepository.update(
//       { user: { id: user.id }, isRead: false },
//       { isRead: true, readAt: new Date() },
//     );
//   }

//   async deleteNotification(user: User, notificationId: string): Promise<void> {
//     const notification = await this.notificationRepository.findOne({
//       where: { id: notificationId, user: { id: user.id } },
//     });

//     if (!notification) {
//       throw new NotFoundException('Notification not found');
//     }

//     await this.notificationRepository.remove(notification);
//   }

//   // async updateNotificationPreferences(
//   //   user: User,
//   //   updatePreferencesDto: UpdateNotificationPreferencesDto,
//   // ): Promise<User> {
//   //   return await this.usersService.update(user.id, updatePreferencesDto);
//   // }

//   // Scheduled notification methods
//   async createWorkoutReminder(user: User, workoutDate: Date): Promise<void> {
//     if (!user.workoutReminders) return;

//     const reminder = this.notificationRepository.create({
//       title: 'Workout Reminder',
//       message: "Don't forget your scheduled workout today!",
//       type: NotificationType.WORKOUT_REMINDER,
//       user,
//       scheduledFor: workoutDate,
//     });

//     await this.notificationRepository.save(reminder);
//   }

//   async createMealReminder(user: User): Promise<void> {
//     if (!user.mealReminders) return;

//     const now = new Date();
//     const currentTime = format(now, 'HH:mm');
//     const preferredTime = user.preferredNotificationTime || '12:00';

//     if (currentTime === preferredTime) {
//       const reminder = this.notificationRepository.create({
//         title: 'Meal Logging Reminder',
//         message: "Don't forget to log your meals for today!",
//         type: NotificationType.MEAL_REMINDER,
//         user,
//       });

//       await this.notificationRepository.save(reminder);
//     }
//   }

//   async processScheduledNotifications(): Promise<void> {
//     const now = new Date();
//     const scheduledNotifications = await this.notificationRepository.find({
//       where: {
//         scheduledFor: LessThanOrEqual(now),
//         isRead: false,
//       },
//       relations: ['user'],
//     });

//     for (const notification of scheduledNotifications) {
//       notification.isRead = true;
//       await this.notificationRepository.save(notification);
//     }
//   }

//   async cleanupOldNotifications(daysToKeep: number = 30): Promise<void> {
//     const cutoffDate = addDays(new Date(), -daysToKeep);
//     await this.notificationRepository.delete({
//       createdAt: LessThanOrEqual(cutoffDate),
//     });
//   }
// }
