import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MaxLength,
  MinLength,
  ValidationArguments,
} from 'class-validator';

export class LoginDTO {
  @IsString()
  @MinLength(4)
  @ApiProperty()
  id: string;

  @IsString()
  @MinLength(4)
  @ApiProperty()
  password: string;
}

export class LoginBody {
  @ApiProperty()
  user: LoginDTO;
}

export class LogoutDTO {
  @IsString()
  id: string;
}

export class LogoutBody {
  @ApiProperty()
  user: LogoutDTO;
}

export class RegisterDTO extends LoginDTO {
  @IsEmail()
  @IsString()
  @MinLength(4)
  @ApiProperty()
  email: string;

  @IsString()
  @MinLength(4)
  @MaxLength(20)
  @ApiProperty()
  username: string;

  @IsPhoneNumber('KR', {
    message: (args: ValidationArguments) => {
      // 010-0000-0000
      if (args.value.length !== 13) {
        throw new BadRequestException(`${args.value} Wrong Phone Number`);
      } else {
        throw new InternalServerErrorException();
      }
    },
  })
  phoneNumber: string;
}

export class RegisterBody {
  @ApiProperty()
  user: RegisterDTO;
}

export class UpdateUserDTO {
  @IsEmail()
  @IsOptional()
  email: string;
}

export class UpdateUserBody {
  @ApiProperty()
  user: UpdateUserDTO;
}

export interface AuthPayload {
  id: string;
}

export interface UserResponse {
  id: string;
  email: string;
  username: string;
}

export interface AuthResponse extends UserResponse {
  accessToken: string;
  refreshToken: string;
}