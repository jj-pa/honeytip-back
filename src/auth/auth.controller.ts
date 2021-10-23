import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBody, ApiDefaultResponse, ApiHeaders } from '@nestjs/swagger';
import { Public } from 'src/decorators/public';
import { TransformInterceptor } from 'src/interceptors/transform.interceptor';
import {
  AuthCheckBody,
  AuthCheckDTO,
  AuthMessageBody,
  AuthMessageDTO,
  AuthResultResponse,
  SendMessageResponse,
} from 'src/models/auth.model';
import { CommonResponse } from 'src/models/response.model';
import {
  RefreshTokenBody,
  RefreshTokenDTO,
  RefreshTokenResponse,
} from 'src/models/user.model';
import { AuthService } from './auth.service';
import { JwtRefreshGuard } from './jwt-refresh.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * @GET /api/auth/refresh-token
   * @param req
   * @returns
   */
  @Public()
  @Get('/refresh-token')
  @UseGuards(JwtRefreshGuard)
  @ApiDefaultResponse({
    description: 'Refresh token',
    type: CommonResponse,
  })
  @ApiHeaders([
    {
      name: 'refresh',
      description: 'refresh token',
      schema: { type: 'string' },
    },
  ])
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
   * @POST /api/auth/send-sms-code
   * @param authBody
   * @returns
   */
  @Public()
  @Post('/send-sms-code')
  @ApiDefaultResponse({
    description: 'Authentication SMS',
    type: CommonResponse,
  })
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
  @ApiDefaultResponse({
    description: 'Validate SMS',
    type: CommonResponse,
  })
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
