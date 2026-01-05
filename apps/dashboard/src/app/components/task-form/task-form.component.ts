import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TaskService, Task, CreateTaskDto, UpdateTaskDto } from '../../services/task.service';

@Component({
  selector: 'app-task-form',
  templateUrl: './task-form.component.html',
  styleUrls: ['./task-form.component.css'],
})
export class TaskFormComponent implements OnInit {
  @Input() task: Task | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  taskForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private taskService: TaskService,
  ) {
    this.taskForm = this.fb.group({
      title: ['', [Validators.required]],
      description: [''],
      category: ['General'],
      priority: ['medium'],
      status: ['todo'],
    });
  }

  ngOnInit(): void {
    if (this.task) {
      this.taskForm.patchValue({
        title: this.task.title,
        description: this.task.description || '',
        category: this.task.category,
        priority: this.task.priority,
        status: this.task.status,
      });
    }
  }

  onSubmit(): void {
    if (this.taskForm.valid) {
      this.isSubmitting = true;
      this.errorMessage = '';
      const formValue = this.taskForm.value;

      if (this.task) {
        // Update existing task
        const updateDto: UpdateTaskDto = {
          title: formValue.title,
          description: formValue.description,
          category: formValue.category,
          priority: formValue.priority,
          status: formValue.status,
        };

        this.taskService.updateTask(this.task.id, updateDto).subscribe({
          next: () => {
            this.saved.emit();
            this.isSubmitting = false;
          },
          error: (error) => {
            console.error('Error updating task:', error);
            this.errorMessage = this.getErrorMessage(error, 'update');
            this.isSubmitting = false;
          },
        });
      } else {
        // Create new task
        const createDto: CreateTaskDto = {
          title: formValue.title,
          description: formValue.description,
          category: formValue.category,
          priority: formValue.priority,
          status: formValue.status,
        };

        this.taskService.createTask(createDto).subscribe({
          next: () => {
            this.saved.emit();
            this.isSubmitting = false;
          },
          error: (error) => {
            console.error('Error creating task:', error);
            this.errorMessage = this.getErrorMessage(error, 'create');
            this.isSubmitting = false;
          },
        });
      }
    }
  }

  onCancel(): void {
    this.close.emit();
  }

  private getErrorMessage(error: any, action: 'create' | 'update'): string {
    if (error?.status === 403) {
      return `You do not have permission to ${action} tasks.`;
    }
    if (error?.status === 401) {
      return 'Your session expired. Please log in again.';
    }
    return 'Something went wrong. Please try again.';
  }
}
