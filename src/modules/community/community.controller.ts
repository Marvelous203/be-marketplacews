import {
  Body,
  Controller,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { Roles } from '../auth/guards/roles.decorator.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { CreateProposalDto, CreateReplyDto, CreateThreadDto } from './dto/community.dto.js';
import { CommunityService } from './community.service.js';

interface AuthenticatedRequest {
  user: {
    userId: string;
    email: string;
    name?: string;
    role: string;
  };
}

@ApiTags('Community Forum & Request Board (R4B/C)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('v1/community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Post('threads')
  @Roles('super_admin', 'admin_owner', 'tenant', 'dev_freelance')
  @ApiOperation({ summary: 'Đăng bài viết mới hoặc phiếu Cần giải pháp lên diễn đàn' })
  createThread(@Body() dto: CreateThreadDto, @Request() req: AuthenticatedRequest) {
    return this.communityService.createThread(dto, {
      id: req.user.userId,
      name: req.user.name || req.user.email,
      role: req.user.role,
    });
  }

  @Post('threads/:id/replies')
  @Roles('super_admin', 'admin_owner', 'tenant', 'dev_freelance')
  @ApiOperation({ summary: 'Gửi bình luận / câu trả lời vào bài viết' })
  addReply(
    @Param('id') id: string,
    @Body() dto: CreateReplyDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.communityService.addReply(id, dto.body, {
      name: req.user.name || req.user.email,
      role: req.user.role,
    });
  }

  @Post('threads/:id/proposals')
  @Roles('dev_freelance', 'super_admin')
  @ApiOperation({ summary: 'Seller đối tác gửi Proposal cạnh tranh cho phiếu Cần giải pháp' })
  addProposal(
    @Param('id') id: string,
    @Body() dto: CreateProposalDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.communityService.addProposal(id, dto, {
      id: req.user.userId,
      name: req.user.name || req.user.email,
    });
  }
}
