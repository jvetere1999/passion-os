"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { getSession, signOut as apiSignOut, getSignInUrl, type AuthUser } from "./api-auth";

/**
 * Auth context type
 */
interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (provider?: 'google' | 'azure') => void;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Auth Provider - manages session state via backend API
 *
 * Replaces NextAuth.js SessionProvider.
 * All auth logic is in the Rust backend.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch session on mount and when window gains focus
    const fetchSession = useCallback(async () => {
      console.log('[AuthProvider] fetchSession called');
      setIsLoading(true);
      try {
        console.log('[AuthProvider] Fetching session...');
        const session = await getSession();
        console.log('[AuthProvider] Session fetch succeeded:', session.user);
        setUser(session.user);
      } catch (err) {
        console.error('[AuthProvider] Session fetch failed:', err);
        setUser(null);
      } finally {
        console.log('[AuthProvider] Setting isLoading to false');
        setIsLoading(false);
      }
    }, []);

  useEffect(() => {
      console.log('[AuthProvider] Mounted');
      fetchSession();

      // Refetch on focus (user might have logged in/out in another tab)
      const handleFocus = () => {
        console.log('[AuthProvider] Window focused, refetching session');
        fetchSession();
      };
      window.addEventListener('focus', handleFocus);
      return () => {
        console.log('[AuthProvider] Unmounted');
        window.removeEventListener('focus', handleFocus);
      };
    }, [fetchSession]);

  // Sign in - redirect to backend OAuth endpoint
  const signIn = useCallback((provider: 'google' | 'azure' = 'google') => {
    window.location.href = getSignInUrl(provider);
  }, []);

  // Sign out - call backend and redirect
  const signOut = useCallback(async () => {
    await apiSignOut();
    setUser(null);
  }, []);

  // Refresh session data
  const refresh = useCallback(async () => {
    await fetchSession();
  }, [fetchSession]);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    signIn,
    signOut,
    refresh,
  };

  return (
      <AuthContext.Provider value={value}>
        {isLoading ? (
          <div style={{ textAlign: 'center', marginTop: '2rem', color: 'red' }}>
            <p>Loading session...</p>
            {/* Show error if session fetch failed */}
            {!user && !isLoading && (
              <p style={{ color: 'red' }}>Session fetch failed. Please check your connection or try again.</p>
            )}
          </div>
        ) : children}
      </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Hook that requires authentication
 * Redirects to sign in if not authenticated
 */
export function useRequireAuth() {
  const { user, isAuthenticated, isLoading, signIn } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      signIn();
    }
  }, [isLoading, isAuthenticated, signIn]);

  return {
    isLoading,
    user,
    isAuthenticated,
  };
}

/**
 * SessionProvider - alias for AuthProvider for backwards compatibility
 */
export const SessionProvider = AuthProvider;
