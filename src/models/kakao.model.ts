export class KakaoLoginDTO {
  accessToken: string;
}

export class KakaoLoginBody {
  kakao: KakaoLoginDTO;
}

export class KakaoLogoutDTO {
  accessToken: string;
}

export class KakaoLogoutBody {
  kakao: KakaoLogoutDTO;
}

export interface KakaoLoginResponse {
  token: string;
}

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
