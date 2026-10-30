import { useLanguage } from '../content/Language';
import { Eyebrow, Heading } from '../components/Primitives';

export function Problem() {
  const { content: { problem } } = useLanguage();
  return (
    <section id="problema" className="section section--light problem" aria-labelledby="problem-title">
      <div className="container">
        <div className="problem__head">
          <Eyebrow tone="light">{problem.eyebrow}</Eyebrow>
          <Heading id="problem-title" title={problem.title} />
        </div>
        <div className="problem__grid">
          <div className="problem__text" data-reveal>
            {problem.paragraphs.map((p) => <p key={p}>{p}</p>)}
            <figure className="problem__question">
              <blockquote><p>“{problem.question}”</p></blockquote>
              <figcaption>{problem.questionSource}</figcaption>
            </figure>
          </div>
          <div className="problem__aside">
            <h3 className="problem__subtitle">{problem.symptomsTitle}</h3>
            <ol className="symptoms">
              {problem.symptoms.map((s, i) => (
                <li key={s.title} className="symptoms__item" data-reveal style={{ transitionDelay: `${i * 90}ms` }}>
                  <span className={`symptoms__swatch symptoms__swatch--${i}`} aria-hidden="true" />
                  <div><h4>{s.title}</h4><p>{s.text}</p></div>
                </li>
              ))}
            </ol>
            <div className="region" data-reveal>
              <svg className="region__map" viewBox="0 0 200 120" aria-hidden="true" focusable="false">
                <path className="region__river" d="M6 92 C40 70 58 96 86 78 S130 40 154 52 S186 30 196 18" />
                <circle className="region__pin" cx="112" cy="58" r="5" />
                <circle className="region__pulse" cx="112" cy="58" r="5" />
                <text x="122" y="74">Registro</text>
              </svg>
              <h4>{problem.region.title}</h4>
              <p>{problem.region.text}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
