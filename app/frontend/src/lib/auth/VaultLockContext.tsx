import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { getSearchManager, type SearchableContent } from '@/lib/search/SearchIndexManager';
import { getIdeas, type Idea } from '@/lib/api/ideas';
import { getEntries, type InfobaseEntry } from '@/lib/api/infobase';

const IDLE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const POLL_INTERVAL_MS = 30 * 1000; // 30 seconds

export interface VaultLockState {
  locked_at: string | null;
  lock_reason: string | null;
}

export interface VaultLockContextType {
  isLocked: boolean;
  lockReason: string | null;
  lockVault: (reason: string) => Promise<void>;
  unlockVault: (passphrase: string) => Promise<void>;
  isUnlocking: boolean;
  unlockError: string | null;
  isSearchIndexing: boolean;
  searchIndexReady: boolean;
}

const VaultLockContext = createContext<VaultLockContextType | undefined>(undefined);

// Simple store for accessing vault lock state outside of React components (e.g., in API client)
let vaultLockStore = {
  isLocked: false,
  lockReason: null as string | null,
};

export const useVaultLockStore = {
  getState: () => vaultLockStore,
};

export const VaultLockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLocked, setIsLocked] = useState(false);
  const [lockReason, setLockReason] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [isSearchIndexing, setIsSearchIndexing] = useState(false);
  const [searchIndexReady, setSearchIndexReady] = useState(false);
  const lastActivityRef = useRef<number>(Date.now());
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clear search index
  const clearSearchIndex = useCallback(async () => {
    try {
      const searchManager = await getSearchManager();
      await searchManager.clearIndex();
      setSearchIndexReady(false);
      console.log('Search index cleared');
    } catch (error) {
      console.error('Error clearing search index:', error);
    }
  }, []);

  // Track last activity
  const recordActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    // Reset idle timer
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    
    if (!isLocked) {
      idleTimerRef.current = setTimeout(async () => {
        // Only lock vault if user is authenticated (has session)
        try {
          // First check if user has an active session
          const sessionResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.ecent.online'}/auth/session`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          });

          // If no session (401/404), don't try to lock vault
          if (!sessionResponse.ok) {
            console.log('No active session, skipping vault lock');
            return;
          }

          const sessionData = await sessionResponse.json() as { user: unknown };
          if (!sessionData.user) {
            console.log('No authenticated user, skipping vault lock');
            return;
          }

          // User is authenticated, proceed with lock
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.ecent.online'}/api/vault/lock`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ reason: 'idle' }),
          });

          if (response.ok) {
            await clearSearchIndex();
            setIsLocked(true);
            setLockReason('idle');
            vaultLockStore = { isLocked: true, lockReason: 'idle' };
          }
        } catch (error) {
          console.error('Error locking vault on idle:', error);
        }
      }, IDLE_TIMEOUT_MS);
    }
  }, [isLocked, clearSearchIndex]); // Removed lockVault dependency, using direct API call instead

  // Fetch content for search indexing
  const fetchIndexableContent = useCallback(async (): Promise<SearchableContent[]> => {
    try {
      const [ideas, entries] = await Promise.all([
        getIdeas(),
        getEntries(),
      ]);

      const content: SearchableContent[] = [];

      // Add ideas
      ideas.forEach((idea: Idea) => {
        content.push({
          id: `idea:${idea.id}`,
          contentType: 'idea',
          encryptedText: idea.content || '',
          plaintextHash: `${idea.id}-${idea.updated_at}`, // Simple hash for change detection
          tags: idea.tags || [],
          status: 'active',
          createdAt: new Date(idea.created_at),
          updatedAt: new Date(idea.updated_at),
        });
      });

      // Add infobase entries
      entries.forEach((entry: InfobaseEntry) => {
        content.push({
          id: `infobase:${entry.id}`,
          contentType: 'infobase',
          encryptedText: entry.content,
          plaintextHash: `${entry.id}-${entry.updated_at}`, // Simple hash for change detection
          tags: entry.tags || [],
          status: 'active',
          createdAt: new Date(entry.created_at),
          updatedAt: new Date(entry.updated_at),
        });
      });

      return content;
    } catch (error) {
      console.error('Error fetching indexable content:', error);
      return [];
    }
  }, []);

  // Rebuild search index
  const rebuildSearchIndex = useCallback(async () => {
    if (isLocked) return;

    try {
      setIsSearchIndexing(true);
      const searchManager = await getSearchManager();
      const content = await fetchIndexableContent();

      if (content.length === 0) {
        console.warn('No content to index');
        setIsSearchIndexing(false);
        setSearchIndexReady(false);
        return;
      }

      await searchManager.rebuildIndex(content);
      setSearchIndexReady(true);
      console.log(`Search index rebuilt with ${content.length} items`);
    } catch (error) {
      console.error('Error rebuilding search index:', error);
      setSearchIndexReady(false);
    } finally {
      setIsSearchIndexing(false);
    }
  }, [isLocked, fetchIndexableContent]);

  // Lock vault
  const lockVault = useCallback(async (reason: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.ecent.online'}/api/vault/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        throw new Error(`Failed to lock vault: ${response.statusText}`);
      }

      // Clear search index when vault locks
      await clearSearchIndex();

      setIsLocked(true);
      setLockReason(reason);
      vaultLockStore = { isLocked: true, lockReason: reason };
    } catch (error) {
      console.error('Error locking vault:', error);
    }
  }, [clearSearchIndex]);

  // Unlock vault
  const unlockVault = useCallback(async (passphrase: string) => {
    setIsUnlocking(true);
    setUnlockError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.ecent.online'}/api/vault/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ passphrase }),
      });

      if (!response.ok) {
        throw new Error('Invalid passphrase');
      }

      setIsLocked(false);
      setLockReason(null);
      vaultLockStore = { isLocked: false, lockReason: null };
      recordActivity(); // Reset idle timer after unlock

      // Rebuild search index after unlock
      // Non-blocking: do this in the background
      rebuildSearchIndex().catch(err => 
        console.error('Background search index rebuild failed:', err)
      );
    } catch (error) {
      setUnlockError(error instanceof Error ? error.message : 'Unlock failed');
    } finally {
      setIsUnlocking(false);
    }
  }, [recordActivity, rebuildSearchIndex]);

  // Poll for lock state changes (cross-device)
  const pollLockState = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.ecent.online'}/api/sync/poll`, {
        credentials: 'include',
      });

      if (!response.ok) return;

      const data = (await response.json()) as {
        vault_lock?: { locked_at: string | null; lock_reason: string | null };
      };
      
      if (data.vault_lock) {
        if (data.vault_lock.locked_at && !isLocked) {
          // Another device locked the vault
          await clearSearchIndex();
          setIsLocked(true);
          setLockReason(data.vault_lock.lock_reason);
          vaultLockStore = { isLocked: true, lockReason: data.vault_lock.lock_reason };
        } else if (!data.vault_lock.locked_at && isLocked) {
          // Vault was unlocked elsewhere
          setIsLocked(false);
          setLockReason(null);
          vaultLockStore = { isLocked: false, lockReason: null };
          // Rebuild search index after cross-device unlock
          rebuildSearchIndex().catch(err =>
            console.error('Cross-device search index rebuild failed:', err)
          );
        }
      }
    } catch (error) {
      console.error('Error polling vault state:', error);
    }
  }, [isLocked, clearSearchIndex, rebuildSearchIndex]);

  // Setup event listeners
  useEffect(() => {
    const handleActivity = () => {
      recordActivity();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // App backgrounded
        lockVault('backgrounded');
      }
    };

    // Activity listeners
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('focus', handleActivity);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initial idle timer
    recordActivity();

    // Start polling for cross-device lock changes
    pollTimerRef.current = setInterval(pollLockState, POLL_INTERVAL_MS);

    return () => {
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('focus', handleActivity);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [recordActivity, lockVault, pollLockState]);

  return (
    <VaultLockContext.Provider
      value={{
        isLocked,
        lockReason,
        lockVault,
        unlockVault,
        isUnlocking,
        unlockError,
        isSearchIndexing,
        searchIndexReady,
      }}
    >
      {children}
    </VaultLockContext.Provider>
  );
};

export const useVaultLock = () => {
  const context = useContext(VaultLockContext);
  if (!context) {
    throw new Error('useVaultLock must be used within VaultLockProvider');
  }
  return context;
};
