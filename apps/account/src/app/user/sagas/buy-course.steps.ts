import {BuyCourseState} from "./buy-course.state";
import {UserEntity} from "../entities/user.entity";
import {CourseGetCourse, PaymentCheck, PaymentGenerateLink, PaymentStatus} from "../../../../../../libs/contracts/src";
import {PurchaseState} from "@microservices/interfaces";

export class BuyCourseSagaStateStarted extends BuyCourseState {
  public async cancel(): Promise<{ user: UserEntity }> {
    this.saga.setState(PurchaseState.Canceled, this.saga.courseId);
    return {
      user: this.saga.user
    }
  }

  public async checkPayment(): Promise<{ user: UserEntity, status: PaymentStatus }> {
    throw new Error('Can\'t check payment status for this step')
  }

  public async pay(): Promise<{ paymentLink: string; user: UserEntity }> {
    const { course } = await this.saga.rmqService.send<CourseGetCourse.Request, CourseGetCourse.Response>(CourseGetCourse.topic, { id: this.saga.courseId });
    if (!course) {
      throw new Error('This course isn\'t existing');
    }
    if (course.price === 0) {
      this.saga.setState(PurchaseState.Purchased, course._id);
      return { paymentLink: null, user: this.saga.user }
    }
    const { paymentLink } = await this.saga.rmqService.send<PaymentGenerateLink.Request, PaymentGenerateLink.Response>(PaymentGenerateLink.topic, { courseId: course._id, userId: this.saga.user._id, sum: course.price });

    this.saga.setState(PurchaseState.WaitingForPayment, course._id);

    return {
      paymentLink,
      user: this.saga.user
    }
  }
}

export class BuyCourseSagaStateWaitingForPayment extends BuyCourseState {
  public cancel(): Promise<{ user: UserEntity }> {
    throw new Error('Sorry, already in process.');
  }

  public async checkPayment(): Promise<{ user: UserEntity, status: PaymentStatus }> {
    const { status } = await this.saga.rmqService.send<PaymentCheck.Request, PaymentCheck.Response>(PaymentCheck.topic, { courseId: this.saga.courseId, userId: this.saga.user._id });
    if (status === PaymentStatus.Canceled) {
      this.saga.setState(PurchaseState.Canceled, this.saga.courseId);
      return {
        user: this.saga.user,
        status: PaymentStatus.Canceled
      }
    }
    if (status !== PaymentStatus.Success) {
      return {
        user: this.saga.user,
        status: PaymentStatus.Progress
      }
    }
    this.saga.setState(PurchaseState.Purchased, this.saga.courseId);

    return {
      user: this.saga.user,
      status: PaymentStatus.Success
    }
  }

  public pay(): Promise<{ paymentLink: string; user: UserEntity }> {
    throw new Error('Sorry, already finshed.');
  }
}

export class BuyCourseSagaStatePurchased extends BuyCourseState {
  public cancel(): Promise<{ user: UserEntity }> {
    throw new Error('Sorry, already in process.');
  }

  checkPayment(): Promise<{ user: UserEntity, status: PaymentStatus }> {
    throw new Error('Sorry, already finished.');
  }

  public pay(): Promise<{ paymentLink: string; user: UserEntity }> {
    throw new Error('Sorry, already finished.');
  }
}

export class BuyCourseSagaStateCanceled extends BuyCourseState {
  public cancel(): Promise<{ user: UserEntity }> {
    throw new Error('Sorry, already canceled.');
  }

  checkPayment(): Promise<{ user: UserEntity, status: PaymentStatus }> {
    throw new Error('Sorry, already finished.');
  }

  public async pay(): Promise<{ paymentLink: string; user: UserEntity }> {
    this.saga.setState(PurchaseState.Started, this.saga.courseId);
    return this.saga.getState().pay();
  }
}
