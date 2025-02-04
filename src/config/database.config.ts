import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as path from 'path';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'sqlite',
  database: path.join(__dirname, '../../', 'data', 'fitness-app.sqlite'),
  entities: [path.join(__dirname, '../**/*.entity{.ts,.js}')],
  synchronize: true, // Set to false in production
};
