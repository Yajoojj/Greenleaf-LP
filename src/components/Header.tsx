import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { site } from '../config/site';
import { useLanguage } from '../content/Language';
import type { Lang } from '../content/types';
import { ButtonLink, Logo } from './Primitives';

function LanguageSwitch() {
  const { lang, setLang, content: { ui } } = useLanguage();
  return (
    <div className="lang" role="group" aria-label={ui.language}>
      {(['pt', 'en'] as Lang[]).map((code) => (
        <button key={code} type="button" className="lang__btn" aria-pressed={lang === code} onClick={() => setLang(code)} lang={code === 'pt' ? 'pt-BR' : 'en'}>
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export function Header() {
  const { content: { nav, ui } } = useLanguage();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('');
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    if (returnFocus) toggleRef.current?.focus();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Destaca o item da seção visível.
  useEffect(() => {
    const sections = nav.map((item) => document.querySelector(item.href)).filter(Boolean) as Element[];
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) setActive(`#${entry.target.id}`); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [nav]);

  // Esc fecha; Tab fica preso no painel enquanto aberto.
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>('a')?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); close(); return; }
      if (event.key !== 'Tab' || !panel) return;
      const focusables = [toggleRef.current, ...panel.querySelectorAll<HTMLElement>('a, button')].filter(Boolean) as HTMLElement[];
      const first = focusables[0], last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    document.body.classList.add('menu-open');
    return () => { document.removeEventListener('keydown', onKey); document.body.classList.remove('menu-open'); };
  }, [open, close]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1100px)');
    const onChange = () => mq.matches && setOpen(false);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return (
    <header className={`site-header${scrolled ? ' is-scrolled' : ''}${open ? ' is-open' : ''}`}>
      <div className="site-header__bar">
        <a className="site-header__brand" href="#inicio" aria-label={ui.home}><Logo /></a>
        <nav className="site-nav" aria-label={ui.mainNav}>
          <ul>
            {nav.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="site-nav__link" aria-current={active === item.href ? 'true' : undefined}>{item.label}</a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="site-header__actions">
          <LanguageSwitch />
          <ButtonLink className="site-header__cta" variant="leaf" href={site.appUrl} external>{ui.openApp}</ButtonLink>
          <button ref={toggleRef} type="button" className="menu-toggle" aria-expanded={open} aria-controls="menu-mobile"
            aria-label={open ? ui.closeMenu : ui.openMenu} onClick={() => (open ? close(false) : setOpen(true))}>
            <span aria-hidden="true" />
          </button>
        </div>
      </div>
      <div id="menu-mobile" ref={panelRef} className="mobile-menu" hidden={!open}
        onClick={(event) => { if ((event.target as HTMLElement).closest('a')) close(false); }}>
        <nav aria-label={ui.mobileNav}>
          <ul>
            {nav.map((item, i) => (
              <li key={item.href} style={{ '--i': i } as CSSProperties}><a href={item.href}>{item.label}</a></li>
            ))}
          </ul>
          <div className="mobile-menu__foot">
            <LanguageSwitch />
            <ButtonLink variant="leaf" href={site.appUrl} external>{ui.openApp}</ButtonLink>
          </div>
        </nav>
      </div>
    </header>
  );
}
