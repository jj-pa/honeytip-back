import {
  Body,
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBody,
  ApiDefaultResponse,
  ApiHeaders,
  ApiSecurity,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from 'src/auth/auth.service';
import { JwtRefreshGuard } from 'src/auth/jwt-refresh.guard';
import { Public } from 'src/decorators/public';
import { TransformInterceptor } from 'src/interceptors/transform.interceptor';
import { CommonResponse } from 'src/models/response.model';
import {
  LoginBody,
  LoginDTO,
  LoginResponse,
  LogoutBody,
  LogoutDTO,
} from 'src/models/user.model';
import { UserService } from 'src/user/user.service';
import { LocalAuthService } from './local-auth.service';

@Controller('auth/local')
export class LocalAuthController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly localAuthService: LocalAuthService,
  ) {}

  /**
   * @POST /api/auth/local/login
   * @param credentials
   * @returns
   */
  @Public()
  @Post('/login')
  @ApiDefaultResponse({
    description: 'User Login',
    type: CommonResponse,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @ApiBody({ type: LoginBody })
  @UseInterceptors(TransformInterceptor)
  async login(
    @Body('user', ValidationPipe) body: LoginDTO,
  ): Promise<CommonResponse<LoginResponse>> {
    const user = await this.localAuthService.validateUser(body); // Validate email and password
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
   * @POST /api/auth/local/logout
   * @param req
   */
  @Public()
  @Post('/logout')
  @UseGuards(JwtRefreshGuard)
  @ApiDefaultResponse({
    description: 'User Logout',
    type: CommonResponse,
  })
  @ApiHeaders([
    {
      name: 'refresh',
      description: 'refresh token',
      schema: { type: 'string' },
    },
  ])
  @ApiBody({ type: LogoutBody })
  @ApiSecurity('basic')
  @UseInterceptors(TransformInterceptor)
  async logOut(
    @Body('user', ValidationPipe) body: LogoutDTO,
  ): Promise<CommonResponse<null>> {
    const { email } = body;
    await this.userService.removeRefreshToken(email);
    return CommonResponse.success(null);
  }
}
