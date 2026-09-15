"use client";

import { useSyncExternalStore } from "react";

function subscribe(query: string, callback: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

const motionQuery = "(prefers-reduced-motion: reduce)";
const subscribeMotion = (callback: () => void) =>
  subscribe(motionQuery, callback);
const getMotion = () => window.matchMedia(motionQuery).matches;
const getServerMotion = () => false;

export function useReducedMotion() {
  return useSyncExternalStore(subscribeMotion, getMotion, getServerMotion);
}

const subscribeVisibility = (callback: () => void) => {
  document.addEventListener("visibilitychange", callback);
  return () => document.removeEventListener("visibilitychange", callback);
};
const getVisibility = () => !document.hidden;
const getServerVisibility = () => true;

export function usePageVisible() {
  return useSyncExternalStore(
    subscribeVisibility,
    getVisibility,
    getServerVisibility,
  );
}
