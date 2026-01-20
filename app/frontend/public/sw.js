/**
 * Service Worker for Browser Caching (SECURITY HARDENED)
 * PERF-001: Browser Caching Implementation
 * Reference: MEDIUM_TASKS_EXECUTION_PLAN.md#perf-001-browser-caching
 * Status: Phase 2 & 3 - Service Worker + Cache Invalidation
 * 
 * Purpose: Cache API responses on the device for offline support and faster repeat requests
 * Strategy: Network-first with cache fallback (only for safe endpoints)
 * - Fetch latest data from network when available
 * - Use cached data if offline
 * - Cache API responses for 5 minutes (TTL enforced)
 * 
 * Security Features:
 * - Endpoint whitelist (only cache non-sensitive endpoints)
 * - Per-user cache isolation (prevents cross-user data leaks)
 * - 5-minute TTL enforcement with metadata
 * - Content validation before caching
 * - Cross-origin request filtering
 * - Error response filtering (no 4xx/5xx caching)
 */

// Cache name template - will include user ID at runtime
let CACHE_NAME = 'ignition-cache-v1';
const CACHE_PREFIX = 'ignition-cache-v1-user-';
const CACHE_MAX_AGE_MS = 5 * 60 * 1000;  // 5 minutes TTL

/**
 * Endpoint whitelist: Only cache these endpoints (safe, non-sensitive)
 * Excluded: /api/vault/*, /api/goals/*, /api/entries/*, /api/auth/*, /api/users/*
 */
const CACHEABLE_ENDPOINTS = [
  '/api/health',           // Health check
  '/api/config',           // Public configuration
  '/api/version',          // Version info
  '/api/onboarding',       // Onboarding data (non-sensitive)
];

/**
 * Initialize cache name with user ID if available
 * Falls back to default if user not identifiable
 */
async function initializeCacheName() {
  try {
    // Try to get user ID from IndexedDB or session storage
    const userId = await getUserIdFromIndexedDB();
    if (userId) {
      CACHE_NAME = `${CACHE_PREFIX}${userId}`;
      console.log('[Service Worker] Initialized cache with user ID:', userId);
    }
  } catch (err) {
    console.warn('[Service Worker] Could not initialize user-based cache:', err);
    // Fall back to default cache name
  }
}

/**
 * Get user ID from IndexedDB (if stored by app)
 */
async function getUserIdFromIndexedDB() {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open('ignition-db');
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['auth'], 'readonly');
        const store = transaction.objectStore('auth');
        const query = store.get('userId');
        query.onsuccess = () => {
          resolve(query.result?.userId || null);
        };
        query.onerror = () => resolve(null);
      };
      request.onerror = () => resolve(null);
    } catch (err) {
      resolve(null);
    }
  });
}

/**
 * Check if endpoint is in whitelist
 */
function isEndpointCacheable(urlPath) {
  return CACHEABLE_ENDPOINTS.some(endpoint => 
    urlPath === endpoint || urlPath.startsWith(endpoint + '/')
  );
}

/**
 * Check if this is same-origin request
 */
function isSameOrigin(url) {
  try {
    const requestUrl = new URL(url);
    return requestUrl.origin === self.location.origin;
  } catch {
    return false;
  }
}

/**
 * Validate response content-type and structure
 */
async function isValidCacheableResponse(response) {
  if (!response.ok) {
    console.log('[Service Worker] Skipping cache for non-ok response:', response.status);
    return false;  // Don't cache error responses
  }

  const contentType = response.headers.get('content-type');
  
  // Only cache JSON responses
  if (!contentType || !contentType.includes('application/json')) {
    console.log('[Service Worker] Skipping cache for non-JSON response:', contentType);
    return false;
  }

  // Validate JSON structure
  try {
    const cloned = response.clone();
    const data = await cloned.json();
    // Ensure response is actually JSON (not error page)
    return typeof data === 'object' && data !== null;
  } catch (err) {
    console.error('[Service Worker] Invalid JSON in response, not caching:', err);
    return false;
  }
}

/**
 * Get cache metadata key for storing TTL and timestamp
 */
function getMetadataKey(url) {
  return `metadata:${url}`;
}

/**
 * Check if cached response is expired (TTL check)
 */
async function isCacheExpired(cache, request) {
  try {
    const metadataKey = getMetadataKey(request.url);
    const metadataResponse = await cache.match(metadataKey);
    
    if (!metadataResponse) {
      return true;  // No metadata = expired
    }

    const metadata = await metadataResponse.json();
    const age = Date.now() - metadata.timestamp;
    
    if (age > CACHE_MAX_AGE_MS) {
      console.log('[Service Worker] Cache expired (TTL exceeded):', request.url);
      // Clean up expired entry
      await cache.delete(request);
      await cache.delete(metadataKey);
      return true;
    }

    return false;
  } catch (err) {
    console.error('[Service Worker] Error checking cache expiration:', err);
    return true;  // Assume expired on error
  }
}
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting(); // Activate immediately without waiting for other clients
});

/**
 * Activate event: Clean up old caches and take control
 * Runs after installation when service worker becomes active
 */
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    (async () => {
      // Initialize user-based cache on activation
      await initializeCacheName();

      // Clean up old cache versions
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => {
          // Keep current cache and user-specific caches
          if (!cacheName.startsWith(CACHE_PREFIX) && cacheName !== CACHE_NAME && cacheName !== 'ignition-cache-v1') {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );

      self.clients.claim(); // Take control of all pages immediately
    })()
  );
});

/**
 * Fetch event: Intercept network requests
 * Strategy: Network-first with cache fallback (endpoint whitelist enforced)
 * 1. Check if endpoint is whitelisted and same-origin
 * 2. Try to fetch from network
 * 3. If successful and response valid, cache it with TTL
 * 4. If offline or network fails, return cached response if not expired
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only cache GET API requests
  if (request.method !== 'GET') return;
  if (!url.pathname.startsWith('/api/')) return;
  if (!isSameOrigin(request.url)) return;
  if (!isEndpointCacheable(url.pathname)) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        // Try to fetch from network first
        const response = await fetch(request);
        
        // Validate and cache successful responses
        if (await isValidCacheableResponse(response)) {
          console.log('[Service Worker] Caching API response:', request.url);
          
          // Store response clone
          cache.put(request, response.clone());
          
          // Store metadata (timestamp for TTL calculation)
          const metadataKey = getMetadataKey(request.url);
          const metadata = {
            timestamp: Date.now(),
            expiresAt: Date.now() + CACHE_MAX_AGE_MS,
          };
          cache.put(metadataKey, new Response(JSON.stringify(metadata), {
            headers: { 'Content-Type': 'application/json' },
          }));
        }
        
        return response;
      } catch (err) {
        // Network request failed - try cache
        console.log('[Service Worker] Network failed, trying cache:', request.url);
        
        // Check if cached response exists and is not expired
        const cached = await cache.match(request);
        if (cached && !await isCacheExpired(cache, request)) {
          console.log('[Service Worker] Returning cached response (TTL valid)');
          return cached;
        }

        // No valid cache available - return offline error
        console.warn('[Service Worker] No valid cached response available');
        return new Response(
          JSON.stringify({ error: 'Offline - no cached data available' }),
          {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    })
  );
});

/**
 * Message event: Handle cache operations from client
 * - CLEAR_CACHE: Force clear all cache (used on logout or version mismatch)
 * - GET_CACHE_VERSION: Report current cache name
 * - UPDATE_USER_ID: Update cache name on user login/logout
 */
self.addEventListener('message', (event) => {
  const { data } = event;
  
  if (data && data.type === 'CLEAR_CACHE') {
    console.log('[Service Worker] Clearing cache on client request');
    
    caches.delete(CACHE_NAME).then(() => {
      console.log('[Service Worker] Cache cleared successfully');
      event.ports[0].postMessage({ success: true });
    }).catch((err) => {
      console.error('[Service Worker] Error clearing cache:', err);
      event.ports[0].postMessage({ success: false, error: err.message });
    });
  }
  
  if (data && data.type === 'GET_CACHE_VERSION') {
    console.log('[Service Worker] Reporting cache name:', CACHE_NAME);
    event.ports[0].postMessage({ version: CACHE_NAME });
  }

  if (data && data.type === 'UPDATE_USER_ID') {
    // Update cache name when user logs in/out
    const newUserId = data.userId;
    if (newUserId) {
      CACHE_NAME = `${CACHE_PREFIX}${newUserId}`;
      console.log('[Service Worker] Updated cache name for user:', newUserId);
    } else {
      CACHE_NAME = 'ignition-cache-v1';
      console.log('[Service Worker] Reset cache to default (user logged out)');
    }
    event.ports[0].postMessage({ success: true, cacheName: CACHE_NAME });
  }
});

