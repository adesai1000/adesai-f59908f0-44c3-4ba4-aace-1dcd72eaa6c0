import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from '../services/tasks.service';
import { CreateTaskDto, UpdateTaskDto, TaskPriority, TaskStatus } from '../../../../libs/data/src/index';

describe('TasksController', () => {
  let controller: TasksController;
  let service: TasksService;

  const mockTasksService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockReq = { user: { id: 1 }, ip: '127.0.0.1', headers: {} } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [{ provide: TasksService, useValue: mockTasksService }],
    }).compile();

    controller = module.get<TasksController>(TasksController);
    service = module.get<TasksService>(TasksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a task', async () => {
    const dto: CreateTaskDto = {
      title: 'Task',
      description: 'Desc',
      priority: TaskPriority.HIGH,
      status: TaskStatus.TODO,
      category: 'Work',
    };
    mockTasksService.create.mockResolvedValue({ id: 1, ...dto });

    const result = await controller.create(dto, mockReq);

    expect(result).toEqual({ id: 1, ...dto });
    expect(service.create).toHaveBeenCalledWith(dto, mockReq.user, mockReq);
  });

  it('should return tasks', async () => {
    mockTasksService.findAll.mockResolvedValue([{ id: 1 }]);

    const result = await controller.findAll(mockReq);

    expect(result).toEqual([{ id: 1 }]);
    expect(service.findAll).toHaveBeenCalledWith(mockReq.user);
  });

  it('should return a task by id', async () => {
    mockTasksService.findOne.mockResolvedValue({ id: 1 });

    const result = await controller.findOne(1, mockReq);

    expect(result).toEqual({ id: 1 });
    expect(service.findOne).toHaveBeenCalledWith(1, mockReq.user);
  });

  it('should update a task', async () => {
    const dto: UpdateTaskDto = { title: 'Updated' };
    mockTasksService.update.mockResolvedValue({ id: 1, ...dto });

    const result = await controller.update(1, dto, mockReq);

    expect(result).toEqual({ id: 1, ...dto });
    expect(service.update).toHaveBeenCalledWith(1, dto, mockReq.user, mockReq);
  });

  it('should remove a task', async () => {
    mockTasksService.remove.mockResolvedValue(undefined);

    const result = await controller.remove(1, mockReq);

    expect(result).toBeUndefined();
    expect(service.remove).toHaveBeenCalledWith(1, mockReq.user, mockReq);
  });
});
