import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));
  
  app.enableCors();
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log('');
  console.log('To use the console:');
  console.log('  1. Start infrastructure: npm run docker:up');
  console.log('  2. Run console: npx node-console --yes');
}

// Export for console
export { bootstrap };

// Start server if run directly
if (require.main === module) {
  bootstrap();
}
