import * as THREE from 'three';
import { BASE_R, halfWidth, lobeSpecs, type AnchorId, type LobeSpec } from './leaf-shape';

export type { AnchorId } from './leaf-shape';

/**
 * Folha de mandioca (Manihot esculenta) procedural.
 *
 * Morfologia: folha palmada com 7 lóbulos obovado-lanceolados que partem do
 * ponto de inserção do pecíolo; lóbulo central maior, laterais decrescentes.
 * Cada lóbulo é uma malha paramétrica (u = base→ponta, v = margem→margem) com
 * curvatura de nervura, arqueamento e margem levemente ondulada. As nervuras
 * e as lesões ficam em texturas geradas em canvas, num atlas com uma coluna
 * por lóbulo, para que cada lóbulo tenha manchas próprias.
 *
 * As lesões seguem o quadro da bacteriose: manchas angulares de aspecto
 * encharcado, centro necrótico pardo e halo amarelado (clorótico). Um único
 * uniforme (`uSeverity`) controla o avanço das manchas; a cobertura da folha
 * é medida no próprio mapa, para aplicar as mesmas faixas de gravidade do app.
 */

const COLUMN_W = 192;
const COLUMN_H = 768;
const PAD = 0.035; // margem da coluna no atlas, evita vazamento entre lóbulos

/** Gerador determinístico (mulberry32): a mesma folha em todo carregamento. */
function random(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function lobePoint(u: number, v: number, s: LobeSpec, out = new THREE.Vector3()) {
  const w = halfWidth(u, s.wid);
  let x = v * w;
  const y = BASE_R + u * s.len;
  let z = s.cup * v * v * w; // nervura central mais baixa que as margens
  z -= s.droop * u * u * s.len; // ponta arqueada para baixo
  z += 0.016 * Math.sin(u * 15 + s.phase) * v * v * (w / s.wid); // margem ondulada
  const t = s.twist * u;
  const c = Math.cos(t), sn = Math.sin(t);
  const xr = x * c - z * sn;
  z = x * sn + z * c;
  x = xr;
  return out.set(x, y, z);
}

function lobeGeometry(spec: LobeSpec, index: number, count: number) {
  const NU = 72, NV = 22;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const p = new THREE.Vector3();
  for (let i = 0; i <= NU; i++) {
    // Mais segmentos perto da base e da ponta, onde a silhueta muda rápido.
    const u = 0.5 - 0.5 * Math.cos((i / NU) * Math.PI);
    for (let j = 0; j <= NV; j++) {
      const v = (j / NV) * 2 - 1;
      lobePoint(u, v, spec, p);
      positions.push(p.x, p.y, p.z);
      const col = PAD + ((v + 1) / 2) * (1 - PAD * 2);
      uvs.push((index + col) / count, u);
    }
  }
  for (let i = 0; i < NU; i++) {
    for (let j = 0; j < NV; j++) {
      const a = i * (NV + 1) + j;
      const b = a + NV + 1;
      // Face frontal voltada para +z (face superior da folha).
      indices.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

interface Spot { lobe: number; u: number; v: number; r: number; b: number; }

function spotsFor(specs: LobeSpec[], rnd: () => number): Spot[] {
  const spots: Spot[] = [];
  // Mancha de referência: aparece primeiro e recebe o marcador "lesão angular".
  spots.push({ lobe: 1, u: 0.5, v: 0.32, r: 0.05, b: 1 });
  specs.forEach((_, lobe) => {
    const n = lobe < 3 ? 26 : lobe < 5 ? 20 : 12;
    for (let k = 0; k < n; k++) {
      const marginal = rnd() < 0.38; // a bacteriose costuma começar pelas margens
      const v = marginal ? (rnd() < 0.5 ? -1 : 1) * (0.72 + rnd() * 0.22) : (rnd() * 2 - 1) * 0.75;
      spots.push({ lobe, u: 0.12 + rnd() * 0.8, v, r: 0.022 + rnd() * 0.05, b: 0.32 + Math.pow(rnd(), 1.6) * 0.62 });
    }
    // Secamento a partir da ponta: só aparece nas fases graves.
    spots.push({ lobe, u: 0.98, v: 0, r: 0.22, b: 0.36 });
  });
  return spots;
}

interface Atlas {
  map: HTMLCanvasElement;
  bump: HTMLCanvasElement;
  lesion: HTMLCanvasElement;
  /** Distribuição da área da folha por valor do campo de lesão (0–255). */
  histogram: Float64Array;
  total: number;
}

function paintAtlas(specs: LobeSpec[], spots: Spot[], rnd: () => number): Atlas {
  const N = specs.length;
  const W = COLUMN_W * N, H = COLUMN_H;
  const make = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
  const map = make(), bump = make(), lesion = make();
  const m = map.getContext('2d')!, b = bump.getContext('2d')!, l = lesion.getContext('2d')!;
  const X = (lobe: number, v: number) => (lobe + PAD + ((v + 1) / 2) * (1 - PAD * 2)) * COLUMN_W;
  const Y = (u: number) => (1 - u) * H;

  b.fillStyle = '#808080';
  b.fillRect(0, 0, W, H);
  l.fillStyle = '#000';
  l.fillRect(0, 0, W, H);

  specs.forEach((spec, lobe) => {
    const x0 = lobe * COLUMN_W;
    // Lâmina: verde-escuro na face superior, mais claro junto à base.
    const g = m.createLinearGradient(0, H, 0, 0);
    g.addColorStop(0, '#6f9a3c');
    g.addColorStop(0.18, '#3f7a2b');
    g.addColorStop(0.7, '#2f6a24');
    g.addColorStop(1, '#3a7428');
    m.fillStyle = g;
    m.fillRect(x0, 0, COLUMN_W, H);

    // Variação de tom (manchas suaves de clorofila).
    for (let k = 0; k < 90; k++) {
      const r = 8 + rnd() * 34;
      m.fillStyle = `rgba(${rnd() < 0.5 ? '70,120,40' : '28,78,26'},${0.05 + rnd() * 0.08})`;
      m.beginPath();
      m.ellipse(x0 + rnd() * COLUMN_W, rnd() * H, r, r * 1.6, 0, 0, Math.PI * 2);
      m.fill();
    }
    // Rede fina de nervuras (aréolas).
    m.strokeStyle = 'rgba(150,200,110,0.08)';
    b.strokeStyle = 'rgba(160,160,160,0.6)';
    m.lineWidth = 1; b.lineWidth = 1;
    for (let k = 0; k < 260; k++) {
      const x = x0 + rnd() * COLUMN_W, y = rnd() * H, a = rnd() * Math.PI;
      const len = 6 + rnd() * 14;
      for (const ctx of [m, b]) {
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); ctx.stroke();
      }
    }
    // Nervuras secundárias: saem da central e curvam em direção à ponta.
    const step = 0.042 + (1 - spec.len / 2.15) * 0.02;
    for (let u0 = 0.05; u0 < 0.93; u0 += step) {
      for (const side of [-1, 1]) {
        const xs = X(lobe, 0), ys = Y(u0);
        const xe = X(lobe, side * 0.98), ye = Y(Math.min(u0 + 0.075, 0.99));
        const cx = X(lobe, side * 0.45), cy = Y(u0 + 0.012);
        m.strokeStyle = 'rgba(176,214,124,0.42)';
        m.lineWidth = 2.2 * (1 - u0 * 0.5);
        m.beginPath(); m.moveTo(xs, ys); m.quadraticCurveTo(cx, cy, xe, ye); m.stroke();
        b.strokeStyle = '#d0d0d0';
        b.lineWidth = 3 * (1 - u0 * 0.5);
        b.beginPath(); b.moveTo(xs, ys); b.quadraticCurveTo(cx, cy, xe, ye); b.stroke();
      }
    }
    // Nervura central: avermelhada na base (comum em várias variedades), clara no restante.
    const rib = m.createLinearGradient(0, H, 0, 0);
    rib.addColorStop(0, '#b0505a');
    rib.addColorStop(0.22, '#c9b27a');
    rib.addColorStop(0.45, '#cfe09a');
    rib.addColorStop(1, '#a9cc7c');
    for (let i = 0; i < 40; i++) {
      const u = i / 40, u2 = (i + 1) / 40;
      const width = 7.5 * (1 - u) + 1;
      m.strokeStyle = rib; m.lineWidth = width; m.lineCap = 'round';
      m.beginPath(); m.moveTo(X(lobe, 0), Y(u)); m.lineTo(X(lobe, 0), Y(u2)); m.stroke();
      b.strokeStyle = '#ffffff'; b.lineWidth = width + 3;
      b.beginPath(); b.moveTo(X(lobe, 0), Y(u)); b.lineTo(X(lobe, 0), Y(u2)); b.stroke();
    }
    // Margem levemente mais clara.
    for (const side of [-1, 1]) {
      m.strokeStyle = 'rgba(160,190,90,0.35)'; m.lineWidth = 3;
      m.beginPath(); m.moveTo(X(lobe, side), 0); m.lineTo(X(lobe, side), H); m.stroke();
    }
  });

  // Campo de lesões: cada mancha é um gradiente radial cujo pico (b) define a
  // ordem em que aparece; "lighten" mantém o máximo onde manchas se encostam.
  l.globalCompositeOperation = 'lighten';
  for (const spot of spots) {
    const spec = specs[spot.lobe];
    const w = halfWidth(spot.u, spec.wid) / spec.wid;
    const stretch = Math.min(1 / Math.max(w, 0.2), 4); // compensa o estreitamento do lóbulo
    const lobes = spot.r > 0.15 ? 1 : 3 + Math.floor(rnd() * 3);
    for (let k = 0; k < lobes; k++) {
      const jitterU = k ? (rnd() - 0.5) * spot.r * 0.9 : 0;
      const jitterV = k ? (rnd() - 0.5) * spot.r * 3 : 0;
      const cx = X(spot.lobe, Math.max(-1, Math.min(1, spot.v + jitterV)));
      const cy = Y(spot.u + jitterU);
      // r está em unidades do comprimento do lóbulo; a coluna tem quase a mesma
      // escala em x e y na largura máxima, e `stretch` corrige o resto.
      const ry = spot.r * (k ? 0.55 + rnd() * 0.4 : 1) * H;
      const rx = ry * stretch * 1.1;
      const peak = Math.round(spot.b * 255 * (k ? 0.93 + rnd() * 0.07 : 1));
      l.save();
      l.translate(cx, cy);
      l.rotate((rnd() - 0.5) * 0.6);
      l.scale(rx / ry, 1);
      const gr = l.createRadialGradient(0, 0, 0, 0, 0, ry);
      gr.addColorStop(0, `rgb(${peak},0,0)`);
      gr.addColorStop(0.55, `rgb(${Math.round(peak * 0.5)},0,0)`);
      gr.addColorStop(1, 'rgb(0,0,0)');
      l.fillStyle = gr;
      l.beginPath(); l.arc(0, 0, ry, 0, Math.PI * 2); l.fill();
      l.restore();
    }
  }
  l.globalCompositeOperation = 'source-over';

  // Histograma ponderado pela largura real do lóbulo em cada linha.
  const data = l.getImageData(0, 0, W, H).data;
  const histogram = new Float64Array(256);
  let total = 0;
  for (let y = 0; y < H; y++) {
    const u = 1 - y / H;
    specs.forEach((spec, lobe) => {
      const weight = halfWidth(u, spec.wid) * spec.len;
      if (weight <= 0) return;
      const from = Math.ceil((lobe + PAD) * COLUMN_W), to = Math.floor((lobe + 1 - PAD) * COLUMN_W);
      for (let x = from; x < to; x++) {
        histogram[data[(y * W + x) * 4]] += weight;
        total += weight;
      }
    });
  }
  return { map, bump, lesion, histogram, total };
}

export interface LeafUniforms {
  uLesion: { value: THREE.Texture };
  uSeverity: { value: number };
  uScan: { value: number };
  uScanPos: { value: number };
  uWilt: { value: number };
  uLobes: { value: number };
}

export interface Leaf {
  group: THREE.Group;
  uniforms: LeafUniforms;
  /** Fração da folha coberta por lesões para um valor de severidade (0–1). */
  coverageAt(severity: number): number;
  /** Severidade que produz uma cobertura (0–1). */
  severityFor(coverage: number): number;
  /** Posição atual do marcador no espaço do mundo. */
  anchor(id: AnchorId, target: THREE.Vector3): THREE.Vector3;
  /** Normal aproximada no marcador (para esconder os que ficam de costas). */
  anchorNormal(id: AnchorId, target: THREE.Vector3): THREE.Vector3;
  sway(time: number, amount: number): void;
  dispose(): void;
}

export function createLeaf({ seed = 7, anisotropy = 4 }: { seed?: number; anisotropy?: number } = {}): Leaf {
  const rnd = random(seed);
  const specs = lobeSpecs();
  const spots = spotsFor(specs, rnd);
  const atlas = paintAtlas(specs, spots, rnd);

  const map = new THREE.CanvasTexture(atlas.map);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = anisotropy;
  const bumpMap = new THREE.CanvasTexture(atlas.bump);
  const lesionMap = new THREE.CanvasTexture(atlas.lesion);
  lesionMap.generateMipmaps = false;
  lesionMap.minFilter = THREE.LinearFilter;

  const uniforms: LeafUniforms = {
    uLesion: { value: lesionMap },
    uSeverity: { value: 0 },
    uScan: { value: 0 },
    uScanPos: { value: 0 },
    uWilt: { value: 0 },
    uLobes: { value: specs.length },
  };

  const material = new THREE.MeshPhysicalMaterial({
    map,
    bumpMap,
    bumpScale: 1.6,
    roughness: 0.62,
    metalness: 0,
    // Cutícula cerosa discreta: brilho suficiente para ler o volume sem lavar o verde.
    clearcoat: 0.12,
    clearcoatRoughness: 0.55,
    sheen: 0.12,
    sheenRoughness: 0.7,
    sheenColor: new THREE.Color('#6fa04a'),
    side: THREE.DoubleSide,
  });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uWilt;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float wiltU = uv.y * uv.y;
        transformed.z -= uWilt * wiltU * 0.75;
        transformed.x *= 1.0 - uWilt * uv.y * 0.22;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform sampler2D uLesion;
        uniform float uSeverity, uScan, uScanPos, uLobes;`,
      )
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
        float lf = texture2D(uLesion, vMapUv).r;
        float t = uSeverity <= 0.001 ? -1.0 : lf - (1.0 - uSeverity);
        float halo = smoothstep(-0.1, -0.012, t) * (1.0 - smoothstep(-0.012, 0.004, t));
        float soaked = smoothstep(-0.004, 0.012, t) * (1.0 - smoothstep(0.045, 0.1, t));
        float necro = smoothstep(0.045, 0.1, t);
        vec3 leafCol = diffuseColor.rgb;
        leafCol = mix(leafCol, leafCol * vec3(1.25, 1.08, 0.5), uSeverity * uSeverity * 0.6);
        leafCol = mix(leafCol, vec3(0.72, 0.66, 0.12), halo * 0.85);
        leafCol = mix(leafCol, vec3(0.1, 0.16, 0.05), soaked * 0.9);
        leafCol = mix(leafCol, mix(vec3(0.33, 0.2, 0.08), vec3(0.17, 0.1, 0.05), lf), necro);
        if (!gl_FrontFacing) leafCol = mix(leafCol, leafCol * vec3(1.35, 1.4, 1.05), 0.6);
        float lesionMask = step(0.0, t);
        float revealed = 1.0 - smoothstep(uScanPos - 0.004, uScanPos + 0.004, vMapUv.y);
        vec3 scanCol = mix(vec3(0.015, 0.05, 0.02) + leafCol * 0.12, vec3(0.9, 0.1, 0.08), lesionMask);
        leafCol = mix(leafCol, scanCol, uScan * revealed);
        diffuseColor.rgb = leafCol;`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        float band = exp(-pow((vMapUv.y - uScanPos) * 22.0, 2.0));
        vec2 cell = vec2(vMapUv.x * uLobes * 10.0, vMapUv.y * 40.0);
        vec2 gridLine = abs(fract(cell) - 0.5);
        float grid = smoothstep(0.46, 0.5, max(gridLine.x, gridLine.y));
        float front = 1.0 - smoothstep(uScanPos - 0.004, uScanPos + 0.004, vMapUv.y);
        totalEmissiveRadiance += uScan * (band * vec3(0.3, 0.85, 0.25) * 1.1 + grid * front * vec3(0.12, 0.32, 0.14) * 0.45 + lesionMask * front * vec3(0.55, 0.02, 0.02));`,
      );
  };

  const group = new THREE.Group();
  const blade = new THREE.Group();
  group.add(blade);
  const pivots: THREE.Object3D[] = [];
  const lobes = specs.map((spec, i) => {
    const pivot = new THREE.Object3D();
    pivot.rotation.z = spec.angle;
    const mesh = new THREE.Mesh(lobeGeometry(spec, i, specs.length), material);
    mesh.rotation.x = spec.lift;
    mesh.position.z = i * 0.0012; // evita z-fighting no centro
    pivot.add(mesh);
    blade.add(pivot);
    pivots.push(pivot);
    return mesh;
  });

  // Pecíolo longo e avermelhado, que sai por trás da junção dos lóbulos.
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.02, -0.02),
    new THREE.Vector3(0, -0.22, -0.16),
    new THREE.Vector3(0.04, -0.85, -0.52),
    new THREE.Vector3(0.12, -1.65, -0.78),
    new THREE.Vector3(0.22, -2.3, -0.86),
  ]);
  const petioleGeometry = new THREE.TubeGeometry(curve, 80, 0.03, 12, false);
  const colors: number[] = [];
  const uv = petioleGeometry.getAttribute('uv');
  const top = new THREE.Color('#a33c4a'), bottom = new THREE.Color('#6d8f3c');
  const tmp = new THREE.Color();
  for (let i = 0; i < uv.count; i++) {
    tmp.copy(top).lerp(bottom, Math.pow(uv.getX(i), 1.6) * 0.75);
    colors.push(tmp.r, tmp.g, tmp.b);
  }
  petioleGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const petioleMaterial = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.38, clearcoat: 0.6, clearcoatRoughness: 0.3 });
  const petiole = new THREE.Mesh(petioleGeometry, petioleMaterial);
  group.add(petiole);
  const junctionGeometry = new THREE.SphereGeometry(0.05, 24, 16);
  const junction = new THREE.Mesh(junctionGeometry, petioleMaterial);
  junction.scale.set(1, 1, 0.7);
  group.add(junction);

  // Marcadores: ponto no lóbulo (u, v) ou na curva do pecíolo.
  const anchors: Record<AnchorId, { lobe?: number; u: number; v: number }> = {
    lobe: { lobe: 3, u: 0.66, v: -0.1 },
    midrib: { lobe: 0, u: 0.42, v: 0 },
    margin: { lobe: 4, u: 0.55, v: 0.98 },
    lesion: { lobe: 1, u: 0.5, v: 0.32 },
    halo: { lobe: 1, u: 0.58, v: 0.05 },
    petiole: { u: 0.42, v: 0 },
  };
  const local = new THREE.Vector3();
  const anchor = (id: AnchorId, target: THREE.Vector3) => {
    const a = anchors[id];
    if (a.lobe === undefined) return petiole.localToWorld(curve.getPoint(a.u, target));
    lobePoint(a.u, a.v, specs[a.lobe], local);
    return lobes[a.lobe].localToWorld(target.copy(local));
  };
  const p1 = new THREE.Vector3(), p2 = new THREE.Vector3(), p3 = new THREE.Vector3();
  const normalMatrix = new THREE.Matrix3();
  const anchorNormal = (id: AnchorId, target: THREE.Vector3) => {
    const a = anchors[id];
    if (a.lobe === undefined) return target.set(0, 0, 1).transformDirection(group.matrixWorld);
    const s = specs[a.lobe];
    lobePoint(a.u, a.v, s, p1);
    lobePoint(a.u + 0.01, a.v, s, p2).sub(p1);
    lobePoint(a.u, Math.min(a.v + 0.05, 1), s, p3).sub(p1);
    target.crossVectors(p3, p2).normalize();
    normalMatrix.getNormalMatrix(lobes[a.lobe].matrixWorld);
    return target.applyMatrix3(normalMatrix).normalize();
  };

  const histogram = atlas.histogram;
  const coverageAt = (severity: number) => {
    if (severity <= 0.001) return 0;
    const threshold = (1 - severity) * 255;
    let sum = 0;
    for (let i = Math.ceil(threshold + 0.0001); i < 256; i++) sum += histogram[i];
    return sum / atlas.total;
  };
  const severityFor = (coverage: number) => {
    if (coverage <= 0) return 0;
    let lo = 0, hi = 1;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (coverageAt(mid) < coverage) lo = mid; else hi = mid;
    }
    return hi;
  };

  return {
    group,
    uniforms,
    coverageAt,
    severityFor,
    anchor,
    anchorNormal,
    sway(time, amount) {
      pivots.forEach((pivot, i) => {
        const s = specs[i];
        lobes[i].rotation.x = s.lift + Math.sin(time * 0.9 + s.phase) * 0.035 * amount;
        pivot.rotation.z = s.angle + Math.sin(time * 0.6 + s.phase * 1.3) * 0.012 * amount;
      });
    },
    dispose() {
      lobes.forEach((lobe) => lobe.geometry.dispose());
      material.dispose();
      map.dispose(); bumpMap.dispose(); lesionMap.dispose();
      petioleGeometry.dispose(); junctionGeometry.dispose(); petioleMaterial.dispose();
    },
  };
}
