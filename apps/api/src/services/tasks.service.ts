import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Task } from '../entities/task.entity';
import { Organization } from '../entities/organization.entity';
import { User } from '../entities/user.entity';
import { CreateTaskDto, UpdateTaskDto, TaskStatus, TaskPriority } from '../../../../libs/data/src/index';
import { RbacService } from '../../../../libs/auth/src/index';
import { AuditService } from './audit.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    private rbacService: RbacService,
    private auditService: AuditService,
  ) {}

  async create(createTaskDto: CreateTaskDto, user: User, request: any): Promise<Task> {
    const taskData = {
      ...createTaskDto,
      createdById: user.id,
      organizationId: user.organizationId,
      status: createTaskDto.status || TaskStatus.TODO,
      category: createTaskDto.category || 'General',
      priority: createTaskDto.priority || TaskPriority.MEDIUM,
      order: 0,
    };
    const task = this.taskRepository.create(taskData);

    const savedTask = await this.taskRepository.save(task);

    await this.auditService.log(
      user,
      'CREATE',
      'task',
      savedTask.id,
      `Created task: ${savedTask.title}`,
      request,
    );

    return savedTask;
  }

  async findAll(user: User): Promise<Task[]> {
    const organizations = await this.organizationRepository.find();
    const accessibleOrgIds = this.rbacService.getAccessibleOrganizationIds(
      user.organizationId,
      organizations,
    );

    const tasks = await this.taskRepository.find({
      where: { organizationId: In(accessibleOrgIds) },
      relations: ['createdBy', 'organization'],
      order: { order: 'ASC', createdAt: 'DESC' },
    });

    // Filter tasks based on role
    return tasks.filter((task) =>
      this.rbacService.canAccessTask(user, task, organizations),
    );
  }

  async findOne(id: number, user: User): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['createdBy', 'organization'],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    const organizations = await this.organizationRepository.find();
    if (!this.rbacService.canAccessTask(user, task, organizations)) {
      throw new ForbiddenException('You do not have access to this task');
    }

    return task;
  }

  async update(
    id: number,
    updateTaskDto: UpdateTaskDto,
    user: User,
    request: any,
  ): Promise<Task> {
    const task = await this.findOne(id, user);

    const organizations = await this.organizationRepository.find();
    if (!this.rbacService.canModifyTask(user, task, organizations)) {
      throw new ForbiddenException('You do not have permission to modify this task');
    }

    Object.assign(task, updateTaskDto);
    const updatedTask = await this.taskRepository.save(task);

    await this.auditService.log(
      user,
      'UPDATE',
      'task',
      updatedTask.id,
      `Updated task: ${updatedTask.title}`,
      request,
    );

    return updatedTask;
  }

  async remove(id: number, user: User, request: any): Promise<void> {
    const task = await this.findOne(id, user);

    const organizations = await this.organizationRepository.find();
    if (!this.rbacService.canDeleteTask(user, task, organizations)) {
      throw new ForbiddenException('You do not have permission to delete this task');
    }

    await this.taskRepository.remove(task);

    await this.auditService.log(
      user,
      'DELETE',
      'task',
      id,
      `Deleted task: ${task.title}`,
      request,
    );
  }
}
