import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { motionAllowed, MOTION_CHANGE } from "../lib/motion";

function glowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(236,245,255,0.95)");
    gradient.addColorStop(0.28, "rgba(150,180,255,0.38)");
    gradient.addColorStop(0.65, "rgba(110,145,255,0.1)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const diskVertex = `
  varying vec3 vPos;
  void main() {
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const diskFragment = `
  uniform float uTime;
  varying vec3 vPos;
  void main() {
    float radius = length(vPos.xy);
    float t = clamp((radius - 1.4) / 1.65, 0.0, 1.0);
    float angle = atan(vPos.y, vPos.x);
    float streak = 0.72 + 0.28 * sin(angle * 38.0 + radius * 15.0 - uTime * 1.8);
    float doppler = 0.62 + 0.55 * cos(angle - 1.4);
    float bands = 0.76 + 0.24 * sin(radius * 34.0 + angle * 3.0);
    vec3 hot = vec3(0.94, 0.97, 1.0);
    vec3 mid = vec3(0.5, 0.66, 1.0);
    vec3 cool = vec3(0.1, 0.11, 0.3);
    vec3 col = mix(hot, mid, smoothstep(0.0, 0.4, t));
    col = mix(col, cool, smoothstep(0.52, 1.0, t));
    col *= streak * bands * doppler * (0.8 + 0.4 * (1.0 - t));
    gl_FragColor = vec4(col, (1.0 - t) * 0.92 + 0.1);
  }
`;

/** A real-time accretion disk and event horizon for the resolution scene. */
export function BlackHole() {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;

    let disposed = false;
    let raf = 0;
    let running = false;
    let visible = true;
    let animate = motionAllowed();
    const start = performance.now();

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setClearColor(0x010207, 1);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x010207);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 30);
    camera.position.set(0, 2.4, 7.6);
    camera.lookAt(0, 0, 0);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.3, 0.55, 0.38);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());

    // Event horizon.
    const horizon = new THREE.Mesh(
      new THREE.SphereGeometry(1.28, 64, 48),
      new THREE.MeshBasicMaterial({ color: 0x000000 }),
    );
    scene.add(horizon);

    // Photon ring.
    const photon = new THREE.Mesh(
      new THREE.TorusGeometry(1.31, 0.012, 8, 220),
      new THREE.MeshBasicMaterial({
        color: 0xcfe4ff,
        transparent: true,
        opacity: 0.82,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    scene.add(photon);

    // Accretion disk in the equatorial plane.
    const diskGroup = new THREE.Group();
    diskGroup.rotation.x = Math.PI / 2 - 0.12;
    diskGroup.rotation.z = 0.1;
    const diskMaterial = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: diskVertex,
      fragmentShader: diskFragment,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    const disk = new THREE.Mesh(new THREE.RingGeometry(1.4, 3.05, 240, 28), diskMaterial);
    diskGroup.add(disk);
    scene.add(diskGroup);

    // A faint lensed ring above the horizon.
    const lens = new THREE.Mesh(
      new THREE.TorusGeometry(1.55, 0.006, 6, 220),
      new THREE.MeshBasicMaterial({
        color: 0x9fb8ff,
        transparent: true,
        opacity: 0.32,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    lens.rotation.x = Math.PI / 2 - 0.52;
    scene.add(lens);

    // Warm halo and star field.
    const halo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTexture(),
        color: 0xffffff,
        transparent: true,
        opacity: 0.09,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    halo.scale.set(3.2, 3.2, 1);
    scene.add(halo);

    const starCount = 700;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    let seed = 19;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let i = 0; i < starCount; i += 1) {
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      const radius = 6 + rand() * 12;
      starPositions[i * 3] = Math.sin(phi) * Math.cos(theta) * radius;
      starPositions[i * 3 + 1] = Math.cos(phi) * radius;
      starPositions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius;
      const warm = rand() > 0.8;
      starColors[i * 3] = warm ? 1 : 0.62;
      starColors[i * 3 + 1] = warm ? 0.84 : 0.78;
      starColors[i * 3 + 2] = warm ? 0.62 : 0.96;
    }
    const stars = new THREE.Points(
      new THREE.BufferGeometry()
        .setAttribute("position", new THREE.BufferAttribute(starPositions, 3))
        .setAttribute("color", new THREE.BufferAttribute(starColors, 3)),
      new THREE.PointsMaterial({
        vertexColors: true,
        size: 0.02,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    scene.add(stars);

    // Disk dust.
    const dustCount = 320;
    const dustPositions = new Float32Array(dustCount * 3);
    const dustColors = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i += 1) {
      const angle = rand() * Math.PI * 2;
      const radius = 1.4 + rand() * 2.0;
      dustPositions[i * 3] = Math.cos(angle) * radius;
      dustPositions[i * 3 + 1] = Math.sin(angle) * radius;
      dustPositions[i * 3 + 2] = (rand() - 0.5) * 0.08;
      const warm = rand() > 0.72;
      dustColors[i * 3] = warm ? 1 : 0.74;
      dustColors[i * 3 + 1] = warm ? 0.86 : 0.86;
      dustColors[i * 3 + 2] = warm ? 0.66 : 1;
    }
    const dust = new THREE.Points(
      new THREE.BufferGeometry()
        .setAttribute("position", new THREE.BufferAttribute(dustPositions, 3))
        .setAttribute("color", new THREE.BufferAttribute(dustColors, 3)),
      new THREE.PointsMaterial({
        vertexColors: true,
        size: 0.016,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    dust.position.z = 0.02;
    diskGroup.add(dust);

    const resize = () => {
      const width = Math.max(1, stage.clientWidth);
      const height = Math.max(1, stage.clientHeight);
      renderer.setSize(width, height, false);
      composer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();

    const renderAt = (time: number) => {
      diskMaterial.uniforms.uTime.value = time;
      diskGroup.rotation.y = time * 0.06;
      dust.rotation.z = time * 0.03;
      photon.material.opacity = 0.72 + Math.sin(time * 1.7) * 0.12;
      stars.rotation.y = time * 0.002;
      composer.render();
    };

    const frame = (now: number) => {
      if (disposed) return;
      running = false;
      if (!animate || !visible) {
        renderAt(0);
        return;
      }
      renderAt((now - start) / 1000);
      raf = window.requestAnimationFrame(frame);
    };

    const kick = () => {
      if (disposed || running) return;
      if (!animate || !visible) {
        renderAt(0);
        return;
      }
      running = true;
      raf = window.requestAnimationFrame(frame);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? false;
        if (visible) kick();
        else {
          window.cancelAnimationFrame(raf);
          running = false;
          renderAt(0);
        }
      },
      { threshold: 0.01 },
    );
    observer.observe(stage);

    const onMotion = () => {
      animate = motionAllowed();
      if (animate) kick();
      else {
        window.cancelAnimationFrame(raf);
        running = false;
        renderAt(0);
      }
    };
    window.addEventListener(MOTION_CHANGE, onMotion);
    const onResize = () => {
      resize();
      if (!animate || !visible) renderAt(0);
    };
    window.addEventListener("resize", onResize);

    renderAt(0);
    kick();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(raf);
      window.removeEventListener(MOTION_CHANGE, onMotion);
      window.removeEventListener("resize", onResize);
      observer.disconnect();
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(material)) material.forEach((item) => item.dispose());
        else material?.dispose();
      });
      composer.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="black-hole" ref={stageRef} aria-hidden="true">
      <canvas className="black-hole__canvas" ref={canvasRef} />
    </div>
  );
}
