/**
 * Auth.js providers configuration
 * Google OAuth and Microsoft Entra ID
 */

import Google from "next-auth/providers/google";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import type { Provider } from "next-auth/providers";

/**
 * Configure OAuth providers
 * Credentials are loaded from environment variables
 */
export function getProviders(): Provider[] {
  const providers: Provider[] = [];

  // Google OAuth
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        // Request minimal scopes
        authorization: {
          params: {
            scope: "openid email profile",
          },
        },
        // Explicitly map profile to ensure name and email are captured
        profile(profile) {
          // Log full profile for debugging
          console.log("[auth/google] Full profile received:", {
            sub: profile.sub,
            name: profile.name,
            given_name: profile.given_name,
            family_name: profile.family_name,
            email: profile.email,
            email_verified: profile.email_verified,
            picture: profile.picture,
          });

          // REQUIRE email - this should never be missing with 'email' scope
          if (!profile.email) {
            console.error("[auth/google] CRITICAL: Profile missing email!", profile);
            throw new Error("Google profile must have an email address");
          }

          // Build name with multiple fallbacks - NEVER return null
          let derivedName = profile.name;
          if (!derivedName && (profile.given_name || profile.family_name)) {
            derivedName = `${profile.given_name || ""} ${profile.family_name || ""}`.trim();
          }
          if (!derivedName) {
            derivedName = profile.email.split("@")[0];
          }
          if (!derivedName) {
            derivedName = "User";
          }

          const result = {
            id: profile.sub,
            name: derivedName,
            email: profile.email,
            image: profile.picture ?? null,
          };

          console.log("[auth/google] Mapped user:", result);
          return result;
        },
      })
    );
  }

  // Microsoft Entra ID (Azure AD)
  if (
    process.env.AZURE_AD_CLIENT_ID &&
    process.env.AZURE_AD_CLIENT_SECRET &&
    process.env.AZURE_AD_TENANT_ID
  ) {
    providers.push(
      MicrosoftEntraID({
        clientId: process.env.AZURE_AD_CLIENT_ID,
        clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
        // Tenant ID is configured via issuer
        issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
        // Request minimal scopes
        authorization: {
          params: {
            scope: "openid email profile User.Read",
          },
        },
        // Explicitly map profile to ensure name and email are captured
        profile(profile) {
          // Cast profile to include optional picture field that may exist
          const profileWithPicture = profile as typeof profile & { picture?: string };

          // Log full profile for debugging
          console.log("[auth/entra] Full profile received:", {
            sub: profile.sub,
            name: profile.name,
            preferred_username: profile.preferred_username,
            email: profile.email,
            picture: profileWithPicture.picture,
          });

          // Derive email with fallbacks
          const derivedEmail = profile.email || profile.preferred_username;

          // REQUIRE email - this should never be missing
          if (!derivedEmail) {
            console.error("[auth/entra] CRITICAL: Profile missing email!", profile);
            throw new Error("Microsoft profile must have an email address");
          }

          // Build name with multiple fallbacks - NEVER return null
          let derivedName = profile.name;
          if (!derivedName && profile.preferred_username) {
            derivedName = profile.preferred_username.split("@")[0];
          }
          if (!derivedName && derivedEmail) {
            derivedName = derivedEmail.split("@")[0];
          }
          if (!derivedName) {
            derivedName = "User";
          }

          const result = {
            id: profile.sub,
            name: derivedName,
            email: derivedEmail,
            image: profileWithPicture.picture ?? null,
          };

          console.log("[auth/entra] Mapped user:", result);
          return result;
        },
      })
    );
  }

  return providers;
}

/**
 * Check if any providers are configured
 */
export function hasProviders(): boolean {
  return getProviders().length > 0;
}

/**
 * Get list of configured provider names for UI display
 */
export function getProviderNames(): string[] {
  const names: string[] = [];

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    names.push("Google");
  }

  if (
    process.env.AZURE_AD_CLIENT_ID &&
    process.env.AZURE_AD_CLIENT_SECRET &&
    process.env.AZURE_AD_TENANT_ID
  ) {
    names.push("Microsoft");
  }

  return names;
}
