import {Injectable} from "@nestjs/common";
import {UserEntity} from "./entities/user.entity";
import {IUser} from "@microservices/interfaces";
import {UserRepository} from "./repositories/user.repository";
import {RMQService} from "nestjs-rmq";
import {BuyCourseSaga} from "./sagas/buy-course.saga";
import {UserEventEmmiter} from "./user.event-emmiter.";

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository, public rmqService: RMQService, private readonly userEventEmmitter: UserEventEmmiter) {}
  public async changeProfile(user: Pick<IUser, 'displayName'>, id: string) {
    const existedUser = await this.userRepository.findUserById(id);

    if (!existedUser) {
      throw new Error("User doesn't exist");
    }

    const userEntity = new UserEntity(existedUser).updateProfile(user.displayName);

    await this.updateUser(userEntity);
    return {}
  }

  public async buyCourse(userId: string, courseId: string) {
    const existingUser = await this.userRepository.findUserById(userId);

    if (!existingUser) {
      throw new Error('User isn\'t existing');
    }

    const userEntity = new UserEntity(existingUser);
    const saga = new BuyCourseSaga(userEntity, courseId, this.rmqService);
    const { paymentLink, user} = await saga.getState().pay();
    await this.updateUser(user);
    return { paymentLink };
  }

  public async checkPayment(userId: string, courseId: string) {
    const existingUser = await this.userRepository.findUserById(userId);

    if (!existingUser) {
      throw new Error('User isn\'t existing');
    }

    const userEntity = new UserEntity(existingUser);
    const saga = new BuyCourseSaga(userEntity, courseId, this.rmqService);
    const { user, status } = await saga.getState().checkPayment();
    await this.updateUser(user);
    return { status }
  }

  private updateUser(user: UserEntity) {
    return Promise.all([
      this.userEventEmmitter.handle(user),
      this.userRepository.updateUser(user)
    ])
  }
}
