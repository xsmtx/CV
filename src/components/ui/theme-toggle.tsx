"use client";

import { setTheme, useTheme } from "@/hooks/use-theme";
import { THEME_COLORS } from "@/lib/theme";

export function ThemeColor() {
  const theme = useTheme();
  return <meta name="theme-color" content={THEME_COLORS[theme]} />;
}

export function ThemeToggle() {
  const theme = useTheme();
  const label = `Switch to ${theme === "dark" ? "light" : "dark"} theme`;
  return (
    <button
      className="theme-toggle"
      type="button"
      aria-label={label}
      title={label}
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      <svg
        className="theme-sun"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
      </svg>
      <svg
        className="theme-moon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20.6 14A8.7 8.7 0 0 1 10 3.4 8.7 8.7 0 1 0 20.6 14Z" />
      </svg>
    </button>
  );
}
