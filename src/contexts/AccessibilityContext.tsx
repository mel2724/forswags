import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";

type TextSize = "small" | "medium" | "large" | "x-large";
type ContrastMode = "normal" | "high";

interface AccessibilityContextType {
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
  contrastMode: ContrastMode;
  setContrastMode: (mode: ContrastMode) => void;
  reducedMotion: boolean;
  setReducedMotion: (value: boolean) => void;
  announceToScreenReader: (message: string, priority?: "polite" | "assertive") => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [textSize, setTextSize] = useState<TextSize>(() => {
    const saved = localStorage.getItem("a11y-text-size");
    return (saved as TextSize) || "medium";
  });

  const [contrastMode, setContrastMode] = useState<ContrastMode>(() => {
    const saved = localStorage.getItem("a11y-contrast-mode");
    return (saved as ContrastMode) || "normal";
  });

  const [reducedMotion, setReducedMotion] = useState(() => {
    const saved = localStorage.getItem("a11y-reduced-motion");
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return saved ? saved === "true" : prefersReduced;
  });

  // Apply text size to document
  useEffect(() => {
    const sizeMap = {
      small: "14px",
      medium: "16px",
      large: "18px",
      "x-large": "20px",
    };
    document.documentElement.style.fontSize = sizeMap[textSize];
    localStorage.setItem("a11y-text-size", textSize);
  }, [textSize]);

  // Apply contrast mode
  useEffect(() => {
    if (contrastMode === "high") {
      document.documentElement.classList.add("high-contrast");
    } else {
      document.documentElement.classList.remove("high-contrast");
    }
    localStorage.setItem("a11y-contrast-mode", contrastMode);
  }, [contrastMode]);

  // Apply reduced motion preference
  useEffect(() => {
    if (reducedMotion) {
      document.documentElement.classList.add("reduce-motion");
    } else {
      document.documentElement.classList.remove("reduce-motion");
    }
    localStorage.setItem("a11y-reduced-motion", String(reducedMotion));
  }, [reducedMotion]);

  // Screen reader announcements
  const announceToScreenReader = (message: string, priority: "polite" | "assertive" = "polite") => {
    const announcement = document.createElement("div");
    announcement.setAttribute("role", "status");
    announcement.setAttribute("aria-live", priority);
    announcement.setAttribute("aria-atomic", "true");
    announcement.className = "sr-only";
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        textSize,
        setTextSize,
        contrastMode,
        setContrastMode,
        reducedMotion,
        setReducedMotion,
        announceToScreenReader,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error("useAccessibility must be used within an AccessibilityProvider");
  }
  return context;
}
