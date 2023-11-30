import {Body, Controller, Post, UnauthorizedException} from '@nestjs/common';
import {AccountLogin, AccountRegister} from "../../../../../libs/contracts/src";
import {RMQService} from "nestjs-rmq";
import {LoginDto} from "../dtos/login.dto";
import {RegisterDto} from "../dtos/register.dto";

@Controller('auth')
export class AuthController {
  constructor( private readonly rmqService: RMQService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<AccountRegister.Response> {
    try {
      return await this.rmqService.send<AccountRegister.Request, AccountRegister.Response>(AccountRegister.topic, dto, { headers: { requestId: 'unique_identifier_should_be_generated' } });
    } catch (e) {
      if (e instanceof Error) {
        throw new UnauthorizedException(e.message)
      }
    }
  }

  @Post('login')
  async login(@Body() dto: LoginDto): Promise<AccountLogin.Response> {
    try {
      return await this.rmqService.send<AccountLogin.Request, AccountLogin.Response>(AccountLogin.topic, dto);
    } catch (e) {
      if (e instanceof Error) {
        throw new UnauthorizedException(e.message)
      }
    }
  }
}
