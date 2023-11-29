import {IUser, IUserCourses, PurchaseState, UserRole} from "@microservices/interfaces";
import {compare, genSalt, hash} from "bcryptjs";

export class UserEntity implements IUser {
  _id?: string;
  displayName?: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  courses?: IUserCourses[]

  constructor(user: IUser) {
    this._id = user._id;
    this.displayName = user.displayName;
    this.email = user.email;
    this.role = user.role;
    this.passwordHash = user.passwordHash
    this.courses = user.courses
  }

  public getPublicProfile() {
    return {
      email: this.email,
      role: this.role,
      displayName: this.displayName,
    }
  }

  public addCourse(courseId: string) {
    const exists = this.courses.find(c => c._id === courseId);
    if (exists) {
      throw new Error('This course already in the your courses list');
    }
    this.courses.push({
      courseId,
      purchaseState: PurchaseState.Started
    })
  }

  public deleteCourse(courseId: string) {
    this.courses = this.courses.filter(c => c._id !== courseId);
  }

  public updateCourseStatus(courseId: string, state: PurchaseState) {
    this.courses = this.courses.map(c => {
      if (c._id === courseId) {
        c.purchaseState = state;
        return c;
      }
      return c;
    })
  }

  public async setPassword(password: string) {
    const salt = await genSalt(10);
    this.passwordHash = await hash(password, salt);
    return this;
  }

  public validatePassword(password: string) {
    return compare(password, this.passwordHash);
  }

  public updateProfile(displayName: string) {
    this.displayName = displayName;
    return this;
  }
}
