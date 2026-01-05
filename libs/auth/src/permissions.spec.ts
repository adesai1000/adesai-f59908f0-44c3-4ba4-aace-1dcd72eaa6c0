import { hasPermission, hasAnyPermission } from './permissions';
import { Role, Permission } from '../../data/src/index';

describe('Permissions', () => {
  describe('hasPermission', () => {
    it('should return true for Owner with CREATE_TASK permission', () => {
      expect(hasPermission(Role.OWNER, Permission.CREATE_TASK)).toBe(true);
    });

    it('should return true for Admin with CREATE_TASK permission', () => {
      expect(hasPermission(Role.ADMIN, Permission.CREATE_TASK)).toBe(true);
    });

    it('should return false for Viewer with CREATE_TASK permission', () => {
      expect(hasPermission(Role.VIEWER, Permission.CREATE_TASK)).toBe(false);
    });

    it('should return true for Viewer with READ_TASK permission', () => {
      expect(hasPermission(Role.VIEWER, Permission.READ_TASK)).toBe(true);
    });

    it('should return false for Viewer with READ_AUDIT_LOG permission', () => {
      expect(hasPermission(Role.VIEWER, Permission.READ_AUDIT_LOG)).toBe(false);
    });

    it('should return true for Owner with READ_AUDIT_LOG permission', () => {
      expect(hasPermission(Role.OWNER, Permission.READ_AUDIT_LOG)).toBe(true);
    });

    it('should return true for Admin with READ_AUDIT_LOG permission', () => {
      expect(hasPermission(Role.ADMIN, Permission.READ_AUDIT_LOG)).toBe(true);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true if user has at least one permission', () => {
      expect(
        hasAnyPermission(Role.VIEWER, [
          Permission.READ_TASK,
          Permission.CREATE_TASK,
        ]),
      ).toBe(true);
    });

    it('should return false if user has none of the permissions', () => {
      expect(
        hasAnyPermission(Role.VIEWER, [
          Permission.CREATE_TASK,
          Permission.DELETE_TASK,
        ]),
      ).toBe(false);
    });
  });
});
