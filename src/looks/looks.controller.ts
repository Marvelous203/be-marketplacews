import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { LooksService } from './looks.service.js';
import { LookDto, LooksListResponseDto } from './dto/look-response.dto.js';

@ApiTags('looks')
@Controller('looks')
export class LooksController {
  constructor(private readonly looksService: LooksService) {}

  @Get()
  @ApiOperation({ summary: 'Get all looks with metadata' })
  @ApiResponse({ status: 200, description: 'List of all looks', type: LooksListResponseDto })
  findAll(): LooksListResponseDto {
    return this.looksService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single look by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Look ID (0-7)' })
  @ApiResponse({ status: 200, description: 'Look details', type: LookDto })
  @ApiResponse({ status: 404, description: 'Look not found' })
  findOne(@Param('id', ParseIntPipe) id: number): LookDto {
    return this.looksService.findOne(id);
  }
}
