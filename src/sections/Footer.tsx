import { site } from '../config/site';
import { useLanguage } from '../content/Language';
import { Logo } from '../components/Primitives';
import { ArrowUpRight } from '../components/Icons';

export function Footer() {
  const { content: { footer, nav, ui, contact } } = useLanguage();
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__top">
          <div className="site-footer__brand">
            <Logo />
            <p>{footer.tagline}</p>
          </div>
          <nav aria-label={ui.mainNav} className="site-footer__nav">
            <ul>{nav.map((item) => <li key={item.href}><a href={item.href}>{item.label}</a></li>)}</ul>
          </nav>
          <div className="site-footer__links">
            <a className="btn btn--cream" href={site.appUrl} target="_blank" rel="noopener">{ui.openApp} <ArrowUpRight className="btn__icon" /><span className="sr-only"> {ui.newTab}</span></a>
            <ul>{contact.links.map((l) => <li key={l.href}><a href={l.href} target="_blank" rel="noopener">{l.label}<span className="sr-only"> {ui.newTab}</span></a></li>)}</ul>
          </div>
        </div>
        <p className="site-footer__word" aria-hidden="true">GreenLeaf</p>
        <div className="site-footer__bottom">
          <p>{footer.credits}</p>
          <p>{footer.disclaimer}</p>
          <a href="#inicio">{ui.backToTop} ↑</a>
        </div>
      </div>
    </footer>
  );
}
