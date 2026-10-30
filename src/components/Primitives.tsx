import { useEffect, useState, type AnchorHTMLAttributes, type ReactNode } from 'react';
import QRCode from 'qrcode';
import type { Title as TitleType } from '../content/types';
import { useLanguage } from '../content/Language';
import { ArrowUpRight } from './Icons';

export function Logo({ className = '', withWord = true }: { className?: string; withWord?: boolean }) {
  return (
    <span className={`logo ${className}`}>
      <svg className="logo__mark" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
        <rect width="64" height="64" rx="16" fill="#1F541A" />
        <g transform="rotate(-40 32 32)">
          <path d="M10 32c8-12 36-12 44 0-8 12-36 12-44 0Z" fill="#7EC86A" />
          <path d="M12 32h38" stroke="#1F541A" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      </svg>
      {withWord && <span className="logo__word">GreenLeaf</span>}
    </span>
  );
}

/** Título de seção com o acento em itálico serifado. */
export function Heading({ title, as: Tag = 'h2', id, className = 'h2' }: { title: TitleType; as?: 'h1' | 'h2' | 'h3'; id?: string; className?: string }) {
  return (
    <Tag id={id} className={className}>
      {title.before}<em>{title.em}</em>{title.after}
    </Tag>
  );
}

export function Eyebrow({ children, tone }: { children: ReactNode; tone?: 'light' }) {
  return <p className={`eyebrow${tone === 'light' ? ' eyebrow--light' : ''}`}>{children}</p>;
}

type Variant = 'leaf' | 'cream' | 'outline' | 'dark' | 'outline-dark';
export function ButtonLink({ variant = 'leaf', external, children, className = '', ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: Variant; external?: boolean }) {
  const { content: { ui } } = useLanguage();
  return (
    <a className={`btn btn--${variant} ${className}`} {...(external ? { target: '_blank', rel: 'noopener' } : {})} {...rest}>
      {children}
      {external && <><ArrowUpRight className="btn__icon" /><span className="sr-only"> {ui.newTab}</span></>}
    </a>
  );
}

export function QrCode({ value, label }: { value: string; label: string }) {
  const [svg, setSvg] = useState('');
  useEffect(() => {
    let alive = true;
    QRCode.toString(value, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#12150c', light: '#00000000' } })
      .then((markup) => { if (alive) setSvg(markup); })
      .catch(() => { /* sem QR: o link ao lado continua disponível */ });
    return () => { alive = false; };
  }, [value]);
  return <div className="qr" role="img" aria-label={label} dangerouslySetInnerHTML={{ __html: svg }} />;
}
