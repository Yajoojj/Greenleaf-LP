import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { site } from '../config/site';
import { useLanguage } from '../content/Language';
import { ButtonLink, Eyebrow, Heading, QrCode } from '../components/Primitives';
import { ChevronLeft, ChevronRight, Shield, Sun, Wifi, Cloud } from '../components/Icons';

const FEATURE_ICONS = [Wifi, Cloud, Sun, Shield];

export function AppShowcase() {
  const { content: { app } } = useLanguage();
  const [index, setIndex] = useState(3);
  const [tilt, setTilt] = useState({ x: -8, y: 4 });
  const [paused, setPaused] = useState(false);
  const phoneRef = useRef<HTMLDivElement>(null);
  const count = app.screens.length;
  const go = (delta: number) => setIndex((i) => (i + delta + count) % count);

  // Troca de tela automática enquanto ninguém está interagindo.
  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const el = phoneRef.current;
    let visible = false;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    if (el) io.observe(el);
    const timer = window.setInterval(() => { if (visible && !document.hidden) setIndex((i) => (i + 1) % count); }, 3800);
    return () => { window.clearInterval(timer); io.disconnect(); };
  }, [paused, count]);

  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse') return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: x * 26 - 4, y: -y * 18 + 2 });
  };

  const screen = app.screens[index];
  return (
    <section id="app" className="section section--light app" aria-labelledby="app-title">
      <div className="container">
        <div className="section-head section-head--split">
          <div>
            <Eyebrow tone="light">{app.eyebrow}</Eyebrow>
            <Heading id="app-title" title={app.title} />
          </div>
          <p className="lead">{app.lead}</p>
        </div>

        <div className="app__layout">
          <div className="phone-stage" onPointerMove={onMove} onPointerLeave={() => setTilt({ x: -8, y: 4 })}
            onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
            <div className="phone-stage__ring" aria-hidden="true" />
            <div ref={phoneRef} className="phone" style={{ '--rx': `${tilt.y}deg`, '--ry': `${tilt.x}deg` } as CSSProperties}>
              <div className="phone__body">
                <div className="phone__screen">
                  {app.screens.map((s, i) => (
                    <img key={s.src} src={s.src} alt={i === index ? `${s.title}: ${s.text}` : ''} aria-hidden={i !== index}
                      className={i === index ? 'is-active' : ''} loading="lazy" width={390} height={845} />
                  ))}
                </div>
                <span className="phone__island" aria-hidden="true" />
              </div>
              <span className="phone__side" aria-hidden="true" />
            </div>
            <div className="phone-caption" aria-live="polite">
              <strong>{String(index + 1).padStart(2, '0')} · {screen.title}</strong>
              <span>{screen.text}</span>
            </div>
            <div className="phone-nav">
              <button type="button" className="icon-btn icon-btn--light" onClick={() => go(-1)} aria-label={app.prev}><ChevronLeft /></button>
              <button type="button" className="icon-btn icon-btn--light" onClick={() => go(1)} aria-label={app.next}><ChevronRight /></button>
            </div>
          </div>

          <div className="app__side">
            <div className="screen-list" role="group" aria-label={app.screensLabel}>
              {app.screens.map((s, i) => (
                <button key={s.src} type="button" aria-pressed={i === index} onClick={() => { setIndex(i); setPaused(true); }}>
                  <span>{String(i + 1).padStart(2, '0')}</span>{s.title}
                </button>
              ))}
            </div>
            <ul className="features">
              {app.features.map((f, i) => {
                const Icon = FEATURE_ICONS[i];
                return (
                  <li key={f.title} data-reveal style={{ transitionDelay: `${i * 70}ms` }}>
                    <span className="features__icon"><Icon /></span>
                    <div><h3>{f.title}</h3><p>{f.text}</p></div>
                  </li>
                );
              })}
            </ul>
            <div className="app__cta">
              <QrCode value={site.appUrl} label={app.qr} />
              <div>
                <p>{app.qr}</p>
                <ButtonLink variant="dark" href={site.appUrl} external>{app.cta}</ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
