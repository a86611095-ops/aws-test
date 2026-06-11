import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./user.entity";

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async create(email: string) {
    const user = this.userRepo.create({ email });

    return this.userRepo.save(user);
  }

  async findAll() {
    return this.userRepo.find();
  }
}