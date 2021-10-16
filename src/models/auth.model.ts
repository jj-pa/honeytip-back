import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AuthMessageDTO {
  @IsString()
  @ApiProperty()
  phoneNumber: string;
}

export class AuthMessageBody {
  @ApiProperty()
  auth: AuthMessageDTO;
}

export class AuthCheckDTO extends AuthMessageDTO {
  @IsString()
  @ApiProperty()
  authCode: string;
}

export class AuthCheckBody {
  @ApiProperty()
  auth: AuthCheckDTO;
}

export interface SendMessageResponse {
  phoneNumber: string;
  authCode: string;
}

export interface AuthResultResponse {
  phoneNumber: string;
  authResult: boolean;
}
