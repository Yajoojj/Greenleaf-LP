import type { CSSProperties } from 'react';
import { useLanguage } from '../content/Language';
import type { Content } from '../content/types';
import { Eyebrow, Heading } from '../components/Primitives';
import { Camera, Check, Cloud, Shield, StateIcon } from '../components/Icons';

type Mini = Content['flow']['mini'];

/** Pequenas interfaces que ilustram cada passo, no estilo dos passos do Ori. */
function MiniUi({ step, mini }: { step: number; mini: Mini }) {
  switch (step) {
    case 0:
      return (
        <div className="mini mini--camera">
          <div className="mini__frame"><img src="/demo/folha-grave.jpg" alt="" loading="lazy" /><i /><i /><i /><i /></div>
          <ul className="mini__tips">{mini.tips.map((t) => <li key={t}><Check width={12} height={12} /> {t}</li>)}</ul>
          <span className="mini__shutter"><Camera width={16} height={16} /></span>
        </div>
      );
    case 1:
      return (
        <div className="mini mini--shrink">
          <div className="mini__file mini__file--big"><span>JPG</span>{mini.shrink[0]}</div>
          <div className="mini__arrow" />
          <div className="mini__file mini__file--small"><span>JPG</span>{mini.shrink[1]}<Shield width={14} height={14} /></div>
        </div>
      );
    case 2:
      return (
        <div className="mini mini--upload">
          <code>POST /predict</code>
          <div className="mini__progress"><i /></div>
          <div className="mini__row"><span>{mini.upload}</span><span>JPEG · ≤ 8 MB</span></div>
          <div className="mini__cloud"><Cloud width={18} height={18} /> greenleaf-ia · HTTPS</div>
        </div>
      );
    case 3:
      return (
        <div className="mini mini--model">
          <div className="mini__bar"><span>{mini.model}</span><b style={{ '--w': '51%' } as CSSProperties}><i /></b><em>0,51</em></div>
          <div className="mini__bar mini__bar--hsv"><span>{mini.color}</span><b style={{ '--w': '100%' } as CSSProperties}><i /></b><em>1,00</em></div>
          <div className="mini__combined">{mini.combined}</div>
        </div>
      );
    case 4:
      return (
        <div className="mini mini--rules">
          <div className="mini__scale">
            {mini.risk.map((r, i) => <span key={r} className={`mini__seg mini__seg--${i}`}>{r}</span>)}
            <i className="mini__needle" />
          </div>
          <div className="mini__ticks"><span>0</span><span>26%</span><span>60%</span><span>100%</span></div>
          <div className="mini__sev">{mini.severity.map((s, i) => <span key={s} className={`mini__chip mini__chip--${i}`}>{s}</span>)}</div>
        </div>
      );
    default:
      return (
        <div className="mini mini--result">
          <div className="mini__badge"><StateIcon state="grave" width={16} height={16} /> {mini.badge}</div>
          <p>{mini.badgeText}</p>
          <div className="mini__levels"><i /><i /><i /><i /></div>
          <div className="mini__metrics">
            <div><strong>51%</strong><span>{mini.chance}</span></div>
            <div><strong>38%</strong><span>{mini.spots}</span></div>
          </div>
        </div>
      );
  }
}

export function Flow() {
  const { content: { flow } } = useLanguage();
  return (
    <section id="como-funciona" className="section section--light flow" aria-labelledby="flow-title">
      <div className="container">
        <div className="section-head section-head--split">
          <div>
            <Eyebrow tone="light">{flow.eyebrow}</Eyebrow>
            <Heading id="flow-title" title={flow.title} />
          </div>
          <p className="lead">{flow.lead}</p>
        </div>
        <ol className="flow__grid">
          {flow.steps.map((step, i) => (
            <li key={step.tag} className="flow__card" data-reveal style={{ transitionDelay: `${(i % 3) * 90}ms` }}>
              <div className="flow__visual" aria-hidden="true"><MiniUi step={i} mini={flow.mini} /></div>
              <div className="flow__meta"><span className="flow__tag">{step.tag}</span><span className="flow__who">{step.who}</span></div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
