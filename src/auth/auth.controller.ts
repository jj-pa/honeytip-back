import {
  Body,
  Controller,
  Get,
  Post,
  Req,
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
  AuthResponse,
  LoginBody,
  LoginDTO,
  RegisterBody,
  RegisterDTO,
  UserResponse,
} from 'src/models/user.model';
import { UserService } from 'src/user/user.service';
import {
  AuthCheckDTO,
  AuthMessageDTO,
  AuthMessageResponse,
} from '../models/auth.model';
import { AuthService } from './auth.service';
import { JwtRefreshGuard } from './jwt-refresh.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {}

  @Public()
  @Post('/login')
  @ApiOkResponse({ description: 'User Login' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @UseInterceptors(TransformInterceptor)
  @ApiBody({ type: LoginBody })
  async login(
    @Body('user', ValidationPipe) credentials: LoginDTO,
  ): Promise<CommonResponse<AuthResponse>> {
    const user = await this.authService.validateUser(credentials);
    const accessToken = this.authService.getJwtAccessToken(user.username);
    const refreshToken = this.authService.getJwtRefreshToken(user.username);

    await this.userService.setCurrentRefreshToken(refreshToken, user.id);

    return CommonResponse.success<AuthResponse>({
      id: user.id,
      email: user.email,
      username: user.username,
      accessToken,
      refreshToken,
    });
  }

  @Public()
  @Post('/logout')
  @UseGuards(JwtRefreshGuard)
  @ApiOkResponse({ description: 'User Logout' })
  async logOut(@Req() req) {
    const { username } = req.user;
    await this.userService.removeRefreshToken(username);
  }

  @Public()
  @Get('/refresh')
  @UseInterceptors(TransformInterceptor)
  @UseGuards(JwtRefreshGuard)
  async refresh(@Req() req): Promise<CommonResponse<any>> {
    const user = req.user;
    const accessToken = this.authService.getJwtAccessToken(user.username);

    return CommonResponse.success<any>({
      ...user,
      accessToken,
    });
  }

  @Public()
  @Post('/signup')
  @ApiCreatedResponse({ description: 'User registration' })
  @ApiBody({ type: RegisterBody })
  @UseInterceptors(TransformInterceptor)
  async register(
    @Body('user', ValidationPipe) credentials: RegisterDTO,
  ): Promise<CommonResponse<UserResponse>> {
    const user = await this.authService.register(credentials);

    return CommonResponse.success<UserResponse>(user);
  }

  @Public()
  @Post('/send-sms')
  @ApiCreatedResponse({ description: 'Authentication SMS' })
  @UseInterceptors(TransformInterceptor)
  async sendSms(
    @Body() authBody: AuthMessageDTO,
  ): Promise<CommonResponse<AuthMessageResponse>> {
    const { phoneNumber } = authBody;
    this.authService.deleteAuthCode(phoneNumber);
    const authCode = await this.authService.sendSMS(phoneNumber);
    this.authService.storeAuthCode(phoneNumber, authCode);

    return CommonResponse.success<AuthMessageResponse>({
      phoneNumber,
      authCode,
    });
  }

  @Public()
  @Post('/check-sms')
  @ApiCreatedResponse({ description: 'Check SMS' })
  @UseInterceptors(TransformInterceptor)
  async checkSms(@Body() authBody: AuthCheckDTO): Promise<CommonResponse<any>> {
    const { phoneNumber, authCode } = authBody;
    const cacheAuthCode = await this.authService.getAuthCode(phoneNumber);
    const isAuth = authCode === cacheAuthCode;

    return CommonResponse.success<any>(isAuth);
  }
}
