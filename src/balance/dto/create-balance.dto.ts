import { IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateBalanceDto {
  @IsString()
  projectId: string;

  @IsInt()
  year: number;

  @IsOptional() @IsNumber() fixedAssets?: number;
  @IsOptional() @IsNumber() investments?: number;
  @IsOptional() @IsNumber() inventory?: number;
  @IsOptional() @IsNumber() receivables?: number;
  @IsOptional() @IsNumber() otherShortTermAssets?: number;
  @IsOptional() @IsNumber() cash?: number;

  @IsOptional() @IsNumber() equity?: number;
  @IsOptional() @IsNumber() equityContribution?: number;
  @IsOptional() @IsNumber() dividend?: number;

  @IsOptional() @IsNumber() longDebt?: number;
  @IsOptional() @IsNumber() shortDebt?: number;
  @IsOptional() @IsNumber() payables?: number;
  @IsOptional() @IsNumber() otherShortTermLiabilities?: number;

  @IsOptional() @IsNumber() @Min(0) @Max(100) depreciationPct?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(100) interestRatePct?: number;

  @IsOptional() @IsNumber() ratioDio?: number;
  @IsOptional() @IsNumber() ratioDso?: number;
  @IsOptional() @IsNumber() ratioDpo?: number;
  @IsOptional() @IsNumber() ratioOcaPct?: number;
  @IsOptional() @IsNumber() ratioOclPct?: number;
}
