import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { useLanguage } from '../content/Language';
import type { LayerId } from '../content/types';
import { DEMO_CASES, MODEL_VERSION, riskOf, type ClassCode, type DemoCase } from '../content/demo-cases';
import { Eyebrow, Heading } from '../components/Primitives';
import { StateIcon } from '../components/Icons';

const LAYERS: LayerId[] = ['photo', 'hsv', 'mask', 'overlay'];
const CLASS_ORDER: ClassCode[] = ['CBB', 'CBSD', 'CGM', 'CMD', 'Healthy'];
const SIZE = 360;

interface Derived { hsv: string; mask: string; }
const cache = new Map<string, Derived>();

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, max ? d / max : 0, max / 255];
}

/**
 * Ilustra as etapas do servidor com a própria imagem: falsa-cor do espaço HSV
 * e uma segmentação simples (folha = verde; manchas = amarelo/pardo dentro da
 * folha). É uma aproximação didática; a área destacada final é a da IA.
 */
async function derive(src: string): Promise<Derived> {
  const hit = cache.get(src);
  if (hit) return hit;
  const img = new Image();
  img.src = src;
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, SIZE, SIZE);
  const source = ctx.getImageData(0, 0, SIZE, SIZE);
  const px = source.data;
  const n = SIZE * SIZE;
  const hsv = ctx.createImageData(SIZE, SIZE);
  const green = new Uint8Array(n);
  const warm = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const [h, s, v] = rgbToHsv(px[i * 4], px[i * 4 + 1], px[i * 4 + 2]);
    // Falsa-cor: matiz com saturação total, intensidade pela saturação × brilho.
    const k = Math.min(1, s * 1.4) * (0.35 + v * 0.65);
    const c = (n2: number) => { const kk = (n2 + h / 60) % 6; return 1 - Math.max(0, Math.min(kk, 4 - kk, 1)); };
    hsv.data[i * 4] = 255 * c(5) * k;
    hsv.data[i * 4 + 1] = 255 * c(3) * k;
    hsv.data[i * 4 + 2] = 255 * c(1) * k;
    hsv.data[i * 4 + 3] = 255;
    green[i] = h >= 62 && h <= 170 && s > 0.22 && v > 0.14 ? 1 : 0;
    warm[i] = ((h < 62 || h > 340) && s > 0.3 && v > 0.12) ? 1 : 0;
  }
  // Fundo = tudo que não é verde e se conecta à borda; o resto é "dentro da folha".
  const outside = new Uint8Array(n);
  const queue = new Int32Array(n);
  let head = 0, tail = 0;
  const push = (i: number) => { if (!outside[i] && !green[i]) { outside[i] = 1; queue[tail++] = i; } };
  for (let x = 0; x < SIZE; x++) { push(x); push((SIZE - 1) * SIZE + x); }
  for (let y = 0; y < SIZE; y++) { push(y * SIZE); push(y * SIZE + SIZE - 1); }
  while (head < tail) {
    const i = queue[head++], x = i % SIZE, y = (i / SIZE) | 0;
    if (x > 0) push(i - 1);
    if (x < SIZE - 1) push(i + 1);
    if (y > 0) push(i - SIZE);
    if (y < SIZE - 1) push(i + SIZE);
  }
  // Faixa junto da folha: manchas na margem também contam.
  const near = new Uint8Array(n);
  const R = 2;
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const i = y * SIZE + x;
    if (!green[i]) continue;
    for (let dy = -R; dy <= R; dy += 2) for (let dx = -R; dx <= R; dx += 2) {
      const xx = x + dx, yy = y + dy;
      if (xx >= 0 && yy >= 0 && xx < SIZE && yy < SIZE) near[yy * SIZE + xx] = 1;
    }
  }
  const mask = ctx.createImageData(SIZE, SIZE);
  for (let i = 0; i < n; i++) {
    const lesion = warm[i] && (!outside[i] || near[i]);
    const leaf = green[i] || !outside[i];
    const [r, g, b] = lesion ? [255, 93, 93] : leaf ? [38, 102, 34] : [10, 13, 8];
    mask.data.set([r, g, b, 255], i * 4);
  }
  ctx.putImageData(hsv, 0, 0);
  const hsvUrl = canvas.toDataURL('image/jpeg', 0.85);
  ctx.putImageData(mask, 0, 0);
  const maskUrl = canvas.toDataURL('image/png');
  const result = { hsv: hsvUrl, mask: maskUrl };
  cache.set(src, result);
  return result;
}

const fmt = (value: number, lang: string, digits = 1) =>
  (value * 100).toLocaleString(lang === 'pt' ? 'pt-BR' : 'en', { maximumFractionDigits: digits, minimumFractionDigits: 0 }) + '%';

export function Vision() {
  const { lang, content: { vision } } = useLanguage();
  const [active, setActive] = useState<DemoCase>(DEMO_CASES[0]);
  const [layer, setLayer] = useState<LayerId>('overlay');
  const [derived, setDerived] = useState<Derived | null>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const stackRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const drag = useRef<{ x: number; y: number; tx: number; ty: number; id: number } | null>(null);

  useEffect(() => {
    let alive = true;
    setDerived(null);
    derive(active.image).then((d) => { if (alive) setDerived(d); }).catch(() => { /* camadas derivadas são opcionais */ });
    return () => { alive = false; };
  }, [active]);

  // As camadas se separam conforme a seção entra na tela.
  useEffect(() => {
    const el = sectionRef.current, stack = stackRef.current;
    if (!el || !stack) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = stack.getBoundingClientRect();
      const p = 1 - Math.min(Math.max((rect.top + rect.height * 0.5) / window.innerHeight - 0.25, 0) / 0.6, 1);
      stack.style.setProperty('--explode', p.toFixed(3));
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(frame); };
  }, []);

  const down = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    drag.current = { x: event.clientX, y: event.clientY, tx: tilt.x, ty: tilt.y, id: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== event.pointerId) return;
    setTilt({ x: Math.max(-18, Math.min(18, d.tx + (event.clientX - d.x) * 0.12)), y: Math.max(-14, Math.min(14, d.ty - (event.clientY - d.y) * 0.1)) });
  };
  const up = () => { drag.current = null; };

  const srcFor = (id: LayerId) => id === 'photo' ? active.image : id === 'overlay' ? active.overlay : derived?.[id];
  const risk = riskOf(active.probability);
  const top = CLASS_ORDER.reduce((a, b) => (active.classes[b] > active.classes[a] ? b : a));

  return (
    <section id="ia" ref={sectionRef} className="section vision" aria-labelledby="vision-title">
      <div className="container">
        <div className="section-head section-head--split">
          <div>
            <Eyebrow>{vision.eyebrow}</Eyebrow>
            <Heading id="vision-title" title={vision.title} />
          </div>
          <p className="lead">{vision.lead}</p>
        </div>

        <div className="vision__examples" role="radiogroup" aria-label={vision.examplesLabel}>
          {DEMO_CASES.map((c) => (
            <button key={c.id} type="button" role="radio" aria-checked={active.id === c.id} className={`example example--${c.state}`} onClick={() => setActive(c)}>
              <img src={c.image} alt="" loading="lazy" width={44} height={44} />
              <span><StateIcon state={c.state} width={14} height={14} /> {c.state === 'other' ? vision.classes.CMD : vision.results[c.state].split(' · ').pop()}</span>
              <small>{fmt(c.probability, lang, 0)}</small>
            </button>
          ))}
        </div>

        <div className="vision__layout">
          <div className="vision__stage" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
            <div ref={stackRef} className="layer-stack" style={{ '--tx': `${tilt.x}deg`, '--ty': `${tilt.y}deg` } as CSSProperties}>
              {LAYERS.map((id, i) => (
                <figure key={id} className={`layer layer--${id}${layer === id ? ' is-active' : ''}`} style={{ '--i': i } as CSSProperties}>
                  {srcFor(id) ? <img src={srcFor(id)} alt="" draggable={false} /> : <span className="layer__loading" />}
                  <figcaption>{String(i + 1).padStart(2, '0')} · {vision.layers[id].title}</figcaption>
                </figure>
              ))}
            </div>
            <p className="vision__hint" aria-hidden="true">{vision.hint}</p>
          </div>

          <div className="vision__side">
            <ol className="layer-list">
              {LAYERS.map((id, i) => (
                <li key={id}>
                  <button type="button" aria-pressed={layer === id} onClick={() => setLayer(id)} onMouseEnter={() => setLayer(id)} onFocus={() => setLayer(id)}>
                    <span className="layer-list__n">{String(i + 1).padStart(2, '0')}</span>
                    <span><strong>{vision.layers[id].title}</strong><small>{vision.layers[id].text}</small></span>
                  </button>
                </li>
              ))}
            </ol>

            <div className={`ai-result ai-result--${active.state}`} aria-live="polite">
              <p className="ai-result__state"><StateIcon state={active.state} width={18} height={18} /> {vision.results[active.state]}</p>
              <dl className="ai-result__grid">
                <div><dt>{vision.labels.probability}</dt><dd>{fmt(active.probability, lang)}</dd></div>
                <div><dt>{vision.labels.risk}</dt><dd className={`risk risk--${risk}`}>{vision.risk[risk]}</dd></div>
                <div><dt>{vision.labels.ratio}</dt><dd>{fmt(active.ratio, lang)}</dd></div>
                <div><dt>{vision.labels.time}</dt><dd>{active.processingMs} ms</dd></div>
              </dl>
              <p className="ai-result__scale">{vision.risk.scale}</p>
              <h3 className="ai-result__title">{vision.labels.classes}</h3>
              <ul className="class-bars">
                {CLASS_ORDER.map((code) => (
                  <li key={code} className={code === top ? 'is-top' : ''}>
                    <span>{vision.classes[code]} <small>{code}</small></span>
                    <b><i style={{ width: `${active.classes[code] * 100}%` }} /></b>
                    <em>{fmt(active.classes[code], lang)}</em>
                  </li>
                ))}
              </ul>
              <p className="ai-result__model">{vision.labels.model}: <code>{MODEL_VERSION}</code></p>
            </div>
          </div>
        </div>

        <ul className="vision__stats">
          {vision.stats.map((s, i) => (
            <li key={s.label} data-reveal style={{ transitionDelay: `${i * 80}ms` }}><strong>{s.value}</strong><span>{s.label}</span></li>
          ))}
        </ul>
        <p className="vision__source">{vision.source}</p>
      </div>
    </section>
  );
}
