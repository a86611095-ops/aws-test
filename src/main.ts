import { NestFactory } from '@nestjs/core';
import { createClient } from 'redis';
import { AppModule } from './app.module';

export const redisClient = createClient({
  url: 'redis://localhost:6379',
});

async function bootstrap() {
  // // await redisClient.connect();

  // // redisClient.on('error', (err) => {
  // //   console.error('Redis Error:', err);
  // // });

  // console.log('Redis Connected');

  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.useGlobalPipes();

  await app.listen(4000);

  console.log('Runnig on ttp://localhost:4000');
}

bootstrap();