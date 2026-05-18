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

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureDefaultTask();
    await this.registerTasks();
  }

  private toDate(value: unknown): Date | null {
    if (!value) {
      return null;
    }

    if (value instanceof Date) {
      return value;
    }

    if (typeof value === 'object' && value !== null) {
      const candidate = value as { toJSDate?: () => Date; toDate?: () => Date };
      if (typeof candidate.toJSDate === 'function') {
        return candidate.toJSDate();
      }
      if (typeof candidate.toDate === 'function') {
        return candidate.toDate();
      }
    }

    return null;
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

    // Remove any leftover temporary per-minute reminder task from the DB
    await this.prisma.scheduledTask.deleteMany({
      where: { name: 'visa-reminder-sweep-temporary' },
    });
  }

  private async registerTasks(): Promise<void> {
    const tasks = await this.prisma.scheduledTask.findMany({
      where: { enabled: true },
    });

    if (tasks.length === 0) {
      this.logger.warn('No enabled scheduled tasks found.');
      return;
    }

    for (const task of tasks) {
      const existing = this.schedulerRegistry.doesExist('cron', task.name);
      if (existing) {
        this.schedulerRegistry.deleteCronJob(task.name);
      }

      if (task.handler === 'dailyVisaReminderSweep') {
        const cronJob = CronJob.from({
          cronTime: task.cronExpression,
          timeZone: task.timezone,
          start: false,
          onTick: async () => {
            await this.executeTask(task.name);
          },
        });

        this.schedulerRegistry.addCronJob(task.name, cronJob);
        cronJob.start();

        const nextRunAt = this.toDate(cronJob.nextDate());
        await this.prisma.scheduledTask.update({
          where: { id: task.id },
          data: { nextRunAt },
        });

        this.logger.log(
          `Registered cron task ${task.name} (${task.cronExpression} ${task.timezone})` +
            `${nextRunAt ? ` next run: ${nextRunAt.toISOString()}` : ''}`,
        );
      }
    }
  }

  private async executeTask(taskName: string): Promise<void> {
    const task = await this.prisma.scheduledTask.findUnique({
      where: { name: taskName },
    });

    if (!task || !task.enabled) {
      this.logger.warn(
        `Skipping task ${taskName} because it is missing or disabled.`,
      );
      return;
    }

    try {
      if (task.handler === 'dailyVisaReminderSweep') {
        await this.processReminderSweep(task);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Task ${task.name} failed: ${message}`);
    } finally {
      const cronJob = this.schedulerRegistry.getCronJob(task.name);
      const nextRunAt = this.toDate(cronJob.nextDate());

      await this.prisma.scheduledTask.update({
        where: { id: task.id },
        data: {
          lastRunAt: new Date(),
          nextRunAt,
        },
      });
    }
  }

  private async processReminderSweep(task: ScheduledTask): Promise<void> {
    const visas = await this.prisma.visa.findMany();
    const now = new Date();

    const results = await Promise.allSettled(
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

    const failedCount = results.filter(
      (result) => result.status === 'rejected',
    ).length;
    if (failedCount > 0) {
      this.logger.warn(
        `Reminder job ${task.name} completed with ${failedCount} failed visa reminders.`,
      );
    }

    this.logger.log(`Reminder job completed: ${task.name}`);
  }
}
