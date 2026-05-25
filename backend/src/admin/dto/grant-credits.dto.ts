import { IsInt, Max, Min } from 'class-validator';

export class GrantCreditsDto {
  @IsInt()
  @Min(1)
  @Max(10000)
  credits!: number;
}
