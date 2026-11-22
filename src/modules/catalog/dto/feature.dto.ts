import { ApiProperty } from '@nestjs/swagger';

export class FeatureDefinitionDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'booking_engine' })
  key: string;

  @ApiProperty({ example: 'Đặt bàn / Đặt lịch trực tuyến' })
  label: string;

  @ApiProperty({ enum: ['BOOLEAN', 'TEXT', 'NUMBER'] })
  dataType: string;

  @ApiProperty({ example: 'Tính năng cốt lõi' })
  groupName: string;

  @ApiProperty()
  isFilterable: boolean;
}

export class ListingFeatureValueDto {
  @ApiProperty({ example: 'booking_engine' })
  key: string;

  @ApiProperty({ example: 'Đặt bàn trực tuyến' })
  label: string;

  @ApiProperty({ example: true })
  value: string | boolean | number;
}
