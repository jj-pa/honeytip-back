import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import {
  RegisterDTO,
  UpdateUserDTO,
  UserResponse,
} from 'src/models/user.model';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async setCurrentRefreshToken(refreshToken: string, email: string) {
    const currentHashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    const user = await this.userRepository.findOne({ where: { email } });

    user.currentHashedRefreshToken = currentHashedRefreshToken;
    await this.userRepository.save(user);
  }

  async getUserIfRefreshTokenMatches(refreshToken: string, email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    const isRefreeshTokenMaching = await user.compareRefreshToken(refreshToken);

    if (isRefreeshTokenMaching) {
      return user;
    }
  }

  async removeRefreshToken(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    user.currentHashedRefreshToken = null;
    await this.userRepository.save(user);
    return user.toJSON();
  }

  async findByUsername(username: string): Promise<UserResponse> {
    return (
      await this.userRepository.findOne({
        where: { username },
      })
    ).toJSON();
  }

  async findByEmail(email: string): Promise<UserEntity> {
    return await this.userRepository.findOne({
      where: { email },
    });
  }

  async create(registerDTO: RegisterDTO): Promise<UserEntity> {
    try {
      return await this.userRepository.create(registerDTO);
    } catch (err) {
      throw new HttpException(err, HttpStatus.BAD_REQUEST);
    }
  }

  async update(
    email: string,
    updateUserDTO: UpdateUserDTO,
  ): Promise<UserEntity> {
    await this.userRepository.update({ email }, updateUserDTO);
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException(`User #${email} not found`);
    }
    return user;
  }
}
