import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  text: string;

  @IsOptional()
  @IsDateString()
  publishedDate: string;

  @IsOptional()
  authorId: number;
}
