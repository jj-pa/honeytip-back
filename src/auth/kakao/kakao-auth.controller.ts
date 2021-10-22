import {
  Body,
  Controller,
  Get,
  Header,
  NotFoundException,
  Post,
  Query,
  Res,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBody, ApiHeaders } from '@nestjs/swagger';
import { lastValueFrom } from 'rxjs';
import { Public } from 'src/decorators/public';
import { KakaoLogin } from 'src/kakao.service';
import {
  KakaoLoginBody,
  KakaoLogoutBody,
  KakaoLogoutDTO,
} from 'src/models/kakao.model';
import { LoginResponse } from 'src/models/user.model';
import { UserService } from 'src/user/user.service';
import { KakaoLoginDTO } from '../../models/kakao.model';
import { CommonResponse } from '../../models/response.model';
import { IKakaoRegister } from '../../models/user.model';
import { AuthService } from '../auth.service';
import { JwtRefreshGuard } from '../jwt-refresh.guard';
import { KakaoAuthService } from './kakao-auth.service';

@Controller('auth/kakao')
export class KakaoAuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly kakaoAuthService: KakaoAuthService,
    private readonly kakaoLoginService: KakaoLogin,
    private readonly userService: UserService,
  ) {}

  /**
   * @GET /api/auth/kakao/login-page
   * @returns
   */
  @Public()
  @Get('/login-page')
  @Header('Content-Type', 'text/html')
  getKakaoLoginPage(): string {
    return `
       <div>
         <h1>카카오 로그인</h1>
 
         <form action="/api/auth/kakao/request-auth" method="GET">
           <input type="submit" value="카카오로그인" />
         </form>
 
         <form action="/api/auth/kakao/logout" method="GET">
           <input type="submit" value="카카오로그아웃 및 연결 끊기" />
         </form>
       </div>
     `;
  }

  /**
   * @GET /api/auth/kakao/request-auth
   * @param res
   * @returns
   */
  @Public()
  @Get('/request-auth')
  @Header('Content-Type', 'text/html')
  kakaoLoginProcess(@Res() res): void {
    const kakaoApiKey = this.configService.get('KAKAO_REST_KEY');
    const redirectUrl = 'http://localhost:5000/api/auth/kakao/redirect-auth';
    const url = `https://kauth.kakao.com/oauth/authorize?client_id=${kakaoApiKey}&redirect_uri=${redirectUrl}&response_type=code`;
    return res.redirect(url);
  }

  /**
   * @GET /api/auth/kakao/redirect-auth
   * @param query
   * @param res
   */
  @Public()
  @Get('/redirect-auth')
  @Header('Content-Type', 'text/html')
  kakaoLoginRedirect(@Query('code') authCode: string, @Res() res): void {
    const kakaoApiKey = this.configService.get('KAKAO_REST_KEY');
    const redirectUrl = 'http://localhost:5000/api/auth/kakao/redirect-auth';
    const _hostName = `https://kauth.kakao.com/oauth/token?grant_type=authorization_code&client_id=${kakaoApiKey}&redirect_uri=${redirectUrl}&code=${authCode}`;
    const _headers = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
    };

    this.kakaoLoginService
      .login(_hostName, _headers)
      .then((e) => {
        console.log('access token is', e.data.access_token);
        console.log('refresh token is', e.data.refresh_token);
        this.kakaoLoginService.setToken(e.data['access_token']);
        return res.send(`
           <div>
             <h2>축하합니다!</h2>
             <p>카카오 로그인 성공하였습니다 :)</p>
             <a href="/api/auth/kakao/login-page">메인으로</a>
           </div>
         `);
      })
      .catch((err) => {
        console.log(err);
        return res.send('error');
      });
  }

  /**
   * @GET /api/auth/kakao/logout
   * @param res
   * @param body
   * @returns
   */
  @Public()
  @ApiBody({ type: KakaoLogoutBody })
  @UseGuards(JwtRefreshGuard)
  @ApiHeaders([
    {
      name: 'refresh',
      description: 'refresh token',
      schema: { type: 'string' },
    },
  ])
  @Post('/logout')
  async kakaoLogout(
    @Res() res,
    @Body('kakao', ValidationPipe) body: KakaoLogoutDTO,
  ): Promise<CommonResponse<any>> {
    const { accessToken } = body;
    const result = await lastValueFrom(
      this.kakaoAuthService.logout(accessToken),
    );

    return CommonResponse.success<any>(result);
  }

  @Public()
  @Post('/login')
  @ApiBody({ type: KakaoLoginBody })
  async kakaoLogin(
    @Body('kakao', ValidationPipe) body: KakaoLoginDTO,
  ): Promise<CommonResponse<LoginResponse>> {
    const { accessToken } = body;
    const userInfo = await lastValueFrom(
      this.kakaoAuthService.getUserInfo(accessToken),
    );
    const kakaoId = userInfo.id;
    const email = userInfo.kakao_account.email;
    const username = userInfo.kakao_account.profile.nickname;

    try {
      const user = await this.authService.validateKakaoUser(kakaoId);
      const accessToken = this.authService.getJwtAccessToken(user.email); // Access token
      const refreshToken = this.authService.getJwtRefreshToken(user.email); // Refresh token
      await this.userService.setCurrentRefreshToken(refreshToken, user.email); // Save refresh token

      return CommonResponse.success<LoginResponse>({
        email: user.email,
        username: user.username,
        accessToken,
        refreshToken,
      });
    } catch (err) {
      console.log(err);
      if (err instanceof NotFoundException) {
        const registerData: IKakaoRegister = {
          email,
          password: this.authService.makeRandomPassword(),
          username,
          kakaoId,
        };
        const user = await this.authService.kakaoRegister(registerData);

        const accessToken = this.authService.getJwtAccessToken(user.email); // Access token
        const refreshToken = this.authService.getJwtRefreshToken(user.email); // Refresh token
        await this.userService.setCurrentRefreshToken(refreshToken, user.email); // Save refresh token

        return CommonResponse.success<LoginResponse>({
          email: user.email,
          username: user.username,
          accessToken,
          refreshToken,
        });
      }
    }
  }
}
