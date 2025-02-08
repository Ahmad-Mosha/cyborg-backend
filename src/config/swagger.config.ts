import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Fitness App API')
    .setDescription(
      'The comprehensive API documentation for the Fitness Application. This API provides endpoints for managing workouts, nutrition, user profiles, and community features.',
    )
    .setVersion('1.0')
    .addBearerAuth()
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
      .swagger-ui .opblock-tag {
        margin: 20px 0;
        padding: 15px;
        border-radius: 8px;
        border-left: 6px solid;
        background: #f8f9fa;
        transition: all 0.3s ease;
      }
      .swagger-ui .opblock-tag:hover { transform: translateX(5px) }
      .swagger-ui .opblock-tag[data-tag="Auth"] { border-color: #4CAF50 }
      .swagger-ui .opblock-tag[data-tag="Users"] { border-color: #2196F3 }
      .swagger-ui .opblock-tag[data-tag="Exercises"] { border-color: #FF9800 }
      .swagger-ui .opblock-tag[data-tag="Workouts"] { border-color: #E91E63 }
      .swagger-ui .opblock-tag[data-tag="Nutrition"] { border-color: #9C27B0 }
      .swagger-ui .opblock-tag[data-tag="Community"] { border-color: #00BCD4 }
      .swagger-ui .opblock-tag[data-tag="Notifications"] { border-color: #795548 }
      .swagger-ui .opblock-tag-section { position: relative }
      .swagger-ui .opblock-tag-section:not(:last-child):after {
        content: "";
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, #e0e0e0, transparent);
      }
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
