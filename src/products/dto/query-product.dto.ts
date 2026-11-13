import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryProductDto {
  @ApiProperty({ required: false, example: 'tops', enum: ['tops', 'bottoms', 'full', 'shoes', 'acc'] })
  @IsOptional()
  @IsEnum(['tops', 'bottoms', 'full', 'shoes', 'acc'])
  category?: string;

  @ApiProperty({ required: false, example: 0, description: 'Filter by look ID' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  lookId?: number;

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({ required: false, example: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 20;
}
