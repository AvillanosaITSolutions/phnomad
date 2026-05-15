import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateVisaDto {
  @IsString()
  @MaxLength(100)
  nationality!: string;

  @IsString()
  @MaxLength(100)
  country!: string;

  @IsString()
  @MaxLength(100)
  visaType!: string;

  @IsDateString()
  entryDate!: string;

  @IsDateString()
  expiryDate!: string;

  @IsString()
  @Matches(/^[0-9+\-\s]{7,20}$/)
  phoneNumber!: string;

  @IsEmail()
  email!: string;

  @IsBoolean()
  smsEnabled!: boolean;

  @IsBoolean()
  emailEnabled!: boolean;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  reminderIntervals?: number[];
}
