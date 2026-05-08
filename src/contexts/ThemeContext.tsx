import { createContext, useContext, useState, useEffect } from "react";

export type Theme = "dark" | "light" | "warm";

interface ThemeCtx {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

export const ThemeContext = createContext<ThemeCtx>({ theme: "dark", setTheme: () => {} });
export const useTheme = () => useContext(ThemeContext);

const VARS: Record<Theme, Record<string, string>> = {
  dark: {
    "--bg":        "#07070d",
    "--bg2":       "#0d0d1a",
    "--bg3":       "#131320",
    "--text":      "#e8e0cc",
    "--text2":     "#888898",
    "--text3":     "#44445a",
    "--border":    "rgba(201,168,76,0.18)",
    "--border2":   "rgba(255,255,255,0.06)",
    "--accent":    "#c9a84c",
    "--accent2":   "#8b6810",
    "--shadow":    "rgba(0,0,0,0.6)",
  },
  light: {
    "--bg":        "#f4f2ee",
    "--bg2":       "#ffffff",
    "--bg3":       "#eceae4",
    "--text":      "#1a1a2e",
    "--text2":     "#4a4a60",
    "--text3":     "#8a8a9a",
    "--border":    "rgba(120,90,20,0.2)",
    "--border2":   "rgba(0,0,0,0.08)",
    "--accent":    "#8b6810",
    "--accent2":   "#c9a84c",
    "--shadow":    "rgba(0,0,0,0.12)",
  },
  warm: {
    "--bg":        "#1c1710",
    "--bg2":       "#241e15",
    "--bg3":       "#2e271c",
    "--text":      "#f0deb4",
    "--text2":     "#a08860",
    "--text3":     "#5a4a30",
    "--border":    "rgba(210,170,80,0.22)",
    "--border2":   "rgba(255,220,100,0.07)",
    "--accent":    "#d4a843",
    "--accent2":   "#9a7020",
    "--shadow":    "rgba(0,0,0,0.5)",
  },
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem("ais_theme") as Theme) || "dark"
  );

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem("ais_theme", t);
  };

  useEffect(() => {
    const root = document.documentElement;
    const vars = VARS[theme];
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
    document.body.style.background = vars["--bg"];
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
