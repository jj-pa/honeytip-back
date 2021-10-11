import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AuthMessageDTO {
  @IsString()
  @ApiProperty()
  phoneNumber: string;
}

export interface AuthMessageResponse {
  phoneNumber: string;
}
