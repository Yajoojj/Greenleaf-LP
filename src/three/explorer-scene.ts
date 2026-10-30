import * as THREE from 'three';
import { createLeaf, type AnchorId } from './leaf';
import { createSpin, createStage } from './stage';

export interface AnchorScreen { id: AnchorId; x: number; y: number; visible: boolean; }

const ANCHORS: AnchorId[] = ['lobe', 'midrib', 'margin', 'lesion', 'halo', 'petiole'];

/**
 * Explorador da folha: arraste para girar, controle de severidade, varredura
 * "como a IA vê" e marcadores HTML posicionados sobre pontos da malha.
 */
export function createExplorerScene(host: HTMLElement, { onAnchors }: { onAnchors: (anchors: AnchorScreen[]) => void }) {
  const leaf = createLeaf({ seed: 7 });
  let severity = 0, targetSeverity = 0;
  let scanTarget = 0, scanStart = -1;
  let zoom = 1, targetZoom = 1;
  const v = new THREE.Vector3(), n = new THREE.Vector3(), toCamera = new THREE.Vector3();

  const stage = createStage(host, {
    fov: 28,
    frame(time, delta) {
      const reduced = stage!.reducedMotion.matches;
      spin.step(delta);
      if (!spin.state.dragging && Math.abs(spin.state.velocity) < 0.0005 && !reduced) spin.state.yaw += delta * 0.08;
      const k = reduced ? 1 : 1 - Math.pow(0.012, delta);
      severity += (targetSeverity - severity) * k;
      zoom += (targetZoom - zoom) * k;
      leaf.uniforms.uSeverity.value = severity;
      leaf.uniforms.uWilt.value = Math.max(0, severity - 0.55) * 1.1;
      leaf.sway(time, 1 - severity * 0.5);

      // Varredura: a frente sobe da base às pontas e depois mantém o destaque.
      if (scanTarget > 0) {
        if (scanStart < 0) scanStart = time;
        const t = reduced ? 1 : Math.min((time - scanStart) / 2.4, 1);
        leaf.uniforms.uScan.value = Math.min(leaf.uniforms.uScan.value + delta * 4, 1);
        if (reduced) leaf.uniforms.uScan.value = 1;
        leaf.uniforms.uScanPos.value = THREE.MathUtils.smootherstep(t, 0, 1) * 1.05;
      } else {
        leaf.uniforms.uScan.value = reduced ? 0 : Math.max(leaf.uniforms.uScan.value - delta * 3, 0);
      }

      root.rotation.y = spin.state.yaw;
      root.rotation.x = -0.5 + spin.state.pitch;
      stage!.camera.position.set(0, 0.1, 9.2 / zoom);
      stage!.camera.lookAt(0, 0.05, 0);
      root.updateMatrixWorld(true);
      stage!.camera.updateMatrixWorld();

      const width = host.clientWidth, height = host.clientHeight;
      onAnchors(ANCHORS.map((id) => {
        leaf.anchor(id, v);
        leaf.anchorNormal(id, n);
        toCamera.copy(stage!.camera.position).sub(v).normalize();
        const facing = id === 'petiole' ? 1 : Math.abs(n.dot(toCamera));
        v.project(stage!.camera);
        return { id, x: (v.x * 0.5 + 0.5) * width, y: (-v.y * 0.5 + 0.5) * height, visible: facing > 0.18 && v.z < 1 };
      }));
    },
  });
  if (!stage) { leaf.dispose(); return null; }
  const { scene } = stage;

  const root = new THREE.Group();
  root.add(leaf.group);
  leaf.group.position.y = -0.55;
  scene.add(root);

  const key = new THREE.DirectionalLight('#fff4e2', 2.8);
  key.position.set(2, 6, 5);
  const rim = new THREE.DirectionalLight('#a8e283', 2.6);
  rim.position.set(-5, 1, -4);
  const fill = new THREE.HemisphereLight('#eef5e3', '#18200f', 0.7);
  scene.add(key, rim, fill);

  // Sombra de contato suave sob a folha.
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = shadowCanvas.height = 128;
  const sctx = shadowCanvas.getContext('2d')!;
  const sg = sctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  sg.addColorStop(0, 'rgba(0,0,0,0.45)');
  sg.addColorStop(1, 'rgba(0,0,0,0)');
  sctx.fillStyle = sg;
  sctx.fillRect(0, 0, 128, 128);
  const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
  const shadowMaterial = new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false });
  const shadowGeometry = new THREE.PlaneGeometry(5.5, 3.2);
  const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -2.3;
  scene.add(shadow);

  const spin = createSpin(host, { onChange: () => stage.invalidate() });
  stage.start();

  return {
    setSeverity(value: number) { targetSeverity = value; stage.invalidate(); },
    setScan(on: boolean) { scanTarget = on ? 1 : 0; scanStart = -1; stage.invalidate(); },
    zoomBy(factor: number) { targetZoom = Math.max(0.8, Math.min(1.7, targetZoom * factor)); stage.invalidate(); },
    rotateBy(radians: number) { spin.state.yaw += radians; stage.invalidate(); },
    reset() { spin.state.yaw = 0; spin.state.pitch = 0; targetZoom = 1; stage.invalidate(); },
    coverageAt: leaf.coverageAt,
    severityFor: leaf.severityFor,
    dispose() { spin.dispose(); leaf.dispose(); shadowGeometry.dispose(); shadowMaterial.dispose(); shadowTexture.dispose(); stage.dispose(); },
  };
}
