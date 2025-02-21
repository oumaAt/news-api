import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createDatabaseIfNotExists } from 'data-source';

async function bootstrap() {
  await createDatabaseIfNotExists();
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
