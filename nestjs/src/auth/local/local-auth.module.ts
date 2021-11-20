import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from 'src/auth/auth.module';
import { UserModule } from 'src/user/user.module';
import { LocalAuthController } from './local-auth.controller';
import { LocalAuthService } from './local-auth.service';

@Module({
  imports: [AuthModule, ConfigModule, UserModule],
  providers: [LocalAuthService],
  controllers: [LocalAuthController],
})
export class LocalAuthModule {}
