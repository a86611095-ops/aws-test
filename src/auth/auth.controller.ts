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
async getHealth(@Headers('authorization') authHeader: string) {
    return 'Ok'
  }
  // @Post('msg')
  // async queue() {
  //   return this.authService.pollMessage();
  // }
}