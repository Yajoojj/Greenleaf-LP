import { useEffect, useRef, useState } from 'react';
import { site } from '../config/site';
import { useLanguage } from '../content/Language';
import { ArrowDown, Scan } from '../components/Icons';
import { LeafIllustration } from '../components/LeafIllustration';
import { ButtonLink, Eyebrow } from '../components/Primitives';
import type { HeroPhase, createHeroScene } from '../three/hero-scene';

type Scene = NonNullable<ReturnType<typeof createHeroScene>>;

function HeroLeaf() {
  const { content: { hero } } = useLanguage();
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<Scene | null>(null);
  const [phase, setPhase] = useState<HeroPhase>('idle');

  useEffect(() => {
    let cancelled = false;
    const host = hostRef.current;
    if (!host) return;
    import('../three/hero-scene').then(({ createHeroScene }) => {
      if (cancelled) return;
      try {
        sceneRef.current = createHeroScene(host, { onPhase: setPhase });
        host.dataset.ready = sceneRef.current ? 'true' : 'false';
      } catch {
        // A ilustração vetorial continua visível quando o WebGL não inicia.
        host.dataset.ready = 'false';
      }
    }).catch(() => { if (!cancelled) host.dataset.ready = 'false'; });

    // Progresso medido na própria folha: no celular ela fica abaixo do texto e
    // só começa a girar quando chega ao topo da tela.
    const onScroll = () => {
      const rect = host.getBoundingClientRect();
      const p = Math.min(Math.max((window.innerHeight * 0.12 - rect.top) / rect.height, 0), 1);
      sceneRef.current?.setProgress(p);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelled = true;
      window.removeEventListener('scroll', onScroll);
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, []);

  const status = phase === 'scanning' ? hero.card.scanning : phase === 'result' ? hero.card.result : hero.card.idle;
  return (
    <div className="hero-leaf">
      <div className="hero-leaf__glow" aria-hidden="true" />
      <div className="hero-leaf__stage stage-host" ref={hostRef} data-ready="false">
        <LeafIllustration className="stage-fallback" severity={0.2} />
      </div>
      <div className={`scan-card scan-card--${phase}`} aria-hidden="true">
        <div className="scan-card__top">
          <span className="scan-card__label"><Scan width={14} height={14} /> {hero.card.label}</span>
          <span className="scan-card__note">{hero.card.note}</span>
        </div>
        <p className="scan-card__status">{status}</p>
        <p className="scan-card__detail">{phase === 'result' ? hero.card.resultDetail : ' '}</p>
        <span className="scan-card__bar"><i /></span>
      </div>
      <p className="hero-leaf__hint" aria-hidden="true">{hero.hint}</p>
    </div>
  );
}

export function Hero() {
  const { content: { hero } } = useLanguage();
  return (
    <section id="inicio" className="hero" aria-labelledby="hero-title">
      <div className="hero__grain" aria-hidden="true" />
      <div className="container hero__grid">
        <div className="hero__copy">
          <Eyebrow>{hero.eyebrow}</Eyebrow>
          <h1 id="hero-title" className="display" data-split>
            {hero.title.before}<em>{hero.title.em}</em>
          </h1>
          <p className="lead hero__lead">{hero.lead}</p>
          <div className="hero__actions">
            <ButtonLink variant="cream" href={site.appUrl} external>{hero.primary}</ButtonLink>
            <ButtonLink variant="outline" href="#explorar">{hero.secondary}</ButtonLink>
          </div>
          <dl className="hero__indicators">
            {hero.indicators.map((item) => (
              <div key={item.label}><dt>{item.value}</dt><dd>{item.label}</dd></div>
            ))}
          </dl>
        </div>
        <HeroLeaf />
      </div>
      <a className="hero__scroll" href="#numeros"><ArrowDown width={16} height={16} /> {hero.scroll}</a>
    </section>
  );
}
