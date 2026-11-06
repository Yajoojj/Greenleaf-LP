import { site } from '../config/site';
import { useLanguage } from '../content/Language';
import { Eyebrow, Heading } from '../components/Primitives';
import { ArrowUpRight, Github } from '../components/Icons';

export function Team() {
  const { content: { team, ui } } = useLanguage();
  return (
    <section id="equipe" className="section section--light team" aria-labelledby="team-title">
      <div className="container">
        <div className="section-head section-head--split">
          <div>
            <Eyebrow tone="light">{team.eyebrow}</Eyebrow>
            <Heading id="team-title" title={team.title} />
          </div>
          <p className="lead">{team.lead}</p>
        </div>
        <ul className="team__grid">
          {team.members.map((m, i) => (
            <li key={m.name} className="member" data-reveal style={{ transitionDelay: `${i * 90}ms` }}>
              <div className="member__photo">
                <span className="member__index" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                <img src={m.photo} alt="" loading="lazy" width={640} height={800} />
              </div>
              <div className="member__body">
                <p className="member__role">{m.role}</p>
                <h3>{m.name}</h3>
                <p className="member__bio">{m.bio}</p>
                {m.github && (
                  <a className="member__link" href={m.github} target="_blank" rel="noopener">
                    <Github width={16} height={16} /> GitHub <ArrowUpRight width={14} height={14} /><span className="sr-only"> {ui.newTab}</span>
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
        <p className="team__institution">
          <a href={site.institutionUrl} target="_blank" rel="noopener">{team.institution}<span className="sr-only"> {ui.newTab}</span></a>
        </p>
      </div>
    </section>
  );
}
