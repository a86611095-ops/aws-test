import { Controller, Post, Body, Get ,Headers, Req, Put, UseInterceptors} from '@nestjs/common';
import { AuthService } from './auth.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    console.log("controller")
    return this.authService.login(body.email, body.password);
  }
   @Post('text')
  async checkText(@Body() body: { text: string; }) {
    console.log("controller")
    return this.authService.bioToSpeech("1",body.text);
  }
@Get('health')
getHealth(@Req() req: any) {
  console.log("h",req.headers)
  console.log("rrr",req);
  return {
    userId: req.headers['x-user-id'],
  };
}
@Put('file')
@UseInterceptors(FileInterceptor('file'))

uploadFile(@Req() req: any) {
  console.log("h",req.headers)
  console.log("rrr",req);
  return this.authService.uploadAvatar(req.file);
}
@Get('file')

getImage(@Body() body: { key: string}) {

  return this.authService.getImageUrl(body.key);
}
}