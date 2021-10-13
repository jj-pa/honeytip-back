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
import {
  CommonResponse,
  TransformInterceptor,
} from 'src/interceptors/transform.interceptor';
import { ResponseObject } from 'src/models/response.model';
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
    return {
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        accessToken,
        refreshToken,
      },
    };
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
  async refresh(@Req() req) {
    const user = req.user;
    const accessToken = this.authService.getJwtAccessToken(user.username);
    return { data: { ...user, accessToken } };
  }

  @Public()
  @Post('/signup')
  @ApiCreatedResponse({ description: 'User registration' })
  @ApiBody({ type: RegisterBody })
  async register(
    @Body('user', ValidationPipe) credentials: RegisterDTO,
  ): Promise<ResponseObject<'user', UserResponse>> {
    const user = await this.authService.register(credentials);
    return { user };
  }

  @Public()
  @Post('/send-sms')
  @ApiCreatedResponse({ description: 'Authentication SMS' })
  async sendSms(
    @Body() authBody: AuthMessageDTO,
  ): Promise<AuthMessageResponse> {
    const { phoneNumber } = authBody;
    this.authService.deleteAuthCode(phoneNumber);
    const authCode = await this.authService.sendSMS(phoneNumber);
    this.authService.storeAuthCode(phoneNumber, authCode);
    return { phoneNumber, authCode };
  }

  @Public()
  @Post('/check-sms')
  @ApiCreatedResponse({ description: 'Check SMS' })
  async checkSms(@Body() authBody: AuthCheckDTO) {
    const { phoneNumber, authCode } = authBody;
    const cacheAuthCode = await this.authService.getAuthCode(phoneNumber);
    const isAuth = authCode === cacheAuthCode;
    return {
      isAuth,
    };
  }
}
