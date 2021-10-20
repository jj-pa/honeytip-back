import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KakaoLogin } from 'src/kakao.service';
import { UserModule } from 'src/user/user.module';
import { AuthModule } from '../auth.module';
import { KakaoAuthController } from './kakao-auth.controller';
import { KakaoAuthService } from './kakao-auth.service';

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
