import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Organization } from './entities/organization.entity';
import { Task } from './entities/task.entity';
import { AuditLog } from './entities/audit-log.entity';
import { Role, TaskStatus, TaskPriority } from '../../../libs/data/src/index';

async function seed() {
  const databasePath = process.env.DATABASE_PATH || 'task-management.db';
  const dataSource = new DataSource({
    type: 'sqlite',
    database: databasePath,
    entities: [User, Organization, Task, AuditLog],
    synchronize: true,
  });

  await dataSource.initialize();

  const orgRepo = dataSource.getRepository(Organization);
  const userRepo = dataSource.getRepository(User);
  const taskRepo = dataSource.getRepository(Task);

  // Create organizations
  const parentOrg = orgRepo.create({
    name: 'Acme Corporation',
  });
  await orgRepo.save(parentOrg);

  const childOrg = orgRepo.create({
    name: 'Acme Engineering',
    parentId: parentOrg.id,
  });
  await orgRepo.save(childOrg);

  // Create users
  const ownerPassword = await bcrypt.hash('owner123', 10);
  const owner = userRepo.create({
    email: 'owner@acme.com',
    password: ownerPassword,
    firstName: 'John',
    lastName: 'Owner',
    role: Role.OWNER,
    organizationId: parentOrg.id,
  });
  await userRepo.save(owner);

  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = userRepo.create({
    email: 'admin@acme.com',
    password: adminPassword,
    firstName: 'Jane',
    lastName: 'Admin',
    role: Role.ADMIN,
    organizationId: parentOrg.id,
  });
  await userRepo.save(admin);

  const viewerPassword = await bcrypt.hash('viewer123', 10);
  const viewer = userRepo.create({
    email: 'viewer@acme.com',
    password: viewerPassword,
    firstName: 'Bob',
    lastName: 'Viewer',
    role: Role.VIEWER,
    organizationId: childOrg.id,
  });
  await userRepo.save(viewer);

  // Create tasks
  const tasks = [
    {
      title: 'Setup project infrastructure',
      description: 'Configure CI/CD pipeline and deployment',
      status: TaskStatus.IN_PROGRESS,
      category: 'Work',
      priority: TaskPriority.HIGH,
      createdById: owner.id,
      organizationId: parentOrg.id,
      order: 0,
    },
    {
      title: 'Design database schema',
      description: 'Create ERD and implement migrations',
      status: TaskStatus.DONE,
      category: 'Work',
      priority: TaskPriority.HIGH,
      createdById: admin.id,
      organizationId: parentOrg.id,
      order: 1,
    },
    {
      title: 'Implement authentication',
      description: 'JWT-based auth with RBAC',
      status: TaskStatus.TODO,
      category: 'Work',
      priority: TaskPriority.MEDIUM,
      createdById: admin.id,
      organizationId: parentOrg.id,
      order: 2,
    },
    {
      title: 'Code review',
      description: 'Review PR #123',
      status: TaskStatus.TODO,
      category: 'Work',
      priority: TaskPriority.LOW,
      createdById: viewer.id,
      organizationId: childOrg.id,
      order: 0,
    },
  ];

  for (const taskData of tasks) {
    const task = taskRepo.create(taskData);
    await taskRepo.save(task);
  }

  console.log('Seed data created successfully!');
  console.log('Users:');
  console.log('  Owner: owner@acme.com / owner123');
  console.log('  Admin: admin@acme.com / admin123');
  console.log('  Viewer: viewer@acme.com / viewer123');

  await dataSource.destroy();
}

seed().catch((error) => {
  console.error('Error seeding database:', error);
  process.exit(1);
});
