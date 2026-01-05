import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Organization } from './entities/organization.entity';
import { Task } from './entities/task.entity';
import { AuditLog } from './entities/audit-log.entity';
import { AuthModule } from './modules/auth.module';
import { TasksModule } from './modules/tasks.module';
import { AuditModule } from './modules/audit.module';
import { Role, TaskPriority, TaskStatus } from '../../../libs/data/src/index';

describe('API Endpoints (e2e)', () => {
  let app: INestApplication;
  let baseUrl: string;
  let userRepo: Repository<User>;
  let orgRepo: Repository<Organization>;
  let taskRepo: Repository<Task>;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [User, Organization, Task, AuditLog],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([User, Organization, Task, AuditLog]),
        PassportModule,
        JwtModule.register({
          global: true,
          secret: 'test-jwt-secret',
          signOptions: { expiresIn: '1h' },
        }),
        AuthModule,
        TasksModule,
        AuditModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    await app.listen(0);
    baseUrl = await app.getUrl();

    userRepo = moduleRef.get<Repository<User>>(getRepositoryToken(User));
    orgRepo = moduleRef.get<Repository<Organization>>(getRepositoryToken(Organization));
    taskRepo = moduleRef.get<Repository<Task>>(getRepositoryToken(Task));

    await seedTestData();
  });

  afterAll(async () => {
    await app.close();
  });

  it('authenticates and allows Owner to create tasks', async () => {
    const ownerToken = await login('owner@acme.com', 'owner123');

    const response = await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        title: 'Owner task',
        description: 'Created via test',
        category: 'Work',
        priority: 'high',
        status: 'todo',
      }),
    });

    expect(response.status).toBe(201);
    const payload = await response.json();
    expect(payload.title).toBe('Owner task');
  });

  it('prevents Viewer from creating tasks', async () => {
    const viewerToken = await login('viewer@acme.com', 'viewer123');

    const response = await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${viewerToken}`,
      },
      body: JSON.stringify({
        title: 'Viewer task',
        category: 'Work',
        priority: 'low',
        status: 'todo',
      }),
    });

    expect(response.status).toBe(403);
  });

  it('scopes tasks to Viewer organization', async () => {
    const viewerToken = await login('viewer@acme.com', 'viewer123');

    const response = await fetch(`${baseUrl}/tasks`, {
      headers: {
        Authorization: `Bearer ${viewerToken}`,
      },
    });

    expect(response.status).toBe(200);
    const tasks = await response.json();
    expect(tasks.every((task: Task) => task.organizationId === 2)).toBe(true);
  });

  it('allows Owner but not Viewer to view audit logs', async () => {
    const ownerToken = await login('owner@acme.com', 'owner123');
    const viewerToken = await login('viewer@acme.com', 'viewer123');

    const ownerResponse = await fetch(`${baseUrl}/audit-log`, {
      headers: {
        Authorization: `Bearer ${ownerToken}`,
      },
    });
    expect(ownerResponse.status).toBe(200);

    const viewerResponse = await fetch(`${baseUrl}/audit-log`, {
      headers: {
        Authorization: `Bearer ${viewerToken}`,
      },
    });
    expect(viewerResponse.status).toBe(403);
  });

  async function login(email: string, password: string): Promise<string> {
    const response = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    expect(response.status).toBe(201);
    const payload = await response.json();
    return payload.access_token as string;
  }

  async function seedTestData(): Promise<void> {
    const parentOrg = await orgRepo.save(orgRepo.create({ name: 'Acme Corp' }));
    const childOrg = await orgRepo.save(
      orgRepo.create({ name: 'Acme Engineering', parentId: parentOrg.id }),
    );

    const ownerPassword = await bcrypt.hash('owner123', 10);
    const adminPassword = await bcrypt.hash('admin123', 10);
    const viewerPassword = await bcrypt.hash('viewer123', 10);

    const owner = await userRepo.save(
      userRepo.create({
        email: 'owner@acme.com',
        password: ownerPassword,
        firstName: 'Owner',
        lastName: 'User',
        role: Role.OWNER,
        organizationId: parentOrg.id,
      }),
    );

    const admin = await userRepo.save(
      userRepo.create({
        email: 'admin@acme.com',
        password: adminPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: Role.ADMIN,
        organizationId: parentOrg.id,
      }),
    );

    const viewer = await userRepo.save(
      userRepo.create({
        email: 'viewer@acme.com',
        password: viewerPassword,
        firstName: 'Viewer',
        lastName: 'User',
        role: Role.VIEWER,
        organizationId: childOrg.id,
      }),
    );

    await taskRepo.save([
      taskRepo.create({
        title: 'Parent task',
        description: 'Parent org task',
        status: TaskStatus.TODO,
        category: 'Work',
        priority: TaskPriority.HIGH,
        createdById: owner.id,
        organizationId: parentOrg.id,
        order: 0,
      }),
      taskRepo.create({
        title: 'Child task',
        description: 'Child org task',
        status: TaskStatus.TODO,
        category: 'Work',
        priority: TaskPriority.LOW,
        createdById: viewer.id,
        organizationId: childOrg.id,
        order: 0,
      }),
      taskRepo.create({
        title: 'Admin task',
        description: 'Admin org task',
        status: TaskStatus.IN_PROGRESS,
        category: 'Work',
        priority: TaskPriority.MEDIUM,
        createdById: admin.id,
        organizationId: parentOrg.id,
        order: 1,
      }),
    ]);
  }
});
