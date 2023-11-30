import {Body, Controller} from '@nestjs/common';
import {UserRepository} from "./repositories/user.repository";
import {RMQRoute, RMQService, RMQValidate} from "nestjs-rmq";
import {AccountBuyCourse, AccountChangeProfile} from "../../../../../libs/contracts/src";
import {UserEntity} from "./entities/user.entity";
import {AccountCheckPayment} from "../../../../../libs/contracts/src";
import {BuyCourseSaga} from "./sagas/buy-course.saga";

@Controller()
export class UserCommands {
  constructor(private readonly userRepository: UserRepository, public rmqService: RMQService ) {
  }

  @RMQValidate()
  @RMQRoute(AccountChangeProfile.topic)
  async changeProfile(@Body() { id, user }: AccountChangeProfile.Request): Promise<AccountChangeProfile.Response> {
    const existedUser = await this.userRepository.findUserById(id);

    if (!existedUser) {
      throw new Error("User doesn't exist");
    }

    const userEntity = new UserEntity(existedUser).updateProfile(user.displayName);

    await this.userRepository.updateUser(userEntity);
    return {}
  }

  @RMQValidate()
  @RMQRoute(AccountBuyCourse.topic)
  async buyCourse(@Body() { userId, courseId }: AccountBuyCourse.Request): Promise<AccountBuyCourse.Response> {
    const existingUser = await this.userRepository.findUserById(userId);

    if (!existingUser) {
      throw new Error('User isn\'t existing');
    }

    const userEntity = new UserEntity(existingUser);
    const saga = new BuyCourseSaga(userEntity, courseId, this.rmqService);
    const { paymentLink, user} = await saga.getState().pay();
    await this.userRepository.updateUser(userEntity);
    return { paymentLink };
  }

  @RMQValidate()
  @RMQRoute(AccountCheckPayment.topic)
  async checkPayment(@Body() { userId, courseId }: AccountCheckPayment.Request): Promise<AccountCheckPayment.Response> {
    const existingUser = await this.userRepository.findUserById(userId);

    if (!existingUser) {
      throw new Error('User isn\'t existing');
    }

    const userEntity = new UserEntity(existingUser);
    const saga = new BuyCourseSaga(userEntity, courseId, this.rmqService);
    const { user, status } = await saga.getState().checkPayment();
    await this.userRepository.updateUser(userEntity);
    return { status }
  }
}

