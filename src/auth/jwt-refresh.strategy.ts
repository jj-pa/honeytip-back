import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from 'src/user/user.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh-token',
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request) => {
          return request?.headers?.refresh; // Refresh token
        },
      ]),
      secretOrKey: configService.get('JWT_REFRESH_TOKEN_SECRET'),
      passReqToCallback: true, // request를 콜백에 함께 전달한다.
    });
  }

  // Refresh Token 유효 체크
  async validate(req, payload: any) {
    const refreshToken = req?.headers?.refresh;
    return this.userService.getUserIfRefreshTokenMatches(
      refreshToken,
      payload.email,
    );
  }
}
