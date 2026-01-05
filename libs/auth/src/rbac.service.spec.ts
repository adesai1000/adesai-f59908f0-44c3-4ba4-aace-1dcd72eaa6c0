import { Test, TestingModule } from '@nestjs/testing';
import { RbacService } from './rbac.service';
import { Role, Task, User, Organization, TaskStatus, TaskPriority } from '../../data/src/index';

describe('RbacService', () => {
  let service: RbacService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RbacService],
    }).compile();

    service = module.get<RbacService>(RbacService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('canAccessTask', () => {
    const mockUser: User = {
      id: 1,
      email: 'test@example.com',
      password: 'hashed',
      firstName: 'Test',
      lastName: 'User',
      role: Role.ADMIN,
      organizationId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockTask: Task = {
      id: 1,
      title: 'Test Task',
      status: TaskStatus.TODO,
      category: 'Work',
      priority: TaskPriority.MEDIUM,
      createdById: 1,
      organizationId: 1,
      order: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should allow Admin to access task in same organization', () => {
      expect(service.canAccessTask(mockUser, mockTask)).toBe(true);
    });

    it('should allow Owner to access task in same organization', () => {
      const ownerUser = { ...mockUser, role: Role.OWNER };
      expect(service.canAccessTask(ownerUser, mockTask)).toBe(true);
    });

    it('should allow Viewer to access task in same organization', () => {
      const viewerUser = { ...mockUser, role: Role.VIEWER };
      expect(service.canAccessTask(viewerUser, mockTask)).toBe(true);
    });

    it('should deny Viewer access to task in different organization', () => {
      const viewerUser = { ...mockUser, role: Role.VIEWER };
      const differentOrgTask = { ...mockTask, organizationId: 2 };
      expect(service.canAccessTask(viewerUser, differentOrgTask)).toBe(false);
    });

    it('should allow Owner to access task in child organization', () => {
      const ownerUser = { ...mockUser, role: Role.OWNER };
      const childOrgTask = { ...mockTask, organizationId: 2 };
      const organizations: Organization[] = [
        { id: 1, name: 'Parent Org', parentId: null, createdAt: new Date(), updatedAt: new Date() },
        { id: 2, name: 'Child Org', parentId: 1, createdAt: new Date(), updatedAt: new Date() },
      ];

      expect(service.canAccessTask(ownerUser, childOrgTask, organizations)).toBe(true);
    });
  });

  describe('canModifyTask', () => {
    const mockUser: User = {
      id: 1,
      email: 'test@example.com',
      password: 'hashed',
      firstName: 'Test',
      lastName: 'User',
      role: Role.ADMIN,
      organizationId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockTask: Task = {
      id: 1,
      title: 'Test Task',
      status: TaskStatus.TODO,
      category: 'Work',
      priority: TaskPriority.MEDIUM,
      createdById: 1,
      organizationId: 1,
      order: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should allow Admin to modify task', () => {
      expect(service.canModifyTask(mockUser, mockTask)).toBe(true);
    });

    it('should allow Owner to modify task', () => {
      const ownerUser = { ...mockUser, role: Role.OWNER };
      expect(service.canModifyTask(ownerUser, mockTask)).toBe(true);
    });

    it('should deny Viewer from modifying task', () => {
      const viewerUser = { ...mockUser, role: Role.VIEWER };
      expect(service.canModifyTask(viewerUser, mockTask)).toBe(false);
    });
  });
});
