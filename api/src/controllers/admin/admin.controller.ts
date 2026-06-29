import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { AdminGuard } from '../../guards/admin.guard';
import { UsersService } from '../../services/user/users.service';
import { TelegramService } from '../../services/telegram/telegram.service';
import { UpdateStatusDto } from '../../dto/admin/update-status.dto';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private usersService: UsersService,
    private telegramService: TelegramService,
  ) {}

  @Get('users')
  async getAllUsers() {
    return this.usersService.findAll();
  }

  @Put('users/:id/status')
  async updateUserStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
  ) {
    const { status } = updateStatusDto;
    const updatedUser = await this.usersService.updateStatus(id, status);

    // If user has linked Telegram, notify them of the decision
    if (updatedUser.telegramChatId) {
      if (status === 'approved') {
        await this.telegramService.notifyApproval(
          updatedUser.telegramChatId,
          updatedUser.name,
          updatedUser.location,
        );
      } else if (status === 'rejected') {
        await this.telegramService.notifyRejection(
          updatedUser.telegramChatId,
          updatedUser.name,
        );
      }
    }

    return updatedUser;
  }

  @Get('stats')
  async getStats() {
    const users = await this.usersService.findAll();
    const totalUsers = users.length;
    const pendingUsers = users.filter(u => u.status === 'pending').length;
    const approvedUsers = users.filter(u => u.status === 'approved').length;
    const telegramLinkedUsers = users.filter(u => !!u.telegramChatId).length;

    return {
      totalUsers,
      pendingUsers,
      approvedUsers,
      telegramLinkedUsers,
    };
  }
}
