import {
  Body,
  Controller,
  Get,
  Header,
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
import { KakaoLoginBody, KakaoLoginDTO } from '../models/kakao.model';
import { LogoutDTO, RefreshTokenDTO } from '../models/user.model';
import { AuthService } from './auth.service';
import { JwtRefreshGuard } from './jwt-refresh.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
    private configService: ConfigService,
    private kakaoLoginService: KakaoLogin,
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
   * @GET /api/auth/kakao-login-sample-page
   * @returns
   */
  @Public()
  @Get('/kakao-login-sample-page')
  @Header('Content-Type', 'text/html')
  getKakaoLoginPage(): string {
    return `
      <div>
        <h1>카카오 로그인</h1>

        <form action="/api/auth/kakao-login-process" method="GET">
          <input type="submit" value="카카오로그인" />
        </form>

        <form action="/api/auth/kakao-logout" method="GET">
          <input type="submit" value="카카오로그아웃 및 연결 끊기" />
        </form>
      </div>
    `;
  }

  /**
   * @GET /api/auth/kakao-login-process
   * @param res
   * @returns
   */
  @Public()
  @Get('/kakao-login-process')
  @Header('Content-Type', 'text/html')
  kakaoLoginProcess(@Res() res): void {
    const kakaoApiKey = this.configService.get('KAKAO_REST_KEY');
    const redirectUrl = 'http://localhost:5000/api/auth/kakao-login-redirect';
    const url = `https://kauth.kakao.com/oauth/authorize?client_id=${kakaoApiKey}&redirect_uri=${redirectUrl}&response_type=code`;

    return res.redirect(url);
  }

  /**
   * @GET /api/auth/kakao-login-redirect
   * @param query
   * @param res
   */
  @Public()
  @Get('/kakao-login-redirect')
  @Header('Content-Type', 'text/html')
  kakaoLoginRedirect(@Query('code') code: string, @Res() res): void {
    const kakaoApiKey = this.configService.get('KAKAO_REST_KEY');
    const redirectUrl = 'http://localhost:5000/api/auth/kakao-login-redirect';
    const _hostName = `https://kauth.kakao.com/oauth/token?grant_type=authorization_code&client_id=${kakaoApiKey}&redirect_uri=${redirectUrl}&code=${code}`;
    const _headers = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
    };

    this.kakaoLoginService
      .login(_hostName, _headers)
      .then((e) => {
        console.log(`TOKEN : ${e.data['access_token']}`);
        this.kakaoLoginService.setToken(e.data['access_token']);
        return res.send(`
          <div>
            <h2>축하합니다!</h2>
            <p>카카오 로그인 성공하였습니다 :)</p>
            <a href="/api/auth/kakao-login-sample-page">메인으로</a>
          </div>
        `);
      })
      .catch((err) => {
        console.log(err);
        return res.send('error');
      });
  }

  /**
   * @GET /api/auth/kakao-logout
   * @param res
   */
  @Public()
  @Get('/kakao-logout')
  kakaoLogout(@Res() res): void {
    console.log(`LOGOUT TOKEN : ${this.kakaoLoginService.accessToken}`);
    this.kakaoLoginService
      .logout()
      .then((e) => {
        return res.send(`
        <div>
          <h2>로그아웃 완료(토큰만료)</h2>
          <a href="/api/auth/kakao-login-sample-page">메인 화면으로</a>
        </div>
      `);
      })
      .catch((e) => {
        console.log(e);
        return res.send('logout error');
      });
  }

  @Public()
  @Post('/kakao-login')
  @ApiBody({ type: KakaoLoginBody })
  async kakaoLogin(
    @Body('kakao', ValidationPipe) body: KakaoLoginDTO,
  ): Promise<CommonResponse<any>> {
    const { token } = body;
    console.log('token is ', token);

    const kakaoApiKey = this.configService.get('KAKAO_REST_KEY');
    const redirectUrl = 'http://localhost:5000/api/auth/kakao-login-redirect';
    const _hostName = `https://kauth.kakao.com/oauth/token?grant_type=authorization_code&client_id=${kakaoApiKey}&redirect_uri=${redirectUrl}&code=${token}`;
    const _headers = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
    };

    this.kakaoLoginService
      .login(_hostName, _headers)
      .then((e) => {
        console.log(`TOKEN : ${e.data['access_token']}`);
        this.kakaoLoginService.setToken(e.data['access_token']);
      })
      .catch((err) => {
        console.log('failed', err);
      });

    return CommonResponse.success<any>('success!!');
  }
}
