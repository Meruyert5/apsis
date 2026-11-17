import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * The field collapse at the apsis: a dark primary, a torn accretion ring,
 * magnetic filaments and a slow rain of charges. It is a full-bleed layer
 * behind the closure, not a card.
 */
export function FieldCollapse() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 1, 4000);
    camera.position.set(0, 120, 900);
    camera.lookAt(0, 0, 0);
    const group = new THREE.Group();
    scene.add(group);

    const glow = (() => {
      const size = 128;
      const c = document.createElement("canvas");
      c.width = size;
      c.height = size;
      const ctx = c.getContext("2d");
      if (ctx) {
        const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        g.addColorStop(0, "rgba(255,255,255,1)");
        g.addColorStop(0.2, "rgba(255,255,255,.55)");
        g.addColorStop(0.55, "rgba(255,255,255,.1)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, size, size);
      }
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    })();

    const resize = () => {
      const w = canvas.clientWidth || 820;
      const h = canvas.clientHeight || 820;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    // the primary
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(120, 48, 48),
      new THREE.MeshBasicMaterial({ color: 0x010403 }),
    );
    group.add(core);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glow, color: 0x4fe3c1, transparent: true, opacity: 0.4,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    halo.scale.set(520, 520, 1);
    group.add(halo);

    // accretion ring
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(190, 2.2, 8, 160),
      new THREE.MeshBasicMaterial({ color: 0xd6fff2, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    ring.rotation.x = 1.25;
    ring.rotation.z = -0.2;
    group.add(ring);
    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(222, 0.8, 8, 160),
      new THREE.MeshBasicMaterial({ color: 0x8b7bff, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    ring2.rotation.x = 1.12;
    ring2.rotation.z = 0.3;
    group.add(ring2);

    // magnetic filaments
    for (let k = 0; k < 10; k += 1) {
      const a = (k / 10) * Math.PI * 2;
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 40; i += 1) {
        const t = i / 40;
        const r = 135 + t * 190;
        pts.push(new THREE.Vector3(
          Math.cos(a + t * 2.2) * r,
          Math.sin(a + t * 2.2) * r * 0.42,
          Math.sin(t * Math.PI) * 52,
        ));
      }
      group.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({
          color: k % 2 === 0 ? 0x4fe3c1 : 0x8b7bff,
          transparent: true,
          opacity: 0.14,
          blending: THREE.AdditiveBlending,
        }),
      ));
    }

    // charges in the ring
    const count = 520;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const r = 155 + Math.random() * 150;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = Math.sin(a) * r * 0.42;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 90;
    }
    const pg = new THREE.BufferGeometry();
    pg.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const charges = new THREE.Points(pg, new THREE.PointsMaterial({
      color: 0xa9e6d6, size: 1.8, map: glow, transparent: true, opacity: 0.65,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    }));
    group.add(charges);

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
      group.rotation.y = t * 0.045;
      group.rotation.x = -0.16 + Math.sin(t * 0.08) * 0.05;
      charges.rotation.z = t * 0.03;
      halo.scale.setScalar(510 + Math.sin(t * 0.7) * 18);
      renderer.render(scene, camera);
    };
    group.rotation.set(-0.16, 0, 0);
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
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" />;
}
