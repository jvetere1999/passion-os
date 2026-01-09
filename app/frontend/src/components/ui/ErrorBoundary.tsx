"use client";

/**
 * Error Boundary Component
 *
 * Catches errors in child components and displays a fallback UI.
 * Prevents single component failures from breaking the entire page.
 */

import { Component, type ReactNode, type ErrorInfo } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            padding: "var(--spacing-4, 16px)",
            background: "var(--color-surface-raised, #1a1a1a)",
            borderRadius: "var(--radius-md, 8px)",
            border: "1px solid var(--color-border, #333)",
          }}
        >
          <p
            style={{
              color: "var(--color-text-muted, #888)",
              fontSize: "var(--font-size-sm, 14px)",
              margin: 0,
            }}
          >
            Something went wrong loading this section.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Section Error Fallback
 * Minimal fallback for Today page sections
 */
export function SectionErrorFallback({ sectionName }: { sectionName?: string }) {
  return (
    <div
      style={{
        padding: "var(--spacing-4, 16px)",
        background: "var(--color-surface-raised, #1a1a1a)",
        borderRadius: "var(--radius-md, 8px)",
        border: "1px solid var(--color-border, #333)",
        textAlign: "center",
      }}
    >
      <p
        style={{
          color: "var(--color-text-muted, #888)",
          fontSize: "var(--font-size-sm, 14px)",
          margin: 0,
        }}
      >
        {sectionName ? `Unable to load ${sectionName}.` : "Unable to load this section."}
      </p>
    </div>
  );
}

export default ErrorBoundary;

