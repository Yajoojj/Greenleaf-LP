/**
 * Forma da folha sem dependência do Three.js: usada pela malha 3D e pela
 * ilustração vetorial de reserva (sem WebGL), para que as duas coincidam.
 */
export type AnchorId = 'lobe' | 'midrib' | 'petiole' | 'lesion' | 'halo' | 'margin';

export interface LobeSpec {
  angle: number; // radianos, a partir do eixo +y no plano da folha
  len: number;
  wid: number;
  lift: number; // inclinação para fora do plano (forma de taça)
  droop: number;
  cup: number;
  twist: number;
  phase: number;
}

export const BASE_R = 0.035; // raio em que os lóbulos começam (evita sobreposição no centro)

export function lobeSpecs(): LobeSpec[] {
  const d = Math.PI / 180;
  // [ângulo, comprimento, largura]: lóbulo central, pares laterais e os dois pequenos junto ao pecíolo.
  const table: [number, number, number][] = [
    [0, 1, 1],
    [37, 0.94, 0.98], [-37, 0.94, 0.98],
    [74, 0.8, 0.92], [-74, 0.8, 0.92],
    [114, 0.52, 0.8], [-114, 0.52, 0.8],
  ];
  return table.map(([a, len, wid], i) => ({
    angle: a * d,
    len: 2.15 * len,
    wid: 0.3 * wid,
    lift: 0.2 - Math.abs(a) * d * 0.05,
    droop: 0.16 + (1 - len) * 0.1,
    cup: 0.42,
    twist: (a === 0 ? 0 : Math.sign(a) * 0.1) + (i % 2 ? 0.02 : -0.02),
    phase: i * 1.7,
  }));
}

/** Meia largura do lóbulo em u (0 = base, 1 = ponta): obovado, ponta acuminada. */
export function halfWidth(u: number, W: number) {
  const s = Math.sin(Math.PI * Math.pow(Math.min(Math.max(u, 0), 1), 1.22));
  return W * Math.pow(Math.max(s, 0), 0.82) * (1 - 0.18 * Math.pow(u, 6));
}

/** Contorno 2D da folha vista de cima (unidades × 100), para o SVG de reserva. */
export function leafOutlinePaths(): { lobe: string; rib: string }[] {
  return lobeSpecs().map((spec) => {
    const steps = 40;
    const toXY = (x: number, u: number): [number, number] => {
      const y = BASE_R + u * spec.len * Math.cos(spec.lift);
      const c = Math.cos(spec.angle), s = Math.sin(spec.angle);
      return [x * c - y * s, x * s + y * c];
    };
    const right: [number, number][] = [];
    const left: [number, number][] = [];
    for (let i = 0; i <= steps; i++) {
      const u = i / steps, w = halfWidth(u, spec.wid);
      right.push(toXY(w, u));
      left.unshift(toXY(-w, u));
    }
    const fmt = ([x, y]: [number, number]) => `${(x * 100).toFixed(1)},${(-y * 100).toFixed(1)}`;
    return {
      lobe: `M${[...right, ...left].map(fmt).join(' L')} Z`,
      rib: `M${fmt(toXY(0, 0))} L${fmt(toXY(0, 0.96))}`,
    };
  });
}
