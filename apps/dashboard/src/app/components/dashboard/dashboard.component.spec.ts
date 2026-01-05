import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { TaskService } from '../../services/task.service';
import { AuthService } from '../../services/auth.service';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let authService: AuthServiceMock;

  class TaskServiceMock {
    getTasks = jasmine.createSpy().and.returnValue(of([]));
    updateTask = jasmine.createSpy().and.returnValue(of({}));
  }

  class AuthServiceMock {
    currentUser: any = { role: 'Viewer' };
    currentUser$ = of(this.currentUser);
    getCurrentUser() {
      return this.currentUser;
    }
    logout = jasmine.createSpy();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DashboardComponent],
      providers: [
        { provide: TaskService, useClass: TaskServiceMock },
        { provide: AuthService, useClass: AuthServiceMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as unknown as AuthServiceMock;
  });

  it('should prevent Viewer from creating tasks', () => {
    component.currentUser = { role: 'Viewer' };
    expect(component.canCreateTask()).toBe(false);
  });

  it('should allow Owner to create tasks', () => {
    component.currentUser = { role: 'Owner' };
    expect(component.canCreateTask()).toBe(true);
  });

  it('should filter tasks by status and category', () => {
    component.tasks = [
      {
        id: 1,
        title: 'Task A',
        status: 'todo',
        category: 'Work',
        priority: 'low',
        createdById: 1,
        organizationId: 1,
        order: 0,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 2,
        title: 'Task B',
        status: 'done',
        category: 'Personal',
        priority: 'high',
        createdById: 1,
        organizationId: 1,
        order: 1,
        createdAt: '2024-01-02T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      },
    ];

    component.selectedStatus = 'todo';
    component.selectedCategory = 'Work';
    component.sortBy = 'order';
    component.applyFilters();

    expect(component.filteredTasks.length).toBe(1);
    expect(component.filteredTasks[0].title).toBe('Task A');
  });

  it('should only allow drag-and-drop when no filters are active', () => {
    component.currentUser = { role: 'Owner' };
    component.selectedStatus = 'all';
    component.selectedCategory = 'all';
    component.sortBy = 'order';
    expect(component.canDragDrop()).toBe(true);

    component.selectedCategory = 'Work';
    expect(component.canDragDrop()).toBe(false);
  });
});
