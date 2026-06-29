import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateLocationDto {
  @IsString({ message: 'Location must be a string' })
  @IsNotEmpty({ message: 'Location cannot be empty' })
  location: string;
}
