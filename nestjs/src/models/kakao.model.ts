import { ApiProperty } from '@nestjs/swagger';

// kakao login
export class KakaoLoginDTO {
  @ApiProperty({ description: '카카오 액세스토큰' })
  accessToken: string;
}
export class KakaoLoginBody {
  @ApiProperty({ description: '카카오 로그인 요청 바디' })
  kakao: KakaoLoginDTO;
}

// kakao logout
export class KakaoLogoutDTO {
  @ApiProperty({ description: '카카오 액세스토큰' })
  accessToken: string;
}
export class KakaoLogoutBody {
  @ApiProperty({ description: '카카오 로그아웃 요청 바디' })
  kakao: KakaoLogoutDTO;
}

// kakao login response
export interface KakaoLoginResponse {
  token: string;
}

// kakao profile response
export interface KakaoProfileResponse {
  id: number;
  kakao_account: {
    profile: {
      nickname: string;
      profile_image_url: string;
    };
    email: string;
  };
}
