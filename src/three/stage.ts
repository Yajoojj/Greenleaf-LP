import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/**
 * Infraestrutura comum das cenas: renderer com densidade de pixels limitada,
 * ambiente PBR, redimensionamento, pausa fora da tela/aba oculta, ~30–60 fps
 * e caminho estático com `prefers-reduced-motion`.
 */
export interface Stage {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  canvas: HTMLCanvasElement;
  reducedMotion: MediaQueryList;
  /** Pede um quadro (útil no modo estático, depois de mudar algo). */
  invalidate(): void;
  start(): void;
  dispose(): void;
}

export interface StageOptions {
  fov?: number;
  /** Chamado a cada quadro com o tempo em segundos e o delta. */
  frame: (time: number, delta: number) => void;
  onResize?: (width: number, height: number) => void;
  maxFps?: number;
}

export function createStage(host: HTMLElement, { fov = 32, frame, onResize, maxFps = 60 }: StageOptions): Stage | null {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('webgl2', { alpha: true, antialias: true, powerPreference: 'high-performance' });
  if (!context) return null;
  const renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: true });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  canvas.setAttribute('aria-hidden', 'true');
  canvas.className = 'stage-canvas';
  host.append(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 100);
  const room = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(room, 0.04);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.35;
  room.dispose();
  pmrem.dispose();

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clock = new THREE.Clock();
  let visible = true;
  let last = 0;
  const minFrame = 1000 / maxFps - 2;

  const draw = (now = performance.now()) => {
    if (!visible || document.hidden) return;
    if (!reducedMotion.matches && now - last < minFrame) return;
    last = now;
    const delta = Math.min(clock.getDelta(), 0.1);
    frame(reducedMotion.matches ? 0 : clock.elapsedTime, delta);
    renderer.render(scene, camera);
  };
  const resize = () => {
    const width = Math.max(host.clientWidth, 1);
    const height = Math.max(host.clientHeight, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, width < 600 ? 1.5 : 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    onResize?.(width, height);
    draw(performance.now() + 1000);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) { clock.getDelta(); draw(performance.now() + 1000); }
  }, { rootMargin: '120px' });
  intersection.observe(host);

  const start = () => {
    renderer.setAnimationLoop(reducedMotion.matches ? null : (t) => draw(t));
    draw(performance.now() + 1000);
  };
  const contextLost = (event: Event) => { event.preventDefault(); host.dataset.ready = 'false'; renderer.setAnimationLoop(null); };
  const contextRestored = () => { host.dataset.ready = 'true'; start(); };
  const visibilityChanged = () => { if (!document.hidden) { clock.getDelta(); draw(performance.now() + 1000); } };
  canvas.addEventListener('webglcontextlost', contextLost);
  canvas.addEventListener('webglcontextrestored', contextRestored);
  document.addEventListener('visibilitychange', visibilityChanged);
  reducedMotion.addEventListener('change', start);

  return {
    renderer, scene, camera, canvas, reducedMotion,
    invalidate: () => { if (reducedMotion.matches) draw(performance.now() + 1000); },
    start: () => { resize(); start(); },
    dispose() {
      renderer.setAnimationLoop(null);
      observer.disconnect();
      intersection.disconnect();
      reducedMotion.removeEventListener('change', start);
      document.removeEventListener('visibilitychange', visibilityChanged);
      canvas.removeEventListener('webglcontextlost', contextLost);
      canvas.removeEventListener('webglcontextrestored', contextRestored);
      environment.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}

/** Arraste com inércia (mouse, caneta ou toque horizontal) sem impedir a rolagem vertical. */
export function createSpin(target: HTMLElement, { onChange }: { onChange?: () => void } = {}) {
  const state = { yaw: 0, pitch: 0, velocity: 0, pitchVelocity: 0, dragging: false };
  let pointerId: number | null = null;
  let lastX = 0, lastY = 0, startX = 0, startY = 0, decided = false, horizontal = false;

  const down = (event: PointerEvent) => {
    if (event.button !== 0 || (event.target as HTMLElement).closest('button, a, input')) return;
    pointerId = event.pointerId;
    startX = lastX = event.clientX;
    startY = lastY = event.clientY;
    decided = event.pointerType === 'mouse';
    horizontal = decided;
    if (decided) { target.setPointerCapture(event.pointerId); state.dragging = true; }
  };
  const move = (event: PointerEvent) => {
    if (pointerId !== event.pointerId) return;
    if (!decided) {
      const dx = Math.abs(event.clientX - startX), dy = Math.abs(event.clientY - startY);
      if (dx + dy < 8) return;
      decided = true;
      horizontal = dx > dy;
      if (!horizontal) { pointerId = null; return; }
      target.setPointerCapture(event.pointerId);
      state.dragging = true;
    }
    const dx = event.clientX - lastX, dy = event.clientY - lastY;
    lastX = event.clientX; lastY = event.clientY;
    state.velocity = dx * 0.006;
    state.pitchVelocity = dy * 0.004;
    state.yaw += state.velocity;
    state.pitch = Math.max(-0.6, Math.min(0.6, state.pitch + state.pitchVelocity));
    onChange?.();
  };
  const up = (event: PointerEvent) => {
    if (pointerId !== event.pointerId) return;
    pointerId = null;
    state.dragging = false;
    if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId);
  };
  target.addEventListener('pointerdown', down);
  target.addEventListener('pointermove', move);
  target.addEventListener('pointerup', up);
  target.addEventListener('pointercancel', up);
  return {
    state,
    /** Aplica a inércia; devolve true enquanto ainda há movimento. */
    step(delta: number) {
      if (state.dragging) return true;
      const k = Math.pow(0.04, delta);
      state.velocity *= k;
      state.pitchVelocity *= k;
      state.yaw += state.velocity;
      state.pitch = Math.max(-0.6, Math.min(0.6, state.pitch + state.pitchVelocity));
      return Math.abs(state.velocity) > 0.0005;
    },
    dispose() {
      target.removeEventListener('pointerdown', down);
      target.removeEventListener('pointermove', move);
      target.removeEventListener('pointerup', up);
      target.removeEventListener('pointercancel', up);
    },
  };
}
