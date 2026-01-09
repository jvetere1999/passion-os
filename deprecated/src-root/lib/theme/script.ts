/**
 * Theme Script - Server-safe exports
 * This file has NO "use client" directive so it can be imported in Server Components
 */

/**
 * Script to prevent flash of wrong theme
 * Insert in <head> before other scripts
 */
export const themeScript = `
(function() {
  try {
    // Check extended theme prefs first
    var prefs = localStorage.getItem('passion_os_theme_prefs_v1');
    var themeId = 'system';
    if (prefs) {
      try {
        var parsed = JSON.parse(prefs);
        themeId = parsed.themeId || 'system';
      } catch (e) {}
    } else {
      // Fallback to legacy simple theme
      var legacy = localStorage.getItem('passion-os-theme');
      if (legacy === 'light') themeId = 'ableton-live-light';
      else if (legacy === 'dark') themeId = 'ableton-live-dark';
    }
    
    var resolved = themeId;
    if (themeId === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches 
        ? 'ableton-live-dark' 
        : 'ableton-live-light';
    }
    
    var mode = resolved.includes('light') || resolved === 'ableton-mid-light' || resolved === 'ableton-mint' 
      ? 'light' 
      : 'dark';
    
    document.documentElement.setAttribute('data-theme', mode);
    document.documentElement.setAttribute('data-theme-id', resolved);
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
})();
`;

