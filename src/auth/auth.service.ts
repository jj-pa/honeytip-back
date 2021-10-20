import {
  CacheStore,
  CACHE_MANAGER,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';
import * as crypto from 'crypto';
import { UserService } from 'src/user/user.service';
import {
  IKakaoRegister,
  LoginDTO,
  RegisterDTO,
  UpdateUserDTO,
  UserResponse,
} from '../models/user.model';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: CacheStore,
  ) {}

  // 사용자 이메일/패스워드 체크
  async validateUser({ email, password }: LoginDTO): Promise<UserResponse> {
    try {
      const user = await this.userService.findByEmail(email);
      const isValid = await user.comparePassword(password);
      if (!isValid) {
        throw new UnauthorizedException('Invalid credentials');
      }
      return { ...user.toJSON() };
    } catch (err) {
      throw new UnauthorizedException();
    }
  }

  // 카카오 사용자 확인
  async validateKakaoUser(kakaoId: number): Promise<UserResponse> {
    try {
      const user = await this.userService.findByKakaoId(kakaoId);
      if (!user) {
        throw new NotFoundException('Not found user');
      }
      return { ...user.toJSON() };
    } catch (err) {
      if (err instanceof NotFoundException) throw new NotFoundException();

      throw new UnauthorizedException();
    }
  }

  // 회원가입
  async register(credentials: RegisterDTO): Promise<UserResponse> {
    try {
      const user = await this.userService.create(credentials);
      await user.save();
      return { ...user.toJSON() };
    } catch (err) {
      if (err.code === '23505') {
        throw new ConflictException('Username has already been taken');
      }
      throw new InternalServerErrorException();
    }
  }

  // 카카오 회원가입
  async kakaoRegister(credentials: IKakaoRegister): Promise<UserResponse> {
    try {
      const user = await this.userService.kakaoCreate(credentials);
      await user.save();
      return { ...user.toJSON() };
    } catch (err) {
      if (err.code === '23505') {
        throw new ConflictException('Username has already been taken');
      }
      throw new InternalServerErrorException();
    }
  }

  // 사용자 조회 (username)
  async findCurrentUser(username: string): Promise<UserResponse> {
    const user = await this.userService.findByUsername(username);
    return user;
  }

  // 사용자 정보 수정
  async updateUser(
    username: string,
    data: UpdateUserDTO,
  ): Promise<UserResponse> {
    const user = await this.userService.update(username, data);
    return { ...user.toJSON() };
  }

  // Access Token 생성 반환
  getJwtAccessToken(email: string) {
    const payload = { email };
    const token = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_ACCESS_TOKEN_SECRET'),
      expiresIn: `${this.configService.get(
        'JWT_ACCESS_TOKEN_EXPIRATION_TIME',
      )}s`,
    });
    return token;
  }

  // Refresh Token 생성 반환
  getJwtRefreshToken(email: string) {
    const payload = { email };
    const token = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn: `${this.configService.get(
        'JWT_REFRESH_TOKEN_EXPIRATION_TIME',
      )}s`,
    });

    return token;
  }

  // NCP SMS Signature 생성
  private makeSignature(): string {
    const message = [];
    const hmac = crypto.createHmac(
      'sha256',
      this.configService.get('NCP_USER_SECRET_KEY'),
    );
    const space = ' ';
    const newLine = '\n';
    const method = 'POST';
    const timestamp = Date.now().toString();

    message.push(method);
    message.push(space);
    message.push(this.configService.get('NCP_SMS_URI'));
    message.push(newLine);
    message.push(timestamp);
    message.push(newLine);
    message.push(this.configService.get('NCP_USER_ACCESS_KEY'));

    // base64 인코딩
    const signature = hmac.update(message.join('')).digest('base64');
    return signature.toString();
  }

  // NCP SMS 전송 요청
  async sendSMS(phoneNumber: string): Promise<string> {
    const verifyCode = this.makeAuthCode();
    const contentText = `인증번호는 [${verifyCode}]입니다.`;

    const body = {
      type: 'SMS',
      contentType: 'COMM',
      countryCode: '82',
      from: this.configService.get('NCP_SMS_HOST_NUMBER'),
      content: contentText,
      messages: [
        {
          to: phoneNumber,
        },
      ],
    };

    const options = {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'x-ncp-apigw-timestamp': Date.now().toString(),
        'x-ncp-iam-access-key': this.configService.get('NCP_USER_ACCESS_KEY'),
        'x-ncp-apigw-signature-v2': this.makeSignature(),
      },
    };

    await axios
      .post(this.configService.get('NCP_SMS_URL'), body, options)
      .then(async (res) => {
        console.log(res.data);
      })
      .catch((err) => {
        console.error(err.response.data);
        throw new InternalServerErrorException();
      });

    return verifyCode;
  }

  // 인증코드 저장
  storeAuthCode(phoneNumber: string, authCode: string) {
    this.cacheManager.set(phoneNumber, authCode);
  }

  // 인증코드 삭제
  deleteAuthCode(phoneNumber: string) {
    this.cacheManager.del(phoneNumber);
  }

  // 인증코드 조회
  async getAuthCode(phoneNumber: string) {
    return await this.cacheManager.get(phoneNumber);
  }

  // 인증코드 생성
  makeAuthCode() {
    const chars = '0123456789';
    const length = 4;
    let randomNumber = '';
    for (let i = 0; i < length; i++) {
      const rnum = Math.floor(Math.random() * chars.length);
      randomNumber += chars.substring(rnum, rnum + 1);
    }
    return randomNumber;
  }

  // 랜덤 패스워드 생성
  makeRandomPassword() {
    const chars =
      '0123456789abcdefghijklmnopqrstubwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const length = 12;
    let randomPassword = '';
    for (let i = 0; i < length; i++) {
      const rnum = Math.floor(Math.random() * chars.length);
      randomPassword += chars.substring(rnum, rnum + 1);
    }
    return randomPassword;
  }
}
