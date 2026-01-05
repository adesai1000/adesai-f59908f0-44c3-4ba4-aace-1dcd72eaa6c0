import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AuditLog {
  id: number;
  userId: number;
  user?: {
    id: number;
    email: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  };
  action: string;
  resource: string;
  resourceId?: number | null;
  details?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuditService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  getAuditLogs(): Observable<AuditLog[]> {
    return this.http.get<AuditLog[]>(`${this.apiUrl}/audit-log`);
  }
}
