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
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { lastValueFrom } from 'rxjs';
import { Public } from 'src/decorators/public';
import { TransformInterceptor } from 'src/interceptors/transform.interceptor';
import { KakaoLogin } from 'src/kakao.service';
import { CommonResponse } from 'src/models/response.model';
import {
  LoginBody,
  LoginDTO,
  LoginResponse,
  LogoutBody,
  RefreshTokenBody,
  RefreshTokenResponse,
  RegisterBody,
  RegisterDTO,
  UserResponse,
} from 'src/models/user.model';
import { UserService } from 'src/user/user.service';
import {
  AuthCheckBody,
  AuthCheckDTO,
  AuthMessageBody,
  AuthMessageDTO,
  AuthResultResponse,
  SendMessageResponse,
} from '../models/auth.model';
import {
  KakaoLoginBody,
  KakaoLoginDTO,
  KakaoLogoutBody,
  KakaoLogoutDTO,
} from '../models/kakao.model';
import {
  IKakaoRegister,
  LogoutDTO,
  RefreshTokenDTO,
} from '../models/user.model';
import { AuthService } from './auth.service';
import { JwtRefreshGuard } from './jwt-refresh.guard';
import { KakaoAuthService } from './kakao-auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
    private configService: ConfigService,
    private kakaoLoginService: KakaoLogin,
    private kakaoAuthService: KakaoAuthService,
  ) {}

  /**
   * @POST /api/auth/login
   * @param credentials
   * @returns
   */
  @Public()
  @Post('/login')
  @ApiOkResponse({ description: 'User Login' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @ApiBody({ type: LoginBody })
  @UseInterceptors(TransformInterceptor)
  async login(
    @Body('user', ValidationPipe) body: LoginDTO,
  ): Promise<CommonResponse<LoginResponse>> {
    const user = await this.authService.validateUser(body); // Validate email and password
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

  /**
   * @POST /api/auth/logout
   * @param req
   */
  @Public()
  @Post('/logout')
  @UseGuards(JwtRefreshGuard)
  @ApiOkResponse({ description: 'User Logout' })
  @ApiBody({ type: LogoutBody })
  @UseInterceptors(TransformInterceptor)
  async logOut(
    @Body('user', ValidationPipe) body: LogoutDTO,
  ): Promise<CommonResponse<null>> {
    const { email } = body;
    await this.userService.removeRefreshToken(email);
    return CommonResponse.success(null);
  }

  /**
   * @GET /api/auth/refresh-token
   * @param req
   * @returns
   */
  @Public()
  @Get('/refresh-token')
  @UseGuards(JwtRefreshGuard)
  @ApiOkResponse({ description: 'Refresh token' })
  @ApiBody({ type: RefreshTokenBody })
  @UseInterceptors(TransformInterceptor)
  async refresh(
    @Body('user', ValidationPipe) body: RefreshTokenDTO,
  ): Promise<CommonResponse<RefreshTokenResponse>> {
    const { email } = body;
    const accessToken = this.authService.getJwtAccessToken(email);

    return CommonResponse.success<RefreshTokenResponse>({
      email,
      accessToken,
    });
  }

  /**
   * @POST /api/auth/signup
   * @param credentials
   * @returns
   */
  @Public()
  @Post('/signup')
  @ApiCreatedResponse({ description: 'User registration' })
  @ApiBody({ type: RegisterBody })
  @UseInterceptors(TransformInterceptor)
  async register(
    @Body('user', ValidationPipe) body: RegisterDTO,
  ): Promise<CommonResponse<UserResponse>> {
    const user = await this.authService.register(body);

    return CommonResponse.success<UserResponse>(user);
  }

  /**
   * @POST /api/auth/send-sms-code
   * @param authBody
   * @returns
   */
  @Public()
  @Post('/send-sms-code')
  @ApiCreatedResponse({ description: 'Authentication SMS' })
  @ApiBody({ type: AuthMessageBody })
  @UseInterceptors(TransformInterceptor)
  async sendSms(
    @Body('auth', ValidationPipe) body: AuthMessageDTO,
  ): Promise<CommonResponse<SendMessageResponse>> {
    const { phoneNumber } = body;
    this.authService.deleteAuthCode(phoneNumber);
    const authCode = await this.authService.sendSMS(phoneNumber);
    this.authService.storeAuthCode(phoneNumber, authCode);

    return CommonResponse.success<SendMessageResponse>({
      phoneNumber,
      authCode,
    });
  }

  /**
   * @POST /api/auth/validate-sms-code
   * @param authBody
   * @returns
   */
  @Public()
  @Post('/validate-sms-code')
  @ApiCreatedResponse({ description: 'Validate SMS' })
  @ApiBody({ type: AuthCheckBody })
  @UseInterceptors(TransformInterceptor)
  async checkSms(
    @Body('auth', ValidationPipe) body: AuthCheckDTO,
  ): Promise<CommonResponse<AuthResultResponse>> {
    const { phoneNumber, authCode } = body;
    const cacheAuthCode = await this.authService.getAuthCode(phoneNumber);
    const authResult = authCode === cacheAuthCode;

    return CommonResponse.success<AuthResultResponse>({
      phoneNumber,
      authResult,
    });
  }

  /**
   * @GET /api/auth/kakao/login-page
   * @returns
   */
  @Public()
  @Get('/kakao/login-page')
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
  @Get('/kakao/request-auth')
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
  @Get('/kakao/redirect-auth')
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
  @Post('/kakao/logout')
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
  @Post('/kakao/login')
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
