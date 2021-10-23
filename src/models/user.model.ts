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

// Login
export class LoginDTO {
  @IsEmail()
  @MinLength(4)
  @ApiProperty({ description: '사용자 이메일' })
  email: string;

  @IsString()
  @MinLength(4)
  @ApiProperty({ description: '사용자 패스워드' })
  password: string;
}
export class LoginBody {
  @ApiProperty({ description: '로그인 요청 바디' })
  user: LoginDTO;
}

// Logout
export class LogoutDTO {
  @IsString()
  @ApiProperty({ description: '사용자 이메일' })
  email: string;
}
export class LogoutBody {
  @ApiProperty({ description: '로그아웃 요청 바디' })
  user: LogoutDTO;
}

// Refresh token
export class RefreshTokenDTO {
  @IsString()
  @ApiProperty({ description: '사용자 이메일' })
  email: string;
}
export class RefreshTokenBody {
  @ApiProperty({ description: '리프레시 요청 바디' })
  user: RefreshTokenDTO;
}

// Register
export class RegisterDTO extends LoginDTO {
  @IsEmail()
  @IsString()
  @MinLength(4)
  @ApiProperty({ description: '사용자 이메일' })
  email: string;

  @IsString()
  @MinLength(4)
  @MaxLength(20)
  @ApiProperty({ description: '사용자 닉네임' })
  username: string;

  @ApiProperty({ description: '사용자 연락처' })
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
  @ApiProperty({ description: '회원가입 요청 바디' })
  user: RegisterDTO;
}

// Update user
export class UpdateUserDTO {
  @IsEmail()
  @IsOptional()
  @ApiProperty({ description: '사용자 이메일' })
  email: string;
}
export class UpdateUserBody {
  @ApiProperty({ description: '사용자 정보 수정 요청 바디' })
  user: UpdateUserDTO;
}

// Kakao Register
export interface IKakaoRegister {
  email: string;
  password: string;
  username: string;
  kakaoId: number;
}

// JWT auth payload (find by email)
export interface AuthPayload {
  email: string;
}

// User entity to json response
export interface UserResponse {
  email: string;
  username: string;
}

// Login response
export interface LoginResponse extends UserResponse {
  accessToken: string;
  refreshToken: string;
}

// Refresh response
export interface RefreshTokenResponse extends AuthPayload {
  accessToken: string;
}
