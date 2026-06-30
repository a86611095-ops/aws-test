import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
console.log(process.env.DB_USERNAME,"dfghjk")
import dotenv from 'dotenv'
dotenv.config();

@Module({
   imports: [AuthModule, UserModule,
   TypeOrmModule.forRoot({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: 5432,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: {
    rejectUnauthorized: false,
  },
}),
    ],
})
export class AppModule {}