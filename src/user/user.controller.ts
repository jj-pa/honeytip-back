import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ResponseObject } from 'src/models/response.model';
import {
  UpdateUserBody,
  UpdateUserDTO,
  UserResponse,
} from 'src/models/user.model';
import { User } from '../auth/user.decorator';
import { UserEntity } from '../entities/user.entity';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @ApiOkResponse({ description: 'Current user' })
  @ApiUnauthorizedResponse()
  @Get('/:username')
  async findCurrentUser(
    @Param('username') username: string,
  ): Promise<ResponseObject<'user', UserResponse>> {
    const user = await this.userService.findByUsername(username);
    return { user };
  }

  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Update current user' })
  @ApiUnauthorizedResponse()
  @ApiBody({ type: UpdateUserBody })
  @Put()
  async update(
    @User() { username }: UserEntity,
    @Body('user', new ValidationPipe({ transform: true, whitelist: true }))
    data: UpdateUserDTO,
  ): Promise<ResponseObject<'user', UserResponse>> {
    const user = await this.userService.update(username, data);
    return { user };
  }
}
