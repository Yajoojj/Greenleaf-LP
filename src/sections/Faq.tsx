import { useId, useState } from 'react';
import { useLanguage } from '../content/Language';
import { Eyebrow, Heading } from '../components/Primitives';

/** Acordeão acessível com abertura exclusiva (mesmo comportamento do FAQ do k9-lp). */
export function Faq() {
  const { content: { faq } } = useLanguage();
  const [open, setOpen] = useState<number | null>(0);
  const baseId = useId();
  return (
    <section id="faq" className="section section--light faq" aria-labelledby="faq-title">
      <div className="container faq__grid">
        <div className="faq__head">
          <Eyebrow tone="light">{faq.eyebrow}</Eyebrow>
          <Heading id="faq-title" title={faq.title} />
        </div>
        <div className="faq__list">
          {faq.items.map((item, i) => {
            const isOpen = open === i;
            const btnId = `${baseId}-q${i}`, panelId = `${baseId}-a${i}`;
            return (
              <div key={item.q} className="faq__item" data-open={isOpen}>
                <h3 className="faq__question">
                  <button id={btnId} type="button" className="faq__button" aria-expanded={isOpen} aria-controls={panelId}
                    onClick={() => setOpen((prev) => (prev === i ? null : i))}>
                    <span>{item.q}</span>
                    <span className="faq__icon" aria-hidden="true" />
                  </button>
                </h3>
                <div id={panelId} role="region" aria-labelledby={btnId} className="faq__panel" data-open={isOpen} inert={!isOpen}>
                  <div className="faq__panel-inner"><p>{item.a}</p></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
