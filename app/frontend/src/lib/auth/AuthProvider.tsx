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
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            width: '100%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Animated background elements */}
            <div style={{
              position: 'absolute',
              width: '400px',
              height: '400px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '50%',
              top: '-50px',
              left: '-50px',
              animation: 'float 6s ease-in-out infinite',
            }} />
            <div style={{
              position: 'absolute',
              width: '300px',
              height: '300px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '50%',
              bottom: '-100px',
              right: '-50px',
              animation: 'float 8s ease-in-out infinite reverse',
            }} />

            <div style={{
              textAlign: 'center',
              animation: 'fadeIn 0.6s ease-out',
              position: 'relative',
              zIndex: 10,
            }}>
              {/* Animated logo/icon */}
              <div style={{
                marginBottom: '2.5rem',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              }}>
                <div style={{
                  width: '70px',
                  height: '70px',
                  margin: '0 auto',
                  background: 'white',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '36px',
                  fontWeight: 'bold',
                  color: '#667eea',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                }}>
                  🎵
                </div>
              </div>

              {/* Loading text */}
              <h1 style={{
                fontSize: '28px',
                fontWeight: '700',
                color: 'white',
                margin: '0 0 0.75rem 0',
                letterSpacing: '0.5px',
              }}>
                Welcome to Passion
              </h1>

              {/* Subtext */}
              <p style={{
                fontSize: '15px',
                color: 'rgba(255, 255, 255, 0.85)',
                margin: '0 0 2.5rem 0',
                fontWeight: '500',
              }}>
                Authenticating and loading your workspace...
              </p>

              {/* Loading spinner */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '2rem',
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'white',
                  animation: 'bounce 1.4s infinite ease-in-out 0s',
                }} />
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'white',
                  animation: 'bounce 1.4s infinite ease-in-out 0.2s',
                }} />
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'white',
                  animation: 'bounce 1.4s infinite ease-in-out 0.4s',
                }} />
              </div>

              {/* Status message */}
              <p style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.7)',
                margin: 0,
              }}>
                This usually takes a few seconds...
              </p>

              <style>{`
                @keyframes fadeIn {
                  from {
                    opacity: 0;
                    transform: translateY(-20px);
                  }
                  to {
                    opacity: 1;
                    transform: translateY(0);
                  }
                }

                @keyframes pulse {
                  0%, 100% {
                    opacity: 1;
                  }
                  50% {
                    opacity: 0.7;
                  }
                }

                @keyframes float {
                  0%, 100% {
                    transform: translateY(0px);
                  }
                  50% {
                    transform: translateY(20px);
                  }
                }

                @keyframes bounce {
                  0%, 80%, 100% {
                    transform: translateY(0);
                    opacity: 1;
                  }
                  40% {
                    transform: translateY(-8px);
                  }
                }
              `}</style>
            </div>
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
