import { Component, OnInit } from '@angular/core';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  template: '<router-outlet></router-outlet>',
  styles: [],
})
export class AppComponent implements OnInit {
  title = 'Task Management System';

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    // Initialize theme service to apply saved theme
    this.themeService.darkMode$.subscribe();
  }
}

