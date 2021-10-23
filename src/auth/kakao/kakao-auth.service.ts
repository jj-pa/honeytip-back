import { HttpService } from '@nestjs/axios';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { KakaoProfileResponse } from 'src/models/kakao.model';
import { IKakaoRegister, UserResponse } from 'src/models/user.model';
import { UserService } from 'src/user/user.service';

@Injectable()
export class KakaoAuthService {
  constructor(
    private readonly httpService: HttpService,
    private readonly userService: UserService,
  ) {}

  logout(accessToken: string): Observable<AxiosResponse<any>> {
    const config = {
      headers: {
        Authorization: `bearer ${accessToken}`,
      },
    };
    return this.httpService
      .post('https://kapi.kakao.com/v1/user/logout', {}, config)
      .pipe(map((response) => response.data));
  }

  getUserInfo(accessToken: string): Observable<KakaoProfileResponse> {
    const config = {
      headers: {
        Authorization: `bearer ${accessToken}`,
      },
    };

    return this.httpService
      .post('https://kapi.kakao.com/v2/user/me', null, config)
      .pipe(map((response) => response.data));
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
}
