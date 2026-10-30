import { useState } from 'react';
import { useLanguage } from '../content/Language';
import type { NodeId } from '../content/types';
import { Eyebrow, Heading } from '../components/Primitives';

const EDGES: { id: string; from: NodeId; to: NodeId; label: 'https' | 'auth' | 'future' }[] = [
  { id: 'app-ia', from: 'app', to: 'ia', label: 'https' },
  { id: 'app-db', from: 'app', to: 'db', label: 'auth' },
  { id: 'db-map', from: 'db', to: 'map', label: 'future' },
];
const NODES: NodeId[] = ['app', 'ia', 'db', 'map'];

export function Architecture() {
  const { content: { architecture } } = useLanguage();
  const [focus, setFocus] = useState<NodeId | null>(null);
  const linked = (edge: (typeof EDGES)[number]) => focus === null || edge.from === focus || edge.to === focus;
  const nodeLinked = (id: NodeId) => focus === null || focus === id || EDGES.some((e) => linked(e) && (e.from === id || e.to === id));

  return (
    <section id="tecnologia" className="section architecture" aria-labelledby="arch-title">
      <div className="container">
        <div className="section-head section-head--split">
          <div>
            <Eyebrow>{architecture.eyebrow}</Eyebrow>
            <Heading id="arch-title" title={architecture.title} />
          </div>
          <p className="lead">{architecture.lead}</p>
        </div>

        <div className="arch" data-focus={focus ?? 'none'} onMouseLeave={() => setFocus(null)}>
          {NODES.map((id) => {
            const node = architecture.nodes[id];
            return (
              <article key={id} className={`arch__node arch__node--${id}${nodeLinked(id) ? '' : ' is-dim'}${focus === id ? ' is-focus' : ''}`}
                tabIndex={0} onMouseEnter={() => setFocus(id)} onFocus={() => setFocus(id)} onBlur={() => setFocus(null)}
                onClick={() => setFocus((f) => (f === id ? null : id))} aria-labelledby={`arch-${id}`}>
                <div className="arch__top"><span className="arch__where">{node.where}</span></div>
                <h3 id={`arch-${id}`}>{node.title}</h3>
                <p className="arch__sub">{node.sub}</p>
                <p className="arch__text">{node.text}</p>
              </article>
            );
          })}
          {EDGES.map((edge) => (
            <div key={edge.id} className={`arch__edge arch__edge--${edge.id}${linked(edge) ? ' is-on' : ' is-dim'}${edge.label === 'future' ? ' is-future' : ''}`} aria-hidden="true">
              <span className="arch__line"><i /></span>
              <span className="arch__label">{architecture.edges[edge.label]}</span>
            </div>
          ))}
        </div>

        <div className="stack">
          <h3 className="stack__title">{architecture.stackTitle}</h3>
          <div className="marquee" aria-hidden="true">
            <div className="marquee__track">
              {[...architecture.stack, ...architecture.stack].map((tool, i) => <span key={i} className="chip">{tool}</span>)}
            </div>
          </div>
          <ul className="sr-only">{architecture.stack.map((tool) => <li key={tool}>{tool}</li>)}</ul>
        </div>
      </div>
    </section>
  );
}
