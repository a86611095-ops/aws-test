import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.useGlobalPipes(); // optional for future validation

  await app.listen(5000);
  console.log(`yaay  Server running on http://localhost:4000`);
}

bootstrap();