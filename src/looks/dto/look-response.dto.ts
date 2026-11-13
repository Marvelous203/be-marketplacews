import { ApiProperty } from '@nestjs/swagger';

export class PieceDto {
  @ApiProperty({ example: 'Ribbed crop tank' })
  name: string;

  @ApiProperty({ example: 'Charcoal' })
  color: string;

  @ApiProperty({ example: 950000 })
  priceVND: number;
}

export class LookPiecesDto {
  @ApiProperty({ type: [PieceDto] })
  tops: PieceDto[];

  @ApiProperty({ type: [PieceDto] })
  bottoms: PieceDto[];

  @ApiProperty({ type: [PieceDto] })
  full: PieceDto[];

  @ApiProperty({ type: [PieceDto] })
  shoes: PieceDto[];

  @ApiProperty({ type: [PieceDto] })
  acc: PieceDto[];
}

export class LookDto {
  @ApiProperty({ example: 0 })
  id: number;

  @ApiProperty({ example: 'Denim Maxi' })
  name: string;

  @ApiProperty({ example: 'everyday', enum: ['everyday', 'athletic', 'sleep', 'formal', 'party', 'street'] })
  category: string;

  @ApiProperty({ example: 350000, description: 'Starting price in VND (cheapest piece)' })
  priceFromVND: number;

  @ApiProperty({ type: LookPiecesDto })
  pieces: LookPiecesDto;
}

export class LooksListResponseDto {
  @ApiProperty({ type: [LookDto] })
  data: LookDto[];

  @ApiProperty({ example: { total: 8 } })
  meta: { total: number };
}
