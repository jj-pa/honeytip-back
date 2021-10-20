import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from 'src/decorators/public';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // reflector를 주입받아 @Public을 사용하는지 확인한다.
  constructor(private readonly reflector: Reflector) {
    super();
  }

  // @Public: isPublic은 JWT 검증을 하지 않는다.
  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    // You can throw an exception based on either "info" or "err" arguments
    console.debug(info);
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
