import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class TagDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'Next.js' })
  name: string;

  @ApiProperty({ example: 'nextjs' })
  slug: string;

  @ApiProperty({ example: 'TECH' })
  tagGroup: string;
}

export class CreateTagDto {
  @ApiProperty({ example: 'Next.js' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'nextjs' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({ example: 'TECH' })
  @IsString()
  @IsNotEmpty()
  tagGroup: string;
}
