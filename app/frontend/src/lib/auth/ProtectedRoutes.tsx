/**
 * Route Protection Components
 * 
 * Components for protecting routes based on authentication and roles.
 * Provides ProtectedRoute, PublicRoute, and AdminRoute wrappers.
 */

'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './AuthContext';
import { UserRole } from './types';

interface RouteProtectionProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * ProtectedRoute Component
 * 
 * Wraps components that require authentication.
 * Redirects to login if user is not authenticated.
 * 
 * @example
 * ```tsx
 * <ProtectedRoute>
 *   <Dashboard />
 * </ProtectedRoute>
 * ```
 */
export const ProtectedRoute: React.FC<RouteProtectionProps> = ({
  children,
  requiredRoles,
  fallback,
  redirectTo = '/login',
}) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    // Not authenticated
    if (!isAuthenticated) {
      router.push(`${redirectTo}?from=${encodeURIComponent(pathname)}`);
      return;
    }

    // Check role requirements
    if (requiredRoles && user && !requiredRoles.includes(user.role)) {
      router.push('/unauthorized');
      return;
    }
  }, [isAuthenticated, isLoading, user, requiredRoles, router, pathname, redirectTo]);

  // Show fallback while loading
  if (isLoading) {
    return fallback || <div>Loading...</div>;
  }

  // Not authenticated or wrong role
  if (!isAuthenticated || (requiredRoles && user && !requiredRoles.includes(user.role))) {
    return fallback || null;
  }

  return <>{children}</>;
};

/**
 * PublicRoute Component
 * 
 * Wraps components that are only for unauthenticated users.
 * Redirects to dashboard if user is already authenticated.
 * 
 * @example
 * ```tsx
 * <PublicRoute>
 *   <LoginPage />
 * </PublicRoute>
 * ```
 */
export const PublicRoute: React.FC<{
  children: React.ReactNode;
  redirectTo?: string;
  fallback?: React.ReactNode;
}> = ({ children, redirectTo = '/dashboard', fallback }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // Already authenticated
    if (isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  // Show fallback while loading
  if (isLoading) {
    return fallback || <div>Loading...</div>;
  }

  // Already authenticated
  if (isAuthenticated) {
    return fallback || null;
  }

  return <>{children}</>;
};

/**
 * AdminRoute Component
 * 
 * Wraps components that only admins can access.
 * Redirects to unauthorized page if user is not an admin.
 * 
 * @example
 * ```tsx
 * <AdminRoute>
 *   <AdminPanel />
 * </AdminRoute>
 * ```
 */
export const AdminRoute: React.FC<RouteProtectionProps> = ({
  children,
  fallback,
  redirectTo = '/unauthorized',
}) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    // Not authenticated
    if (!isAuthenticated) {
      router.push(`/login?from=${encodeURIComponent(pathname)}`);
      return;
    }

    // Not an admin
    if (user && user.role !== 'admin') {
      router.push(redirectTo);
      return;
    }
  }, [isAuthenticated, isLoading, user, router, pathname, redirectTo]);

  // Show fallback while loading
  if (isLoading) {
    return fallback || <div>Loading...</div>;
  }

  // Not authenticated or not an admin
  if (!isAuthenticated || (user && user.role !== 'admin')) {
    return fallback || null;
  }

  return <>{children}</>;
};

/**
 * RoleRoute Component
 * 
 * Wraps components that require specific roles.
 * Generic component for any role-based access control.
 * 
 * @example
 * ```tsx
 * <RoleRoute requiredRoles={['admin', 'moderator']}>
 *   <ModeratorPanel />
 * </RoleRoute>
 * ```
 */
export const RoleRoute: React.FC<RouteProtectionProps> = ({
  children,
  requiredRoles = [],
  fallback,
  redirectTo = '/unauthorized',
}) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    // Not authenticated
    if (!isAuthenticated) {
      router.push(`/login?from=${encodeURIComponent(pathname)}`);
      return;
    }

    // Check role requirements
    if (requiredRoles.length > 0 && user && !requiredRoles.includes(user.role)) {
      router.push(redirectTo);
      return;
    }
  }, [isAuthenticated, isLoading, user, requiredRoles, router, pathname, redirectTo]);

  // Show fallback while loading
  if (isLoading) {
    return fallback || <div>Loading...</div>;
  }

  // Not authenticated or wrong role
  if (!isAuthenticated || (requiredRoles.length > 0 && user && !requiredRoles.includes(user.role))) {
    return fallback || null;
  }

  return <>{children}</>;
};

/**
 * ConditionalRender Component
 * 
 * Conditionally render content based on authentication and roles.
 * Useful for showing/hiding UI elements without routing.
 * 
 * @example
 * ```tsx
 * <ConditionalRender requiredRoles={['admin']}>
 *   <AdminButton />
 * </ConditionalRender>
 * ```
 */
export const ConditionalRender: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
  requiredRoles?: UserRole[];
  requiredPermission?: string;
}> = ({
  children,
  fallback = null,
  requireAuth = false,
  requiredRoles,
  requiredPermission,
}) => {
  const { isAuthenticated, user, hasRole, hasPermission } = useAuth();

  // Check auth requirement
  if (requireAuth && !isAuthenticated) {
    return fallback;
  }

  // Check role requirement
  if (requiredRoles && user && !hasRole(requiredRoles)) {
    return fallback;
  }

  // Check permission requirement
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return fallback;
  }

  return <>{children}</>;
};
