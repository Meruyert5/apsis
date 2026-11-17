import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const BLUE = 0x1a1aff;
const WHITE = 0xffffff;

function starTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.translate(size / 2, size / 2);
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    for (let i = 0; i < 8; i += 1) {
      const radius = i % 2 === 0 ? 54 : 10;
      const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 62);
    glow.addColorStop(0, "rgba(255,255,255,.55)");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(-64, -64, 128, 128);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function addStar(root: THREE.Group, x: number, y: number, z: number, scale: number, map: THREE.Texture) {
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map,
    color: WHITE,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }));
  sprite.position.set(x, y, z);
  sprite.scale.set(scale, scale, 1);
  root.add(sprite);
}

function OrbFallback() {
  return (
    <div className="mascot-fallback">
      <svg viewBox="0 0 800 620" role="img" aria-label="Wireframe globe with a seven-node orbit">
        <defs>
          <radialGradient id="orb-core" cx="36%" cy="30%" r="72%">
            <stop offset="0" stopColor="#e8ebff" />
            <stop offset=".16" stopColor="#6a6aff" />
            <stop offset=".52" stopColor="#1a1aff" />
            <stop offset=".8" stopColor="#080848" />
            <stop offset="1" stopColor="#000" />
          </radialGradient>
        </defs>
        <circle cx="400" cy="310" r="238" fill="none" stroke="#1a1aff" strokeWidth="1" opacity=".8" />
        <ellipse cx="400" cy="310" rx="238" ry="78" fill="none" stroke="#1a1aff" strokeWidth="1" opacity=".8" />
        <ellipse cx="400" cy="310" rx="78" ry="238" fill="none" stroke="#1a1aff" strokeWidth="1" opacity=".8" />
        <ellipse cx="400" cy="310" rx="238" ry="78" transform="rotate(45 400 310)" fill="none" stroke="#1a1aff" strokeWidth="1" opacity=".55" />
        <ellipse cx="400" cy="310" rx="238" ry="78" transform="rotate(-45 400 310)" fill="none" stroke="#1a1aff" strokeWidth="1" opacity=".55" />
        <circle cx="400" cy="310" r="156" fill="url(#orb-core)" />
        <ellipse cx="400" cy="310" rx="300" ry="92" transform="rotate(-18 400 310)" fill="none" stroke="#fff" strokeWidth="1.2" opacity=".8" />
        <circle cx="400" cy="310" r="272" fill="none" stroke="#fff" strokeWidth=".7" strokeDasharray="3 7" opacity=".5" />
        <g fill="#fff">
          <circle cx="108" cy="240" r="4" />
          <circle cx="186" cy="192" r="4" />
          <circle cx="286" cy="196" r="4" />
          <circle cx="400" cy="218" r="5" />
          <circle cx="512" cy="270" r="4" />
          <circle cx="616" cy="332" r="4" />
          <circle cx="692" cy="360" r="6" />
        </g>
        <g fill="none" stroke="#fff" strokeWidth="1.2" opacity=".9">
          <path d="M650 116 L656 148 L688 154 L656 160 L650 192 L644 160 L612 154 L644 148 Z" />
          <path d="M206 462 L210 482 L230 486 L210 490 L206 510 L202 490 L182 486 L202 482 Z" opacity=".7" />
        </g>
      </svg>
    </div>
  );
}

export function MascotOrb() {
  const hostRef = useRef<HTMLDivElement>(null);
  const paused = useRef(false);
  const startRef = useRef<() => void>(() => {});
  const [mode, setMode] = useState<"3d" | "2d">("3d");

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    host.prepend(canvas);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch {
      canvas.remove();
      setMode("2d");
      paused.current = true;
      return;
    }

    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(1.6, window.devicePixelRatio || 1));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 1.1, 10.4);
    camera.lookAt(0, 0.1, 0);

    const root = new THREE.Group();
    root.rotation.x = 0.12;
    scene.add(root);

    const uniforms = { uTime: { value: 0 } };
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(1.72, 96, 64),
      new THREE.ShaderMaterial({
        uniforms,
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vPos;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vPos = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uTime;
          varying vec3 vNormal;
          varying vec3 vPos;
          void main() {
            vec3 n = normalize(vNormal);
            float fresnel = pow(1.0 - abs(n.z), 2.2);
            float swirl = sin(vPos.y * 7.4 + sin(vPos.x * 2.6 + uTime * 0.32) * 2.4 + vPos.z * 4.2 + uTime * 0.12);
            float band = smoothstep(-0.35, 0.8, swirl);
            vec3 deep = vec3(0.004, 0.004, 0.045);
            vec3 cobalt = vec3(0.10, 0.10, 1.0);
            vec3 ice = vec3(0.86, 0.90, 1.0);
            vec3 col = mix(deep, cobalt, 0.18 + band * 0.56);
            col = mix(col, ice, fresnel * 0.5);
            float spec = pow(max(dot(n, normalize(vec3(0.45, 0.7, 0.8))), 0.0), 28.0);
            col += ice * spec * 0.4;
            gl_FragColor = vec4(col, 1.0);
            #include <colorspace_fragment>
          }
        `,
      }),
    );
    root.add(core);

    const shell = new THREE.Mesh(
      new THREE.SphereGeometry(2.36, 32, 22),
      new THREE.MeshBasicMaterial({
        color: BLUE, wireframe: true, transparent: true, opacity: 0.36,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }),
    );
    root.add(shell);

    const outerShell = new THREE.Mesh(
      new THREE.SphereGeometry(2.58, 16, 12),
      new THREE.MeshBasicMaterial({
        color: WHITE, wireframe: true, transparent: true, opacity: 0.08,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }),
    );
    root.add(outerShell);

    const orbitPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= 180; i += 1) {
      const angle = (i / 180) * Math.PI * 2;
      orbitPoints.push(new THREE.Vector3(
        Math.cos(angle) * 3.0,
        Math.sin(angle * 2) * 0.46,
        Math.sin(angle) * 2.55,
      ));
    }
    const orbit = new THREE.CatmullRomCurve3(orbitPoints, true);
    const ring = new THREE.Mesh(
      new THREE.TubeGeometry(orbit, 220, 0.012, 6, true),
      new THREE.MeshBasicMaterial({
        color: WHITE, transparent: true, opacity: 0.7,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }),
    );
    root.add(ring);

    const starMap = starTexture();
    for (let i = 0; i < 7; i += 1) {
      const point = orbit.getPointAt(i / 7);
      const admin = i === 6;
      const node = new THREE.Mesh(
        new THREE.OctahedronGeometry(admin ? 0.1 : 0.055, 0),
        new THREE.MeshBasicMaterial({
          color: admin ? BLUE : WHITE,
          transparent: true, opacity: admin ? 1 : 0.9,
          blending: THREE.AdditiveBlending, depthWrite: false,
        }),
      );
      node.position.copy(point);
      root.add(node);
      if (admin) addStar(root, point.x, point.y, point.z, 0.7, starMap);
    }

    const dustCount = 400;
    const dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i += 1) {
      const y = 1 - (i / (dustCount - 1)) * 2;
      const radius = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = i * 2.399963;
      const distance = 2.52 + Math.random() * 0.72;
      dustPositions[i * 3] = Math.cos(theta) * radius * distance;
      dustPositions[i * 3 + 1] = y * distance;
      dustPositions[i * 3 + 2] = Math.sin(theta) * radius * distance;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
    root.add(new THREE.Points(dustGeo, new THREE.PointsMaterial({
      color: BLUE, size: 0.02, transparent: true, opacity: 0.7,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })));

    const ghost = new THREE.Mesh(
      new THREE.SphereGeometry(0.92, 16, 12),
      new THREE.MeshBasicMaterial({
        color: BLUE, wireframe: true, transparent: true, opacity: 0.15,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }),
    );
    ghost.position.set(-3.25, 2.15, -2.5);
    root.add(ghost);

    const polar = new THREE.PolarGridHelper(4.2, 8, 4, 64, BLUE, BLUE);
    polar.position.y = -2.6;
    const polarMaterial = polar.material as THREE.LineBasicMaterial;
    polarMaterial.transparent = true;
    polarMaterial.opacity = 0.1;
    const polarGroup = new THREE.Group();
    polarGroup.add(polar);
    root.add(polarGroup);

    addStar(root, -2.9, 2.1, 1.0, 0.5, starMap);
    addStar(root, 2.9, -1.7, 0.8, 0.38, starMap);

    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let targetX = 0;
    let targetY = 0.2;
    let rotX = 0;
    let rotY = 0;
    let zoom = 1;
    let visible = true;
    let raf = 0;
    const clock = new THREE.Clock();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const width = host.clientWidth || 500;
      const height = host.clientHeight || 380;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const onDown = (event: PointerEvent) => {
      dragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
      canvas.setPointerCapture?.(event.pointerId);
      canvas.style.cursor = "grabbing";
    };
    const onMove = (event: PointerEvent) => {
      if (!dragging) return;
      targetY += (event.clientX - lastX) * 0.006;
      targetX += (event.clientY - lastY) * 0.004;
      lastX = event.clientX;
      lastY = event.clientY;
    };
    const onUp = (event: PointerEvent) => {
      dragging = false;
      canvas.releasePointerCapture?.(event.pointerId);
      canvas.style.cursor = "grab";
    };
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      zoom = Math.min(1.28, Math.max(0.82, zoom + event.deltaY * 0.0006));
    };
    const onDouble = () => {
      targetX = 0;
      targetY = 0.2;
      zoom = 1;
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("dblclick", onDouble);

    const loop = () => {
      if (!visible || paused.current) return;
      raf = requestAnimationFrame(loop);
      const time = clock.getElapsedTime();
      uniforms.uTime.value = time;
      if (!reduce) targetY += 0.0008;
      rotX += (targetX - rotX) * 0.07;
      rotY += (targetY - rotY) * 0.07;
      root.rotation.x = 0.12 + rotX;
      root.rotation.y = rotY;
      polarGroup.rotation.y = -rotY * 0.2;
      camera.position.set(0, 1.1 / zoom, 10.4 / zoom);
      camera.lookAt(0, 0.1, 0);
      renderer.render(scene, camera);
    };

    const start = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(loop);
    };
    startRef.current = start;

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else cancelAnimationFrame(raf);
    }, { threshold: 0.05 });
    observer.observe(host);

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    renderer.render(scene, camera);
    start();

    return () => {
      startRef.current = () => {};
      cancelAnimationFrame(raf);
      observer.disconnect();
      resizeObserver.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("dblclick", onDouble);
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(material)) material.forEach((item) => item.dispose());
        else material?.dispose();
      });
      starMap.dispose();
      renderer.dispose();
      canvas.remove();
    };
  }, []);

  const toggle = () => {
    const next = mode === "3d" ? "2d" : "3d";
    paused.current = next === "2d";
    if (next === "3d") startRef.current();
    setMode(next);
  };

  return (
    <div className="mascot-orb" ref={hostRef}>
      {mode === "2d" ? <OrbFallback /> : null}
      <button type="button" className="mascot-mode" onClick={toggle}>
        {mode === "3d" ? "Use 2D" : "Use 3D"}
      </button>
    </div>
  );
}
