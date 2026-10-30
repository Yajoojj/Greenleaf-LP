/**
 * Respostas reais da GreenLeaf IA v2 gravadas pelo app (modo demonstração,
 * `src/services/fixtures/demo-cases.json` do Greenleaf-Mobile), sem o overlay.
 * As imagens são ilustrações geradas por computador; o rótulo de cada exemplo
 * vem do resultado da IA, não do nome do arquivo (decisão D-29 do app).
 */
export type DemoState = 'sadia' | 'leve' | 'moderada' | 'grave' | 'other';
export type ClassCode = 'CBB' | 'CBSD' | 'CGM' | 'CMD' | 'Healthy';

export interface DemoCase {
  id: string;
  image: string;
  overlay: string;
  state: DemoState;
  probability: number;
  ratio: number;
  processingMs: number;
  classes: Record<ClassCode, number>;
}

export const MODEL_VERSION = 'greenleaf_effb0-2026-10-28';

export const DEMO_CASES: DemoCase[] = [
  {
    id: 'grave', image: '/demo/folha-grave.jpg', overlay: '/demo/folha-grave-overlay.jpg', state: 'grave',
    probability: 0.5088, ratio: 0.3806, processingMs: 752,
    classes: { CBB: 0.5088, CBSD: 0.1362, CGM: 0.0338, CMD: 0.1238, Healthy: 0.1975 },
  },
  {
    id: 'moderada', image: '/demo/folha-moderada.jpg', overlay: '/demo/folha-moderada-overlay.jpg', state: 'leve',
    probability: 0.331, ratio: 0, processingMs: 704,
    classes: { CBB: 0.331, CBSD: 0.1009, CGM: 0.0152, CMD: 0.0267, Healthy: 0.5262 },
  },
  {
    id: 'mosaico', image: '/demo/folha-mosaico.jpg', overlay: '/demo/folha-mosaico-overlay.jpg', state: 'other',
    probability: 0.0229, ratio: 0.0739, processingMs: 992,
    classes: { CBB: 0.0229, CBSD: 0.0241, CGM: 0.0232, CMD: 0.9132, Healthy: 0.0166 },
  },
  {
    id: 'leve', image: '/demo/folha-leve.jpg', overlay: '/demo/folha-leve-overlay.jpg', state: 'sadia',
    probability: 0.1281, ratio: 0, processingMs: 638,
    classes: { CBB: 0.1281, CBSD: 0.1062, CGM: 0.0135, CMD: 0.0229, Healthy: 0.7293 },
  },
  {
    id: 'sadia', image: '/demo/folha-sadia.jpg', overlay: '/demo/folha-sadia-overlay.jpg', state: 'sadia',
    probability: 0.0223, ratio: 0, processingMs: 728,
    classes: { CBB: 0.0223, CBSD: 0.0488, CGM: 0.0092, CMD: 0.0051, Healthy: 0.9147 },
  },
];

/** Mesmas faixas do app: Baixo < 0,26; Médio 0,26–0,60; Alto > 0,60. */
export function riskOf(probability: number): 'low' | 'medium' | 'high' {
  if (probability > 0.6) return 'high';
  if (probability >= 0.26) return 'medium';
  return 'low';
}
