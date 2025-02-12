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
    .addTag('User Profile', 'User profile management and personal information')
    .addTag('User Data', 'User health and fitness data management')
    .addTag('Exercises', 'Exercise library and workout components')
    .addTag('Workouts', 'Workout routines and session tracking')
    .addTag('Food', 'Food database and nutritional information')
    .addTag('Nutrition', 'Meal tracking and nutrition planning')
    .addTag('AI Chat', 'AI-powered fitness coaching and conversation')
    .addTag('Community', 'Social features and community interaction')
    .addTag('Notifications', 'User notification management')
    .addTag('Recipes', 'Recipe search and nutrition information')
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
      .swagger-ui .opblock-tag[data-tag="User Profile"] { border-color: #2196F3 }
      .swagger-ui .opblock-tag[data-tag="User Data"] { border-color: #673AB7 }
      .swagger-ui .opblock-tag[data-tag="Exercises"] { border-color: #FF9800 }
      .swagger-ui .opblock-tag[data-tag="Workouts"] { border-color: #E91E63 }
      .swagger-ui .opblock-tag[data-tag="Food"] { border-color: #3F51B5 }
      .swagger-ui .opblock-tag[data-tag="Nutrition"] { border-color: #9C27B0 }
      .swagger-ui .opblock-tag[data-tag="AI Chat"] { border-color: #00BCD4 }
      .swagger-ui .opblock-tag[data-tag="Community"] { border-color: #009688 }
      .swagger-ui .opblock-tag[data-tag="Notifications"] { border-color: #795548 }
      .swagger-ui .opblock-tag[data-tag="Recipes"] { border-color: #FF5722 }
      
      .swagger-ui .opblock { margin: 0 0 15px }
      .swagger-ui .opblock .opblock-summary { padding: 8px }
      .swagger-ui .opblock .opblock-summary-description { font-size: 13px }
      .swagger-ui .parameters-col_description { width: 35% }
      .swagger-ui .parameters-col_name { width: 20% }
      .swagger-ui table tbody tr td { padding: 10px 0 }
      .swagger-ui .prop-format { color: #999 }
      
      .swagger-ui .response-col_status { width: 100px }
      .swagger-ui .response-col_description { width: auto }
      .swagger-ui .model-box { padding: 10px }
      .swagger-ui section.models { margin: 30px 0 }
      .swagger-ui section.models.is-open h4 { margin: 0 0 10px }
      .swagger-ui .model-title { font-size: 16px }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      defaultModelsExpandDepth: 3,
      defaultModelExpandDepth: 3,
      displayRequestDuration: true,
      docExpansion: 'none',
      filter: true,
      showCommonExtensions: true,
      showExtensions: true,
      tagsSorter: 'alpha',
      operationsSorter: (a, b) => {
        const methodsOrder = [
          'get',
          'post',
          'put',
          'delete',
          'patch',
          'options',
          'trace',
        ];
        const compare =
          methodsOrder.indexOf(a.get('method')) -
          methodsOrder.indexOf(b.get('method'));
        if (compare === 0) {
          return a.get('path').localeCompare(b.get('path'));
        }
        return compare;
      },
    },
  });
}
