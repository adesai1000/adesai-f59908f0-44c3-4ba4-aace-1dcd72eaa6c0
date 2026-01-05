import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from '../entities/task.entity';
import { Organization } from '../entities/organization.entity';
import { TasksController } from '../controllers/tasks.controller';
import { TasksService } from '../services/tasks.service';
import { RbacService } from '../../../../libs/auth/src/index';
import { AuditModule } from './audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, Organization]),
    AuditModule,
  ],
  controllers: [TasksController],
  providers: [TasksService, RbacService],
  exports: [TasksService],
})
export class TasksModule {}

