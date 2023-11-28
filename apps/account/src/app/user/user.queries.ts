import {Body, Controller} from '@nestjs/common';
import {RMQRoute, RMQValidate} from "nestjs-rmq";
import {AccountUserCourses, AccountUserInfo} from "../../../../../libs/contracts/src";
import {UserRepository} from "./repositories/user.repository";
import {UserEntity} from "./entities/user.entity";

@Controller()
export class UserQueries {
  constructor(private readonly userRepository: UserRepository) {
  }

  @RMQValidate()
  @RMQRoute(AccountUserInfo.topic)
  async userInfo(@Body() { id }: AccountUserInfo.Request): Promise<AccountUserInfo.Response> {
    const user = await this.userRepository.findUserById(id);

    if (!user) {
      throw new Error("User doesn't exist");
    }

    const profile =  new UserEntity(user).getPublicProfile();
    return {
      profile
    };
  }

  @RMQValidate()
  @RMQRoute(AccountUserCourses.topic)
  async userCourses(@Body() dto: AccountUserCourses.Request): Promise<AccountUserCourses.Response> {
    const user = await this.userRepository.findUserById(dto.id);
    return {
      courses: user.courses
    }
  }
}
