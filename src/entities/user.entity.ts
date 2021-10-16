import * as bcrypt from 'bcryptjs';
import { classToPlain, Exclude } from 'class-transformer';
import { IsEmail, IsString } from 'class-validator';
import { UserResponse } from 'src/models/user.model';
import { BeforeInsert, Column, Entity } from 'typeorm';
import { AbstractEntity } from './abstract-entity';

@Entity('users')
export class UserEntity extends AbstractEntity {
  @Column({ unique: true })
  @IsEmail()
  email: string;

  @Column()
  @IsString()
  username: string;

  @Column()
  @Exclude()
  password: string;

  @Column()
  phoneNumber: string;

  @Column({ nullable: true })
  @Exclude()
  currentHashedRefreshToken?: string;

  @BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 10);
  }

  async comparePassword(attempt: string) {
    return await bcrypt.compare(attempt, this.password);
  }

  async compareRefreshToken(attempt: string) {
    return await bcrypt.compare(attempt, this.currentHashedRefreshToken);
  }

  toJSON(): UserResponse {
    return <UserResponse>classToPlain(this);
  }
}
