import * as THREE from 'three';
import { createLeaf } from './leaf';
import { createSpin, createStage } from './stage';

export type HeroPhase = 'idle' | 'scanning' | 'result';

/**
 * Cena do hero: a folha flutua, responde ao ponteiro e ao arraste, e de
 * tempos em tempos passa por uma varredura que destaca as manchas — a mesma
 * ideia da "área destacada" do app.
 */
export function createHeroScene(host: HTMLElement, { onPhase }: { onPhase?: (phase: HeroPhase) => void } = {}) {
  const leaf = createLeaf({ seed: 11 });
  const pointer = new THREE.Vector2();
  const smoothPointer = new THREE.Vector2();
  let progress = 0;
  let phase: HeroPhase = 'idle';
  let cycleStart = 1.2;
  const CYCLE = 9;

  const setPhase = (next: HeroPhase) => {
    if (next === phase) return;
    phase = next;
    onPhase?.(phase);
  };

  const stage = createStage(host, {
    fov: 30,
    frame(time, delta) {
      const moving = spin.step(delta);
      smoothPointer.lerp(pointer, 1 - Math.pow(0.02, delta));
      if (!spin.state.dragging && !moving) spin.state.yaw *= Math.pow(0.35, delta); // volta devagar ao centro
      leaf.sway(time, 1);
      root.rotation.y = spin.state.yaw + smoothPointer.x * 0.25 + Math.sin(time * 0.25) * 0.12 + progress * 0.8;
      root.rotation.x = -0.62 + spin.state.pitch * 0.5 + smoothPointer.y * 0.12 + progress * 0.35;
      root.position.y = Math.sin(time * 0.7) * 0.06 - progress * 0.4;

      // Ciclo de varredura: espera → varre → mostra o resultado → apaga.
      const reduced = stage!.reducedMotion.matches;
      const local = reduced ? CYCLE * 0.6 : (time - cycleStart) % CYCLE;
      if (time < cycleStart && !reduced) {
        leaf.uniforms.uScan.value = 0;
        setPhase('idle');
      } else if (local < 2.6) {
        leaf.uniforms.uScan.value = Math.min(local / 0.4, 1);
        leaf.uniforms.uScanPos.value = THREE.MathUtils.smoothstep(local, 0.2, 2.6) * 1.05;
        setPhase('scanning');
      } else if (local < 6.4) {
        leaf.uniforms.uScan.value = 1;
        leaf.uniforms.uScanPos.value = 1.05;
        setPhase('result');
      } else {
        leaf.uniforms.uScan.value = Math.max(0, 1 - (local - 6.4) / 0.9);
        setPhase('idle');
      }
      spores.rotation.y = time * 0.03;
      const pos = sporeGeometry.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i) + delta * speeds[i];
        if (y > 2.6) y = -2.6;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
    },
    onResize(width) {
      // No celular a folha fica centralizada e um pouco menor.
      const narrow = width < 700;
      root.position.x = narrow ? 0 : 0.15;
      root.scale.setScalar(narrow ? 0.86 : 1);
      stage!.camera.position.set(0, 0.2, narrow ? 9.4 : 8.6);
      stage!.camera.lookAt(0, 0.1, 0);
    },
  });
  if (!stage) { leaf.dispose(); return null; }
  const { scene } = stage;

  const root = new THREE.Group();
  root.add(leaf.group);
  leaf.group.position.y = -0.45;
  leaf.group.rotation.z = 0.28;
  scene.add(root);
  leaf.uniforms.uSeverity.value = leaf.severityFor(0.045);

  const key = new THREE.DirectionalLight('#fff3df', 2.6);
  key.position.set(3, 5, 6);
  const rim = new THREE.DirectionalLight('#9fe07a', 3.2);
  rim.position.set(-4, 2, -5);
  const fill = new THREE.HemisphereLight('#e7f2d8', '#1b2412', 0.6);
  scene.add(key, rim, fill);

  // Esporos/poeira em suspensão, desenhados como pontos suaves.
  const sprite = document.createElement('canvas');
  sprite.width = sprite.height = 64;
  const sctx = sprite.getContext('2d')!;
  const grad = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.45)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  sctx.fillStyle = grad;
  sctx.fillRect(0, 0, 64, 64);
  const spriteTexture = new THREE.CanvasTexture(sprite);
  const COUNT = 220;
  const positions = new Float32Array(COUNT * 3);
  const speeds = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    const r = 1.6 + Math.random() * 2.6, a = Math.random() * Math.PI * 2;
    positions.set([Math.cos(a) * r, (Math.random() - 0.5) * 5.2, Math.sin(a) * r - 0.6], i * 3);
    speeds[i] = 0.05 + Math.random() * 0.12;
  }
  const sporeGeometry = new THREE.BufferGeometry();
  sporeGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const sporeMaterial = new THREE.PointsMaterial({
    size: 0.05, map: spriteTexture, color: '#c7dca6', transparent: true, opacity: 0.55,
    depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
  });
  const spores = new THREE.Points(sporeGeometry, sporeMaterial);
  scene.add(spores);

  const spin = createSpin(host);
  const onPointer = (event: PointerEvent) => {
    const rect = host.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width - 0.5, (event.clientY - rect.top) / rect.height - 0.5);
  };
  const onLeave = () => pointer.set(0, 0);
  host.addEventListener('pointermove', onPointer);
  host.addEventListener('pointerleave', onLeave);
  stage.start();
  cycleStart = 1.2;

  return {
    /** 0 → topo da página; 1 → hero fora da tela. */
    setProgress(value: number) { progress = value; stage.invalidate(); },
    dispose() {
      host.removeEventListener('pointermove', onPointer);
      host.removeEventListener('pointerleave', onLeave);
      spin.dispose();
      leaf.dispose();
      sporeGeometry.dispose(); sporeMaterial.dispose(); spriteTexture.dispose();
      stage.dispose();
    },
  };
}
