import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginDTO, RegisterDTO, UserResponse } from 'src/models/user.model';
import { UserService } from 'src/user/user.service';

@Injectable()
export class LocalAuthService {
  constructor(private readonly userService: UserService) {}

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
      throw new UnauthorizedException(
        '일치하는 사용자 정보를 찾지 못하였습니다.',
      );
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
}
