import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;
const base = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, focusable: false } as const;

export const ArrowRight = (p: IconProps) => <svg {...base} {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
export const ArrowUpRight = (p: IconProps) => <svg {...base} {...p}><path d="M7 17 17 7M8 7h9v9" /></svg>;
export const ArrowDown = (p: IconProps) => <svg {...base} {...p}><path d="M12 5v14M6 13l6 6 6-6" /></svg>;
export const ChevronLeft = (p: IconProps) => <svg {...base} {...p}><path d="m15 6-6 6 6 6" /></svg>;
export const ChevronRight = (p: IconProps) => <svg {...base} {...p}><path d="m9 6 6 6-6 6" /></svg>;
export const Plus = (p: IconProps) => <svg {...base} {...p}><path d="M12 5v14M5 12h14" /></svg>;
export const Minus = (p: IconProps) => <svg {...base} {...p}><path d="M5 12h14" /></svg>;
export const Reset = (p: IconProps) => <svg {...base} {...p}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>;
export const RotateLeft = (p: IconProps) => <svg {...base} {...p}><path d="M4 12a8 8 0 1 0 2.3-5.7" /><path d="M4 4v5h5" /></svg>;
export const RotateRight = (p: IconProps) => <svg {...base} {...p}><path d="M20 12a8 8 0 1 1-2.3-5.7" /><path d="M20 4v5h-5" /></svg>;
export const Play = (p: IconProps) => <svg {...base} {...p}><path d="M8 5.5v13l11-6.5z" fill="currentColor" /></svg>;
export const Camera = (p: IconProps) => <svg {...base} {...p}><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>;
export const Scan = (p: IconProps) => <svg {...base} {...p}><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M4 12h16" /></svg>;
export const Leaf = (p: IconProps) => <svg {...base} {...p}><path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15" /><path d="M5 19 14 10" /></svg>;
export const Check = (p: IconProps) => <svg {...base} {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>;
export const Shield = (p: IconProps) => <svg {...base} {...p}><path d="M12 3 5 6v6c0 4.2 3 7.7 7 9 4-1.3 7-4.8 7-9V6z" /><path d="m9 12 2 2 4-4" /></svg>;
export const Wifi = (p: IconProps) => <svg {...base} {...p}><path d="M2 8.5a15 15 0 0 1 20 0M5.5 12a10 10 0 0 1 13 0M9 15.5a5 5 0 0 1 6 0" /><circle cx="12" cy="19" r="1" fill="currentColor" /></svg>;
export const Sun = (p: IconProps) => <svg {...base} {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>;
export const Cloud = (p: IconProps) => <svg {...base} {...p}><path d="M7 18h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 9a4.5 4.5 0 0 0 1 9z" /></svg>;
export const Mail = (p: IconProps) => <svg {...base} {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>;
export const Github = (p: IconProps) => (
  <svg {...base} fill="currentColor" stroke="none" {...p}>
    <path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.8c-2.8.6-3.4-1.2-3.4-1.2-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.7 1a9.4 9.4 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.9V21c0 .3.2.6.7.5A10 10 0 0 0 12 2z" />
  </svg>
);

/** Ícones de estado com formas diferentes, como no app (círculo ✓, círculo !, triângulo, octógono). */
export function StateIcon({ state, ...p }: IconProps & { state: 'sadia' | 'leve' | 'moderada' | 'grave' | 'other' }) {
  if (state === 'sadia') return <svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="m8 12.5 2.8 2.8L16.5 9.5" /></svg>;
  if (state === 'leve' || state === 'other') return <svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5M12 16.5h.01" /></svg>;
  if (state === 'moderada') return <svg {...base} {...p}><path d="M12 3.5 21.5 20h-19z" /><path d="M12 10v4.5M12 17.5h.01" /></svg>;
  return <svg {...base} {...p}><path d="M8.3 3h7.4L21 8.3v7.4L15.7 21H8.3L3 15.7V8.3z" /><path d="M12 7.5v5.5M12 16.5h.01" /></svg>;
}
