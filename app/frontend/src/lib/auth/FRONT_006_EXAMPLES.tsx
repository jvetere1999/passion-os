/**
 * FRONT-006 Routing & Auth Examples
 * 
 * Complete working examples showing how to use the routing and
 * authentication protection system in real applications.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { 
  ProtectedRoute,
  PublicRoute,
  WithAuth,
  useRequireAuth,
  useRequirePublic,
  useRouterWithAuth,
} from '@/lib/auth/routeGuards';
import { useApiClient } from '@/lib/api/authenticatedClient';
import { useForm } from '@/lib/forms/useForm';
import { loginSchema, signupSchema } from '@/lib/forms/schemas';

// ============================================================================
// EXAMPLE 1: Login Page (Public Route)
// ============================================================================

/**
 * Login page - only accessible when NOT logged in
 * Uses FRONT-005 form system with FRONT-006 auth protection
 */
export function LoginPageExample() {
  const router = useRouterWithAuth();
  const { signIn } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const form = useForm({
    schema: loginSchema,
    onSubmit: async (data) => {
      setIsSigningIn(true);
      try {
        // Backend handles OAuth flow
        signIn(data.email.includes('azure') ? 'azure' : 'google');
      } catch (err) {
        form.setError('root.serverError', {
          type: 'manual',
          message: 'Login failed. Please try again.',
        });
      } finally {
        setIsSigningIn(false);
      }
    },
  });

  return (
    <PublicRoute
      fallback={<div>Redirecting...</div>}
      redirectTo="/dashboard"
    >
      <div className="max-w-md mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Login</h1>
        
        <form onSubmit={form.handleSubmit as any} className="space-y-4">
          {/* Email field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              {...form.register('email')}
              className="w-full px-3 py-2 border rounded"
              disabled={isSigningIn}
            />
            {form.formState.errors.email && (
              <p className="text-red-600 text-sm mt-1">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          {/* OAuth Buttons */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => signIn('google')}
              disabled={isSigningIn}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isSigningIn ? 'Signing in...' : 'Sign in with Google'}
            </button>
            <button
              type="button"
              onClick={() => signIn('azure')}
              disabled={isSigningIn}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
            >
              {isSigningIn ? 'Signing in...' : 'Sign in with Azure'}
            </button>
          </div>
        </form>

        <p className="text-sm text-gray-600 mt-4">
          Don't have an account? <a href="/signup" className="text-blue-600">Sign up</a>
        </p>
      </div>
    </PublicRoute>
  );
}

// ============================================================================
// EXAMPLE 2: Dashboard Page (Protected Route)
// ============================================================================

/**
 * Dashboard component - requires authentication
 * Shows user data and uses authenticated API calls
 */
function DashboardComponent() {
  const { user, signOut, isLoading } = useAuth();
  const api = useApiClient();
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Fetch user stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      const response = await api.get('/dashboard/stats');
      if (response.ok) {
        setStats(response.data);
      }
      setStatsLoading(false);
    };

    if (!isLoading) {
      fetchStats();
    }
  }, [api, isLoading]);

  const handleLogout = async () => {
    await signOut();
  };

  if (isLoading) return <div>Loading auth...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header with user info */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {user?.name}</h1>
          <p className="text-gray-600">{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Logout
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {statsLoading ? (
          <div>Loading stats...</div>
        ) : stats ? (
          <>
            <div className="p-4 bg-blue-100 rounded">
              <h3 className="font-semibold">Active</h3>
              <p className="text-2xl">{stats.active}</p>
            </div>
            <div className="p-4 bg-green-100 rounded">
              <h3 className="font-semibold">Completed</h3>
              <p className="text-2xl">{stats.completed}</p>
            </div>
            <div className="p-4 bg-purple-100 rounded">
              <h3 className="font-semibold">Total</h3>
              <p className="text-2xl">{stats.total}</p>
            </div>
          </>
        ) : (
          <div>Failed to load stats</div>
        )}
      </div>

      {/* User profile section */}
      <div className="bg-gray-50 p-4 rounded">
        <h2 className="text-xl font-bold mb-4">Profile</h2>
        <div className="space-y-2">
          <p><strong>ID:</strong> {user?.id}</p>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Name:</strong> {user?.name}</p>
          <p><strong>Role:</strong> {user?.role}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Dashboard page wrapper with protection
 */
export function DashboardPageExample() {
  return (
    <ProtectedRoute
      fallback={<div className="flex items-center justify-center p-8">Loading...</div>}
    >
      <DashboardComponent />
    </ProtectedRoute>
  );
}

// ============================================================================
// EXAMPLE 3: Settings Page (Protected with Hook)
// ============================================================================

/**
 * Settings component using useRequireAuth hook
 * Shows conditional content based on auth state
 */
export function SettingsPageExample() {
  const { isAuthenticated, user, isLoading } = useRequireAuth();
  const [settings, setSettings] = useState<any>(null);

  // Will be null if not authenticated
  if (!isAuthenticated || isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="space-y-6">
        {/* General Settings */}
        <section className="border-t pt-6">
          <h2 className="text-xl font-bold mb-4">General</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3 py-2 border rounded bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <input
                type="text"
                defaultValue={user?.name || ''}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
          </div>
        </section>

        {/* Notification Settings */}
        <section className="border-t pt-6">
          <h2 className="text-xl font-bold mb-4">Notifications</h2>
          <div className="space-y-2">
            <label className="flex items-center">
              <input type="checkbox" defaultChecked className="mr-2" />
              Email notifications
            </label>
            <label className="flex items-center">
              <input type="checkbox" defaultChecked className="mr-2" />
              Push notifications
            </label>
          </div>
        </section>

        {/* Save button */}
        <div className="border-t pt-6">
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// EXAMPLE 4: Admin Panel (Protected Component)
// ============================================================================

/**
 * Admin component - shows admin-specific content
 */
function AdminPanelComponent() {
  const { user } = useAuth();
  const api = useApiClient();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch users list
  useEffect(() => {
    const fetchUsers = async () => {
      const response = await api.get('/admin/users');
      if (response.ok) {
        setUsers(response.data);
      }
      setLoading(false);
    };

    fetchUsers();
  }, [api]);

  if (!user) return null; // Should not happen with useAuth

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>

      {/* User management */}
      <section>
        <h2 className="text-xl font-bold mb-4">Users ({users.length})</h2>
        {loading ? (
          <div>Loading users...</div>
        ) : users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-2 text-left">Name</th>
                  <th className="border p-2 text-left">Email</th>
                  <th className="border p-2 text-left">Role</th>
                  <th className="border p-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="border p-2">{u.name}</td>
                    <td className="border p-2">{u.email}</td>
                    <td className="border p-2">{u.role}</td>
                    <td className="border p-2 space-x-2">
                      <button className="px-2 py-1 bg-blue-600 text-white text-sm rounded">
                        Edit
                      </button>
                      <button className="px-2 py-1 bg-red-600 text-white text-sm rounded">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div>No users found</div>
        )}
      </section>

      {/* System stats */}
      <section className="mt-8">
        <h2 className="text-xl font-bold mb-4">System Stats</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-100 rounded">
            <p className="text-sm text-gray-600">Total Users</p>
            <p className="text-2xl font-bold">{users.length}</p>
          </div>
          <div className="p-4 bg-gray-100 rounded">
            <p className="text-sm text-gray-600">Admin Users</p>
            <p className="text-2xl font-bold">{users.filter((u) => u.role === 'admin').length}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

/**
 * Admin panel page with protection
 */
export const AdminPanelPageExample = WithAuth(AdminPanelComponent);

// ============================================================================
// EXAMPLE 5: Profile Update with API Client
// ============================================================================

/**
 * Profile update component using authenticated API client
 */
export function ProfileUpdateExample() {
  const { user, isLoading } = useRequireAuth();
  const api = useApiClient();
  const [isUpdating, setIsUpdating] = useState(false);
  const [success, setSuccess] = useState(false);

  const form = useForm({
    schema: signupSchema, // Reuse signup schema for validation
    defaultValues: {
      email: user?.email || '',
      name: user?.name || '',
      password: '', // Not required for update
    },
    onSubmit: async (data) => {
      setIsUpdating(true);
      try {
        const response = await api.put('/auth/profile', {
          name: data.name,
          email: data.email,
        });

        if (response.ok) {
          setSuccess(true);
          setTimeout(() => setSuccess(false), 3000);
        } else {
          form.setError('root.serverError', {
            type: 'manual',
            message: response.error || 'Update failed',
          });
        }
      } finally {
        setIsUpdating(false);
      }
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <div>Not authenticated</div>;

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Update Profile</h1>

      {success && (
        <div className="mb-4 p-4 bg-green-100 text-green-800 rounded">
          Profile updated successfully!
        </div>
      )}

      <form onSubmit={form.handleSubmit as any} className="space-y-4">
        {/* Name field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Name
          </label>
          <input
            id="name"
            type="text"
            {...form.register('name')}
            className="w-full px-3 py-2 border rounded"
            disabled={isUpdating}
          />
          {form.formState.errors.name && (
            <p className="text-red-600 text-sm mt-1">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

        {/* Email field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            {...form.register('email')}
            className="w-full px-3 py-2 border rounded"
            disabled={isUpdating}
          />
          {form.formState.errors.email && (
            <p className="text-red-600 text-sm mt-1">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        {/* Server error */}
        {form.formState.errors.root?.serverError && (
          <div className="p-3 bg-red-100 text-red-800 rounded text-sm">
            {form.formState.errors.root.serverError.message}
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={isUpdating}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isUpdating ? 'Updating...' : 'Update Profile'}
        </button>
      </form>
    </div>
  );
}

// ============================================================================
// EXAMPLE 6: Conditional Content Based on Auth
// ============================================================================

/**
 * Component showing conditional content
 */
export function ConditionalContentExample() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Home</h1>

      {!isAuthenticated ? (
        // Public content
        <div className="p-6 bg-blue-50 rounded">
          <h2 className="text-xl font-bold mb-2">Welcome!</h2>
          <p className="text-gray-600 mb-4">
            Sign in to access your dashboard and manage your content.
          </p>
          <a
            href="/login"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Sign In
          </a>
        </div>
      ) : (
        // Authenticated content
        <div className="space-y-6">
          <div className="p-6 bg-green-50 rounded">
            <h2 className="text-xl font-bold mb-2">Welcome back, {user?.name}!</h2>
            <p className="text-gray-600">
              You have access to all your tools and content.
            </p>
          </div>

          {/* Admin-only section */}
          {user?.role === 'admin' && (
            <div className="p-6 bg-purple-50 rounded">
              <h3 className="text-lg font-bold mb-2">Admin Tools</h3>
              <p className="text-gray-600 mb-4">
                As an administrator, you can access the admin panel to manage users and system settings.
              </p>
              <a
                href="/admin"
                className="inline-block px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Go to Admin Panel
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
