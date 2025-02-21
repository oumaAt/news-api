import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  text: string;

  @IsDateString()
  publishedDate: string;

  @IsOptional()
  authorId: number;
}
