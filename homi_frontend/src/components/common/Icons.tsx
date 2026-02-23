import React from 'react';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Homi Icon Design System — Premium SVG Pictograms
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Feather-style stroke-based icons with built-in:
 * • Consistent size scale (xs → 2xl)
 * • WCAG accessibility (aria-hidden for decorative, aria-label for meaningful)
 * • Touch-target aware sizing (min 44px hit area via parent padding)
 * • Responsive-ready className overrides
 *
 * ─── SIZE GUIDE ────────────────────────────────────────────────
 * | Size  | Class    | Px  | Usage                             |
 * |-------|----------|-----|-----------------------------------|
 * | 2xs   | w-3 h-3  | 12  | Compact inline indicators         |
 * | xs    | w-3.5…   | 14  | Spell-check hints, tiny badges    |
 * | sm    | w-4 h-4  | 16  | Nav items, dropdown menus, tables |
 * | md    | w-5 h-5  | 20  | DEFAULT — section headers, cards  |
 * | lg    | w-6 h-6  | 24  | Prominent actions, feature tiles  |
 * | xl    | w-8 h-8  | 32  | Page headers, hero sections       |
 * | 2xl   | w-10 h-10| 40  | Empty states, onboarding          |
 * | 3xl   | w-14 h-14| 56  | Full-page empty states            |
 *
 * ─── ACCESSIBILITY ─────────────────────────────────────────────
 * • Decorative icons (next to text): default aria-hidden="true"
 * • Meaningful icons (standalone): pass label="Description"
 * • Screen readers see label text or skip the icon entirely
 *
 * ─── USAGE EXAMPLES ───────────────────────────────────────────
 * <IconHome />                           // 20px decorative
 * <IconHome className="w-4 h-4" />       // 16px nav size
 * <IconHome className="w-8 h-8" />       // 32px header
 * <IconHome label="Accueil" />           // Accessible standalone
 * ═══════════════════════════════════════════════════════════════════════════
 */

/* ─── Icon Props ────────────────────────────────────────────────────────── */
export interface IconProps {
  /** Tailwind size + color classes. Default: 'w-5 h-5' (20px) */
  className?: string;
  /** Accessible label for standalone icons — adds role="img" + aria-label */
  label?: string;
  /** Additional inline styles (rare — prefer className) */
  style?: React.CSSProperties;
}

const defaultClass = 'w-5 h-5';

/* ─── SVG Wrapper — shared boilerplate for all icons ────────────────────── */
// eslint-disable-next-line react-refresh/only-export-components
const I = ({ className = defaultClass, label, style, children }: IconProps & { children: React.ReactNode }) => (
  <svg
    className={className}
    style={style}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...(label
      ? { role: 'img', 'aria-label': label }
      : { 'aria-hidden': true as const }
    )}
  >
    {children}
  </svg>
);

/* ═══════════════════════════════════════════════════════════════════════════
   ICON COMPONENTS — Alphabetical order, consistent API
   Each icon spreads { className, label, style } to the I wrapper.
   ═══════════════════════════════════════════════════════════════════════════ */

// ─── Activity / Pulse ───
export const IconActivity: React.FC<IconProps> = (p) => (
  <I {...p}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></I>
);

// ─── Alert Triangle / Warning ───
export const IconAlertTriangle: React.FC<IconProps> = (p) => (
  <I {...p}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></I>
);

// ─── Arrow Left ───
export const IconArrowLeft: React.FC<IconProps> = (p) => (
  <I {...p}><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></I>
);

// ─── Award / Badge ───
export const IconAward: React.FC<IconProps> = (p) => (
  <I {...p}><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></I>
);

// ─── Bar Chart ───
export const IconBarChart: React.FC<IconProps> = (p) => (
  <I {...p}><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></I>
);

// ─── Bell / Notification ───
export const IconBell: React.FC<IconProps> = (p) => (
  <I {...p}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></I>
);

// ─── Calendar ───
export const IconCalendar: React.FC<IconProps> = (p) => (
  <I {...p}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></I>
);

// ─── Check (simple checkmark, no circle) ───
export const IconCheck: React.FC<IconProps> = (p) => (
  <I {...p}><polyline points="20 6 9 17 4 12" /></I>
);

// ─── Check Circle ───
export const IconCheckCircle: React.FC<IconProps> = (p) => (
  <I {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></I>
);

// ─── Chevron Down ───  (NEW — for dropdowns)
export const IconChevronDown: React.FC<IconProps> = (p) => (
  <I {...p}><polyline points="6 9 12 15 18 9" /></I>
);

// ─── Clipboard / Tasks List ───
export const IconClipboard: React.FC<IconProps> = (p) => (
  <I {...p}><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /></I>
);

// ─── Clock / Timer ───
export const IconClock: React.FC<IconProps> = (p) => (
  <I {...p}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></I>
);

// ─── Coins / Euro ───
export const IconCoins: React.FC<IconProps> = (p) => (
  <I {...p}><circle cx="8" cy="8" r="6" /><path d="M18.09 10.37A6 6 0 1 1 10.34 18" /><path d="M7 6h1v4" /><path d="M4.22 7.22H10" /><path d="M4.22 8.78H10" /></I>
);

// ─── Construction / Build ───
export const IconConstruction: React.FC<IconProps> = (p) => (
  <I {...p}><rect x="2" y="6" width="20" height="8" rx="1" /><path d="M17 14v7" /><path d="M7 14v7" /><path d="M17 3v3" /><path d="M7 3v3" /><path d="M10 14 2.3 6.3" /><path d="M14 6 21.7 13.7" /><path d="M8 6l8 8" /></I>
);

// ─── Dollar / Currency ───
export const IconDollar: React.FC<IconProps> = (p) => (
  <I {...p}><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></I>
);

// ─── Download / Export ───
export const IconDownload: React.FC<IconProps> = (p) => (
  <I {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></I>
);

// ─── Edit / Pencil ───
export const IconEdit: React.FC<IconProps> = (p) => (
  <I {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></I>
);

// ─── Eye ───
export const IconEye: React.FC<IconProps> = (p) => (
  <I {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></I>
);

// ─── Eye Off / Hidden ───
export const IconEyeOff: React.FC<IconProps> = (p) => (
  <I {...p}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></I>
);

// ─── File Plus (NEW — for create invoice) ───
export const IconFilePlus: React.FC<IconProps> = (p) => (
  <I {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" /></I>
);

// ─── File Text / Document ───
export const IconFileText: React.FC<IconProps> = (p) => (
  <I {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></I>
);

// ─── File Logs (NEW — for admin logs) ───
export const IconFileLogs: React.FC<IconProps> = (p) => (
  <I {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><polyline points="10 9 9 9 8 9" /></I>
);

// ─── Filter ───
export const IconFilter: React.FC<IconProps> = (p) => (
  <I {...p}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></I>
);

// ─── Fire / Flame ───
export const IconFire: React.FC<IconProps> = (p) => (
  <I {...p}><path d="M12 12c2-2.96 0-7-1-8 0 3.038-1.773 4.741-3 6-1.226 1.26-2 3.24-2 5a6 6 0 1 0 12 0c0-1.532-1.056-3.94-2-5-1.786 3-2 2-4 2z" /></I>
);

// ─── Heart / Favorite ───
export const IconHeart: React.FC<IconProps> = (p) => (
  <I {...p}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></I>
);

// ─── Help Circle / Support ───
export const IconHelpCircle: React.FC<IconProps> = (p) => (
  <I {...p}><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></I>
);

// ─── Home / House ───
export const IconHome: React.FC<IconProps> = (p) => (
  <I {...p}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></I>
);

// ─── Hourglass / Loading ───
export const IconHourglass: React.FC<IconProps> = (p) => (
  <I {...p}><path d="M5 22h14" /><path d="M5 2h14" /><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" /><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" /></I>
);

// ─── Info ───
export const IconInfo: React.FC<IconProps> = (p) => (
  <I {...p}><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></I>
);

// ─── Key ───
export const IconKey: React.FC<IconProps> = (p) => (
  <I {...p}><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" /></I>
);

// ─── Layers (NEW — for admin content) ───
export const IconLayers: React.FC<IconProps> = (p) => (
  <I {...p}><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></I>
);

// ─── Lock / Security ───
export const IconLock: React.FC<IconProps> = (p) => (
  <I {...p}><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></I>
);

// ─── Log Out ───
export const IconLogOut: React.FC<IconProps> = (p) => (
  <I {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></I>
);

// ─── Mail ───
export const IconMail: React.FC<IconProps> = (p) => (
  <I {...p}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></I>
);

// ─── Map Pin ───
export const IconMapPin: React.FC<IconProps> = (p) => (
  <I {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></I>
);

// ─── Menu / Hamburger (NEW) ───
export const IconMenu: React.FC<IconProps> = (p) => (
  <I {...p}><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></I>
);

// ─── Message / Chat ───
export const IconMessage: React.FC<IconProps> = (p) => (
  <I {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></I>
);

// ─── Monitor / Desktop ───
export const IconMonitor: React.FC<IconProps> = (p) => (
  <I {...p}><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></I>
);

// ─── Moon ───
export const IconMoon: React.FC<IconProps> = (p) => (
  <I {...p}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></I>
);

// ─── Package / Box ───
export const IconPackage: React.FC<IconProps> = (p) => (
  <I {...p}><line x1="16.5" y1="9.4" x2="7.5" y2="4.21" /><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></I>
);

// ─── Pause ───
export const IconPause: React.FC<IconProps> = (p) => (
  <I {...p}><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></I>
);

// ─── Pin ───
export const IconPin: React.FC<IconProps> = (p) => (
  <I {...p}><line x1="12" y1="17" x2="12" y2="22" /><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" /></I>
);

// ─── Play ───
export const IconPlay: React.FC<IconProps> = (p) => (
  <I {...p}><polygon points="5 3 19 12 5 21 5 3" /></I>
);

// ─── Plus ───
export const IconPlus: React.FC<IconProps> = (p) => (
  <I {...p}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></I>
);

// ─── Plus Circle ───
export const IconPlusCircle: React.FC<IconProps> = (p) => (
  <I {...p}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></I>
);

// ─── Refresh / Repeat ───
export const IconRefresh: React.FC<IconProps> = (p) => (
  <I {...p}><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></I>
);

// ─── Rocket ───
export const IconRocket: React.FC<IconProps> = (p) => (
  <I {...p}><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" /><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" /><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" /><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" /></I>
);

// ─── Search / Magnifier ───
export const IconSearch: React.FC<IconProps> = (p) => (
  <I {...p}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></I>
);

// ─── Settings / Gear ───
export const IconSettings: React.FC<IconProps> = (p) => (
  <I {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></I>
);

// ─── Shield ───
export const IconShield: React.FC<IconProps> = (p) => (
  <I {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></I>
);

// ─── Star ───
export const IconStar: React.FC<IconProps> = (p) => (
  <I {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></I>
);

// ─── Sun ───
export const IconSun: React.FC<IconProps> = (p) => (
  <I {...p}><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></I>
);

// ─── Task Check (NEW — for tasks nav: checkmark + box) ───
export const IconTaskCheck: React.FC<IconProps> = (p) => (
  <I {...p}><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></I>
);

// ─── Trash ───
export const IconTrash: React.FC<IconProps> = (p) => (
  <I {...p}><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></I>
);

// ─── Trending Up ───
export const IconTrendingUp: React.FC<IconProps> = (p) => (
  <I {...p}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></I>
);

// ─── Trophy ───
export const IconTrophy: React.FC<IconProps> = (p) => (
  <I {...p}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></I>
);

// ─── User / Person ───
export const IconUser: React.FC<IconProps> = (p) => (
  <I {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></I>
);

// ─── Users / People ───
export const IconUsers: React.FC<IconProps> = (p) => (
  <I {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></I>
);

// ─── X / Close (NEW) ───
export const IconX: React.FC<IconProps> = (p) => (
  <I {...p}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></I>
);

// ─── X Circle ───
export const IconXCircle: React.FC<IconProps> = (p) => (
  <I {...p}><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></I>
);

// ─── Zap / Lightning ───
export const IconZap: React.FC<IconProps> = (p) => (
  <I {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></I>
);
