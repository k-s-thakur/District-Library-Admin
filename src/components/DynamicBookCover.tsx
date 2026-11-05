import React from "react";

export interface DynamicBookCoverProps {
  id?: string;
  isbn?: string;
  title: string;
  subtitle?: string | null;
  authors?: string | null;
  category?: string | { name: string; code?: string; ddcPrefix?: string } | null;
  publisher?: string | null;
  edition?: string | null;
  publicationYear?: number | string | null;
  language?: string | null;
  ddcCode?: string | null;
  size?: "sm" | "md" | "lg" | "responsive";
  className?: string;
  showSpineEffect?: boolean;
}

// 1. Color Palette Definitions (12 Curated Editorial Palettes)
interface Palette {
  name: string;
  isLight: boolean;
  bgGradient: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentBg: string;
  frameBorder: string;
  bandBg?: string;
  bandText?: string;
}

const PALETTES: Palette[] = [
  // 1. Oxford Navy & Champagne Gold
  {
    name: "oxford-navy",
    isLight: false,
    bgGradient: "linear-gradient(150deg, #0e1e38 0%, #081120 100%)",
    textPrimary: "#fef3c7",
    textSecondary: "#e2d5bc",
    textMuted: "#94a3b8",
    accent: "#f59e0b",
    accentBg: "rgba(245, 158, 11, 0.15)",
    frameBorder: "rgba(245, 158, 11, 0.35)",
    bandBg: "#162846",
    bandText: "#fef3c7",
  },
  // 2. Botanical Deep Pine & Mint Cream
  {
    name: "botanical-pine",
    isLight: false,
    bgGradient: "linear-gradient(150deg, #0d3326 0%, #061d15 100%)",
    textPrimary: "#ecfdf5",
    textSecondary: "#a7f3d0",
    textMuted: "#6ee7b7",
    accent: "#34d399",
    accentBg: "rgba(52, 211, 153, 0.15)",
    frameBorder: "rgba(52, 211, 153, 0.35)",
    bandBg: "#134232",
    bandText: "#ecfdf5",
  },
  // 3. Bordeaux Burgundy & Ivory
  {
    name: "bordeaux-crimson",
    isLight: false,
    bgGradient: "linear-gradient(150deg, #3d0c18 0%, #20040b 100%)",
    textPrimary: "#fff1f2",
    textSecondary: "#fecdd3",
    textMuted: "#fda4af",
    accent: "#fb7185",
    accentBg: "rgba(251, 113, 133, 0.15)",
    frameBorder: "rgba(251, 113, 133, 0.35)",
    bandBg: "#501221",
    bandText: "#fff1f2",
  },
  // 4. Warm Terracotta & Antique Sand
  {
    name: "warm-terracotta",
    isLight: false,
    bgGradient: "linear-gradient(150deg, #7c2d12 0%, #431407 100%)",
    textPrimary: "#fffbeb",
    textSecondary: "#fde68a",
    textMuted: "#fed7aa",
    accent: "#f59e0b",
    accentBg: "rgba(245, 158, 11, 0.2)",
    frameBorder: "rgba(245, 158, 11, 0.4)",
    bandBg: "#9a3412",
    bandText: "#fffbeb",
  },
  // 5. Obsidian Charcoal & Ice Blue (Modernist)
  {
    name: "obsidian-charcoal",
    isLight: false,
    bgGradient: "linear-gradient(150deg, #181c24 0%, #0c0e12 100%)",
    textPrimary: "#f8fafc",
    textSecondary: "#cbd5e1",
    textMuted: "#94a3b8",
    accent: "#38bdf8",
    accentBg: "rgba(56, 189, 248, 0.15)",
    frameBorder: "rgba(56, 189, 248, 0.35)",
    bandBg: "#232936",
    bandText: "#f8fafc",
  },
  // 6. Antiquarian Parchment & Iron Gall Ink (Light Editorial)
  {
    name: "antiquarian-parchment",
    isLight: true,
    bgGradient: "linear-gradient(150deg, #f7f3e8 0%, #eae2cf 100%)",
    textPrimary: "#1c1917",
    textSecondary: "#44403c",
    textMuted: "#78716c",
    accent: "#854d0e",
    accentBg: "rgba(133, 77, 14, 0.1)",
    frameBorder: "rgba(133, 77, 14, 0.35)",
    bandBg: "#ded5c0",
    bandText: "#1c1917",
  },
  // 7. Royal Aubergine & Gold
  {
    name: "royal-aubergine",
    isLight: false,
    bgGradient: "linear-gradient(150deg, #2e1065 0%, #150530 100%)",
    textPrimary: "#faf5ff",
    textSecondary: "#e9d5ff",
    textMuted: "#d8b4fe",
    accent: "#c084fc",
    accentBg: "rgba(192, 132, 252, 0.15)",
    frameBorder: "rgba(192, 132, 252, 0.35)",
    bandBg: "#3b177e",
    bandText: "#faf5ff",
  },
  // 8. Nordic Eucalyptus & Bone
  {
    name: "nordic-sage",
    isLight: false,
    bgGradient: "linear-gradient(150deg, #1e3a34 0%, #0f1f1c 100%)",
    textPrimary: "#f0fdf4",
    textSecondary: "#bbf7d0",
    textMuted: "#86efac",
    accent: "#4ade80",
    accentBg: "rgba(74, 222, 128, 0.15)",
    frameBorder: "rgba(74, 222, 128, 0.35)",
    bandBg: "#284d45",
    bandText: "#f0fdf4",
  },
  // 9. Prussian Cobalt & Coral
  {
    name: "prussian-cobalt",
    isLight: false,
    bgGradient: "linear-gradient(150deg, #0c2d48 0%, #051624 100%)",
    textPrimary: "#f0f9ff",
    textSecondary: "#bae6fd",
    textMuted: "#7dd3fc",
    accent: "#f43f5e",
    accentBg: "rgba(244, 63, 94, 0.18)",
    frameBorder: "rgba(244, 63, 94, 0.35)",
    bandBg: "#14426b",
    bandText: "#f0f9ff",
  },
  // 10. Roasted Espresso & Ochre
  {
    name: "espresso-leather",
    isLight: false,
    bgGradient: "linear-gradient(150deg, #2b1a11 0%, #170d08 100%)",
    textPrimary: "#fff7ed",
    textSecondary: "#fed7aa",
    textMuted: "#fdba74",
    accent: "#f97316",
    accentBg: "rgba(249, 115, 22, 0.18)",
    frameBorder: "rgba(249, 115, 22, 0.35)",
    bandBg: "#3d2518",
    bandText: "#fff7ed",
  },
  // 11. Minimalist Sand & Teal (Light Editorial)
  {
    name: "sand-teal",
    isLight: true,
    bgGradient: "linear-gradient(150deg, #f4efe6 0%, #e5dcce 100%)",
    textPrimary: "#0f172a",
    textSecondary: "#334155",
    textMuted: "#64748b",
    accent: "#0d9488",
    accentBg: "rgba(13, 148, 136, 0.12)",
    frameBorder: "rgba(13, 148, 136, 0.35)",
    bandBg: "#dad0c0",
    bandText: "#0f172a",
  },
  // 12. Deep Indigo & Silver
  {
    name: "deep-indigo",
    isLight: false,
    bgGradient: "linear-gradient(150deg, #1e1b4b 0%, #0d0b26 100%)",
    textPrimary: "#e0e7ff",
    textSecondary: "#c7d2fe",
    textMuted: "#a5b4fc",
    accent: "#818cf8",
    accentBg: "rgba(129, 140, 248, 0.15)",
    frameBorder: "rgba(129, 140, 248, 0.35)",
    bandBg: "#2d296b",
    bandText: "#e0e7ff",
  },
];

// 2. Deterministic Hash Function
function hashString(key: string): number {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

// 3. Helper to detect Hindi / Devanagari script
function isDevanagari(text: string): boolean {
  return /[\u0900-\u097F]/.test(text);
}

// 4. Category Name Helper
function resolveCategoryName(
  cat?: string | { name: string; code?: string } | null
): string {
  if (!cat) return "Library Collection";
  if (typeof cat === "string") return cat;
  return cat.name || "Library Collection";
}

export default function DynamicBookCover({
  id = "",
  isbn = "",
  title,
  subtitle,
  authors,
  category,
  publisher,
  edition,
  publicationYear,
  language,
  ddcCode,
  size = "responsive",
  className = "",
  showSpineEffect = true,
}: DynamicBookCoverProps) {
  // Deterministic seed
  const seedKey = id || isbn || title || "book-default";
  const seed = hashString(seedKey);

  // Palette & Layout selection
  const palette = PALETTES[seed % PALETTES.length];
  const layoutIndex = Math.floor(seed / PALETTES.length) % 6; // 0 to 5 (6 layout styles)

  const categoryName = resolveCategoryName(category);
  const authorName = authors?.trim() || "National Collection";
  const hasHindi = isDevanagari(title);
  const titleLength = title.length;

  // Font styling: serif by default, sans for modern science/tech layout variants
  const useSansFont = layoutIndex === 3 || (seed % 4 === 0 && !hasHindi);
  const fontFamilyClass = useSansFont ? "font-sans" : "font-serif";

  // Size Scale Classes
  const isLarge = size === "lg";
  const isSmall = size === "sm";

  // Dynamic Typography Sizing based on Title Length & Container Size
  let titleSizeClass = "text-base sm:text-lg font-bold leading-tight";
  let authorSizeClass = "text-xs font-medium";
  let metadataSizeClass = "text-[10px]";
  let tagSizeClass = "text-[9px] px-2 py-0.5";

  if (isLarge) {
    // Large display (e.g. Book Detail page)
    metadataSizeClass = "text-xs";
    tagSizeClass = "text-xs px-2.5 py-1";
    authorSizeClass = "text-sm sm:text-base font-medium";
    if (titleLength <= 20) {
      titleSizeClass = "text-3xl sm:text-4xl font-extrabold leading-[1.12]";
    } else if (titleLength <= 45) {
      titleSizeClass = "text-2xl sm:text-3xl font-bold leading-[1.15]";
    } else if (titleLength <= 75) {
      titleSizeClass = "text-xl sm:text-2xl font-bold leading-snug";
    } else {
      titleSizeClass = "text-lg sm:text-xl font-semibold leading-snug";
    }
  } else if (isSmall) {
    // Small thumbnail display
    metadataSizeClass = "text-[8px]";
    tagSizeClass = "text-[8px] px-1.5 py-0.2";
    authorSizeClass = "text-[10px]";
    if (titleLength <= 25) {
      titleSizeClass = "text-xs font-bold leading-tight";
    } else {
      titleSizeClass = "text-[11px] font-semibold leading-tight";
    }
  } else {
    // Standard / Responsive (Cards, Carousels, Grids)
    if (titleLength <= 18) {
      titleSizeClass = "text-lg sm:text-xl font-bold leading-[1.15]";
    } else if (titleLength <= 38) {
      titleSizeClass = "text-base sm:text-lg font-bold leading-[1.18]";
    } else if (titleLength <= 65) {
      titleSizeClass = "text-sm sm:text-base font-semibold leading-[1.2]";
    } else {
      titleSizeClass = "text-xs sm:text-sm font-semibold leading-snug";
    }
  }

  // Formatting strings
  const displayYear = publicationYear ? String(publicationYear) : null;
  const displayIsbn = isbn ? (isbn.length > 13 ? isbn.slice(0, 13) : isbn) : null;
  const displayPublisher = publisher || "District Public Library";

  return (
    <div
      className={`relative w-full aspect-[2/3] overflow-hidden select-none transition-shadow duration-300 rounded-lg sm:rounded-xl shadow-md ${className}`}
      style={{
        background: palette.bgGradient,
        color: palette.textPrimary,
      }}
    >
      {/* 1. Subtle Paper Grain & Ambient Sheen Overlay (Pure CSS) */}
      <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10 pointer-events-none z-10" />

      {/* 2. Physical Book 3D Spine Depth Effects (Left Crease & Paper Edge) */}
      {showSpineEffect && (
        <>
          {/* Left spine shadow & fold crease */}
          <div className="absolute left-0 top-0 bottom-0 w-3 sm:w-4 bg-gradient-to-r from-black/40 via-black/15 to-transparent pointer-events-none z-20" />
          <div className="absolute left-2.5 sm:left-3 top-0 bottom-0 w-[1px] bg-white/20 pointer-events-none z-20" />
          {/* Right edge paper page trim */}
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-l from-black/30 to-transparent pointer-events-none z-20" />
          {/* Subtle perimeter binding border */}
          <div className="absolute inset-0 rounded-lg sm:rounded-xl border border-white/10 pointer-events-none z-20" />
        </>
      )}

      {/* 3. Dynamic Typography Layout Rendering (One of 6 distinct styles) */}
      <div className="relative w-full h-full p-4 sm:p-5 flex flex-col justify-between z-15 overflow-hidden">
        {/* LAYOUT 1: Left-Aligned Editorial (Faber & Pelican style) */}
        {layoutIndex === 0 && (
          <>
            {/* Header: Imprint & Category */}
            <div className="space-y-1.5 pt-0.5">
              <div className="flex items-center justify-between text-[9px] tracking-[0.2em] uppercase font-mono opacity-75">
                <span>District Library</span>
                {ddcCode && <span>DDC {ddcCode}</span>}
              </div>
              <span
                className={`inline-block font-semibold uppercase tracking-wider rounded-md border ${tagSizeClass}`}
                style={{
                  backgroundColor: palette.accentBg,
                  color: palette.accent,
                  borderColor: palette.frameBorder,
                }}
              >
                {categoryName}
              </span>
            </div>

            {/* Center: Prominent Left-Aligned Title & Author */}
            <div className="my-auto py-2 space-y-2">
              <h2
                className={`${fontFamilyClass} ${titleSizeClass} tracking-tight line-clamp-4`}
                style={{ color: palette.textPrimary }}
              >
                {title}
              </h2>
              {subtitle && !isSmall && (
                <p
                  className="font-serif italic text-xs sm:text-sm line-clamp-2 opacity-85"
                  style={{ color: palette.textSecondary }}
                >
                  {subtitle}
                </p>
              )}
              <div
                className="w-8 h-[2px] rounded-full my-2"
                style={{ backgroundColor: palette.accent }}
              />
              <p
                className={`${authorSizeClass} font-medium line-clamp-2`}
                style={{ color: palette.textSecondary }}
              >
                <span className="opacity-70 text-[10px] uppercase tracking-wider block font-sans">
                  Author
                </span>
                {authorName}
              </p>
            </div>

            {/* Footer: Publisher & ISBN Coordinates */}
            <div
              className={`pt-2 border-t flex items-center justify-between ${metadataSizeClass} opacity-80`}
              style={{ borderColor: palette.frameBorder }}
            >
              <span className="truncate max-w-[65%] font-medium">
                {displayPublisher}
              </span>
              {displayYear ? (
                <span className="font-mono">{displayYear}</span>
              ) : displayIsbn ? (
                <span className="font-mono">{displayIsbn.slice(-6)}</span>
              ) : (
                <span className="uppercase text-[8px] font-mono">OPAC</span>
              )}
            </div>
          </>
        )}

        {/* LAYOUT 2: Centered Classic (Everyman's Library / Folio Society) */}
        {layoutIndex === 1 && (
          <div className="w-full h-full flex flex-col justify-between text-center relative">
            {/* Elegant Inner Rule Frame */}
            <div
              className="absolute inset-1 sm:inset-1.5 border rounded pointer-events-none opacity-40"
              style={{ borderColor: palette.accent }}
            />

            {/* Header: Imprint */}
            <div className="pt-2 z-10">
              <span
                className="text-[9px] uppercase tracking-[0.25em] font-serif font-semibold block opacity-85"
                style={{ color: palette.accent }}
              >
                {categoryName}
              </span>
              <span className="text-[8px] font-mono tracking-widest uppercase opacity-60 block mt-0.5">
                Public Reference Holding
              </span>
            </div>

            {/* Center: Title & Author */}
            <div className="my-auto px-2 py-3 z-10 space-y-2.5">
              <h2
                className={`${fontFamilyClass} ${titleSizeClass} tracking-normal line-clamp-4`}
                style={{ color: palette.textPrimary }}
              >
                {title}
              </h2>
              <div
                className="flex items-center justify-center gap-2 text-xs opacity-70"
                style={{ color: palette.accent }}
              >
                <span>◆</span>
                <span className="w-6 h-[1px] bg-current" />
                <span>◆</span>
              </div>
              <p
                className={`font-serif ${authorSizeClass} tracking-wide uppercase line-clamp-2`}
                style={{ color: palette.textSecondary }}
              >
                {authorName}
              </p>
            </div>

            {/* Footer: Publisher & Year */}
            <div className="pb-2 z-10 space-y-0.5">
              <p
                className={`${metadataSizeClass} font-serif tracking-wider uppercase opacity-75`}
                style={{ color: palette.textSecondary }}
              >
                {displayPublisher}
              </p>
              {displayYear && (
                <p className="text-[9px] font-mono opacity-60">
                  Edition Mcmxlvi · {displayYear}
                </p>
              )}
            </div>
          </div>
        )}

        {/* LAYOUT 3: Editorial Asymmetric (New Yorker & Contemporary) */}
        {layoutIndex === 2 && (
          <>
            {/* Top Right Floating Badge */}
            <div className="flex justify-between items-start gap-2">
              <span className="text-[9px] font-mono tracking-widest uppercase opacity-60">
                {edition || "Vol. I"}
              </span>
              <span
                className={`font-semibold uppercase tracking-wider rounded border text-right ${tagSizeClass}`}
                style={{
                  backgroundColor: palette.accentBg,
                  color: palette.accent,
                  borderColor: palette.frameBorder,
                }}
              >
                {categoryName}
              </span>
            </div>

            {/* Title with left accent quotation bar */}
            <div
              className="my-auto pl-3 border-l-2 py-1 space-y-2"
              style={{ borderColor: palette.accent }}
            >
              <h2
                className={`${fontFamilyClass} ${titleSizeClass} tracking-tight line-clamp-4`}
                style={{ color: palette.textPrimary }}
              >
                {title}
              </h2>
              {subtitle && !isSmall && (
                <p
                  className="text-xs line-clamp-2 opacity-80"
                  style={{ color: palette.textSecondary }}
                >
                  {subtitle}
                </p>
              )}
            </div>

            {/* Author in high-contrast capsule & footer details */}
            <div className="space-y-2 pt-2">
              <div>
                <span
                  className="inline-block px-2.5 py-1 rounded text-xs font-semibold tracking-wide"
                  style={{
                    backgroundColor: palette.accentBg,
                    color: palette.textPrimary,
                    border: `1px solid ${palette.frameBorder}`,
                  }}
                >
                  {authorName}
                </span>
              </div>
              <div
                className={`flex items-center justify-between ${metadataSizeClass} font-mono opacity-70 pt-1 border-t`}
                style={{ borderColor: palette.frameBorder }}
              >
                <span className="truncate">{displayPublisher}</span>
                {displayIsbn && <span>#{displayIsbn.slice(-4)}</span>}
              </div>
            </div>
          </>
        )}

        {/* LAYOUT 4: Bold Minimal (Bauhaus / Swiss Typography) */}
        {layoutIndex === 3 && (
          <>
            {/* Top minimal header */}
            <div className="flex items-center justify-between text-[9px] font-mono font-bold tracking-widest uppercase opacity-75">
              <span>{categoryName}</span>
              {language && <span>{language.split("/")[0]}</span>}
            </div>

            {/* Oversized High-Impact Title */}
            <div className="my-auto py-2 space-y-3">
              <h2
                className={`font-sans font-black uppercase tracking-tight line-clamp-4 ${titleSizeClass}`}
                style={{ color: palette.textPrimary }}
              >
                {title}
              </h2>
              <div
                className="w-12 h-1 rounded-sm"
                style={{ backgroundColor: palette.accent }}
              />
              <p
                className="font-sans font-bold uppercase tracking-wider text-xs sm:text-sm line-clamp-2"
                style={{ color: palette.textSecondary }}
              >
                {authorName}
              </p>
            </div>

            {/* Technical metadata footer */}
            <div
              className={`flex items-center justify-between font-mono ${metadataSizeClass} pt-2 border-t opacity-75`}
              style={{ borderColor: palette.frameBorder }}
            >
              <span className="truncate">{displayPublisher}</span>
              {displayIsbn && <span>ISBN {displayIsbn}</span>}
            </div>
          </>
        )}

        {/* LAYOUT 5: Stacked Typography Grid */}
        {layoutIndex === 4 && (
          <>
            {/* Header block */}
            <div
              className="pb-2 border-b flex items-center justify-between"
              style={{ borderColor: palette.frameBorder }}
            >
              <span
                className="text-[9px] font-bold uppercase tracking-wider"
                style={{ color: palette.accent }}
              >
                {categoryName}
              </span>
              <span className="text-[9px] font-mono opacity-60">
                {displayYear || "Archive"}
              </span>
            </div>

            {/* Center Stacked Title */}
            <div className="my-auto py-2 space-y-1.5">
              <h2
                className={`${fontFamilyClass} ${titleSizeClass} tracking-tight line-clamp-4`}
                style={{ color: palette.textPrimary }}
              >
                {title}
              </h2>
              {subtitle && !isSmall && (
                <p
                  className="text-xs font-serif italic line-clamp-2 opacity-80"
                  style={{ color: palette.textSecondary }}
                >
                  {subtitle}
                </p>
              )}
            </div>

            {/* Contrast Author Block & Footer */}
            <div className="space-y-1.5">
              <div
                className="p-2 rounded-md"
                style={{
                  backgroundColor: palette.accentBg,
                  border: `1px solid ${palette.frameBorder}`,
                }}
              >
                <p className="text-[9px] uppercase tracking-wider opacity-60 font-mono">
                  Authored By
                </p>
                <p
                  className={`font-bold ${authorSizeClass} line-clamp-1`}
                  style={{ color: palette.textPrimary }}
                >
                  {authorName}
                </p>
              </div>
              <div
                className={`flex items-center justify-between text-[9px] font-mono opacity-70 px-0.5`}
              >
                <span className="truncate">{displayPublisher}</span>
                {ddcCode && <span>DDC {ddcCode}</span>}
              </div>
            </div>
          </>
        )}

        {/* LAYOUT 6: Classic Banded Editorial (Penguin Tri-Band Heritage) */}
        {layoutIndex === 5 && (
          <div className="w-full h-full flex flex-col justify-between -m-4 sm:-m-5 p-0">
            {/* Top Band: Library & Category */}
            <div
              className="p-3.5 sm:p-4 text-center border-b"
              style={{
                backgroundColor: palette.bandBg,
                borderColor: palette.frameBorder,
              }}
            >
              <span
                className="text-[9px] font-serif font-bold uppercase tracking-[0.2em] block"
                style={{ color: palette.accent }}
              >
                District Public Library
              </span>
              <span className="text-[8px] uppercase tracking-widest font-mono opacity-80 text-white">
                {categoryName}
              </span>
            </div>

            {/* Middle Main Band: Title & Author */}
            <div className="flex-1 p-4 sm:p-5 flex flex-col justify-center text-center space-y-2">
              <h2
                className={`${fontFamilyClass} ${titleSizeClass} tracking-normal line-clamp-4`}
                style={{ color: palette.textPrimary }}
              >
                {title}
              </h2>
              <div
                className="w-10 h-[1px] mx-auto my-1.5"
                style={{ backgroundColor: palette.accent }}
              />
              <p
                className={`font-serif ${authorSizeClass} tracking-wide uppercase line-clamp-2`}
                style={{ color: palette.textSecondary }}
              >
                {authorName}
              </p>
            </div>

            {/* Bottom Band: Publisher & ISBN */}
            <div
              className="p-2.5 sm:p-3 text-center border-t flex items-center justify-between text-[9px] font-mono px-4"
              style={{
                backgroundColor: palette.bandBg,
                borderColor: palette.frameBorder,
                color: palette.bandText,
              }}
            >
              <span className="truncate max-w-[60%]">{displayPublisher}</span>
              {displayYear ? (
                <span>{displayYear}</span>
              ) : displayIsbn ? (
                <span>{displayIsbn.slice(-5)}</span>
              ) : (
                <span>OPAC</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
