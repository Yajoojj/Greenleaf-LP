import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { useLanguage } from '../content/Language';
import type { Stage } from '../content/types';
import type { AnchorId } from '../three/leaf-shape';
import type { AnchorScreen, createExplorerScene } from '../three/explorer-scene';
import { LeafIllustration } from '../components/LeafIllustration';
import { Eyebrow, Heading } from '../components/Primitives';
import { Minus, Plus, Reset, RotateLeft, RotateRight, Scan, StateIcon } from '../components/Icons';

type Scene = NonNullable<ReturnType<typeof createExplorerScene>>;

const STAGES: Stage[] = ['sadia', 'leve', 'moderada', 'grave'];
/** Cobertura-alvo de cada botão, dentro das faixas do app (<3%, 3–15%, ≥15%). */
const TARGET: Record<Stage, number> = { sadia: 0, leve: 0.016, moderada: 0.08, grave: 0.24 };
const ANCHOR_ORDER: AnchorId[] = ['lobe', 'midrib', 'margin', 'lesion', 'halo', 'petiole'];

function stageOf(coverage: number): Stage {
  if (coverage <= 0.0005) return 'sadia';
  if (coverage < 0.03) return 'leve';
  if (coverage < 0.15) return 'moderada';
  return 'grave';
}

/** Aproximação usada só enquanto a cena 3D (que mede a cobertura real) não carregou. */
const approxCoverage = (s: number) => (s <= 0 ? 0 : Math.pow(s, 2.2) * 0.42);
const approxSeverity = (c: number) => (c <= 0 ? 0 : Math.pow(c / 0.42, 1 / 2.2));

export function Explorer() {
  const { content: { explorer } } = useLanguage();
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<Scene | null>(null);
  const markerRefs = useRef<Partial<Record<AnchorId, HTMLButtonElement | null>>>({});
  const [ready, setReady] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [severity, setSeverity] = useState(0);
  const [scan, setScan] = useState(false);
  const [hotspot, setHotspot] = useState<AnchorId>('lesion');
  const sliderId = useId();
  const panelId = useId();

  const coverageAt = useCallback((s: number) => sceneRef.current?.coverageAt(s) ?? approxCoverage(s), []);
  const severityFor = useCallback((c: number) => sceneRef.current?.severityFor(c) ?? approxSeverity(c), []);
  // `ready` entra nas dependências porque a cena troca a aproximação pela medida real.
  const coverage = useMemo(() => coverageAt(severity), [coverageAt, severity, ready]);
  const stage = stageOf(coverage);
  const lesionVisible = coverage > 0.0005;

  // Posição dos marcadores: escrita direto no DOM a cada quadro, sem re-renderizar o React.
  const lesionVisibleRef = useRef(lesionVisible);
  lesionVisibleRef.current = lesionVisible;
  const onAnchors = useCallback((anchors: AnchorScreen[]) => {
    for (const a of anchors) {
      const el = markerRefs.current[a.id];
      if (!el) continue;
      const needsLesion = a.id === 'lesion' || a.id === 'halo';
      const show = a.visible && (!needsLesion || lesionVisibleRef.current);
      el.style.transform = `translate3d(${a.x.toFixed(1)}px, ${a.y.toFixed(1)}px, 0)`;
      el.dataset.visible = String(show);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const host = hostRef.current;
    if (!host) return;
    import('../three/explorer-scene').then(({ createExplorerScene }) => {
      if (cancelled) return;
      try {
        sceneRef.current = createExplorerScene(host, { onAnchors });
        host.dataset.ready = sceneRef.current ? 'true' : 'false';
        setReady(sceneRef.current ? 'ready' : 'failed');
      } catch {
        host.dataset.ready = 'false';
        setReady('failed');
      }
    }).catch(() => { if (!cancelled) { host.dataset.ready = 'false'; setReady('failed'); } });
    return () => { cancelled = true; sceneRef.current?.dispose(); sceneRef.current = null; };
  }, [onAnchors]);

  // Começa em "Leve" quando a cena estiver pronta, para mostrar algo na primeira visita.
  useEffect(() => {
    if (ready === 'ready') setSeverity(severityFor(TARGET.leve));
  }, [ready, severityFor]);

  useEffect(() => { sceneRef.current?.setSeverity(severity); }, [severity, ready]);
  useEffect(() => { sceneRef.current?.setScan(scan); }, [scan, ready]);

  const chooseStage = (s: Stage) => setSeverity(severityFor(TARGET[s]));
  const onStageKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const i = STAGES.indexOf(stage);
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') { event.preventDefault(); chooseStage(STAGES[Math.min(i + 1, 3)]); }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { event.preventDefault(); chooseStage(STAGES[Math.max(i - 1, 0)]); }
  };
  const onStageKeyFocus = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); sceneRef.current?.rotateBy(-0.35); }
    if (event.key === 'ArrowRight') { event.preventDefault(); sceneRef.current?.rotateBy(0.35); }
    if (event.key === '+' || event.key === '=') { event.preventDefault(); sceneRef.current?.zoomBy(1.15); }
    if (event.key === '-') { event.preventDefault(); sceneRef.current?.zoomBy(1 / 1.15); }
  };

  const percent = (coverage * 100).toLocaleString(undefined, { maximumFractionDigits: coverage < 0.1 ? 1 : 0 });
  const info = explorer.stages[stage];
  const hotspotInfo = explorer.hotspots[hotspot];

  return (
    <section id="explorar" className="section explorer" aria-labelledby="explorer-title">
      <div className="container">
        <div className="section-head">
          <Eyebrow>{explorer.eyebrow}</Eyebrow>
          <Heading id="explorer-title" title={explorer.title} />
          <p className="lead">{explorer.lead}</p>
        </div>

        <div className="explorer__layout">
          <div className={`explorer__viewport${scan ? ' is-scanning' : ''}${ready === 'failed' ? ' is-failed' : ''}`} data-stage={stage}>
            <div className="explorer__stage stage-host" ref={hostRef} data-ready="false" role="img" aria-label={explorer.sceneLabel}
              tabIndex={0} onKeyDown={onStageKeyFocus} aria-describedby={`${panelId}-hint`}>
              <LeafIllustration className="stage-fallback" severity={Math.min(coverage * 4, 1)} />
            </div>
            {ready === 'ready' && (
              <div className="markers" aria-label={explorer.hotspotsLabel} role="group">
                {ANCHOR_ORDER.map((id, i) => (
                  <button key={id} ref={(el) => { markerRefs.current[id] = el; }} type="button" className="marker"
                    data-visible="false" aria-pressed={hotspot === id} onClick={() => setHotspot(id)}
                    aria-label={explorer.hotspots[id].title}>
                    <span className="marker__dot" aria-hidden="true">{i + 1}</span>
                    <span className="marker__label" aria-hidden="true">{explorer.hotspots[id].title}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="explorer__hud" aria-hidden="true">
              <span>{scan ? 'HSV · EfficientNet-B0' : 'Manihot esculenta'}</span>
              <span>{explorer.stages[stage].label.toUpperCase()} · {percent}%</span>
            </div>
            <div className="explorer__tools">
              <button type="button" className="icon-btn" onClick={() => sceneRef.current?.rotateBy(-0.5)} aria-label={explorer.controls.left} disabled={ready !== 'ready'}><RotateLeft /></button>
              <button type="button" className="icon-btn" onClick={() => sceneRef.current?.rotateBy(0.5)} aria-label={explorer.controls.right} disabled={ready !== 'ready'}><RotateRight /></button>
              <button type="button" className="icon-btn" onClick={() => sceneRef.current?.zoomBy(1.15)} aria-label={explorer.controls.zoomIn} disabled={ready !== 'ready'}><Plus /></button>
              <button type="button" className="icon-btn" onClick={() => sceneRef.current?.zoomBy(1 / 1.15)} aria-label={explorer.controls.zoomOut} disabled={ready !== 'ready'}><Minus /></button>
              <button type="button" className="icon-btn" onClick={() => sceneRef.current?.reset()} aria-label={explorer.controls.reset} disabled={ready !== 'ready'}><Reset /></button>
            </div>
            <p className="explorer__hint" id={`${panelId}-hint`}>{ready === 'failed' ? explorer.fallback : explorer.hint}</p>
          </div>

          <div className="explorer__panel">
            <div className="stage-tabs" role="radiogroup" aria-label={explorer.stagesLabel} onKeyDown={onStageKey}>
              {STAGES.map((s) => (
                <button key={s} type="button" role="radio" aria-checked={stage === s} tabIndex={stage === s ? 0 : -1}
                  className={`stage-tab stage-tab--${s}`} onClick={() => chooseStage(s)}>
                  <StateIcon state={s} width={18} height={18} />
                  <span className="stage-tab__label">{explorer.stages[s].label}</span>
                  <span className="stage-tab__range">{explorer.stages[s].range}</span>
                </button>
              ))}
            </div>

            <div className="severity">
              <label htmlFor={sliderId}>{explorer.slider}</label>
              <input id={sliderId} type="range" min={0} max={100} step={1} value={Math.round(severity * 100)}
                onChange={(e) => setSeverity(Number(e.target.value) / 100)}
                aria-valuetext={`${percent}% ${explorer.coverage} · ${info.label}`}
                style={{ '--fill': `${severity * 100}%` } as CSSProperties} />
              <output htmlFor={sliderId} className={`severity__out severity__out--${stage}`} aria-live="polite">
                <strong>{percent}%</strong> {explorer.coverage}
              </output>
            </div>

            <button type="button" className={`scan-toggle${scan ? ' is-on' : ''}`} aria-pressed={scan} onClick={() => setScan((v) => !v)}>
              <Scan /> {scan ? explorer.scanOff : explorer.scanOn}
            </button>

            <div className={`diagnosis diagnosis--${stage}`} aria-live="polite">
              <p className="diagnosis__badge"><StateIcon state={stage} width={20} height={20} /> {info.label}</p>
              <p className="diagnosis__meaning">{info.meaning}</p>
              <h3 className="diagnosis__todo-title">{explorer.todoTitle}</h3>
              <ul className="diagnosis__todo">{info.todo.map((t) => <li key={t}>{t}</li>)}</ul>
              <p className="diagnosis__note">{explorer.todoNote}</p>
            </div>

            <div className="hotspot-card" id={panelId}>
              <div className="hotspot-card__chips" role="group" aria-label={explorer.hotspotsLabel}>
                {ANCHOR_ORDER.map((id, i) => (
                  <button key={id} type="button" aria-pressed={hotspot === id} onClick={() => setHotspot(id)}>
                    <span aria-hidden="true">{i + 1}</span>{explorer.hotspots[id].title}
                  </button>
                ))}
              </div>
              <div aria-live="polite">
                <h3>{hotspotInfo.title}</h3>
                <p>{hotspotInfo.text}</p>
              </div>
            </div>
          </div>
        </div>
        <p className="explorer__note">{explorer.note}</p>
      </div>
    </section>
  );
}
