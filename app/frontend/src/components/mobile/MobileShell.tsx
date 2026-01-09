"use client";

/**
 * Mobile Shell Component
 * App shell with header and bottom tab bar for mobile PWA
 */

import { useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { MobileHeader } from "./MobileHeader";
import { MobileTabBar } from "./MobileTabBar";
import styles from "./MobileShell.module.css";

interface MobileShellProps {
  children: React.ReactNode;
}

export function MobileShell({ children }: MobileShellProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isScrolled, setIsScrolled] = useState(false);

  // Detect if we're on auth pages (hide tab bar)
  const isAuthPage = pathname?.startsWith("/m/auth");

  const handleScroll = useCallback((scrollTop: number) => {
    setIsScrolled(scrollTop > 10);
  }, []);

  return (
    <div className={styles.shell}>
      <MobileHeader isScrolled={isScrolled} user={session?.user} />

      <main
        className={styles.main}
        onScroll={(e) => handleScroll(e.currentTarget.scrollTop)}
      >
        <div className={styles.content}>
          {children}
        </div>
      </main>

      {!isAuthPage && <MobileTabBar currentPath={pathname || "/m"} />}
    </div>
  );
}

