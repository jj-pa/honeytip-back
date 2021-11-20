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
  ApiBody,
  ApiDefaultResponse,
  ApiHeaders,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { User } from 'src/auth/user.decorator';
import { UserEntity } from 'src/entities/user.entity';
import { TransformInterceptor } from 'src/interceptors/transform.interceptor';
import { CommonResponse } from 'src/models/response.model';
import {
  UpdateUserBody,
  UpdateUserDTO,
  UserResponse,
} from 'src/models/user.model';
import { UserService } from './user.service';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * @GET /user/:username
   * @param username
   * @returns
   */
  @ApiHeaders([
    {
      name: 'authentication',
      description: 'Access token',
      schema: { type: 'string' },
      required: true,
    },
  ])
  @ApiDefaultResponse({
    description: 'Current user',
    type: CommonResponse,
  })
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
  @ApiHeaders([
    {
      name: 'authentication',
      description: 'Access token',
      schema: { type: 'string' },
      required: true,
    },
  ])
  @ApiDefaultResponse({
    description: 'Update current user',
    type: CommonResponse,
  })
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
