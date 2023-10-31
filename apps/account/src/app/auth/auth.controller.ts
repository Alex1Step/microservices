import {Body, Controller, Post} from '@nestjs/common';
import {AuthService} from "./auth.service";

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterDTO) {
    return this.authService.register(dto);
  }

  // @Post('register')
  // async register(@Body() dto: RegisterDTO) {
  //   return this.authService.register(dto);
  // }
}

export class RegisterDTO {
  email: string;
  password: string;
  displayName?: string;
}
