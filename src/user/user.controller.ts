import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { TransformInterceptor } from 'src/interceptors/transform.interceptor';
import { CommonResponse } from 'src/models/response.model';
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
  constructor(private readonly userService: UserService) {}

  /**
   * @GET /user/:username
   * @param username
   * @returns
   */
  @ApiOkResponse({ description: 'Current user' })
  @ApiUnauthorizedResponse()
  @Get('/:username')
  @UseInterceptors(TransformInterceptor)
  async findCurrentUser(
    @Param('username') username: string,
  ): Promise<CommonResponse<UserResponse>> {
    const user = await this.userService.findByUsername(username);

    return CommonResponse.success<UserResponse>(user);
  }

  /**
   * @PUT /user
   * @param param0
   * @param data
   * @returns
   */
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Update current user' })
  @ApiUnauthorizedResponse()
  @ApiBody({ type: UpdateUserBody })
  @Put()
  @UseInterceptors(TransformInterceptor)
  async update(
    @User() { username }: UserEntity,
    @Body('user', new ValidationPipe({ transform: true, whitelist: true }))
    data: UpdateUserDTO,
  ): Promise<CommonResponse<UserResponse>> {
    const user = await this.userService.update(username, data);

    return CommonResponse.success<UserResponse>(user);
  }
}
