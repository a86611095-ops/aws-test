import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { UserService } from "./user.service";
import { redisClient } from "../main"

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
  @Get(':id')
async getUser(@Param('id') id: string) {
  const cacheKey = `user:${id}`;

  const cached = await redisClient.get(cacheKey);
console.log(cached,"from redis")
  if (cached) {
    return JSON.parse(cached);
  }

  const user = await this.userService.findById(id);

  await redisClient.set(cacheKey, JSON.stringify(user), {
    EX: 3600,
  });

  return user;
}
}