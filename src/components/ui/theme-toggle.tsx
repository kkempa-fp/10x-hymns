import { useCallback, useEffect, useState } from "react";
import { MoonStar, SunMedium } from "lucide-react";

import { Button } from "@/components/ui/button";

type ResolvedTheme = Extract<ThemeMode, "light" | "dark">;

const LABELS: Record<ResolvedTheme, string> = {
  light: "Jasny",
  dark: "Ciemny",
};

const ICONS: Record<ResolvedTheme, typeof SunMedium> = {
  light: SunMedium,
  dark: MoonStar,
};

const resolveTheme = (mode?: ThemeMode | null): ResolvedTheme => {
  if (mode === "dark") {
    return "dark";
  }

  if (mode === "light") {
    return "light";
  }

  if (typeof document !== "undefined" && document.documentElement.dataset.themeEffective === "dark") {
    return "dark";
  }

  return "light";
};

const ThemeToggle = () => {
  const [mode, setMode] = useState<ResolvedTheme>(() => resolveTheme());

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const applyFromSource = (next?: ThemeMode | null) => {
      setMode(resolveTheme(next));
    };

    const handleThemeChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ mode?: ThemeMode; effective?: ResolvedTheme }>;
      if (customEvent.detail?.effective) {
        setMode(customEvent.detail.effective);
      } else {
        const current = window.__getPreferredTheme?.();
        if (current) {
          applyFromSource(current);
        }
      }
    };

    applyFromSource(window.__getPreferredTheme?.());

    window.addEventListener("theme-change", handleThemeChange);
    return () => {
      window.removeEventListener("theme-change", handleThemeChange);
    };
  }, []);

  const cycleMode = useCallback(() => {
    setMode((previous) => {
      const next = previous === "light" ? "dark" : "light";
      window.__setPreferredTheme?.(next);
      return next;
    });
  }, []);

  const Icon = ICONS[mode];
  const label = LABELS[mode];

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={cycleMode}
      className="gap-2"
      aria-label={`Przełącz motyw (obecnie ${label})`}
    >
      <Icon className="size-4" aria-hidden="true" />
      <span className="hidden sm:inline text-[0.8125rem]">Motyw: {label}</span>
      <span className="sr-only">Przełącz motyw, aktualnie {label}</span>
    </Button>
  );
};

export default ThemeToggle;
