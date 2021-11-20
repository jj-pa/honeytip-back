import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static/dist/serve-static.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as Joi from 'joi';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { KakaoAuthModule } from './auth/kakao/kakao-auth.module';
import { LocalAuthModule } from './auth/local/local-auth.module';
import { DatabaseConnectionService } from './database-connection.service';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        ADMIN_PASSWORD: Joi.string().required(),
        JWT_ACCESS_TOKEN_SECRET: Joi.string().required(),
        JWT_ACCESS_TOKEN_EXPIRATION_TIME: Joi.string().required(),
        JWT_REFRESH_TOKEN_SECRET: Joi.string().required(),
        JWT_REFRESH_TOKEN_EXPIRATION_TIME: Joi.string().required(),
        NCP_USER_ACCESS_KEY: Joi.string().required(),
        NCP_USER_SECRET_KEY: Joi.string().required(),
        NCP_SMS_URL: Joi.string().required(),
        NCP_SMS_URI: Joi.string().required(),
        NCP_SMS_HOST_NUMBER: Joi.string().required(),
        KAKAO_REST_KEY: Joi.string().required(),
      }),
    }),
    TypeOrmModule.forRootAsync({ useClass: DatabaseConnectionService }),
    UserModule,
    AuthModule,
    LocalAuthModule,
    KakaoAuthModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
