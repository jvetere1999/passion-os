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
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = params.error;

  // Map error codes to user-friendly messages
  const errorMessages: Record<string, string> = {
    Configuration:
      "There is a problem with the server configuration. Please contact support.",
    AccessDenied:
      "Access denied. You do not have permission to sign in.",
    Verification:
      "The verification link has expired or has already been used.",
    OAuthSignin:
      "An error occurred while trying to sign in with the provider.",
    OAuthCallback:
      "An error occurred while processing the authentication callback.",
    OAuthCreateAccount:
      "Could not create an account with the OAuth provider.",
    EmailCreateAccount: "Could not create an email account.",
    Callback: "An error occurred during the authentication callback.",
    OAuthAccountNotLinked:
      "This email is already associated with another account. Please sign in with the original provider.",
    EmailSignin: "The email could not be sent.",
    CredentialsSignin:
      "Sign in failed. Check the details you provided are correct.",
    SessionRequired: "Please sign in to access this page.",
    Default: "An unexpected error occurred. Please try again.",
  };

  const message = error
    ? errorMessages[error] || errorMessages.Default
    : errorMessages.Default;

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-4)",
      }}
    >
      <div
        style={{
          maxWidth: "400px",
          width: "100%",
          textAlign: "center",
        }}
      >
        {/* Error icon */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "var(--space-6)",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "var(--radius-full)",
              backgroundColor: "var(--color-error)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
        </div>

        <h1
          style={{
            fontSize: "var(--font-size-2xl)",
            fontWeight: "var(--font-weight-bold)",
            marginBottom: "var(--space-4)",
          }}
        >
          Authentication Error
        </h1>

        <p
          style={{
            color: "var(--color-text-secondary)",
            marginBottom: "var(--space-8)",
            lineHeight: "var(--line-height-relaxed)",
          }}
        >
          {message}
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-3)",
          }}
        >
          <Link
            href="/auth/signin"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "var(--space-3) var(--space-6)",
              backgroundColor: "var(--color-accent)",
              color: "white",
              fontWeight: "var(--font-weight-medium)",
              borderRadius: "var(--radius-md)",
              textDecoration: "none",
            }}
          >
            Try Again
          </Link>

          <Link
            href="/"
            style={{
              color: "var(--color-text-secondary)",
              fontSize: "var(--font-size-sm)",
            }}
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}

