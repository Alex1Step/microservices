import {Controller, Get, Logger, Post, UseGuards} from '@nestjs/common';
import {JWTAuthGuard} from "../guards/jwt.guard";
import {UserId} from "../guards/user.decorator";
import {Cron} from "@nestjs/schedule";
import {AccountUserInfo} from "../../../../../libs/contracts/src";
import {RMQService} from "nestjs-rmq";

@Controller('user')
export class UserController {
  constructor(private readonly rmqService: RMQService) {}

  @UseGuards(JWTAuthGuard)
  @Get('info')
  async info(@UserId() userId: string): Promise<AccountUserInfo.Response> {
    return await this.rmqService.send<AccountUserInfo.Request, AccountUserInfo.Response>(AccountUserInfo.topic, {id: userId});
  }

  @Cron('*/5 * * * * *')
  async cron() {
    // Logger.log('Done')
  }
}
