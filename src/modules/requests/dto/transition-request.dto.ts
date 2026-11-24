import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { RequestStatus } from '../requests.types.js';

export class TransitionRequestDto {
  @ApiProperty({
    enum: [
      'NEW',
      'TRIAGED',
      'IN_REVIEW',
      'WAITING_CUSTOMER',
      'QUOTATION_SENT',
      'CONVERTED',
      'CLOSED_WON',
      'CLOSED_LOST',
      'SPAM',
    ],
  })
  toStatus!: RequestStatus;

  @ApiProperty({ example: 'Đã hoàn tất phân loại và điều phối kỹ sư khảo sát' })
  reason!: string;

  @ApiPropertyOptional({ example: 'admin-lead' })
  actor?: string;
}

export class AddInternalNoteDto {
  @ApiProperty({ example: 'Khách hàng yêu cầu hỗ trợ thêm cổng thanh toán VNPay và bảo mật 2 lớp.' })
  body!: string;

  @ApiPropertyOptional({ example: 'staff-user-id' })
  authorId?: string;

  @ApiPropertyOptional({ example: 'Nguyễn Kỹ Sư' })
  authorName?: string;
}

export class AssignStaffDto {
  @ApiProperty({ example: 'staff-01' })
  staffUserId!: string;

  @ApiProperty({ example: 'Trần Tư Vấn Viên' })
  staffName!: string;

  @ApiPropertyOptional({ example: 'admin' })
  actor?: string;
}
