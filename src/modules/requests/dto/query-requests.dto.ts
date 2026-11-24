import { ApiPropertyOptional } from '@nestjs/swagger';
import type { RequestPriority, RequestStatus } from '../requests.types.js';

export class QueryRequestsDto {
  @ApiPropertyOptional({ example: 'WMR-2026' })
  search?: string;

  @ApiPropertyOptional({
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
  status?: RequestStatus;

  @ApiPropertyOptional({ enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'] })
  priority?: RequestPriority;

  @ApiPropertyOptional({ example: 'staff-user-id' })
  assignedToUserId?: string;

  @ApiPropertyOptional({ default: 1 })
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  limit?: number;
}
