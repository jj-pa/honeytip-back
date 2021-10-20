import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionFilter } from './filters/all-exception.filter';

async function bootstrap() {
  const app: NestExpressApplication = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new AllExceptionFilter());
  app.enableCors({ credentials: true, origin: 'http://localhost:3000' });

  const swaggerOptions = new DocumentBuilder()
    .setTitle('오늘의 꿀팁')
    .setDescription('오늘의 꿀팁 API')
    .setVersion('1.0.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerOptions);
  SwaggerModule.setup('api', app, document, {
    customSiteTitle: '오늘의 꿀팁',
    customfavIcon: '../favicon.ico',
  });

  await app.listen(5000);
}
bootstrap();
