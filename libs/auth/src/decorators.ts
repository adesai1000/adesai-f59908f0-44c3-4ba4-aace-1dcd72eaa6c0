import { SetMetadata } from '@nestjs/common';
import { Permission } from '../../data/src/index';

export const PERMISSIONS_KEY = 'permissions';
export const ROLES_KEY = 'roles';

/**
 * Decorator to require specific permissions
 */
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

/**
 * Decorator to require specific roles
 */
export const RequireRoles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

