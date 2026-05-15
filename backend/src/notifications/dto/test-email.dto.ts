import { IsDateString, IsEmail, IsString, MaxLength } from 'class-validator';

export class TestEmailDto {
  @IsEmail()
  to!: string;

  @IsString()
  @MaxLength(100)
  country!: string;

  @IsDateString()
  expiryDate!: string;

  @IsString()
  @MaxLength(100)
  visaType!: string;
}
