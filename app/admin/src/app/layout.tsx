import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import "@/styles/design-tokens.css";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Admin Console - Ignition",
    template: "%s | Admin - Ignition",
  },
  description: "Administrator dashboard for Ignition.",
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1e1e1e",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div className="admin-container">
            <header className="admin-header">
              <div className="admin-logo">
                <span className="admin-logo-icon">&#9881;</span>
                <span className="admin-logo-text">Ignition Admin</span>
              </div>
              <nav className="admin-nav">
                <Link href="/" className="admin-nav-link">Dashboard</Link>
                <Link href="/templates" className="admin-nav-link">Templates</Link>
                <Link href="/audit" className="admin-nav-link">Audit</Link>
                <Link href="/docs" className="admin-nav-link">Docs</Link>
              </nav>
            </header>
            <main className="admin-main">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
