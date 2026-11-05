"use client";

import { useState, useEffect, useRef } from "react";
import { Palette, Check, Sparkles, ChevronDown } from "lucide-react";

export interface ThemeOption {
  id: string;
  name: string;
  subtitle: string;
  sourceDoc: string;
  palette: {
    primary: string;
    accent: string;
    bg: string;
    surface: string;
  };
}

export const THEMES: ThemeOption[] = [
  {
    id: "opac",
    name: "GPL OPAC Editorial",
    subtitle: "Public Library Standard (Teal & Coral)",
    sourceDoc: "PRD-Public-OPAC.md",
    palette: {
      primary: "#0F766E",
      accent: "#E11D48",
      bg: "#F8FAFC",
      surface: "#FFFFFF",
    },
  },
  {
    id: "homenest",
    name: "HomeNest",
    subtitle: "Warm Earthy, Sage & Cream",
    sourceDoc: "homenest-DESIGN.md",
    palette: {
      primary: "#92400E",
      accent: "#84CC16",
      bg: "#FEF3C7",
      surface: "#FFFBEB",
    },
  },
  {
    id: "brushstroke",
    name: "BrushStroke",
    subtitle: "Burnt Sienna, Olive & Parchment",
    sourceDoc: "brushstroke-design-system-DESIGN.md",
    palette: {
      primary: "#B45309",
      accent: "#65A30D",
      bg: "#FFFDF7",
      surface: "#FEF9EF",
    },
  },
  {
    id: "corky",
    name: "Corky's Luxe",
    subtitle: "Heritage Green & Antique Gold",
    sourceDoc: "corky-s-cigar-co-designmd-ai-design-system-DESIGN.md",
    palette: {
      primary: "#112A15",
      accent: "#C9A227",
      bg: "#F6F1E7",
      surface: "#FFFDF8",
    },
  },
  {
    id: "lumina",
    name: "Lumina Flow",
    subtitle: "Dark Neoform & Neon Orange",
    sourceDoc: "lumina-DESIGN.md",
    palette: {
      primary: "#EA580C",
      accent: "#D04D09",
      bg: "#09090B",
      surface: "#18181B",
    },
  },
];

export default function ThemeSwitcher() {
  const [activeTheme, setActiveTheme] = useState<string>("opac");
  const [open, setOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load persisted theme on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("gplms-theme");
      if (saved && THEMES.some((t) => t.id === saved)) {
        setActiveTheme(saved);
        document.documentElement.setAttribute("data-theme", saved);
      } else {
        document.documentElement.setAttribute("data-theme", "opac");
      }
    } catch {
      // Ignore localStorage access failures
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleSelect = (themeId: string) => {
    setActiveTheme(themeId);
    document.documentElement.setAttribute("data-theme", themeId);
    try {
      localStorage.setItem("gplms-theme", themeId);
    } catch {
      // Ignore
    }
    setOpen(false);
  };

  const current = THEMES.find((t) => t.id === activeTheme) || THEMES[0];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Theme Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="true"
        title={`Current Theme: ${current.name} (${current.sourceDoc})`}
        className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition shadow-xs text-xs font-medium text-slate-700 cursor-pointer"
      >
        <span className="text-slate-400 text-xs">Theme:</span>
        <span className="text-amber-500 text-xs">☀️</span>
        <span className="font-semibold text-slate-800 truncate max-w-[85px]">
          {activeTheme === "corky" ? "Corky's" : current.name.split(" ")[0]}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-slate-400 transition-transform duration-200 ml-0.5 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-200 py-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-700" />
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Select Design Theme
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              5 Design Systems
            </span>
          </div>

          <div className="py-1 max-h-[420px] overflow-y-auto divide-y divide-slate-100">
            {THEMES.map((theme) => {
              const isSelected = theme.id === activeTheme;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => handleSelect(theme.id)}
                  className={`w-full text-left px-4 py-3 flex items-start justify-between gap-3 transition cursor-pointer ${
                    isSelected
                      ? "bg-teal-50/70 text-slate-900"
                      : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {theme.name}
                      </span>
                      {isSelected && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-teal-700 text-white uppercase tracking-wider">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {theme.subtitle}
                    </p>
                    <span className="inline-block mt-1 font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      Doc: {theme.sourceDoc}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-0.5">
                    {/* Palette swatches preview */}
                    <div className="flex items-center gap-1 p-1 rounded-lg border border-slate-200 bg-slate-50">
                      <span
                        className="w-3.5 h-3.5 rounded-full shadow-xs"
                        style={{ backgroundColor: theme.palette.primary }}
                        title="Primary Action"
                      />
                      <span
                        className="w-3.5 h-3.5 rounded-full shadow-xs"
                        style={{ backgroundColor: theme.palette.accent }}
                        title="Accent"
                      />
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-xs"
                        style={{ backgroundColor: theme.palette.bg }}
                        title="Background"
                      />
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-xs"
                        style={{ backgroundColor: theme.palette.surface }}
                        title="Surface / Card"
                      />
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-teal-700 shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 text-[10px] text-slate-500 rounded-b-2xl flex items-center justify-between">
            <span>Themes applied globally via CSS tokens</span>
            <span className="font-semibold text-teal-700">Instant Preview</span>
          </div>
        </div>
      )}
    </div>
  );
}
