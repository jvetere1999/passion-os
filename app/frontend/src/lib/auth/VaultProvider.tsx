/**
 * VaultProvider Context
 * 
 * Manages vault lock state and auto-lock behavior across the application.
 * - Exposes isLocked state to all components
 * - Handles auto-lock on inactivity (10 minutes)
 * - Handles auto-lock when app backgrounded
 * - Provides lock/unlock methods
 */

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { lockVault, unlockVault, getVaultLockState, VaultLockState } from '@/lib/api/vault';

interface VaultContextType {
  isLocked: boolean;
  lockReason: string | null;
  lockVault: (reason: 'idle' | 'backgrounded' | 'logout' | 'force' | 'rotation' | 'admin') => Promise<void>;
  unlockVault: (passphrase: string) => Promise<void>;
  setManualLock: (locked: boolean) => void;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export const useVault = () => {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error('useVault must be used within VaultProvider');
  }
  return context;
};

interface VaultProviderProps {
  children: React.ReactNode;
}

export const VaultProvider: React.FC<VaultProviderProps> = ({ children }) => {
  const [isLocked, setIsLocked] = useState(false);
  const [lockReason, setLockReason] = useState<string | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const visibilityHandlerRef = useRef<(() => void) | null>(null);
  const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

  // Initialize vault state on mount
  useEffect(() => {
    const initVaultState = async () => {
      try {
        // Check if user is authenticated before fetching vault state
        const sessionResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.ecent.online'}/auth/session`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        // If no session, skip vault state fetch
        if (!sessionResponse.ok) {
          console.log('No active session, skipping vault state initialization');
          return;
        }

        const sessionData = await sessionResponse.json() as { user: unknown };
        if (!sessionData.user) {
          console.log('No authenticated user, skipping vault state initialization');
          return;
        }

        // User is authenticated, fetch vault state
        const state = await getVaultLockState();
        setIsLocked(state.locked_at !== null);
        setLockReason(state.lock_reason);
      } catch (error) {
        console.error('Failed to initialize vault state:', error);
        setIsLocked(true); // Default to locked on error
      }
    };

    initVaultState();
  }, []);

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    if (!isLocked) {
      inactivityTimerRef.current = setTimeout(async () => {
        try {
          // Check if user is authenticated before locking vault
          const sessionResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.ecent.online'}/auth/session`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          });

          // If no session, don't try to lock vault
          if (!sessionResponse.ok) {
            console.log('No active session, skipping vault lock on inactivity');
            return;
          }

          const sessionData = await sessionResponse.json() as { user: unknown };
          if (!sessionData.user) {
            console.log('No authenticated user, skipping vault lock on inactivity');
            return;
          }

          await lockVault('idle');
          setIsLocked(true);
          setLockReason('idle');
        } catch (error) {
          console.error('Failed to auto-lock vault on inactivity:', error);
        }
      }, INACTIVITY_TIMEOUT_MS);
    }
  }, [isLocked]);

  // Track user activity for inactivity timeout
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'mousemove'];
    const handleActivity = () => {
      resetInactivityTimer();
    };

    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    // Initial timer
    resetInactivityTimer();

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [isLocked, resetInactivityTimer]);

  // Handle app backgrounding (visibility change)
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    visibilityHandlerRef.current = async () => {
      if (document.hidden) {
        // App backgrounded - check auth before locking
        try {
          // Check if user is authenticated before locking vault
          const sessionResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.ecent.online'}/auth/session`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          });

          // If no session, don't try to lock vault
          if (!sessionResponse.ok) {
            console.log('No active session, skipping vault lock on background');
            return;
          }

          const sessionData = await sessionResponse.json() as { user: unknown };
          if (!sessionData.user) {
            console.log('No authenticated user, skipping vault lock on background');
            return;
          }

          await lockVault('backgrounded');
          setIsLocked(true);
          setLockReason('backgrounded');
        } catch (error) {
          console.error('Failed to lock vault on background:', error);
        }
      }
    };

    document.addEventListener('visibilitychange', visibilityHandlerRef.current);

    return () => {
      if (visibilityHandlerRef.current) {
        document.removeEventListener('visibilitychange', visibilityHandlerRef.current);
      }
    };
  }, []);

  // Lock vault handler
  const handleLockVault = useCallback(
    async (reason: 'idle' | 'backgrounded' | 'logout' | 'force' | 'rotation' | 'admin') => {
      try {
        await lockVault(reason);
        setIsLocked(true);
        setLockReason(reason);
      } catch (error) {
        console.error('Failed to lock vault:', error);
        throw error;
      }
    },
    []
  );

  // Unlock vault handler
  const handleUnlockVault = useCallback(async (passphrase: string) => {
    try {
      const response = await unlockVault(passphrase);
      setIsLocked(response.locked_at !== null);
      setLockReason(response.lock_reason);
      resetInactivityTimer();
    } catch (error) {
      console.error('Failed to unlock vault:', error);
      throw error;
    }
  }, [resetInactivityTimer]);

  // Manual lock/unlock (for UI testing)
  const setManualLock = useCallback((locked: boolean) => {
    setIsLocked(locked);
  }, []);

  const value: VaultContextType = {
    isLocked,
    lockReason,
    lockVault: handleLockVault,
    unlockVault: handleUnlockVault,
    setManualLock,
  };

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
};
