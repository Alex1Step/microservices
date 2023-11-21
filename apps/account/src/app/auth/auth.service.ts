import {Injectable} from '@nestjs/common';
import {UserRepository} from "../user/repositories/user.repository";
import {UserEntity} from "../user/entities/user.entity";
import {UserRole} from "@microservices/interfaces";
import {User} from "../user/models/user.model";
import {JwtService} from "@nestjs/jwt";
import {AccountRegister} from "../../../../../libs/contracts/src";

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService
  ) {}

  async register({email, password, displayName}: AccountRegister.Request) {
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

  async validateUser(email: string, password: string) {
    const user = await this.userRepository.findUser(email);
    if (!user) {
      throw new Error('Wrong login or password');
    }

    const userEntity = new UserEntity(user);
    const isCorrectPassword = userEntity.validatePassword(password);

    if (!isCorrectPassword) {
      throw new Error('Wrong login or password');
    }

    return { id: user._id };
  }

  async login(id: string) {
    return {
      access_token: await this.jwtService.signAsync({ id })
    }
  }
}
