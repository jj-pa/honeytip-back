import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Public } from 'src/decorators/public';
import { TransformInterceptor } from 'src/interceptors/transform.interceptor';
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
import { LogoutDTO, RefreshTokenDTO } from '../models/user.model';
import { AuthService } from './auth.service';
import { JwtRefreshGuard } from './jwt-refresh.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
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
}
