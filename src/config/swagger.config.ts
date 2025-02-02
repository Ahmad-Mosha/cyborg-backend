import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Fitness App API')
    .setDescription(
      'The comprehensive API documentation for the Fitness Application. This API provides endpoints for managing workouts, nutrition, user profiles, and community features.',
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
    .addTag('Auth', 'Authentication endpoints for user registration and login')
    .addTag('Users', 'User profile management and settings')
    .addTag('Exercises', 'Exercise library and management')
    .addTag('Workouts', 'Workout routines and session tracking')
    .addTag('Nutrition', 'Food tracking and meal planning')
    .addTag('Community', 'Social features and community interaction')
    .addTag('Notifications', 'User notification preferences and management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    customSiteTitle: 'Fitness App API Documentation',
    customfavIcon: 'https://api.iconify.design/material-symbols:exercise.svg',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { font-size: 2.5em }
      .swagger-ui .scheme-container { background-color: #f8f9fa }
    `,
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui-themes/3.0.0/themes/3.x/theme-material.css',
    ],
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
      defaultModelsExpandDepth: 3,
      defaultModelExpandDepth: 3,
      displayRequestDuration: true,
      tryItOutEnabled: true,
    },
  });
}
