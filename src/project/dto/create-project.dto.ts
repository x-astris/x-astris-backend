import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(2000)
  @Max(2100)
  startYear: number;

  @IsInt()
  @Min(3)
  @Max(15)
  @IsOptional()
  forecastYears?: number;
}