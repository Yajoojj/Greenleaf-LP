import { useState } from 'react';
import { site } from '../config/site';
import { useLanguage } from '../content/Language';
import { Eyebrow, Heading } from '../components/Primitives';
import { Play } from '../components/Icons';

/** Vídeo carregado só após o clique (youtube-nocookie), sem custo nem rastreio antes disso. */
export function Pitch() {
  const { content: { video } } = useLanguage();
  const [playing, setPlaying] = useState(false);
  return (
    <section id="pitch" className="section pitch" aria-labelledby="pitch-title">
      <div className="container pitch__grid">
        <div className="pitch__copy">
          <Eyebrow>{video.eyebrow}</Eyebrow>
          <Heading id="pitch-title" title={video.title} />
          <p className="lead">{video.lead}</p>
          <p className="pitch__consent">{video.consent}</p>
        </div>
        <div className="pitch__frame" data-reveal>
          {playing ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${site.pitchVideoId}?autoplay=1&rel=0`}
              title={video.caption}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <button type="button" className="pitch__poster" onClick={() => setPlaying(true)}>
              <img src={`https://i.ytimg.com/vi/${site.pitchVideoId}/hqdefault.jpg`} alt="" loading="lazy" />
              <span className="pitch__play"><Play width={28} height={28} /></span>
              <span className="pitch__label">{video.play}<small>{video.caption}</small></span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
