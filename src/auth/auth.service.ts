import { BadRequestException, Injectable } from "@nestjs/common";

@Injectable()
export class AuthService {


  async login(email: string, password: string) {
   return 'hi'
  }
}