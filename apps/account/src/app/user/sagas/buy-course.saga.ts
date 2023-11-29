import {UserEntity} from "../entities/user.entity";
import {RMQService} from "nestjs-rmq";
import {PurchaseState} from "@microservices/interfaces";
import {BuyCourseState} from "./buy-course.state";

export class BuyCourseSaga {
  private state: BuyCourseState;

  constructor(private user: UserEntity, private courseId: string, private rmqService: RMQService) {}
  setState(state: PurchaseState, courseId: string) {
    switch (state) {
      case PurchaseState.Started:
        break;
      case PurchaseState.WaitingForPayment:
        break;
      case PurchaseState.Purchased:
        break;
      case PurchaseState.Canceled:
        break;
    }
    this.state.setContext(this);
    this.user.updateCourseStatus(courseId, state);
  }

  public getState() {
    return this.state;
  }
}
