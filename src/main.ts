import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({ credentials: true, origin: 'http://localhost:3000' });

  const swaggerOptions = new DocumentBuilder()
    .setTitle('오늘의 꿀팁')
    .setDescription('오늘의 꿀팁 API')
    .setVersion('1.0.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerOptions);
  SwaggerModule.setup('api', app, document);

  await app.listen(5000);
}
bootstrap();
