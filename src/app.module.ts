import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
console.log(process.env.DB_USERNAME,"dfghjk")
import dotenv from 'dotenv'
import { User } from './user/user.entity';
dotenv.config();

@Module({
   imports: [AuthModule, UserModule,
   TypeOrmModule.forRoot({
  type: 'postgres',
  host: process.env.DB_HOST,
    entities: [User],

  port: 5433,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  synchronize: true,
  ssl: {
    rejectUnauthorized: false,
  },
}),
    ],
})
export class AppModule {}