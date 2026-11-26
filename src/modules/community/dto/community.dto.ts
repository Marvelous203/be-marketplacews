import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUrl, Min } from 'class-validator';
import type { ReactionType, ThreadType } from '../community.types.js';

export class ReactThreadDto {
  @ApiProperty({ enum: ['HELPFUL', 'TRIED', 'NEED_DEMO'] })
  @IsEnum(['HELPFUL', 'TRIED', 'NEED_DEMO'])
  reactionType!: ReactionType;
}

export class CreateThreadDto {
  @ApiProperty({ enum: ['DISCUSSION', 'QUESTION', 'SHOWCASE', 'WANTED'] })
  @IsEnum(['DISCUSSION', 'QUESTION', 'SHOWCASE', 'WANTED'])
  threadType!: Exclude<ThreadType, 'ANNOUNCEMENT'>;

  @ApiProperty({ example: 'Cần làm website Tiệm Gốm Truyền Thống kèm đặt lịch workshop' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'Tìm đối tác thiết kế web giao diện mộc, ngân sách 12-20 triệu.' })
  @IsString()
  @IsNotEmpty()
  bodyMd!: string;

  @ApiPropertyOptional({ example: '12.000.000 - 20.000.000 ₫' })
  @IsOptional()
  @IsString()
  budgetRange?: string;

  @ApiPropertyOptional({ example: 'restaurant-pro' })
  @IsOptional()
  @IsString()
  relatedListingSlug?: string;
}

export class CreateProposalDto {
  @ApiProperty({ example: 18500000 })
  @IsInt()
  @Min(100000)
  priceMinor!: number;

  @ApiProperty({ example: 14 })
  @IsInt()
  @Min(1)
  estimatedDays!: number;

  @ApiProperty({ example: 'Đội ngũ đã triển khai 5+ web thương mại điện tử đồng hồ, cam kết đạt 95+ PageSpeed và bàn giao source sạch.' })
  @IsString()
  @IsNotEmpty()
  pitchSummary!: string;

  @ApiPropertyOptional({ example: 'https://demo.phonghe.vn/watch-luxury' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  demoUrl?: string;
}

export class CreateReplyDto {
  @ApiProperty({ example: 'Mình đã áp dụng preload font cục bộ và giảm LCP xuống 1.1s.' })
  @IsString()
  @IsNotEmpty()
  body!: string;
}
