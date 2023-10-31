import {Injectable} from '@nestjs/common';
import {RegisterDTO} from "./auth.controller";
import {UserRepository} from "../user/repositories/user.repository";
import {UserEntity} from "../user/entities/user.entity";
import {UserRole} from "@microservices/interfaces";
import {User} from "../user/models/user.model";

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository
  ) {}

  async register({email, password, displayName}: RegisterDTO) {
    const oldUser = await this.userRepository.findUser(email);
    if (oldUser) {
      throw new Error('User already existing');
    }

    const newUserEntity = await new UserEntity({
      displayName,
      email,
      passwordHash: '',
      role: UserRole.Student
    }).setPassword(password);

    const newUser = await this.userRepository.createUser(newUserEntity);

    return { email: newUser.email }
  }

  // async validateUser(email: string, password: string) {
  //   const user = await this.userRepository.findUser(email);
  //   if (!user) {
  //     throw new Error('Wrong login or password');
  //   }
  //
  //   const userEntity = new UserEntity(user);
  // }
}
