import { Body, Controller, Get, Post } from "@nestjs/common";
import { UserService } from "./user.service";

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() body: { email: string }) {
    return this.userService.create(body.email);
  }

  @Get()
  getAll() {
    return this.userService.findAll();
  }
}