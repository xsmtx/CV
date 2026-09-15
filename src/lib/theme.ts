export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "portfolio-theme";
export const THEME_COLORS = { dark: "#070b16", light: "#edf1f3" } as const;

// Run in the document head before content paints, including on static pages.
export const themeBootstrap = `(()=>{let choice;try{choice=localStorage.getItem("${THEME_STORAGE_KEY}")}catch{}document.documentElement.dataset.theme=choice==="dark"||choice==="light"?choice:matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"})()`;
