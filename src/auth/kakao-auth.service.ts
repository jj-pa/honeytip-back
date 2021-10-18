import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { KakaoProfileResponse } from 'src/models/kakao.model';

@Injectable()
export class KakaoAuthService {
  constructor(private httpService: HttpService) {}

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
}
