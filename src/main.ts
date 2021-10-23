import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as basicAuth from 'express-basic-auth';
import { AppModule } from './app.module';
import { AllExceptionFilter } from './filters/all-exception.filter';

async function bootstrap() {
  const app: NestExpressApplication = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.useGlobalFilters(new AllExceptionFilter());
  app.enableCors({ credentials: true, origin: 'http://localhost:3000' });
  app.use(
    ['/api'],
    basicAuth({
      challenge: true,
      users: {
        admin: configService.get<string>('ADMIN_PASSWORD'),
      },
    }),
  );

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
