"use client";

/**
 * TodayContent Component
 * Client component that handles reduced mode state for Today page
 */

import { useState, createContext, useContext } from "react";

interface ReducedModeContextValue {
  isReducedMode: boolean;
  forceExpanded: boolean;
  setForceExpanded: (value: boolean) => void;
}

const ReducedModeContext = createContext<ReducedModeContextValue>({
  isReducedMode: false,
  forceExpanded: false,
  setForceExpanded: () => {},
});

export function useReducedMode() {
  return useContext(ReducedModeContext);
}

interface ReducedModeProviderProps {
  initialReducedMode: boolean;
  children: React.ReactNode;
}

export function ReducedModeProvider({ initialReducedMode, children }: ReducedModeProviderProps) {
  const [isReducedMode] = useState(initialReducedMode);
  const [forceExpanded, setForceExpanded] = useState(false);

  // When user dismisses the banner, force expanded mode
  const effectiveReducedMode = isReducedMode && !forceExpanded;

  return (
    <ReducedModeContext.Provider
      value={{
        isReducedMode: effectiveReducedMode,
        forceExpanded,
        setForceExpanded,
      }}
    >
      {children}
    </ReducedModeContext.Provider>
  );
}

