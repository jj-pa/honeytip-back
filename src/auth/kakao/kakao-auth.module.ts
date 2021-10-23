import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from 'src/auth/auth.module';
import { UserModule } from 'src/user/user.module';
import { KakaoAuthController } from './kakao-auth.controller';
import { KakaoAuthService } from './kakao-auth.service';
import { KakaoLogin } from './kakao.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    AuthModule,
    ConfigModule,
    UserModule,
  ],
  providers: [KakaoAuthService, KakaoLogin],
  controllers: [KakaoAuthController],
})
export class KakaoAuthModule {}
