import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Authentication Error",
  description: "An error occurred during authentication.",
};

/**
 * Auth error page
 * Displays user-friendly error messages for auth failures
 */
export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; details?: string; provider?: string; code?: string }>;
}) {
  const params = await searchParams;
  const error = params.error;
  const details = params.details;
  const provider = params.provider;
  const code = params.code;

  // Map error codes to user-friendly messages and detailed explanations
  const errorInfo: Record<string, { message: string; explanation: string; actions: string[] }> = {
    Configuration: {
      message: "Server Configuration Error",
      explanation: "The authentication service is not properly configured. This is a server-side issue that requires administrator attention.",
      actions: [
        "OAuth provider credentials may not be set",
        "Environment variables may be missing or incorrect",
        "The authentication service may need to be restarted",
      ],
    },
    OAuthNotConfigured: {
      message: "OAuth Provider Not Configured",
      explanation: `The ${provider || "requested"} sign-in method is not available because it hasn't been configured on the server.`,
      actions: [
        "Contact the administrator to enable this sign-in method",
        "Try signing in with a different provider",
        "Check if the service is undergoing maintenance",
      ],
    },
    AccessDenied: {
      message: "Access Denied",
      explanation: "You do not have permission to sign in with this account.",
      actions: [
        "Your account may not be authorized for this application",
        "Try using a different account",
        "Contact support if you believe this is an error",
      ],
    },
    Verification: {
      message: "Verification Failed",
      explanation: "The verification link has expired or has already been used.",
      actions: [
        "Request a new verification link",
        "Check if you've already verified this action",
      ],
    },
    OAuthSignin: {
      message: "OAuth Sign-in Failed",
      explanation: "An error occurred while trying to initiate sign-in with the provider.",
      actions: [
        "The OAuth provider may be temporarily unavailable",
        "Try again in a few moments",
        "Try a different sign-in method",
      ],
    },
    OAuthCallback: {
      message: "OAuth Callback Error",
      explanation: "An error occurred while processing the authentication response from the provider.",
      actions: [
        "The authentication session may have expired",
        "Try signing in again from the beginning",
        "Clear your browser cookies and try again",
      ],
    },
    OAuthCreateAccount: {
      message: "Account Creation Failed",
      explanation: "Could not create an account using the OAuth provider.",
      actions: [
        "An account may already exist with this email",
        "Try signing in with a different method",
        "Contact support for assistance",
      ],
    },
    OAuthAccountNotLinked: {
      message: "Account Not Linked",
      explanation: "This email is already associated with another sign-in method.",
      actions: [
        "Sign in using the original method you used to create your account",
        "Contact support to link your accounts",
      ],
    },
    SessionRequired: {
      message: "Session Required",
      explanation: "You need to be signed in to access this page.",
      actions: [
        "Sign in to continue",
      ],
    },
    ServerError: {
      message: "Server Error",
      explanation: "The authentication server encountered an unexpected error.",
      actions: [
        "This is usually temporary - try again in a few moments",
        "If the problem persists, contact support",
      ],
    },
    Default: {
      message: "Authentication Error",
      explanation: "An unexpected error occurred during authentication.",
      actions: [
        "Try signing in again",
        "Clear your browser cookies and cache",
        "Contact support if the problem persists",
      ],
    },
  };

  const info = error ? errorInfo[error] || errorInfo.Default : errorInfo.Default;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-slate-50 dark:bg-slate-900">
      <div className="w-full max-w-md space-y-6">
        {/* Error header with icon */}
        <div className="flex flex-col items-center space-y-3 text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl"></div>
            <div className="relative bg-red-50 dark:bg-red-950/30 rounded-full p-4 border border-red-200 dark:border-red-900">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-red-600 dark:text-red-400"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {info.message}
            </h1>
            {provider && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {provider} • Authentication Issue
              </p>
            )}
          </div>
        </div>

        {/* Error explanation card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
            {info.explanation}
          </p>
        </div>

        {/* What might be happening */}
        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-900/30 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-blue-600 dark:text-blue-400 flex-shrink-0"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            What might be happening
          </h2>
          <ul className="space-y-2">
            {info.actions.map((action, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                <span className="text-blue-600 dark:text-blue-400 font-bold mt-0.5 flex-shrink-0">•</span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Technical details (collapsible) */}
        {(code || details || error) && (
          <details className="group bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <summary className="cursor-pointer px-5 py-3 flex items-center gap-2 font-medium text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/50 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transform group-open:rotate-180 transition-transform">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
              Technical Details
            </summary>
            <div className="px-5 py-4 space-y-2 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-600 dark:text-slate-400">
              {error && (
                <div>
                  <span className="text-slate-700 dark:text-slate-300 font-semibold">Error Code:</span>{" "}
                  <span className="break-all text-slate-600 dark:text-slate-400">{error}</span>
                </div>
              )}
              {code && (
                <div>
                  <span className="text-slate-700 dark:text-slate-300 font-semibold">Status:</span>{" "}
                  <span>{code}</span>
                </div>
              )}
              {provider && (
                <div>
                  <span className="text-slate-700 dark:text-slate-300 font-semibold">Provider:</span>{" "}
                  <span>{provider}</span>
                </div>
              )}
              {details && (
                <div>
                  <span className="text-slate-700 dark:text-slate-300 font-semibold">Details:</span>{" "}
                  <span className="break-all text-slate-600 dark:text-slate-400">{decodeURIComponent(details)}</span>
                </div>
              )}
              <div>
                <span className="text-slate-700 dark:text-slate-300 font-semibold">Time:</span>{" "}
                <span>{new Date().toISOString()}</span>
              </div>
            </div>
          </details>
        )}

        {/* Action buttons */}
        <div className="space-y-3 pt-2">
          <Link
            href="/auth/signin"
            className="block text-center px-6 py-2.5 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
          >
            Try Again
          </Link>

          <Link
            href="/"
            className="block text-center px-6 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 font-medium rounded-lg transition-colors duration-200"
          >
            Back to Home
          </Link>
        </div>

        {/* Footer support link */}
        <p className="text-center text-xs text-slate-600 dark:text-slate-400 pt-2">
          Need help?{" "}
          <a
            href="mailto:support@ecent.online"
            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium transition-colors"
          >
            Contact support
          </a>
        </p>
      </div>
    </main>
  );
}

