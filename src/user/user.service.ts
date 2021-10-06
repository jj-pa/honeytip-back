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

  async setCurrentRefreshToken(refreshToken: string, id: string) {
    const currentHashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    const user = await this.userRepository.findOne({ where: { id } });

    user.currentHashedRefreshToken = currentHashedRefreshToken;
    await this.userRepository.save(user);
  }

  async getUserIfRefreshTokenMatches(refreshToken: string, username: string) {
    const user = await this.userRepository.findOne({ where: { username } });
    const isRefreeshTokenMaching = await user.compareRefreshToken(refreshToken);

    if (isRefreeshTokenMaching) {
      return user;
    }
  }

  async removeRefreshToken(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    user.currentHashedRefreshToken = null;
    await this.userRepository.save(user);
    return user.toJSON();
  }

  async findById(id: string): Promise<UserEntity> {
    return await this.userRepository.findOne({
      where: { id },
    });
  }

  async findByUsername(username: string): Promise<UserResponse> {
    return (
      await this.userRepository.findOne({
        where: { username },
      })
    ).toJSON();
  }

  async findByEmail(email: string): Promise<UserResponse> {
    return (
      await this.userRepository.findOne({
        where: { email },
      })
    ).toJSON();
  }

  async create(registerDTO: RegisterDTO): Promise<UserEntity> {
    try {
      return await this.userRepository.create(registerDTO);
    } catch (err) {
      throw new HttpException(err, HttpStatus.BAD_REQUEST);
    }
  }

  async update(id: string, updateUserDTO: UpdateUserDTO): Promise<UserEntity> {
    await this.userRepository.update({ id }, updateUserDTO);
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }
    return user;
  }
}
