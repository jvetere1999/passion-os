import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getProviders, hasProviders, getProviderNames } from "../providers";

describe("Auth Providers", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("getProviders", () => {
    it("should return empty array when no providers configured", () => {
      process.env.GOOGLE_CLIENT_ID = "";
      process.env.GOOGLE_CLIENT_SECRET = "";
      process.env.AZURE_AD_CLIENT_ID = "";
      process.env.AZURE_AD_CLIENT_SECRET = "";
      process.env.AZURE_AD_TENANT_ID = "";

      const providers = getProviders();
      expect(providers).toEqual([]);
    });

    it("should include Google provider when configured", () => {
      process.env.GOOGLE_CLIENT_ID = "test-google-id";
      process.env.GOOGLE_CLIENT_SECRET = "test-google-secret";

      const providers = getProviders();
      expect(providers.length).toBeGreaterThan(0);
    });

    it("should include Microsoft provider when configured", () => {
      process.env.AZURE_AD_CLIENT_ID = "test-azure-id";
      process.env.AZURE_AD_CLIENT_SECRET = "test-azure-secret";
      process.env.AZURE_AD_TENANT_ID = "test-tenant-id";

      const providers = getProviders();
      expect(providers.length).toBeGreaterThan(0);
    });
  });

  describe("hasProviders", () => {
    it("should return false when no providers configured", () => {
      process.env.GOOGLE_CLIENT_ID = "";
      process.env.GOOGLE_CLIENT_SECRET = "";
      process.env.AZURE_AD_CLIENT_ID = "";
      process.env.AZURE_AD_CLIENT_SECRET = "";
      process.env.AZURE_AD_TENANT_ID = "";

      expect(hasProviders()).toBe(false);
    });

    it("should return true when Google provider configured", () => {
      process.env.GOOGLE_CLIENT_ID = "test-google-id";
      process.env.GOOGLE_CLIENT_SECRET = "test-google-secret";

      expect(hasProviders()).toBe(true);
    });
  });

  describe("getProviderNames", () => {
    it("should return empty array when no providers configured", () => {
      process.env.GOOGLE_CLIENT_ID = "";
      process.env.GOOGLE_CLIENT_SECRET = "";
      process.env.AZURE_AD_CLIENT_ID = "";
      process.env.AZURE_AD_CLIENT_SECRET = "";
      process.env.AZURE_AD_TENANT_ID = "";

      expect(getProviderNames()).toEqual([]);
    });

    it("should return Google when Google provider configured", () => {
      process.env.GOOGLE_CLIENT_ID = "test-google-id";
      process.env.GOOGLE_CLIENT_SECRET = "test-google-secret";

      expect(getProviderNames()).toContain("Google");
    });

    it("should return Microsoft when Azure AD provider configured", () => {
      process.env.AZURE_AD_CLIENT_ID = "test-azure-id";
      process.env.AZURE_AD_CLIENT_SECRET = "test-azure-secret";
      process.env.AZURE_AD_TENANT_ID = "test-tenant-id";

      expect(getProviderNames()).toContain("Microsoft");
    });

    it("should return both providers when both configured", () => {
      process.env.GOOGLE_CLIENT_ID = "test-google-id";
      process.env.GOOGLE_CLIENT_SECRET = "test-google-secret";
      process.env.AZURE_AD_CLIENT_ID = "test-azure-id";
      process.env.AZURE_AD_CLIENT_SECRET = "test-azure-secret";
      process.env.AZURE_AD_TENANT_ID = "test-tenant-id";

      const names = getProviderNames();
      expect(names).toContain("Google");
      expect(names).toContain("Microsoft");
    });
  });
});

