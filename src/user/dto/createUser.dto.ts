import { IsString, IsNotEmpty } from 'class-validator';

// Define a class with validation rules
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;
}
