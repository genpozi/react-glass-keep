import { useState, useEffect, useCallback } from 'react';
import { ACCENT_COLORS } from '../themes';

const DEFAULT_TRANSPARENCY = 'medium';

/**
 * useSettings Hook
 * Manages user preferences: theme, background, accent color, transparency, etc.
 */
export function useSettings() {
  // Dark mode
  const [dark, setDark] = useState(false);

  // Background
  const [backgroundImage, setBackgroundImage] = useState(() => {
    try {
      return localStorage.getItem("glass_keep_bg") || null;
    } catch (e) { return null; }
  });

  const [backgroundOverlay, setBackgroundOverlay] = useState(() => {
    try {
      return localStorage.getItem("glass_keep_bg_overlay") === "true";
    } catch (e) { return false; }
  });

  // Accent color
  const [accentColor, setAccentColor] = useState(() => {
    try {
      return localStorage.getItem("glass_keep_accent") || "indigo";
    } catch (e) { return "indigo"; }
  });

  // Card transparency
  const [cardTransparency, setCardTransparency] = useState(() => {
    try {
      return localStorage.getItem("glass_keep_transparency") || DEFAULT_TRANSPARENCY;
    } catch (e) { return DEFAULT_TRANSPARENCY; }
  });

  // Sidebar preferences
  const [alwaysShowSidebarOnWide, setAlwaysShowSidebarOnWide] = useState(() => {
    try { 
      return localStorage.getItem("sidebarAlwaysVisible") === "true"; 
    } catch (e) { 
      return false; 
    }
  });

  const [sidebarWidth, setSidebarWidth] = useState(() => {
    try { 
      return parseInt(localStorage.getItem("sidebarWidth")) || 288; 
    } catch (e) { 
      return 288; 
    }
  });

  // Local AI
  const [localAiEnabled, setLocalAiEnabled] = useState(() => {
    try {
      const stored = localStorage.getItem("localAiEnabled");
      return stored === null ? false : stored === "true";
    } catch (e) { 
      return false; 
    }
  });

  // Initialize dark mode on mount
  useEffect(() => {
    const savedDark =
      localStorage.getItem("glass-keep-dark-mode") === "true" ||
      (!("glass-keep-dark-mode" in localStorage) &&
        window.matchMedia?.("(prefers-color-scheme: dark)").matches);
    setDark(savedDark);
    document.documentElement.classList.toggle("dark", savedDark);
  }, []);

  // Persist background image
  useEffect(() => {
    if (backgroundImage) {
      localStorage.setItem("glass_keep_bg", backgroundImage);
    } else {
      localStorage.removeItem("glass_keep_bg");
    }
  }, [backgroundImage]);

  // Persist background overlay
  useEffect(() => {
    localStorage.setItem("glass_keep_bg_overlay", backgroundOverlay);
  }, [backgroundOverlay]);

  // Persist and apply accent color
  useEffect(() => {
    localStorage.setItem("glass_keep_accent", accentColor);
    const theme = ACCENT_COLORS.find(c => c.id === accentColor) || ACCENT_COLORS[0];
    document.documentElement.style.setProperty('--color-accent', theme.hex);
    document.documentElement.style.setProperty('--color-accent-hover', theme.hover);
    
    // Convert hex to rgba for glow effect
    const hex = theme.hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    document.documentElement.style.setProperty('--color-accent-glow', `rgba(${r}, ${g}, ${b}, 0.15)`);
  }, [accentColor]);

  // Persist card transparency
  useEffect(() => {
    localStorage.setItem("glass_keep_transparency", cardTransparency);
  }, [cardTransparency]);

  // Persist sidebar preferences
  useEffect(() => {
    localStorage.setItem("sidebarAlwaysVisible", alwaysShowSidebarOnWide);
  }, [alwaysShowSidebarOnWide]);

  useEffect(() => {
    localStorage.setItem("sidebarWidth", sidebarWidth);
  }, [sidebarWidth]);

  // Persist local AI setting
  useEffect(() => {
    localStorage.setItem("localAiEnabled", localAiEnabled);
  }, [localAiEnabled]);

  // Toggle dark mode
  const toggleDark = useCallback(() => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("glass-keep-dark-mode", String(next));
  }, [dark]);

  return {
    // Dark mode
    dark,
    setDark,
    toggleDark,

    // Background
    backgroundImage,
    setBackgroundImage,
    backgroundOverlay,
    setBackgroundOverlay,

    // Accent color
    accentColor,
    setAccentColor,

    // Transparency
    cardTransparency,
    setCardTransparency,

    // Sidebar
    alwaysShowSidebarOnWide,
    setAlwaysShowSidebarOnWide,
    sidebarWidth,
    setSidebarWidth,

    // Local AI
    localAiEnabled,
    setLocalAiEnabled,
  };
}
