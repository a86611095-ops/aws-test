import { Controller, Post, Body, Get ,Headers} from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    console.log("controller")
    return this.authService.login(body.email, body.password);
  }
@Get('health')
getHealth(@Headers() headers: any) {
  return {
    userId: headers['x-user-id'],
  };
}
}