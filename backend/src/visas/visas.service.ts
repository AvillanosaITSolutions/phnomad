import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Visa, VisaRenewalEventType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVisaDto } from './dto/create-visa.dto';
import { UpdateVisaDto } from './dto/update-visa.dto';
import { normalizePhToE164 } from '../common/phone.util';
import {
  getRecommendedReminderIntervals,
  normalizeVisaType,
} from './visa-rules';

@Injectable()
export class VisasService {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, dto: CreateVisaDto): Promise<Visa> {
    const visaType = normalizeVisaType(dto.visaType);
    const phoneNumber = normalizePhToE164(dto.phoneNumber);
    if (!phoneNumber) {
      throw new BadRequestException(
        'Invalid Philippine mobile number. Use 09XXXXXXXXX or +639XXXXXXXXX.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const visa = await tx.visa.create({
        data: {
          userId,
          nationality: dto.nationality,
          country: dto.country,
          visaType,
          entryDate: new Date(dto.entryDate),
          expiryDate: new Date(dto.expiryDate),
          phoneNumber,
          email: dto.email,
          smsEnabled: dto.smsEnabled,
          emailEnabled: dto.emailEnabled,
          reminderIntervals:
            dto.reminderIntervals ?? getRecommendedReminderIntervals(visaType),
        },
      });

      await tx.visaRenewalHistory.create({
        data: {
          userId,
          visaId: visa.id,
          eventType: VisaRenewalEventType.CREATED,
          previousExpiryDate: null,
          newExpiryDate: visa.expiryDate,
          note: 'Initial visa setup',
        },
      });

      return visa;
    });
  }

  findAll(userId: string): Promise<Visa[]> {
    return this.prisma.visa.findMany({
      where: { userId },
      orderBy: { expiryDate: 'asc' },
    });
  }

  async update(
    userId: string,
    visaId: string,
    dto: UpdateVisaDto,
  ): Promise<Visa> {
    const existingVisa = await this.ensureOwnership(userId, visaId);

    const visaType = dto.visaType ? normalizeVisaType(dto.visaType) : undefined;
    const nextReminderIntervals =
      dto.reminderIntervals ??
      (visaType ? getRecommendedReminderIntervals(visaType) : undefined);
    const normalizedPhoneNumber =
      typeof dto.phoneNumber === 'string'
        ? normalizePhToE164(dto.phoneNumber)
        : undefined;

    if (typeof dto.phoneNumber === 'string' && !normalizedPhoneNumber) {
      throw new BadRequestException(
        'Invalid Philippine mobile number. Use 09XXXXXXXXX or +639XXXXXXXXX.',
      );
    }

    const data: Prisma.VisaUpdateInput = {
      nationality: dto.nationality,
      country: dto.country,
      email: dto.email,
      smsEnabled: dto.smsEnabled,
      emailEnabled: dto.emailEnabled,
      reminderIntervals: nextReminderIntervals,
    };

    if (normalizedPhoneNumber) {
      data.phoneNumber = normalizedPhoneNumber;
    }

    if (visaType) {
      data.visaType = visaType;
    }

    if (dto.entryDate) data.entryDate = new Date(dto.entryDate);

    return this.prisma.$transaction(async (tx) => {
      const updatedVisa = await tx.visa.update({ where: { id: visaId }, data });

      if (dto.expiryDate) {
        const nextExpiryDate = new Date(dto.expiryDate);
        const expiryChanged =
          existingVisa.expiryDate.getTime() !== nextExpiryDate.getTime();

        if (expiryChanged) {
          await tx.visaRenewalHistory.create({
            data: {
              userId,
              visaId,
              eventType: VisaRenewalEventType.RENEWED,
              previousExpiryDate: existingVisa.expiryDate,
              newExpiryDate: nextExpiryDate,
              note: 'Visa expiry date updated',
            },
          });
        }
      }

      return updatedVisa;
    });
  }

  async remove(userId: string, visaId: string): Promise<{ success: true }> {
    await this.ensureOwnership(userId, visaId);
    await this.prisma.visa.delete({ where: { id: visaId } });
    return { success: true };
  }

  async getRenewalHistory(userId: string, visaId: string) {
    await this.ensureOwnership(userId, visaId);

    return this.prisma.visaRenewalHistory.findMany({
      where: {
        userId,
        visaId,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async ensureOwnership(userId: string, visaId: string): Promise<Visa> {
    const visa = await this.prisma.visa.findUnique({ where: { id: visaId } });
    if (!visa || visa.userId !== userId) {
      throw new NotFoundException('Visa record not found');
    }

    return visa;
  }
}
