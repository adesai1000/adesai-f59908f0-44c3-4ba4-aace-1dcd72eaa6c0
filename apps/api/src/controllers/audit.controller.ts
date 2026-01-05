import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AuditService } from '../services/audit.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PermissionsGuard, RequirePermissions } from '../../../../libs/auth/src/index';
import { Permission } from '../../../../libs/data/src/index';

@Controller('audit-log')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.READ_AUDIT_LOG)
  findAll(@Request() req) {
    return this.auditService.getAllAuditLogs(100);
  }
}

