'use client';

import { useAppSelector } from '@/store/hooks';
import { selectUser, selectUserRole } from '@/store/slices/authSlice';
import { UserRole } from '@/types';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
}

/**
 * Component that conditionally renders children based on user role
 * Use this for showing/hiding UI elements based on role
 */
export function RoleGuard({ children, allowedRoles, fallback = null }: RoleGuardProps) {
  const userRole = useAppSelector(selectUserRole);

  if (!userRole || !allowedRoles.includes(userRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Hook to check if current user has a specific role
 */
export function useHasRole(allowedRoles: UserRole[]): boolean {
  const userRole = useAppSelector(selectUserRole);
  return userRole ? allowedRoles.includes(userRole) : false;
}

/**
 * Hook to check if current user is at least a certain role level
 */
export function useHasMinimumRole(minimumRole: UserRole): boolean {
  const userRole = useAppSelector(selectUserRole);

  if (!userRole) return false;

  const roleHierarchy: Record<UserRole, number> = {
    [UserRole.NEWCOMER]: 0,
    [UserRole.MEMBER]: 1,
    [UserRole.STAFF]: 2,
    [UserRole.ADMIN]: 3,
  };

  return roleHierarchy[userRole] >= roleHierarchy[minimumRole];
}

/**
 * Hook to get current user's permissions
 */
export function usePermissions() {
  const user = useAppSelector(selectUser);
  const userRole = useAppSelector(selectUserRole);

  const canManageUsers = userRole === UserRole.ADMIN;
  const canManageAttendance = userRole === UserRole.STAFF || userRole === UserRole.ADMIN;
  const canManageMinistries = userRole === UserRole.STAFF || userRole === UserRole.ADMIN;
  const canManageSermons = userRole === UserRole.STAFF || userRole === UserRole.ADMIN;
  const canManageServices = userRole === UserRole.STAFF || userRole === UserRole.ADMIN;
  const canSendEmails = userRole === UserRole.STAFF || userRole === UserRole.ADMIN;
  const canManageMedia = userRole === UserRole.STAFF || userRole === UserRole.ADMIN;
  const canViewAnalytics = userRole === UserRole.STAFF || userRole === UserRole.ADMIN;
  const canAccessAdmin = userRole === UserRole.ADMIN;
  const canViewDirectory = userRole !== UserRole.NEWCOMER;
  const canJoinMinistries = userRole === UserRole.MEMBER || userRole === UserRole.STAFF || userRole === UserRole.ADMIN;

  return {
    user,
    userRole,
    canManageUsers,
    canManageAttendance,
    canManageMinistries,
    canManageSermons,
    canManageServices,
    canSendEmails,
    canManageMedia,
    canViewAnalytics,
    canAccessAdmin,
    canViewDirectory,
    canJoinMinistries,
  };
}
