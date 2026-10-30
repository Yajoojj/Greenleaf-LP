import { useId, useMemo } from 'react';
import { leafOutlinePaths } from '../three/leaf-shape';

/**
 * Ilustração vetorial da mesma folha da cena 3D. Aparece enquanto o WebGL
 * carrega e fica como reserva quando ele não está disponível.
 */
export function LeafIllustration({ severity = 0, className = '' }: { severity?: number; className?: string }) {
  const id = useId();
  const paths = useMemo(() => leafOutlinePaths(), []);
  // Manchas fixas e determinísticas; aparecem conforme a severidade.
  const spots = useMemo(() => {
    const list: { x: number; y: number; r: number; at: number }[] = [];
    let seed = 42;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 34; i++) {
      const a = (rnd() - 0.5) * 3.6, d = 50 + rnd() * 140;
      list.push({ x: Math.sin(a) * d, y: -Math.cos(a) * d, r: 4 + rnd() * 9, at: rnd() * 0.9 });
    }
    return list;
  }, []);
  return (
    <svg className={`leaf-illustration ${className}`} viewBox="-240 -250 480 420" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#6f9a3c" />
          <stop offset=".3" stopColor="#3f7a2b" />
          <stop offset="1" stopColor="#2f6a24" />
        </linearGradient>
        <clipPath id={`${id}-clip`}>{paths.map((p, i) => <path key={i} d={p.lobe} />)}</clipPath>
      </defs>
      <path d="M0,0 C4,40 14,90 26,150" stroke="#a33c4a" strokeWidth="6" fill="none" strokeLinecap="round" />
      {paths.map((p, i) => <path key={i} d={p.lobe} fill={`url(#${id}-g)`} stroke="#9fc57a" strokeOpacity=".35" strokeWidth="1" />)}
      <g clipPath={`url(#${id}-clip)`}>
        {spots.filter((s) => s.at < severity).map((s, i) => (
          <g key={i}>
            <circle cx={s.x} cy={s.y} r={s.r * 1.6} fill="#c9b52a" opacity=".55" />
            <circle cx={s.x} cy={s.y} r={s.r} fill="#4a2e14" />
          </g>
        ))}
      </g>
      {paths.map((p, i) => <path key={i} d={p.rib} stroke="#cfe09a" strokeOpacity=".7" strokeWidth="2" fill="none" />)}
    </svg>
  );
}
