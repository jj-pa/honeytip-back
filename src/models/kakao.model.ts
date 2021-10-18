export class KakaoLoginDTO {
  accessToken: string;
}

export class KakaoLoginBody {
  kakao: KakaoLoginDTO;
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
