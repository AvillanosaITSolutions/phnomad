import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { ScheduledTask, Visa } from '@prisma/client';

@Injectable()
export class SchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerService.name);
  private readonly reminderJobName = 'visa-reminder-sweep';
  private readonly temporaryReminderJobName = 'visa-reminder-sweep-temporary';

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureDefaultTask();
    await this.registerTasks();
  }

  private async ensureDefaultTask(): Promise<void> {
    await this.prisma.scheduledTask.upsert({
      where: { name: this.reminderJobName },
      create: {
        name: this.reminderJobName,
        handler: 'dailyVisaReminderSweep',
        cronExpression: '0 1 * * *',
        timezone: 'UTC',
        enabled: true,
      },
      update: {
        handler: 'dailyVisaReminderSweep',
        cronExpression: '0 1 * * *',
        timezone: 'UTC',
        enabled: true,
      },
    });

    await this.prisma.scheduledTask.upsert({
      where: { name: this.temporaryReminderJobName },
      create: {
        name: this.temporaryReminderJobName,
        handler: 'temporaryVisaReminderSweep',
        cronExpression: '* * * * *',
        timezone: 'UTC',
        enabled: true,
      },
      update: {
        handler: 'temporaryVisaReminderSweep',
        cronExpression: '* * * * *',
        timezone: 'UTC',
        enabled: true,
      },
    });
  }

  private async registerTasks(): Promise<void> {
    const tasks = await this.prisma.scheduledTask.findMany({
      where: { enabled: true },
    });

    for (const task of tasks) {
      const existing = this.schedulerRegistry.doesExist('cron', task.name);
      if (existing) {
        this.schedulerRegistry.deleteCronJob(task.name);
      }

      if (
        task.handler === 'dailyVisaReminderSweep' ||
        task.handler === 'temporaryVisaReminderSweep'
      ) {
        const cronJob = CronJob.from({
          cronTime: task.cronExpression,
          timeZone: task.timezone,
          start: false,
          onTick: async () => {
            await this.processReminderSweep(task);
          },
        });

        this.schedulerRegistry.addCronJob(task.name, cronJob);
        cronJob.start();
      }
    }
  }

  private async processReminderSweep(task: ScheduledTask): Promise<void> {
    const visas = await this.prisma.visa.findMany();
    const now = new Date();

    await Promise.all(
      visas.map(async (visa: Visa) => {
        const msPerDay = 1000 * 60 * 60 * 24;
        const daysLeft = Math.ceil(
          (visa.expiryDate.getTime() - now.getTime()) / msPerDay,
        );

        const shouldSend =
          visa.reminderIntervals.includes(daysLeft) || daysLeft === 0;
        if (!shouldSend) {
          return;
        }

        await this.notificationsService.sendReminder(visa, daysLeft);
      }),
    );

    await this.prisma.scheduledTask.update({
      where: { id: task.id },
      data: { lastRunAt: new Date() },
    });

    this.logger.log(`Reminder job completed: ${task.name}`);
  }
}
