export class KakaoLoginDTO {
  token: string;
}

export class KakaoLoginBody {
  kakao: KakaoLoginDTO;
}

export interface KakaoLoginResponse {
  token: string;
}
