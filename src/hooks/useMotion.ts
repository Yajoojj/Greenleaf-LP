import { useEffect } from 'react';

/**
 * Movimento global: rolagem suave com Lenis (como no Halo), âncoras com
 * compensação do cabeçalho e revelação de elementos `[data-reveal]`.
 * Com `prefers-reduced-motion`, tudo fica visível e a rolagem é nativa.
 */
export function useMotion() {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const root = document.documentElement;
    root.classList.add('js');

    const reveal = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        reveal.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    const observeAll = () => document.querySelectorAll('[data-reveal]:not(.is-visible)').forEach((el) => reveal.observe(el));
    observeAll();
    // Conteúdo trocado (idioma, exemplos) também precisa ser observado.
    const mutations = new MutationObserver(observeAll);
    mutations.observe(document.getElementById('root')!, { childList: true, subtree: true });

    let destroyLenis = () => {};
    let lenisScrollTo: ((target: Element) => void) | null = null;
    if (!reduced) {
      import('lenis').then(({ default: Lenis }) => {
        const lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 1, smoothWheel: true });
        let frame = requestAnimationFrame(function raf(time) { lenis.raf(time); frame = requestAnimationFrame(raf); });
        lenisScrollTo = (target) => lenis.scrollTo(target as HTMLElement, { offset: -12 });
        destroyLenis = () => { cancelAnimationFrame(frame); lenis.destroy(); };
      }).catch(() => { /* rolagem nativa */ });
    }

    const onClick = (event: MouseEvent) => {
      const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!link) return;
      const id = link.getAttribute('href')!.slice(1);
      const target = id ? document.getElementById(id) : null;
      if (!target) return;
      event.preventDefault();
      if (lenisScrollTo) lenisScrollTo(target);
      else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', `#${id}`);
      // Move o foco para a seção, para leitores de tela e teclado.
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    };
    document.addEventListener('click', onClick);

    // O React monta depois da primeira tentativa do navegador de resolver a âncora.
    const hash = window.location.hash.slice(1);
    const frame = requestAnimationFrame(() => { if (hash) document.getElementById(hash)?.scrollIntoView({ block: 'start' }); });

    return () => {
      cancelAnimationFrame(frame);
      reveal.disconnect();
      mutations.disconnect();
      document.removeEventListener('click', onClick);
      destroyLenis();
    };
  }, []);
}
