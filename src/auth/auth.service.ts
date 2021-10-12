import {
  CacheStore,
  CACHE_MANAGER,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';
import * as crypto from 'crypto';
import { UserService } from 'src/user/user.service';
import {
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
    private cacheManager: CacheStore,
  ) {}

  // 사용자 이메일/패스워드 체크
  async validateUser({ id, password }: LoginDTO): Promise<UserResponse> {
    try {
      const user = await this.userService.findById(id);
      const isValid = await user.comparePassword(password);
      if (!isValid) {
        throw new UnauthorizedException('Invalid credentials');
      }
      return { ...user.toJSON() };
    } catch (err) {
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

  // 사용자 조회 (username)
  async findCurrentUser(username: string): Promise<UserResponse> {
    const user = await this.userService.findByUsername(username);
    return user;
  }

  async updateUser(
    username: string,
    data: UpdateUserDTO,
  ): Promise<UserResponse> {
    const user = await this.userService.update(username, data);
    return { ...user.toJSON() };
  }

  // Access Token 생성 반환
  getJwtAccessToken(username: string) {
    const payload = { username };
    const token = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_ACCESS_TOKEN_SECRET'),
      expiresIn: `${this.configService.get(
        'JWT_ACCESS_TOKEN_EXPIRATION_TIME',
      )}s`,
    });
    return token;
  }

  // Refresh Token 생성 반환
  getJwtRefreshToken(username: string) {
    const payload = { username };
    const token = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn: `${this.configService.get(
        'JWT_REFRESH_TOKEN_EXPIRATION_TIME',
      )}s`,
    });

    return token;
  }

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

  async sendSMS(phoneNumber: string): Promise<number> {
    let verifyCode;
    for (let i = 0; i < 6; i++) {
      verifyCode += Math.random() * 10;
    }
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

  storeCache(phoneNumber: string, authCode: number) {
    this.cacheManager.set(phoneNumber, authCode);
  }

  deleteCache(phoneNumber: string) {
    this.cacheManager.del(phoneNumber);
  }
}