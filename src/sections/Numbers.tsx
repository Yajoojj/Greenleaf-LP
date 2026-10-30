import { useLanguage } from '../content/Language';

export function Numbers() {
  const { content: { numbers } } = useLanguage();
  return (
    <section id="numeros" className="numbers" aria-labelledby="numbers-title">
      <div className="container">
        <h2 id="numbers-title" className="sr-only">{numbers.title}</h2>
        <p className="eyebrow">{numbers.eyebrow}</p>
        <ul className="numbers__grid">
          {numbers.items.map((item, i) => (
            <li key={item.label} className="numbers__item" data-reveal style={{ transitionDelay: `${i * 80}ms` }}>
              <strong className="numbers__value">{item.value}</strong>
              <span className="numbers__label">{item.label}</span>
              <span className="numbers__source">{item.source}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
