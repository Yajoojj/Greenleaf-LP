import { useEffect, useRef, type CSSProperties } from 'react';
import { site } from '../config/site';
import { useLanguage } from '../content/Language';
import { DEMO_CASES } from '../content/demo-cases';
import { ButtonLink, Heading } from '../components/Primitives';

const SHOTS = DEMO_CASES.flatMap((c) => [c.image, c.overlay]);

/**
 * Roda de imagens do CTA final, adaptada do `final-cta-wheel.js` do Halo:
 * giro ocioso, arraste pelo ângulo do ponteiro e inércia ao soltar.
 */
function useWheel() {
  const orbitRef = useRef<HTMLDivElement>(null);
  const wheelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const orbit = orbitRef.current, wheel = wheelRef.current;
    if (!orbit || !wheel) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const idle = reduced ? 0 : 360 / 90; // graus por segundo
    let rotation = 0, velocity = idle, dragging = false, pointer: number | null = null;
    let lastAngle = 0, lastTime = 0, frame = 0, visible = false, last = performance.now();
    const angleOf = (event: PointerEvent) => {
      const b = orbit.getBoundingClientRect();
      return (Math.atan2(event.clientY - (b.top + b.height / 2), event.clientX - (b.left + b.width / 2)) * 180) / Math.PI;
    };
    const norm = (v: number) => ((v + 540) % 360) - 180;
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!visible || dragging) return;
      velocity += (idle - velocity) * (1 - Math.pow(0.25, dt));
      rotation += velocity * dt;
      wheel.style.setProperty('--rot', `${rotation}deg`);
    };
    const down = (event: PointerEvent) => {
      if (event.button !== 0) return;
      dragging = true; pointer = event.pointerId;
      lastAngle = angleOf(event); lastTime = performance.now(); velocity = 0;
      orbit.setPointerCapture(event.pointerId);
      orbit.classList.add('is-dragging');
    };
    const move = (event: PointerEvent) => {
      if (!dragging || event.pointerId !== pointer) return;
      const a = angleOf(event), now = performance.now();
      const delta = norm(a - lastAngle);
      rotation += delta;
      velocity = (delta / Math.max(now - lastTime, 8)) * 1000;
      velocity = Math.max(-720, Math.min(720, velocity));
      lastAngle = a; lastTime = now;
      wheel.style.setProperty('--rot', `${rotation}deg`);
    };
    const up = (event: PointerEvent) => {
      if (event.pointerId !== pointer) return;
      dragging = false; pointer = null;
      orbit.classList.remove('is-dragging');
    };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(orbit);
    orbit.addEventListener('pointerdown', down);
    orbit.addEventListener('pointermove', move);
    orbit.addEventListener('pointerup', up);
    orbit.addEventListener('pointercancel', up);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame); io.disconnect();
      orbit.removeEventListener('pointerdown', down);
      orbit.removeEventListener('pointermove', move);
      orbit.removeEventListener('pointerup', up);
      orbit.removeEventListener('pointercancel', up);
    };
  }, []);
  return { orbitRef, wheelRef };
}

export function FinalCta() {
  const { content: { cta } } = useLanguage();
  const { orbitRef, wheelRef } = useWheel();
  return (
    <section className="final-cta" aria-labelledby="cta-title">
      <div className="final-cta__orbit" ref={orbitRef} aria-label={cta.wheel} role="img">
        <div className="final-cta__wheel" ref={wheelRef}>
          {SHOTS.map((src, i) => (
            <span key={src} className="final-cta__shot" style={{ '--a': `${(360 / SHOTS.length) * i}deg` } as CSSProperties}>
              <img src={src} alt="" loading="lazy" draggable={false} />
            </span>
          ))}
        </div>
      </div>
      <div className="container final-cta__content">
        <Heading id="cta-title" title={cta.title} className="h2 final-cta__title" />
        <p className="lead">{cta.lead}</p>
        <div className="final-cta__actions">
          <ButtonLink variant="cream" href={site.appUrl} external>{cta.primary}</ButtonLink>
          <ButtonLink variant="outline" href="#explorar">{cta.secondary}</ButtonLink>
        </div>
      </div>
    </section>
  );
}
