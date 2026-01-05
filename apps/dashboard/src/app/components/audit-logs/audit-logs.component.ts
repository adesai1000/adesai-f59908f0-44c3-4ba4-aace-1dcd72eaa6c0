import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AuditService, AuditLog } from '../../services/audit.service';

@Component({
  selector: 'app-audit-logs',
  templateUrl: './audit-logs.component.html',
  styleUrls: ['./audit-logs.component.css'],
})
export class AuditLogsComponent implements OnInit {
  logs: AuditLog[] = [];
  loading = true;
  errorMessage = '';
  currentUser: any;

  constructor(
    private auditService: AuditService,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.canViewAuditLogs()) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.loadLogs();
  }

  loadLogs(): void {
    this.loading = true;
    this.auditService.getAuditLogs().subscribe({
      next: (logs) => {
        this.logs = logs;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load audit logs.';
        this.loading = false;
      },
    });
  }

  canViewAuditLogs(): boolean {
    return this.currentUser?.role === 'Owner';
  }

  logout(): void {
    this.authService.logout();
  }
}
