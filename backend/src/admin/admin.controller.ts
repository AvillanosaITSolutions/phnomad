import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { AdminService } from './admin.service';
import { GrantCreditsDto } from './dto/grant-credits.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/decorators/current-user.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adminService: AdminService,
  ) {}

  @Get('scheduled-tasks')
  listScheduledTasks() {
    return this.prisma.scheduledTask.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  @Get('users')
  listUsers() {
    return this.adminService.listUsers();
  }

  @Post('users/:userId/grant-credits')
  grantCredits(
    @Param('userId') userId: string,
    @Body() dto: GrantCreditsDto,
    @CurrentUser() admin: AuthUser,
  ) {
    return this.adminService.grantCredits(userId, dto.credits, {
      id: admin.sub,
      email: admin.email,
    });
  }
}
