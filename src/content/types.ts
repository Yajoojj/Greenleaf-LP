import type { AnchorId } from '../three/leaf-shape';

export type Lang = 'pt' | 'en';
export type Stage = 'sadia' | 'leve' | 'moderada' | 'grave';
export type LayerId = 'photo' | 'hsv' | 'mask' | 'overlay';
export type GoalStatus = 'done' | 'progress' | 'pending' | 'future';
export type NodeId = 'app' | 'ia' | 'db' | 'map';

/** Título com um trecho em itálico serifado (o acento editorial do Halo). */
export interface Title { before: string; em: string; after?: string; }
export interface Text { title: string; text: string; }

export interface Content {
  meta: { title: string; description: string; locale: string };
  ui: {
    skip: string; home: string; mainNav: string; mobileNav: string; openMenu: string; closeMenu: string;
    openApp: string; language: string; backToTop: string; newTab: string; illustrative: string;
  };
  nav: { href: string; label: string }[];
  hero: {
    eyebrow: string; title: Title; lead: string; primary: string; secondary: string;
    indicators: { value: string; label: string }[];
    card: { label: string; idle: string; scanning: string; result: string; resultDetail: string; note: string };
    hint: string; scroll: string;
  };
  numbers: { eyebrow: string; title: string; items: { value: string; label: string; source: string }[] };
  problem: {
    eyebrow: string; title: Title; paragraphs: string[]; question: string; questionSource: string;
    symptomsTitle: string; symptoms: Text[]; region: Text;
  };
  explorer: {
    eyebrow: string; title: Title; lead: string; stagesLabel: string;
    stages: Record<Stage, { label: string; range: string; meaning: string; todo: string[] }>;
    slider: string; coverage: string; scanOn: string; scanOff: string; todoTitle: string; todoNote: string;
    hotspotsLabel: string; hotspots: Record<AnchorId, Text>;
    controls: { left: string; right: string; zoomIn: string; zoomOut: string; reset: string };
    hint: string; note: string; fallback: string; sceneLabel: string;
  };
  flow: {
    eyebrow: string; title: Title; lead: string;
    steps: { tag: string; who: string; title: string; text: string }[];
    mini: {
      tips: string[]; shrink: [string, string]; upload: string; model: string; color: string; combined: string;
      risk: [string, string, string]; severity: [string, string, string]; badge: string; badgeText: string; chance: string; spots: string;
    };
  };
  vision: {
    eyebrow: string; title: Title; lead: string; examplesLabel: string;
    layers: Record<LayerId, Text>;
    labels: { probability: string; ratio: string; top: string; time: string; model: string; risk: string; result: string; classes: string };
    classes: Record<'CBB' | 'CBSD' | 'CGM' | 'CMD' | 'Healthy', string>;
    risk: { low: string; medium: string; high: string; scale: string };
    results: { sadia: string; leve: string; moderada: string; grave: string; other: string };
    stats: { value: string; label: string }[];
    honesty: string; hint: string; source: string;
  };
  app: {
    eyebrow: string; title: Title; lead: string;
    screens: { src: string; title: string; text: string }[];
    features: Text[]; qr: string; cta: string; screensLabel: string; prev: string; next: string;
  };
  architecture: {
    eyebrow: string; title: Title; lead: string;
    nodes: Record<NodeId, { title: string; sub: string; where: string; text: string }>;
    edges: { https: string; auth: string; future: string };
    stackTitle: string; stack: string[];
  };
  goals: {
    eyebrow: string; title: Title; lead: string;
    labels: { goal: string; target: string; status: string };
    items: { id: string; goal: string; target: string; status: GoalStatus; statusLabel: string }[];
    mission: Text; vision: Text; values: { title: string; items: string[] };
  };
  video: { eyebrow: string; title: Title; lead: string; play: string; consent: string; caption: string };
  team: {
    eyebrow: string; title: Title; lead: string;
    members: { name: string; role: string; bio: string; photo: string; github?: string }[];
    institution: string;
  };
  faq: { eyebrow: string; title: Title; items: { q: string; a: string }[] };
  contact: {
    eyebrow: string; title: Title; lead: string;
    form: { name: string; profile: string; profiles: string[]; message: string; placeholder: string; submit: string; subject: string; hint: string };
    linksTitle: string; links: { label: string; href: string }[];
  };
  cta: { title: Title; lead: string; primary: string; secondary: string; wheel: string };
  footer: { tagline: string; credits: string; disclaimer: string };
}
