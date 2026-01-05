import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { Organization } from './entities/organization.entity';
import { Task } from './entities/task.entity';
import { AuditLog } from './entities/audit-log.entity';
import { AuthModule } from './modules/auth.module';
import { TasksModule } from './modules/tasks.module';
import { AuditModule } from './modules/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env', '../../.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const databasePath =
          configService.get<string>('DATABASE_PATH') ||
          process.env.DATABASE_PATH ||
          'task-management.db';

        return {
          type: 'sqlite',
          database: databasePath,
          entities: [User, Organization, Task, AuditLog],
          synchronize: true,
          logging: false,
        };
      },
      inject: [ConfigService],
    }),
    PassportModule,
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const envSecret = process.env.JWT_SECRET;
        const configSecret = configService.get<string>('JWT_SECRET');
        const secret = configSecret || envSecret || 'b728fb0226d68245091790ea46e349a2e1e39abe7ee009ce16f789a88f25afb0';
        
        if (!secret || secret.trim().length === 0) {
          throw new Error('JWT_SECRET must have a value');
        }
        
        console.log('JWT Secret loaded:', secret ? 'Yes (length: ' + secret.length + ')' : 'No');
        
        return {
          secret: secret.trim(),
          signOptions: { expiresIn: '24h' },
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    TasksModule,
    AuditModule,
  ],
})
export class AppModule {}
