import { Injectable } from '@nestjs/common';
import { Role, Permission, User, Organization, Task } from '../../data/src/index';
import { hasPermission } from './permissions';

@Injectable()
export class RbacService {
  /**
   * Check if user has a specific permission
   */
  hasPermission(user: User, permission: Permission): boolean {
    return hasPermission(user.role, permission);
  }

  /**
   * Check if user can access a task based on organization hierarchy
   */
  canAccessTask(
    user: User,
    task: Task,
    organizations?: Organization[],
  ): boolean {
    // Owner and Admin can access tasks in their org and child orgs
    if (user.role === Role.OWNER || user.role === Role.ADMIN) {
      return this.isInOrganizationHierarchy(
        user.organizationId,
        task.organizationId,
        organizations,
      );
    }
    // Viewer can only access tasks in their own org
    if (user.role === Role.VIEWER) {
      return user.organizationId === task.organizationId;
    }
    return false;
  }

  /**
   * Check if user can modify a task
   */
  canModifyTask(
    user: User,
    task: Task,
    organizations?: Organization[],
  ): boolean {
    if (!this.canAccessTask(user, task, organizations)) {
      return false;
    }
    // Only Owner and Admin can modify tasks
    return user.role === Role.OWNER || user.role === Role.ADMIN;
  }

  /**
   * Check if user can delete a task
   */
  canDeleteTask(
    user: User,
    task: Task,
    organizations?: Organization[],
  ): boolean {
    return this.canModifyTask(user, task, organizations);
  }

  /**
   * Get all organization IDs that user can access (including child orgs)
   */
  getAccessibleOrganizationIds(
    userOrgId: number,
    organizations: Organization[],
  ): number[] {
    const accessibleIds = [userOrgId];
    const findChildren = (orgId: number) => {
      const children = organizations.filter((org) => org.parentId === orgId);
      children.forEach((child) => {
        accessibleIds.push(child.id);
        findChildren(child.id);
      });
    };
    findChildren(userOrgId);
    return accessibleIds;
  }

  /**
   * Check if targetOrgId is in the hierarchy of userOrgId
   */
  private isInOrganizationHierarchy(
    userOrgId: number,
    targetOrgId: number,
    organizations?: Organization[],
  ): boolean {
    if (userOrgId === targetOrgId) {
      return true;
    }
    if (!organizations) {
      // If we don't have org data, assume same org only
      return userOrgId === targetOrgId;
    }
    // Check if targetOrg is a child of userOrg
    const findInHierarchy = (orgId: number, targetId: number): boolean => {
      if (orgId === targetId) return true;
      const children = organizations.filter((org) => org.parentId === orgId);
      return children.some((child) => findInHierarchy(child.id, targetId));
    };
    return findInHierarchy(userOrgId, targetOrgId);
  }

  /**
   * Check if user can view audit logs
   */
  canViewAuditLog(user: User): boolean {
    return (
      user.role === Role.OWNER || user.role === Role.ADMIN
    );
  }
}
