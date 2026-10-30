import { useLanguage } from '../content/Language';
import { Eyebrow, Heading } from '../components/Primitives';

export function Goals() {
  const { content: { goals } } = useLanguage();
  return (
    <section id="objetivos" className="section section--light goals" aria-labelledby="goals-title">
      <div className="container">
        <div className="section-head section-head--split">
          <div>
            <Eyebrow tone="light">{goals.eyebrow}</Eyebrow>
            <Heading id="goals-title" title={goals.title} />
          </div>
          <p className="lead">{goals.lead}</p>
        </div>

        <div className="goals__table" role="table" aria-labelledby="goals-title">
          <div className="goals__row goals__row--head" role="row">
            <span role="columnheader">#</span>
            <span role="columnheader">{goals.labels.goal}</span>
            <span role="columnheader">{goals.labels.target}</span>
            <span role="columnheader">{goals.labels.status}</span>
          </div>
          {goals.items.map((item, i) => (
            <div key={item.id} className="goals__row" role="row" data-reveal style={{ transitionDelay: `${i * 60}ms` }}>
              <span role="cell" className="goals__id">{item.id}</span>
              <span role="cell" className="goals__goal">{item.goal}</span>
              <span role="cell" className="goals__target">{item.target}</span>
              <span role="cell"><span className={`status status--${item.status}`}>{item.statusLabel}</span></span>
            </div>
          ))}
        </div>

        <div className="pillars">
          <article className="pillar" data-reveal><h3>{goals.mission.title}</h3><p>{goals.mission.text}</p></article>
          <article className="pillar" data-reveal style={{ transitionDelay: '80ms' }}><h3>{goals.vision.title}</h3><p>{goals.vision.text}</p></article>
          <article className="pillar" data-reveal style={{ transitionDelay: '160ms' }}>
            <h3>{goals.values.title}</h3>
            <ul>{goals.values.items.map((v) => <li key={v}>{v}</li>)}</ul>
          </article>
        </div>
      </div>
    </section>
  );
}
