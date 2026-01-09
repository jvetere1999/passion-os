"use client";

/**
 * Theme Manifest Data
 * Inline theme definitions to avoid JSON import issues with OpenNext/Cloudflare
 */

// Inline type to avoid import issues
interface ThemeVars {
  "--bg-primary": string;
  "--bg-secondary": string;
  "--bg-tertiary": string;
  "--bg-elevated": string;
  "--surface-default": string;
  "--surface-hover": string;
  "--surface-active": string;
  "--surface-selected": string;
  "--text-primary": string;
  "--text-secondary": string;
  "--text-muted": string;
  "--text-inverse": string;
  "--border-default": string;
  "--border-subtle": string;
  "--border-strong": string;
  "--accent-primary": string;
  "--accent-secondary": string;
  "--accent-success": string;
  "--accent-warning": string;
  "--accent-error": string;
  "--selection-bg": string;
  "--selection-text": string;
  "--focus-ring": string;
  "--keycap-bg": string;
  "--keycap-text": string;
  "--keycap-border": string;
  "--keycap-modifier-bg": string;
  "--keycap-modifier-text": string;
  "--waveform-bg": string;
  "--waveform-wave": string;
  "--waveform-playhead": string;
  "--waveform-region": string;
  "--waveform-marker": string;
  "--player-bg": string;
  "--player-controls": string;
  "--player-progress": string;
  "--row-odd": string;
  "--row-even": string;
  "--row-hover": string;
  "--row-selected": string;
  "--tag-bg": string;
  "--tag-text": string;
  "--badge-bg": string;
  "--badge-text": string;
  // Index signature for compatibility
  [key: string]: string;
}

interface ThemeMeta {
  sourceType: "ableton-ask" | "custom" | "system";
  fileName?: string;
  sha256?: string;
}

interface ThemeDefinition {
  id: string;
  name: string;
  mode: "light" | "dark";
  vars: ThemeVars;
  meta: ThemeMeta;
  missing?: string[];
}

interface ThemeManifest {
  version: number;
  generatedAt: string;
  themes: ThemeDefinition[];
}

export const themeManifest: ThemeManifest = {
  version: 1,
  generatedAt: "2024-12-29T00:00:00.000Z",
  themes: [
    {
      id: "ableton-live-dark",
      name: "Live Dark",
      mode: "dark",
      vars: {
        "--bg-primary": "#1e1e1e",
        "--bg-secondary": "#2d2d2d",
        "--bg-tertiary": "#3d3d3d",
        "--bg-elevated": "#4d4d4d",
        "--surface-default": "#2d2d2d",
        "--surface-hover": "#3d3d3d",
        "--surface-active": "#4d4d4d",
        "--surface-selected": "#5d5d5d",
        "--text-primary": "#ffffff",
        "--text-secondary": "#b3b3b3",
        "--text-muted": "#808080",
        "--text-inverse": "#1e1e1e",
        "--border-default": "#4d4d4d",
        "--border-subtle": "#3d3d3d",
        "--border-strong": "#5d5d5d",
        "--accent-primary": "#ff764d",
        "--accent-secondary": "#50b8b8",
        "--accent-success": "#87c157",
        "--accent-warning": "#ffc107",
        "--accent-error": "#ff5252",
        "--selection-bg": "#ff764d33",
        "--selection-text": "#ffffff",
        "--focus-ring": "#ff764d",
        "--keycap-bg": "#3d3d3d",
        "--keycap-text": "#ffffff",
        "--keycap-border": "#5d5d5d",
        "--keycap-modifier-bg": "#4d4d4d",
        "--keycap-modifier-text": "#ff764d",
        "--waveform-bg": "#1e1e1e",
        "--waveform-wave": "#ff764d",
        "--waveform-playhead": "#ffffff",
        "--waveform-region": "#ff764d33",
        "--waveform-marker": "#ffc107",
        "--player-bg": "#2d2d2d",
        "--player-controls": "#ffffff",
        "--player-progress": "#ff764d",
        "--row-odd": "#2d2d2d",
        "--row-even": "#262626",
        "--row-hover": "#3d3d3d",
        "--row-selected": "#ff764d33",
        "--tag-bg": "#4d4d4d",
        "--tag-text": "#ffffff",
        "--badge-bg": "#ff764d",
        "--badge-text": "#ffffff"
      },
      meta: {
        sourceType: "ableton-ask",
        fileName: "Dark.ask"
      }
    },
    {
      id: "ableton-live-light",
      name: "Live Light",
      mode: "light",
      vars: {
        "--bg-primary": "#f5f5f5",
        "--bg-secondary": "#e8e8e8",
        "--bg-tertiary": "#dbdbdb",
        "--bg-elevated": "#ffffff",
        "--surface-default": "#e8e8e8",
        "--surface-hover": "#dbdbdb",
        "--surface-active": "#cecece",
        "--surface-selected": "#c1c1c1",
        "--text-primary": "#1e1e1e",
        "--text-secondary": "#4d4d4d",
        "--text-muted": "#808080",
        "--text-inverse": "#ffffff",
        "--border-default": "#c1c1c1",
        "--border-subtle": "#dbdbdb",
        "--border-strong": "#a8a8a8",
        "--accent-primary": "#ff5500",
        "--accent-secondary": "#00a8a8",
        "--accent-success": "#5ea030",
        "--accent-warning": "#e6a800",
        "--accent-error": "#e62c2c",
        "--selection-bg": "#ff550033",
        "--selection-text": "#1e1e1e",
        "--focus-ring": "#ff5500",
        "--keycap-bg": "#ffffff",
        "--keycap-text": "#1e1e1e",
        "--keycap-border": "#c1c1c1",
        "--keycap-modifier-bg": "#e8e8e8",
        "--keycap-modifier-text": "#ff5500",
        "--waveform-bg": "#e8e8e8",
        "--waveform-wave": "#ff5500",
        "--waveform-playhead": "#1e1e1e",
        "--waveform-region": "#ff550033",
        "--waveform-marker": "#e6a800",
        "--player-bg": "#f5f5f5",
        "--player-controls": "#1e1e1e",
        "--player-progress": "#ff5500",
        "--row-odd": "#f5f5f5",
        "--row-even": "#ebebeb",
        "--row-hover": "#dbdbdb",
        "--row-selected": "#ff550033",
        "--tag-bg": "#dbdbdb",
        "--tag-text": "#1e1e1e",
        "--badge-bg": "#ff5500",
        "--badge-text": "#ffffff"
      },
      meta: {
        sourceType: "ableton-ask",
        fileName: "Light.ask"
      }
    },
    {
      id: "ableton-mid-dark",
      name: "Mid Dark",
      mode: "dark",
      vars: {
        "--bg-primary": "#282828",
        "--bg-secondary": "#353535",
        "--bg-tertiary": "#424242",
        "--bg-elevated": "#4f4f4f",
        "--surface-default": "#353535",
        "--surface-hover": "#424242",
        "--surface-active": "#4f4f4f",
        "--surface-selected": "#5c5c5c",
        "--text-primary": "#f0f0f0",
        "--text-secondary": "#a8a8a8",
        "--text-muted": "#707070",
        "--text-inverse": "#282828",
        "--border-default": "#4f4f4f",
        "--border-subtle": "#424242",
        "--border-strong": "#5c5c5c",
        "--accent-primary": "#8bb8e8",
        "--accent-secondary": "#b8d060",
        "--accent-success": "#7ac87a",
        "--accent-warning": "#e8c060",
        "--accent-error": "#e87878",
        "--selection-bg": "#8bb8e833",
        "--selection-text": "#f0f0f0",
        "--focus-ring": "#8bb8e8",
        "--keycap-bg": "#424242",
        "--keycap-text": "#f0f0f0",
        "--keycap-border": "#5c5c5c",
        "--keycap-modifier-bg": "#4f4f4f",
        "--keycap-modifier-text": "#8bb8e8",
        "--waveform-bg": "#282828",
        "--waveform-wave": "#8bb8e8",
        "--waveform-playhead": "#f0f0f0",
        "--waveform-region": "#8bb8e833",
        "--waveform-marker": "#e8c060",
        "--player-bg": "#353535",
        "--player-controls": "#f0f0f0",
        "--player-progress": "#8bb8e8",
        "--row-odd": "#353535",
        "--row-even": "#2f2f2f",
        "--row-hover": "#424242",
        "--row-selected": "#8bb8e833",
        "--tag-bg": "#4f4f4f",
        "--tag-text": "#f0f0f0",
        "--badge-bg": "#8bb8e8",
        "--badge-text": "#282828"
      },
      meta: {
        sourceType: "ableton-ask",
        fileName: "MidDark.ask"
      }
    },
    {
      id: "ableton-mid-light",
      name: "Mid Light",
      mode: "light",
      vars: {
        "--bg-primary": "#d8d8d8",
        "--bg-secondary": "#c8c8c8",
        "--bg-tertiary": "#b8b8b8",
        "--bg-elevated": "#e8e8e8",
        "--surface-default": "#c8c8c8",
        "--surface-hover": "#b8b8b8",
        "--surface-active": "#a8a8a8",
        "--surface-selected": "#989898",
        "--text-primary": "#282828",
        "--text-secondary": "#505050",
        "--text-muted": "#787878",
        "--text-inverse": "#f0f0f0",
        "--border-default": "#a8a8a8",
        "--border-subtle": "#b8b8b8",
        "--border-strong": "#888888",
        "--accent-primary": "#5090d0",
        "--accent-secondary": "#90b830",
        "--accent-success": "#50a050",
        "--accent-warning": "#c89820",
        "--accent-error": "#c85050",
        "--selection-bg": "#5090d033",
        "--selection-text": "#282828",
        "--focus-ring": "#5090d0",
        "--keycap-bg": "#e8e8e8",
        "--keycap-text": "#282828",
        "--keycap-border": "#a8a8a8",
        "--keycap-modifier-bg": "#d8d8d8",
        "--keycap-modifier-text": "#5090d0",
        "--waveform-bg": "#c8c8c8",
        "--waveform-wave": "#5090d0",
        "--waveform-playhead": "#282828",
        "--waveform-region": "#5090d033",
        "--waveform-marker": "#c89820",
        "--player-bg": "#d8d8d8",
        "--player-controls": "#282828",
        "--player-progress": "#5090d0",
        "--row-odd": "#d8d8d8",
        "--row-even": "#d0d0d0",
        "--row-hover": "#b8b8b8",
        "--row-selected": "#5090d033",
        "--tag-bg": "#b8b8b8",
        "--tag-text": "#282828",
        "--badge-bg": "#5090d0",
        "--badge-text": "#ffffff"
      },
      meta: {
        sourceType: "ableton-ask",
        fileName: "MidLight.ask"
      }
    },
    {
      id: "ableton-disco",
      name: "Disco",
      mode: "dark",
      vars: {
        "--bg-primary": "#1a1a2e",
        "--bg-secondary": "#252542",
        "--bg-tertiary": "#303056",
        "--bg-elevated": "#3b3b6a",
        "--surface-default": "#252542",
        "--surface-hover": "#303056",
        "--surface-active": "#3b3b6a",
        "--surface-selected": "#46467e",
        "--text-primary": "#ffffff",
        "--text-secondary": "#b8b8d0",
        "--text-muted": "#7878a0",
        "--text-inverse": "#1a1a2e",
        "--border-default": "#46467e",
        "--border-subtle": "#3b3b6a",
        "--border-strong": "#515192",
        "--accent-primary": "#ff6b9d",
        "--accent-secondary": "#64d2ff",
        "--accent-success": "#7dcea0",
        "--accent-warning": "#f7dc6f",
        "--accent-error": "#ff5555",
        "--selection-bg": "#ff6b9d33",
        "--selection-text": "#ffffff",
        "--focus-ring": "#ff6b9d",
        "--keycap-bg": "#303056",
        "--keycap-text": "#ffffff",
        "--keycap-border": "#515192",
        "--keycap-modifier-bg": "#3b3b6a",
        "--keycap-modifier-text": "#ff6b9d",
        "--waveform-bg": "#1a1a2e",
        "--waveform-wave": "#ff6b9d",
        "--waveform-playhead": "#ffffff",
        "--waveform-region": "#ff6b9d33",
        "--waveform-marker": "#f7dc6f",
        "--player-bg": "#252542",
        "--player-controls": "#ffffff",
        "--player-progress": "#ff6b9d",
        "--row-odd": "#252542",
        "--row-even": "#202038",
        "--row-hover": "#303056",
        "--row-selected": "#ff6b9d33",
        "--tag-bg": "#3b3b6a",
        "--tag-text": "#ffffff",
        "--badge-bg": "#ff6b9d",
        "--badge-text": "#1a1a2e"
      },
      meta: {
        sourceType: "ableton-ask",
        fileName: "Disco.ask"
      }
    },
    {
      id: "ableton-mint",
      name: "Mint",
      mode: "light",
      vars: {
        "--bg-primary": "#e8f5f0",
        "--bg-secondary": "#d0ebe0",
        "--bg-tertiary": "#b8e0d0",
        "--bg-elevated": "#f0faf5",
        "--surface-default": "#d0ebe0",
        "--surface-hover": "#b8e0d0",
        "--surface-active": "#a0d5c0",
        "--surface-selected": "#88cab0",
        "--text-primary": "#1a3830",
        "--text-secondary": "#3a5850",
        "--text-muted": "#5a7870",
        "--text-inverse": "#f0faf5",
        "--border-default": "#a0d5c0",
        "--border-subtle": "#b8e0d0",
        "--border-strong": "#78c0a0",
        "--accent-primary": "#20a070",
        "--accent-secondary": "#3090b0",
        "--accent-success": "#30a050",
        "--accent-warning": "#c8a020",
        "--accent-error": "#c05050",
        "--selection-bg": "#20a07033",
        "--selection-text": "#1a3830",
        "--focus-ring": "#20a070",
        "--keycap-bg": "#f0faf5",
        "--keycap-text": "#1a3830",
        "--keycap-border": "#a0d5c0",
        "--keycap-modifier-bg": "#e8f5f0",
        "--keycap-modifier-text": "#20a070",
        "--waveform-bg": "#d0ebe0",
        "--waveform-wave": "#20a070",
        "--waveform-playhead": "#1a3830",
        "--waveform-region": "#20a07033",
        "--waveform-marker": "#c8a020",
        "--player-bg": "#e8f5f0",
        "--player-controls": "#1a3830",
        "--player-progress": "#20a070",
        "--row-odd": "#e8f5f0",
        "--row-even": "#e0f0e8",
        "--row-hover": "#b8e0d0",
        "--row-selected": "#20a07033",
        "--tag-bg": "#b8e0d0",
        "--tag-text": "#1a3830",
        "--badge-bg": "#20a070",
        "--badge-text": "#ffffff"
      },
      meta: {
        sourceType: "ableton-ask",
        fileName: "Mint.ask"
      }
    }
  ]
};

