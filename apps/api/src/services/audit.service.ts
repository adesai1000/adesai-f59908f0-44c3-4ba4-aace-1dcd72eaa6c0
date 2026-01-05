import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(
    user: User,
    action: string,
    resource: string,
    resourceId?: number,
    details?: string,
    request?: any,
  ): Promise<void> {
    const auditLog = this.auditLogRepository.create({
      userId: user.id,
      action,
      resource,
      resourceId: resourceId || null,
      details: details || null,
      ipAddress: request?.ip || request?.connection?.remoteAddress || null,
      userAgent: request?.headers?.['user-agent'] || null,
    });

    await this.auditLogRepository.save(auditLog);

    // Also log to console
    console.log(
      `[AUDIT] ${new Date().toISOString()} - User ${user.email} (${user.role}) - ${action} ${resource}${resourceId ? ` #${resourceId}` : ''}${details ? ` - ${details}` : ''}`,
    );
  }

  async getAuditLogs(user: User, limit: number = 100): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { userId: user.id },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getAllAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}

