import { useEffect, useRef } from "react";
import * as THREE from "three";

const BLUE = 0x1a1aff;
const WHITE = 0xffffff;

export function WaveMesh() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    host.appendChild(canvas);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch {
      canvas.remove();
      return;
    }
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(1.6, window.devicePixelRatio || 1));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 1.2, 4.6);
    camera.lookAt(0, -0.1, 0);

    const group = new THREE.Group();
    group.rotation.x = -1.02;
    scene.add(group);

    const geometry = new THREE.PlaneGeometry(36, 4.2, 140, 20);
    const base = Float32Array.from(geometry.attributes.position.array);
    const points = new THREE.Points(geometry, new THREE.PointsMaterial({
      color: BLUE, size: 0.03, transparent: true, opacity: 0.85,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    group.add(points);

    const sparkGeo = new THREE.BufferGeometry();
    const sparkPositions = Float32Array.from(base);
    sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPositions, 3));
    const sparks = new THREE.Points(sparkGeo, new THREE.PointsMaterial({
      color: WHITE, size: 0.02, transparent: true, opacity: 0.35,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    group.add(sparks);

    const wireGeo = new THREE.PlaneGeometry(36, 4.2, 60, 14);
    const wireBase = Float32Array.from(wireGeo.attributes.position.array);
    const wire = new THREE.Mesh(wireGeo, new THREE.MeshBasicMaterial({
      color: BLUE, wireframe: true, transparent: true, opacity: 0.1,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    group.add(wire);

    const resize = () => {
      const width = host.clientWidth || 900;
      const height = host.clientHeight || 90;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const shape = (x: number, y: number, time: number) =>
      Math.sin(x * 0.6 + time * 0.55) * 0.22 + Math.cos(y * 1.6 + time * 0.4) * 0.14;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let visible = true;
    const clock = new THREE.Clock();

    const animate = () => {
      const time = reduce ? 1.4 : clock.getElapsedTime();
      const positions = geometry.attributes.position.array;
      const sparkArray = sparkGeo.attributes.position.array;
      for (let i = 0; i < positions.length / 3; i += 1) {
        const x = base[i * 3];
        const y = base[i * 3 + 1];
        const z = shape(x, y, time);
        positions[i * 3 + 2] = z;
        sparkArray[i * 3 + 2] = z + 0.012;
      }
      geometry.attributes.position.needsUpdate = true;
      sparkGeo.attributes.position.needsUpdate = true;

      const wirePositions = wireGeo.attributes.position.array;
      for (let i = 0; i < wirePositions.length / 3; i += 1) {
        wirePositions[i * 3 + 2] = shape(wireBase[i * 3], wireBase[i * 3 + 1], time);
      }
      wireGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
      if (visible && !reduce) raf = requestAnimationFrame(animate);
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !reduce) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(animate);
      } else {
        cancelAnimationFrame(raf);
      }
    }, { threshold: 0.05 });
    observer.observe(host);

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();
    animate();

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      resizeObserver.disconnect();
      geometry.dispose();
      sparkGeo.dispose();
      wireGeo.dispose();
      (points.material as THREE.Material).dispose();
      (sparks.material as THREE.Material).dispose();
      (wire.material as THREE.Material).dispose();
      renderer.dispose();
      canvas.remove();
    };
  }, []);

  return <div className="wave-mesh" ref={hostRef} aria-hidden="true" />;
}
