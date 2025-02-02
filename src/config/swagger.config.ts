import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Fitness App API')
    .setDescription(
      'The comprehensive API documentation for the Fitness Application',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Users', 'User management endpoints')
    .addTag('Exercises', 'Exercise-related endpoints')
    .addTag('Workouts', 'Workout management endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    customSiteTitle: 'Fitness App API Documentation',
    customfavIcon: 'https://api.iconify.design/material-symbols:exercise.svg',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui-themes/3.0.0/themes/3.x/theme-material.css',
    ],
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  });
}
