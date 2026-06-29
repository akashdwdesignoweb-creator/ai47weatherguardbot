import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateStatusDto {
  @IsNotEmpty({ message: 'Status is required' })
  @IsEnum(['approved', 'rejected'], { message: 'Status must be approved or rejected' })
  status: 'approved' | 'rejected';
}
