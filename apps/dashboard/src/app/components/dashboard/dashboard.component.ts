import { Component, OnInit } from '@angular/core';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { TaskService, Task } from '../../services/task.service';
import { AuthService } from '../../services/auth.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  currentUser: any;
  selectedStatus: string = 'all';
  selectedCategory: string = 'all';
  sortBy: string = 'order';
  showTaskForm: boolean = false;
  editingTask: Task | null = null;

  constructor(
    private taskService: TaskService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
    this.loadTasks();
  }

  loadTasks(): void {
    this.taskService.getTasks().subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error loading tasks:', error);
      },
    });
  }

  applyFilters(): void {
    let filtered = [...this.tasks];

    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter((task) => task.status === this.selectedStatus);
    }

    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(
        (task) => task.category === this.selectedCategory,
      );
    }

    // Sort
    if (this.sortBy === 'order') {
      filtered.sort((a, b) => a.order - b.order);
    } else if (this.sortBy === 'priority') {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      filtered.sort(
        (a, b) =>
          priorityOrder[b.priority] - priorityOrder[a.priority],
      );
    } else if (this.sortBy === 'created') {
      filtered.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }

    this.filteredTasks = filtered;
  }

  getCategories(): string[] {
    const categories = new Set(this.tasks.map((task) => task.category));
    return Array.from(categories);
  }

  onStatusChange(status: string): void {
    this.selectedStatus = status;
    this.applyFilters();
  }

  onCategoryChange(category: string): void {
    this.selectedCategory = category;
    this.applyFilters();
  }

  onSortChange(sortBy: string): void {
    this.sortBy = sortBy;
    this.applyFilters();
  }

  onDrop(event: CdkDragDrop<Task[]>): void {
    const task = event.item.data;
    const previousStatus = event.previousContainer.id;
    const newStatus = event.container.id;

    if (!this.canDragDrop()) {
      return;
    }

    const originalState = new Map(
      this.tasks.map((item) => [item.id, { status: item.status, order: item.order }]),
    );

    if (previousStatus === newStatus) {
      const list = this.getTasksByStatus(previousStatus);
      moveItemInArray(list, event.previousIndex, event.currentIndex);
      this.applyOrder(list);
      this.persistOrderChanges(list, originalState);
      return;
    }

    if (task.status !== newStatus) {
      const sourceList = this.getTasksByStatus(previousStatus);
      const targetList = this.getTasksByStatus(newStatus);

      transferArrayItem(sourceList, targetList, event.previousIndex, event.currentIndex);
      targetList.forEach((item) => {
        if (item.id === task.id) {
          item.status = newStatus as any;
        }
      });

      this.applyOrder(sourceList);
      this.applyOrder(targetList);
      this.persistOrderChanges([...sourceList, ...targetList], originalState);
    }
  }

  openTaskForm(task?: Task): void {
    if (!this.canCreateTask() && !task) {
      return;
    }
    this.editingTask = task || null;
    this.showTaskForm = true;
    if (!task) {
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 0);
    }
  }

  closeTaskForm(): void {
    this.showTaskForm = false;
    this.editingTask = null;
  }

  onTaskSaved(): void {
    this.closeTaskForm();
    this.loadTasks();
  }

  deleteTask(task: Task): void {
    if (!this.canModifyTask()) {
      return;
    }
    if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
      this.taskService.deleteTask(task.id).subscribe({
        next: () => {
          this.loadTasks();
        },
        error: (error) => {
          console.error('Error deleting task:', error);
        },
      });
    }
  }

  logout(): void {
    this.authService.logout();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'todo':
        return 'bg-muted text-muted-foreground';
      case 'in_progress':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      case 'done':
        return 'bg-green-500/10 text-green-700 dark:text-green-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high':
        return 'bg-red-500/10 text-red-700 dark:text-red-400';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
      case 'low':
        return 'bg-green-500/10 text-green-700 dark:text-green-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  }

  canCreateTask(): boolean {
    return this.hasEditorRole();
  }

  canModifyTask(): boolean {
    return this.hasEditorRole();
  }

  canViewAuditLogs(): boolean {
    return this.currentUser?.role === 'Owner';
  }

  canDragDrop(): boolean {
    return (
      this.canModifyTask() &&
      this.selectedStatus === 'all' &&
      this.selectedCategory === 'all' &&
      this.sortBy === 'order'
    );
  }

  private hasEditorRole(): boolean {
    const role = this.currentUser?.role;
    return role === 'Owner' || role === 'Admin';
  }

  private getTasksByStatus(status: string): Task[] {
    return this.tasks
      .filter((task) => task.status === status)
      .sort((a, b) => a.order - b.order);
  }

  private applyOrder(tasks: Task[]): void {
    tasks.forEach((task, index) => {
      task.order = index;
    });
  }

  private persistOrderChanges(
    tasks: Task[],
    originalState: Map<number, { status: Task['status']; order: number }>,
  ): void {
    const updates = tasks
      .filter((task) => {
        const original = originalState.get(task.id);
        return !original || original.order !== task.order || original.status !== task.status;
      })
      .map((task) =>
        this.taskService.updateTask(task.id, {
          status: task.status,
          order: task.order,
        }),
      );

    if (updates.length === 0) {
      return;
    }

    forkJoin(updates).subscribe({
      next: () => {
        this.loadTasks();
      },
      error: (error) => {
        console.error('Error updating task order:', error);
        this.loadTasks();
      },
    });
  }

  getTodoTasks(): Task[] {
    return this.filteredTasks.filter((t) => t.status === 'todo');
  }

  getInProgressTasks(): Task[] {
    return this.filteredTasks.filter((t) => t.status === 'in_progress');
  }

  getDoneTasks(): Task[] {
    return this.filteredTasks.filter((t) => t.status === 'done');
  }
}
