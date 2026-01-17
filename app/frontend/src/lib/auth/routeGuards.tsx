/**
 * Enhanced Route Protection Components
 * 
 * Components for protecting routes based on authentication state.
 * These integrate with the existing AuthProvider.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from './AuthProvider';

interface RouteGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onUnauthorized?: () => void;
}

/**
 * ProtectedRoute Component
 * 
 * Wraps components that require authentication.
 * Shows fallback while loading, redirects to login if not authenticated.
 */
export const ProtectedRoute: React.FC<RouteGuardProps> = ({
  children,
  fallback,
  onUnauthorized,
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [canRender, setCanRender] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      onUnauthorized?.();
      // Redirect to login with return path
      const loginUrl = `/login?from=${encodeURIComponent(pathname)}`;
      router.push(loginUrl);
      return;
    }

    setCanRender(true);
  }, [isAuthenticated, isLoading, pathname, router, onUnauthorized]);

  // Show fallback while loading or redirecting
  if (isLoading || !canRender) {
    return fallback || (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

/**
 * PublicRoute Component
 * 
 * Wraps components that are only for unauthenticated users.
 * Redirects to dashboard if already authenticated.
 */
export const PublicRoute: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}> = ({ children, fallback, redirectTo = '/dashboard' }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [canRender, setCanRender] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      router.push(redirectTo);
      return;
    }

    setCanRender(true);
  }, [isAuthenticated, isLoading, router, redirectTo]);

  // Show fallback while loading or redirecting
  if (isLoading || !canRender) {
    return fallback || (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

/**
 * RequireAuth Hook
 * 
 * Hook to check if user is authenticated.
 * Redirects to login if not authenticated.
 */
export function useRequireAuth(redirectTo?: string) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      const loginPath = redirectTo || `/login?from=${encodeURIComponent(pathname)}`;
      router.push(loginPath);
    }
  }, [isAuthenticated, isLoading, router, pathname, redirectTo]);

  return { isAuthenticated, isLoading, user };
}

/**
 * RequirePublic Hook
 * 
 * Hook to require user to NOT be authenticated.
 * Redirects to dashboard if already authenticated.
 */
export function useRequirePublic(redirectTo: string = '/dashboard') {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  return { isAuthenticated, isLoading };
}

/**
 * WithAuth HOC
 * 
 * Higher-order component to protect a component.
 * 
 * Usage:
 * ```tsx
 * const ProtectedDashboard = WithAuth(Dashboard);
 * export default ProtectedDashboard;
 * ```
 */
export function WithAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    fallback?: React.ReactNode;
    redirectTo?: string;
  } = {}
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute
        fallback={options.fallback}
      >
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

/**
 * WithoutAuth HOC
 * 
 * Higher-order component for public-only components.
 */
export function WithoutAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    fallback?: React.ReactNode;
    redirectTo?: string;
  } = {}
) {
  return function PublicComponent(props: P) {
    return (
      <PublicRoute
        fallback={options.fallback}
        redirectTo={options.redirectTo}
      >
        <Component {...props} />
      </PublicRoute>
    );
  };
}

/**
 * useRouterWithAuth Hook
 * 
 * Enhanced router that checks auth before navigation.
 * Useful for conditional navigation based on auth state.
 */
export function useRouterWithAuth() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const searchParams = useSearchParams();

  return {
    push: (path: string) => router.push(path),
    pushIfAuth: (path: string, publicPath?: string) => {
      if (isAuthenticated) {
        router.push(path);
      } else if (publicPath) {
        router.push(publicPath);
      }
    },
    getReturnPath: (): string => {
      return searchParams.get('from') || '/';
    },
    pushWithReturn: (path: string) => {
      const from = searchParams.get('from');
      if (from) {
        router.push(`${path}?from=${encodeURIComponent(from)}`);
      } else {
        router.push(path);
      }
    },
  };
}
