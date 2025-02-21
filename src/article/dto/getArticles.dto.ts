import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min } from 'class-validator';

export class GetArticlesDto {
  @ApiProperty({
    description: 'Recherche par texte dans les titres',
    example: 'Show',
    required: false,
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({
    description: 'Filtrer les articles par source',
    example: 'vincentwoo.com',
    required: false,
  })
  @IsString()
  @IsOptional()
  source?: string;

  @ApiProperty({
    description: 'Tri ascendant(ASC) ou descendant (DESC)',
    example: 'DESC',
    required: false,
  })
  @IsOptional()
  sort?: string;

  @ApiProperty({
    description: "Nombre d'articles à retourner par page",
    example: 10,
    required: false,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number;

  @ApiProperty({
    description: 'Numero de page',
    example: 1,
    required: false,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;
}
