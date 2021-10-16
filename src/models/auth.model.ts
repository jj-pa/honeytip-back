import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AuthMessageDTO {
  @IsString()
  @ApiProperty()
  phoneNumber: string;
}

export class AuthCheckDTO extends AuthMessageDTO {
  @IsString()
  @ApiProperty()
  authCode: string;
}

export interface SendMessageResponse {
  phoneNumber: string;
  authCode: string;
}

export interface AuthResultResponse {
  phoneNumber: string;
  authResult: boolean;
}
