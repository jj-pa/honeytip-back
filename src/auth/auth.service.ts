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

  async postVerifyCode() {
    const value = await this.cacheManager.get('key');
    await this.cacheManager.set('key', 'value', { ttl: 1000 });
  }
}
