import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { SessionProvider } from "@/lib/auth/SessionProvider";
import { ThemeProvider } from "@/lib/theme";
import { themeScript } from "@/lib/theme/script";
import { SiteFooter } from "@/components/shell/SiteFooter";
import "@/styles/tokens.css";
import "./globals.css";

// AdSense publisher ID - set to empty to disable ads
const ADSENSE_PUBLISHER_ID = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || "";

export const metadata: Metadata = {
  title: {
    default: "Ignition - Start Without Friction",
    template: "%s | Ignition",
  },
  description:
    "A starter engine for focus, movement, and learning. Pomodoro focus timer, workout tracker, DAW shortcuts for Ableton, Logic Pro, FL Studio. Begin with one thing.",
  keywords: [
    "starter engine",
    "focus timer",
    "music production app",
    "DAW shortcuts",
    "Ableton Live shortcuts",
    "Logic Pro shortcuts",
    "FL Studio shortcuts",
    "Pro Tools shortcuts",
    "pomodoro timer",
    "focus timer app",
    "workout tracker",
    "fitness app",
    "book tracker",
    "reading log",
    "quest tracker",
    "gamified app",
    "skill development",
    "music producer tools",
    "daily planner app",
    "goal tracking app",
    "XP leveling system",
    "personal development",
    "free focus tool",
  ],
  authors: [{ name: "Ignition Team" }],
  creator: "Ignition",
  publisher: "Ignition",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://ignition.ecent.online"
  ),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Ignition",
    title: "Ignition - Start Without Friction",
    description:
      "A starter engine for focus, movement, and learning. Begin with one thing. Build momentum naturally.",
    url: "/",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Ignition - A starter engine for creators",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ignition - Start Without Friction",
    description:
      "A starter engine for focus, movement, and learning. Pick one thing. Build momentum.",
    images: ["/og-image.svg"],
  },
  verification: {
    // Add your verification codes here when available
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
  category: "productivity",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a1a" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
        {/* Google AdSense - loaded async for performance */}
        {ADSENSE_PUBLISHER_ID && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-${ADSENSE_PUBLISHER_ID}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </head>
      <body>
        <SessionProvider>
          <ThemeProvider>
            <div id="app-root">{children}</div>
            <SiteFooter />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

