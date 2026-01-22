'use client';

import { AuthProvider } from "@/lib/auth";
import { VaultLockProvider } from "@/lib/auth/VaultLockContext";
import { ThemeProvider } from "@/lib/theme";
import { SiteFooter } from "@/components/shell/SiteFooter";
import { ErrorNotifications } from "@/components/ui/ErrorNotifications";
import { ErrorNotificationInitializer } from "@/components/ui/ErrorNotificationInitializer";
import { OfflineStatusBanner } from "@/components/ui/OfflineStatusBanner";
import { ZenBrowserInitializer } from "@/components/browser/ZenBrowserInitializer";
import { OnboardingGate } from "@/components/onboarding/OnboardingGate";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";

const OfflineQueueWorker = dynamic(
  () => import("@/components/OfflineQueueWorker").then((mod) => mod.OfflineQueueWorker),
  { ssr: false }
);

const ServiceWorkerRegistrar = dynamic(
  () => import("@/components/ServiceWorkerRegistrar").then((mod) => mod.ServiceWorkerRegistrar),
  { ssr: false }
);

export function RootLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideShellChrome = pathname.startsWith("/onboarding") || pathname.startsWith("/auth");

  return (
    <AuthProvider>
      <VaultLockProvider>
          <ThemeProvider>
            <ZenBrowserInitializer />
            <OnboardingGate>
              {!hideShellChrome && <OfflineStatusBanner />}
              <div id="app-root">{children}</div>
              {!hideShellChrome && <SiteFooter />}
              <ErrorNotifications />
              <ErrorNotificationInitializer />
              <ServiceWorkerRegistrar />
              <OfflineQueueWorker />
            </OnboardingGate>
          </ThemeProvider>
      </VaultLockProvider>
    </AuthProvider>
  );
}
