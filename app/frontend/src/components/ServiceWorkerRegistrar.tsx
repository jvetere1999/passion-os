"use client";

import { useEffect } from "react";

/**
 * Service Worker Registration & Cache Invalidation
 * PERF-001: Browser Caching Implementation
 * Reference: MEDIUM_TASKS_EXECUTION_PLAN.md#perf-001-browser-caching
 * Status: Phase 2 & 3 - Service Worker + Cache Invalidation
 * 
 * Responsibilities:
 * 1. Register service worker on mount
 * 2. Check API cache version from backend
 * 3. Clear cache if version mismatch (cache invalidation)
 * 4. Handle registration errors gracefully
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      console.warn('[SW] Service Worker not supported in this browser');
      return;
    }

    // Register service worker
    const swUrl = "/sw.js";
    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        console.log('[SW] Registration successful:', registration);
        
        // Check cache version and invalidate if needed
        checkAndInvalidateCacheIfNeeded(registration);
        
        // Send user ID to service worker for per-user cache isolation
        notifyServiceWorkerOfUserId(registration);
      })
      .catch((err) => {
        console.error('[SW] Registration failed:', err);
      });
  }, []);

  return null;
}

/**
 * Check API cache version and clear cache if mismatch
 * Cache Version Source: X-Cache-Version header from backend
 * 
 * Flow:
 * 1. Fetch latest X-Cache-Version from API (no-cache to bypass browser cache)
 * 2. Validate version header format (security: prevent injection)
 * 3. Compare with stored sessionStorage version (session-only, not persistent)
 * 4. If mismatch: clear service worker cache and update stored version
 * 5. If match: cache is valid, no action needed
 */
async function checkAndInvalidateCacheIfNeeded(registration: ServiceWorkerRegistration) {
  try {
    const CACHE_VERSION_KEY = 'api-cache-version';
    
    // Fetch a small endpoint to get X-Cache-Version header
    // Using no-cache to ensure we get fresh headers from server
    const response = await fetch('/api/', {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
      },
      credentials: 'include', // Include cookies for auth
    });

    // Extract version from X-Cache-Version header
    const serverVersion = response.headers.get('X-Cache-Version');
    
    // Validate version header format (security: prevent injection)
    if (!serverVersion || !/^[a-zA-Z0-9._\-]+$/.test(serverVersion)) {
      console.log('[SW] Invalid or missing cache version header, skipping validation');
      return;
    }

    // Use sessionStorage instead of localStorage (session-only, not persistent across tabs)
    const storedVersion = sessionStorage.getItem(CACHE_VERSION_KEY);

    console.log('[SW] Server cache version:', serverVersion, 'Stored:', storedVersion);

    // If versions don't match, invalidate cache
    if (serverVersion && serverVersion !== storedVersion) {
      console.log('[SW] Cache version mismatch! Clearing cache...');
      
      // Send message to service worker to clear cache
      if (registration.active) {
        const channel = new MessageChannel();
        registration.active.postMessage(
          { type: 'CLEAR_CACHE' },
          [channel.port2]
        );

        // Wait for response with timeout
        const clearPromise = new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Service worker cache clear timeout'));
          }, 5000);

          channel.port1.onmessage = (event: MessageEvent) => {
            clearTimeout(timeout);
            if (event.data.success) {
              console.log('[SW] Cache cleared successfully');
              // Update stored version
              sessionStorage.setItem(CACHE_VERSION_KEY, serverVersion);
              console.log('[SW] Updated cache version to:', serverVersion);
              resolve();
            } else {
              console.error('[SW] Error clearing cache:', event.data.error);
              reject(new Error(event.data.error));
            }
          };
        });

        await clearPromise;
      }
    } else if (serverVersion && !storedVersion) {
      // First time - just store the version
      sessionStorage.setItem(CACHE_VERSION_KEY, serverVersion);
      console.log('[SW] Initial cache version set to:', serverVersion);
    }
  } catch (error) {
    // If API fetch fails (might be offline), don't clear cache
    // This preserves cached data when network is unavailable
    console.warn('[SW] Could not check cache version (offline?):', error);
  }
}

/**
 * Notify service worker of current user ID for per-user cache isolation
 * This ensures each user has isolated cached data on shared devices
 */
async function notifyServiceWorkerOfUserId(registration: ServiceWorkerRegistration) {
  try {
    if (!registration.active) return;

    // Try to get user ID from IndexedDB or localStorage
    const userId = await getUserIdForCache();
    
    if (!userId) {
      console.log('[SW] No user ID available for cache isolation');
      return;
    }

    const channel = new MessageChannel();
    registration.active.postMessage(
      { type: 'UPDATE_USER_ID', userId },
      [channel.port2]
    );

    channel.port1.onmessage = (event: MessageEvent) => {
      if (event.data.success) {
        console.log('[SW] Updated cache for user:', userId, 'Cache name:', event.data.cacheName);
      }
    };
  } catch (error) {
    console.warn('[SW] Error notifying service worker of user ID:', error);
  }
}

/**
 * Get user ID from storage for cache isolation
 */
async function getUserIdForCache(): Promise<string | null> {
  try {
    // Try IndexedDB first (if app stores it there)
    return new Promise((resolve) => {
      try {
        const request = indexedDB.open('ignition-db');
        request.onsuccess = () => {
          try {
            const db = request.result;
            const transaction = db.transaction(['auth'], 'readonly');
            const store = transaction.objectStore('auth');
            const query = store.get('userId');
            query.onsuccess = () => {
              resolve(query.result?.userId || null);
            };
            query.onerror = () => resolve(null);
          } catch {
            resolve(null);
          }
        };
        request.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  } catch {
    return null;
  }
}

