"use client";

import { useSyncExternalStore } from "react";
import { THEME_STORAGE_KEY, type Theme } from "@/lib/theme";

const eventName = "portfolio-theme-change";
const query = "(prefers-color-scheme: light)";
let choice: Theme | null | undefined;

function storedChoice(): Theme | null {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return value === "dark" || value === "light" ? value : null;
  } catch {
    return choice ?? null;
  }
}

const systemTheme = (): Theme =>
  window.matchMedia(query).matches ? "light" : "dark";
const getTheme = (): Theme =>
  document.documentElement.dataset.theme === "light" ? "light" : "dark";
const getServerTheme = (): Theme => "dark";

function applyTheme(theme: Theme) {
  const changed = getTheme() !== theme;
  document.documentElement.dataset.theme = theme;
  if (changed) window.dispatchEvent(new Event(eventName));
}

function subscribe(callback: () => void) {
  const media = window.matchMedia(query);
  choice ??= storedChoice();
  const syncSystem = () => {
    if (!choice) applyTheme(systemTheme());
  };
  const syncStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== THEME_STORAGE_KEY) return;
    choice = storedChoice();
    applyTheme(choice ?? systemTheme());
  };
  window.addEventListener(eventName, callback);
  window.addEventListener("storage", syncStorage);
  media.addEventListener("change", syncSystem);
  applyTheme(choice ?? systemTheme());
  return () => {
    window.removeEventListener(eventName, callback);
    window.removeEventListener("storage", syncStorage);
    media.removeEventListener("change", syncSystem);
  };
}

export function setTheme(theme: Theme) {
  choice = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* Keep the choice in memory when storage is unavailable. */
  }
  applyTheme(theme);
}

export function useTheme() {
  return useSyncExternalStore(subscribe, getTheme, getServerTheme);
}
