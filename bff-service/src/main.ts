import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  const port = configService.get('PORT') || 3000;

  app.enableCors({
    origin: (req, callback) => callback(null, true),
  });
  app.use(helmet());

  try {
    await app.listen(port, () => {
      console.log('App is running on %s port', port);
    });
  } catch (error) {
    console.error('Database connection failed, but app is running:', error);
  }
}
bootstrap();
