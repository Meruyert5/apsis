import { useEffect, useRef } from "react";
import * as THREE from "three";

interface Props {
  labels: string[];
  phase: number;
}

function glowTexture(): THREE.Texture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.2, "rgba(255,255,255,.55)");
    g.addColorStop(0.55, "rgba(255,255,255,.1)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * A single transfer to the apsis: the signature route as a 3D filament that
 * spirals into the primary star. It is decorative on the Signal act; the
 * accessible route is the text and the Map.
 */
export function OrbitHero({ labels, phase }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef(phase);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 1, 3000);
    camera.position.set(0, 80, 760);
    camera.lookAt(0, 0, 0);
    const group = new THREE.Group();
    scene.add(group);
    const glow = glowTexture();

    const resize = () => {
      const w = canvas.clientWidth || 600;
      const h = canvas.clientHeight || 360;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    // one orbit
    const orbit = [];
    for (let i = 0; i <= 160; i += 1) {
      const a = (i / 160) * Math.PI * 2;
      orbit.push(new THREE.Vector3(Math.cos(a) * 300, Math.sin(a) * 142, -50));
    }
    group.add(new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(orbit),
      new THREE.LineBasicMaterial({ color: 0x4fe3ff, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending }),
    ));

    // the signature transfer
    const points: THREE.Vector3[] = [];
    labels.forEach((_, index) => {
      const last = index === labels.length - 1;
      if (last) {
        points.push(new THREE.Vector3(0, 0, 0));
        return;
      }
      const a = ((210 - index * 26) * Math.PI) / 180;
      const r = 268 - index * 30;
      points.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r * 0.62, Math.sin(index * 1.4) * 22));
    });
    if (points.length > 1) {
      const curve = new THREE.CatmullRomCurve3(points);
      group.add(new THREE.Mesh(
        new THREE.TubeGeometry(curve, 64, 1.8, 8, false),
        new THREE.MeshBasicMaterial({ color: 0xeaf7ff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }),
      ));
      group.add(new THREE.Mesh(
        new THREE.TubeGeometry(curve, 64, 6, 8, false),
        new THREE.MeshBasicMaterial({ color: 0x4fe3ff, transparent: true, opacity: 0.14, blending: THREE.AdditiveBlending, depthWrite: false }),
      ));
      points.forEach((point, index) => {
        const last = index === points.length - 1;
        const node = new THREE.Sprite(new THREE.SpriteMaterial({
          map: glow,
          color: last ? 0xffc46b : 0x4fe3ff,
          transparent: true,
          opacity: last ? 0.9 : 0.55,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }));
        node.position.copy(point);
        const size = last ? 74 : 20;
        node.scale.set(size, size, 1);
        group.add(node);
      });
      const pulse = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glow, color: 0xffc46b, transparent: true, opacity: 0.95,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      pulse.scale.set(22, 22, 1);
      group.add(pulse);
      const pulse2 = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glow, color: 0x4fe3ff, transparent: true, opacity: 0.6,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      pulse2.scale.set(14, 14, 1);
      group.add(pulse2);
      group.userData.curve = curve;
      group.userData.pulse = pulse;
      group.userData.pulse2 = pulse2;
    }

    // a comet on a long ellipse, with a tail and a belt
    const comet = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0x9fefff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
    comet.scale.set(34, 34, 1);
    group.add(comet);
    const tailGeo = new THREE.BufferGeometry();
    tailGeo.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(12 * 3), 3));
    const tail = new THREE.Line(tailGeo, new THREE.LineBasicMaterial({ color: 0x4fe3ff, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending }));
    group.add(tail);
    const beltPositions = new Float32Array(120 * 3);
    for (let i = 0; i < 120; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const r = 330 + Math.random() * 40;
      beltPositions[i * 3] = Math.cos(a) * r;
      beltPositions[i * 3 + 1] = Math.sin(a) * r * 0.48;
      beltPositions[i * 3 + 2] = (Math.random() - 0.5) * 30;
    }
    const beltGeo = new THREE.BufferGeometry();
    beltGeo.setAttribute("position", new THREE.BufferAttribute(beltPositions, 3));
    group.add(new THREE.Points(beltGeo, new THREE.PointsMaterial({ color: 0x9fd8ff, size: 1.1, transparent: true, opacity: 0.42, blending: THREE.AdditiveBlending, depthWrite: false })));
    const flare = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xffc46b, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false }));
    flare.scale.set(260, 260, 1);
    group.add(flare);

    const star = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glow, color: 0xffc46b, transparent: true, opacity: 0.95,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    star.scale.set(190, 190, 1);
    group.add(star);
    const starCore = new THREE.Mesh(
      new THREE.SphereGeometry(10, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0xfff3dc }),
    );
    group.add(starCore);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.dataset.motion === "off";
    let raf = 0;
    let visible = true;
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !reduced) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(loop);
      } else {
        cancelAnimationFrame(raf);
      }
    }, { threshold: 0.05 });
    io.observe(canvas);

    const clock = new THREE.Clock();
    const loop = () => {
      if (!visible || reduced) return;
      raf = requestAnimationFrame(loop);
      const t = clock.getElapsedTime();
      group.rotation.y = Math.sin(t * 0.12) * 0.18 + 0.2;
      group.rotation.x = -0.3;
      const curve = group.userData.curve as THREE.CatmullRomCurve3 | undefined;
      const pulse = group.userData.pulse as THREE.Sprite | undefined;
      const pulse2 = group.userData.pulse2 as THREE.Sprite | undefined;
      if (curve && pulse) pulse.position.copy(curve.getPoint((t * 0.09) % 1));
      if (curve && pulse2) pulse2.position.copy(curve.getPoint((t * 0.09 + 0.48) % 1));
      renderer.render(scene, camera);
    };
    group.rotation.set(-0.3, 0.2, 0);
    renderer.render(scene, camera);
    if (!reduced) raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      observer.disconnect();
      glow.dispose();
      group.traverse((node) => {
        const mesh = node as THREE.Mesh;
        mesh.geometry?.dispose?.();
        const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(material)) material.forEach((item) => item.dispose());
        else material?.dispose?.();
      });
      renderer.dispose();
    };
  }, [labels]);

  return (
    <div className="bio-routefield" aria-label={`Signature route: ${labels.join(" to ")}`}>
      <span className="tag">Signature transfer</span>
      <canvas ref={canvasRef} aria-hidden="true" />
      <span className="bio-route-label bio-route-label--start">{labels[0]}</span>
      <span className="bio-route-label bio-route-label--end">Apsis</span>
    </div>
  );
}
