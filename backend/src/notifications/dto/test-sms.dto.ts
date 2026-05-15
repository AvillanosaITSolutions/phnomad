import { IsDateString, IsString, Matches, MaxLength } from 'class-validator';

export class TestSmsDto {
  @Matches(/^[0-9+\-\s]{7,20}$/)
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
