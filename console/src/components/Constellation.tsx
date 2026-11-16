import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { Bundle } from "../lib/types";
import { spatialLayout, type SpatialNode } from "../lib/spatial";
import { motionAllowed, MOTION_CHANGE } from "../lib/motion";
import { useStageSize } from "../lib/useStageSize";

interface Props {
  bundle: Bundle;
  activeNodes: ReadonlySet<string>;
  activeEdges: ReadonlySet<string>;
  cutEdges: ReadonlySet<string>;
  selected: string | null;
  onSelect?: (id: string) => void;
  variant?: "hero" | "survey";
  controls?: MutableRefObject<ConstellationHandle | null>;
}

export interface ConstellationHandle {
  zoomBy: (factor: number) => void;
  resetView: () => void;
}

type NodeMaterial = THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial;

interface NodeVisual {
  node: SpatialNode;
  group: THREE.Group;
  mesh: THREE.Mesh;
  material: NodeMaterial;
  glow: THREE.Sprite;
  glowMaterial: THREE.SpriteMaterial;
  ring: THREE.Mesh;
  ringMaterial: THREE.MeshBasicMaterial;
  ringDisk?: THREE.Mesh;
  ringDiskMaterial?: THREE.MeshBasicMaterial;
  trail?: THREE.Line;
  trailPositions?: THREE.BufferAttribute;
  ringTwo?: THREE.Mesh;
  ringTwoMaterial?: THREE.MeshBasicMaterial;
  moon?: THREE.Mesh;
  moonPhase: number;
  base: number;
  targetScale: number;
  orbitRadius: number;
  orbitAngle: number;
  orbitSpeed: number;
  orbitY: number;
  rest: THREE.Vector3;
  dragged: boolean;
}

interface EdgeVisual {
  source: string;
  target: string;
  curve: THREE.QuadraticBezierCurve3;
  line: THREE.Line;
  positions: THREE.BufferAttribute;
  material: THREE.LineBasicMaterial;
  dashed: THREE.Line;
  dashedPositions: THREE.BufferAttribute;
  dashedMaterial: THREE.LineDashedMaterial;
  pulse: THREE.Mesh;
}

interface Api extends ConstellationHandle {
  apply: () => void;
  kick: () => void;
  renderOnce: () => void;
  resize: (width: number, height: number) => void;
}

const RESOURCE = new Set(["lambda", "ec2", "ecs", "glue", "sagemaker", "cloudformation"]);

const C = {
  void: 0x010207,
  signal: 0xa9c2ff,
  signalDeep: 0x4f6ef2,
  gold: 0xe6b878,
  goldLit: 0xf5d8a8,
  violet: 0xa78bfa,
  rose: 0xe58aa6,
  mint: 0x7fd8c4,
  blue: 0x6f8cff,
  platinum: 0xa3b2c8,
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

function seeded(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function radialTexture(inner: string, outer: string, size = 192): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, inner);
    gradient.addColorStop(0.24, inner);
    gradient.addColorStop(0.6, outer);
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function nebulaTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.globalCompositeOperation = "lighter";
    const puffs: [number, number, number, string][] = [
      [0.46, 0.5, 0.42, "rgba(64,116,255,0.32)"],
      [0.58, 0.43, 0.3, "rgba(138,112,255,0.24)"],
      [0.36, 0.58, 0.26, "rgba(56,205,255,0.18)"],
      [0.65, 0.62, 0.2, "rgba(255,156,94,0.12)"],
    ];
    for (const [x, y, r, color] of puffs) {
      const gradient = ctx.createRadialGradient(
        size * x,
        size * y,
        0,
        size * x,
        size * y,
        size * r,
      );
      gradient.addColorStop(0, color);
      gradient.addColorStop(0.48, color.replace(/[\d.]+\)$/, "0.08)"));
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function surfaceTexture(seed: number, rocky: boolean): THREE.CanvasTexture {
  const width = 512;
  const height = 256;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const rand = seeded(seed);
    ctx.fillStyle = "#b9b9b9";
    ctx.fillRect(0, 0, width, height);
    for (let y = 0; y < height; y += 3) {
      const wave = Math.sin(y * 0.11 + seed * 0.3) * 18 + Math.sin(y * 0.037) * 12;
      const shade = 158 + wave + rand() * 26;
      ctx.fillStyle = `rgba(${shade},${shade},${shade},0.38)`;
      ctx.fillRect(0, y, width, 3);
    }
    if (rocky) {
      for (let i = 0; i < 70; i += 1) {
        const x = rand() * width;
        const y = rand() * height;
        const r = 1 + rand() * 6;
        const crater = rand() > 0.5 ? 255 : 40;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${crater},${crater},${crater},0.09)`;
        ctx.fill();
      }
    }
    for (let i = 0; i < 1800; i += 1) {
      const x = rand() * width;
      const y = rand() * height;
      const glow = 140 + rand() * 110;
      ctx.fillStyle = `rgba(${glow},${glow},${glow},${0.03 + rand() * 0.08})`;
      ctx.fillRect(x, y, 1 + rand() * 3, 1);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  return texture;
}

function ringDiskTexture(): THREE.CanvasTexture {
  const width = 8;
  const height = 256;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "rgba(255,255,255,0)");
    gradient.addColorStop(0.12, "rgba(255,255,255,0.24)");
    gradient.addColorStop(0.24, "rgba(255,255,255,0.7)");
    gradient.addColorStop(0.42, "rgba(255,255,255,0.18)");
    gradient.addColorStop(0.58, "rgba(255,255,255,0.46)");
    gradient.addColorStop(0.74, "rgba(255,255,255,0.1)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    for (let i = 0; i < 32; i += 1) {
      const y = Math.random() * height;
      ctx.fillStyle = `rgba(255,255,255,${0.02 + Math.random() * 0.06})`;
      ctx.fillRect(0, y, width, 1);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

function galaxyTexture(): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#02040b";
    ctx.fillRect(0, 0, size, size);
    ctx.globalCompositeOperation = "lighter";
    const rand = seeded(811);
    const core = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size * 0.36);
    core.addColorStop(0, "rgba(235,244,255,0.95)");
    core.addColorStop(0.16, "rgba(143,216,255,0.6)");
    core.addColorStop(0.42, "rgba(124,108,255,0.18)");
    core.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = core;
    ctx.fillRect(0, 0, size, size);
    for (let arm = 0; arm < 3; arm += 1) {
      const offset = (arm / 3) * Math.PI * 2;
      for (let i = 0; i < 2200; i += 1) {
        const t = Math.pow(rand(), 0.62) * 1.72;
        const radius = t * size * 0.38;
        const angle = offset + t * 6.2 + (rand() - 0.5) * 0.4;
        const x = size / 2 + Math.cos(angle) * radius + (rand() - 0.5) * 16;
        const y = size / 2 + Math.sin(angle) * radius * 0.54 + (rand() - 0.5) * 12;
        const warm = rand() > 0.78;
        ctx.fillStyle = warm
          ? `rgba(255,214,160,${0.08 + rand() * 0.32})`
          : `rgba(${150 + rand() * 80},${192 + rand() * 50},255,${0.08 + rand() * 0.42})`;
        ctx.beginPath();
        ctx.arc(x, y, 0.5 + rand() * 1.7, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function spaceBackdropTexture(): THREE.CanvasTexture {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#02040a";
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = "lighter";
    const rand = seeded(421);
    const band = ctx.createLinearGradient(0, height * 0.2, width, height * 0.78);
    band.addColorStop(0, "rgba(37,99,235,0.02)");
    band.addColorStop(0.34, "rgba(124,108,255,0.08)");
    band.addColorStop(0.58, "rgba(143,216,255,0.05)");
    band.addColorStop(1, "rgba(255,122,168,0.02)");
    ctx.fillStyle = band;
    ctx.fillRect(0, 0, width, height);
    for (let i = 0; i < 2600; i += 1) {
      const x = rand() * width;
      const y = rand() * height;
      const size = rand() > 0.965 ? 1.6 + rand() * 1.6 : 0.35 + rand() * 0.9;
      const warm = rand() > 0.84;
      ctx.fillStyle = warm
        ? `rgba(255,215,170,${0.25 + rand() * 0.6})`
        : `rgba(${180 + rand() * 70},${208 + rand() * 40},255,${0.2 + rand() * 0.7})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < 18; i += 1) {
      const x = rand() * width;
      const y = rand() * height;
      const glow = ctx.createRadialGradient(x, y, 0, x, y, 18 + rand() * 36);
      glow.addColorStop(0, "rgba(180,220,255,0.22)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(x - 60, y - 60, 120, 120);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function planetTint(kind: string) {
  if (kind === "user") return C.blue;
  if (kind === "role") return C.violet;
  if (kind === "group") return C.platinum;
  return C.mint;
}

/** The full permission orrery: a binary administrator sun, planets on
 *  hop-depth orbits, a real asteroid belt, and a deep field of phenomena.
 *  Orbit by dragging, pan with the second button, zoom with the controls,
 *  and lift any planet out of its orbit. */
export function Constellation({
  bundle,
  activeNodes,
  activeEdges,
  cutEdges,
  selected,
  onSelect,
  variant = "survey",
  controls,
}: Props) {
  const [stageRef, size] = useStageSize<HTMLDivElement>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labelRefs = useRef(new Map<string, HTMLSpanElement>());
  const leaderRefs = useRef(new Map<string, SVGLineElement>());
  const apiRef = useRef<Api | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [motionOn, setMotionOn] = useState(() => motionAllowed());
  const [inView, setInView] = useState(false);

  const layout = useMemo(() => spatialLayout(bundle), [bundle]);

  const stateRef = useRef({
    activeNodes,
    activeEdges,
    cutEdges,
    selected,
    hovered,
    motionOn,
    inView,
    run: motionOn && inView,
    onSelect,
  });
  stateRef.current = {
    activeNodes,
    activeEdges,
    cutEdges,
    selected,
    hovered,
    motionOn,
    inView,
    run: motionOn && inView,
    onSelect,
  };

  useEffect(() => {
    const sync = () => setMotionOn(motionAllowed());
    sync();
    window.addEventListener(MOTION_CHANGE, sync);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduced.addEventListener("change", sync);
    return () => {
      window.removeEventListener(MOTION_CHANGE, sync);
      reduced.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) setInView(entry.isIntersecting);
      },
      { threshold: 0.03 },
    );
    observer.observe(stage);
    return () => observer.disconnect();
  }, [stageRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;

    let disposed = false;
    let raf = 0;
    let running = false;
    const start = performance.now();
    let last = start;
    let lastLabelSync = 0;
    let time = 0;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
    renderer.setSize(Math.max(1, size.w), Math.max(1, size.h));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    renderer.setClearColor(C.void, 1);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(C.void);
    const field = new THREE.Group();
    scene.add(field);
    scene.fog = new THREE.FogExp2(C.void, 0.032);

    const initialAspect = Math.max(1, size.w) / Math.max(1, size.h);
    const fovFor = (aspect: number) => (aspect < 0.8 ? 52 : aspect < 1.1 ? 44 : 34);
    const camera = new THREE.PerspectiveCamera(fovFor(initialAspect), initialAspect, 0.1, 50);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    // Sprite glows carry the light; a full-resolution bloom pass is not worth
    // the frame budget on the survey.
    composer.addPass(new OutputPass());
    composer.setSize(Math.max(1, size.w), Math.max(1, size.h));

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envScene = new RoomEnvironment();
    const envTexture = pmrem.fromScene(envScene, 0.04).texture;
    scene.environment = envTexture;
    (envScene as unknown as { dispose?: () => void }).dispose?.();
    pmrem.dispose();

    const ambient = new THREE.AmbientLight(0x18223d, 0.5);
    const keyLight = new THREE.DirectionalLight(0xfff0d8, 1.5);
    keyLight.position.set(3.4, 4.2, 3.4);
    const rimLight = new THREE.DirectionalLight(0x6f8cff, 1.2);
    rimLight.position.set(-3.8, 1.4, -2.8);
    const sunLight = new THREE.PointLight(0xffc887, 0.95, 9, 2);
    sunLight.position.set(0, 0.18, 0);
    const signalLight = new THREE.PointLight(C.signal, 1.4, 5, 2);
    signalLight.position.set(0.8, 1.6, 1.2);
    scene.add(ambient, keyLight, rimLight, sunLight, signalLight);

    const glowMap = radialTexture("rgba(255,255,255,1)", "rgba(255,255,255,0.18)");
    const nebulaMap = nebulaTexture();
    const starMap = glowMap;

    const nebulaA = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: nebulaMap,
        color: 0x3f6bff,
        transparent: true,
        opacity: 0.28,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    nebulaA.scale.set(12.5, 12.5, 1);
    nebulaA.position.set(-3.2, 0.8, -7.8);
    scene.add(nebulaA);
    const nebulaB = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: nebulaMap,
        color: 0x9a6cff,
        transparent: true,
        opacity: 0.17,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    nebulaB.scale.set(8.6, 8.6, 1);
    nebulaB.position.set(3.4, -1.6, -8.4);
    scene.add(nebulaB);

    const galaxyMap = galaxyTexture();
    const backdropMap = spaceBackdropTexture();
    const backdrop = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: backdropMap,
        color: 0xffffff,
        transparent: true,
        opacity: 0.62,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    backdrop.scale.set(26, 14, 1);
    backdrop.position.set(0, 0.6, -15);
    scene.add(backdrop);
    const galaxySprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: galaxyMap,
        color: 0xdce9ff,
        transparent: true,
        opacity: 0.62,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        rotation: 0.32,
      }),
    );
    galaxySprite.scale.set(6.4, 3.9, 1);
    galaxySprite.position.set(-1.8, 2.0, -6.8);
    scene.add(galaxySprite);

    const bandSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: nebulaMap,
        color: 0x7fa8ff,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        rotation: 0.2,
      }),
    );
    bandSprite.scale.set(19, 6, 1);
    bandSprite.position.set(0, 1.2, -8.8);
    scene.add(bandSprite);

    /* ------------------------------------------------------------- the sun */
    const sunCoreGeometry = new THREE.SphereGeometry(1, 24, 18);
    const sunCoreMaterial = new THREE.MeshBasicMaterial({ color: 0xfff8e8, toneMapped: false });
    const sunHalo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowMap,
        color: C.goldLit,
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    sunHalo.scale.set(0.32, 0.32, 1);
    sunHalo.position.set(0, 0.05, 0);
    field.add(sunHalo);
    const sunCorona = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: nebulaMap,
        color: 0xe0b072,
        transparent: true,
        opacity: 0.09,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    sunCorona.scale.set(0.8, 0.8, 1);
    sunCorona.position.set(0, 0.08, -0.2);
    field.add(sunCorona);

    /* -------------------------------------------------------------- nodes */
    const nodeGeometry = new THREE.SphereGeometry(1, 36, 26);
    const resourceGeometry = new THREE.SphereGeometry(1, 40, 28);
    const adminGeometry = new THREE.SphereGeometry(1, 48, 32);
    const ringGeometry = new THREE.TorusGeometry(1.95, 0.028, 4, 84);
    const glowMaterialBase: THREE.SpriteMaterialParameters = {
      map: glowMap,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    };
    const planetSurface = surfaceTexture(73, false);
    const rockSurface = surfaceTexture(191, true);
    const ringDiskMap = ringDiskTexture();

    const loader = new THREE.TextureLoader();
    const loadMap = (url: string) => {
      const texture = loader.load(url);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return texture;
    };
    const tex = (name: string) => `${import.meta.env.BASE_URL}textures/${name}`;
    const planetMaps = {
      mars: loadMap(tex("1k_mars.jpg")),
      venus: loadMap(tex("1k_venus_surface.jpg")),
      mercury: loadMap(tex("1k_mercury.jpg")),
      jupiter: loadMap(tex("1k_jupiter.jpg")),
      saturn: loadMap(tex("1k_saturn.jpg")),
      neptune: loadMap(tex("1k_neptune.jpg")),
      sun: loadMap(tex("1k_sun.jpg")),
    };
    const moonGeometry = new THREE.SphereGeometry(1, 16, 12);
    const moonMaterial = new THREE.MeshStandardMaterial({
      color: 0xd7dbe2,
      roughness: 0.92,
      metalness: 0.04,
    });

    const nodes = new Map<string, NodeVisual>();
    let adminIndex = 0;
    let hash = 17;

    for (const node of layout.nodes) {
      const resource = RESOURCE.has(node.kind);
      const base = node.admin ? 0.19 : resource ? 0.1 : node.kind === "group" ? 0.07 : 0.06;
      const geometry = node.admin ? adminGeometry : resource ? resourceGeometry : nodeGeometry;
      const tint = planetTint(node.kind);
      const map = node.admin
        ? planetMaps.sun
        : resource
          ? planetMaps.jupiter
          : node.kind === "role"
            ? planetMaps.venus
            : node.kind === "group"
              ? planetMaps.mercury
              : planetMaps.mars;
      const material: NodeMaterial = node.admin
        ? new THREE.MeshStandardMaterial({
            map,
            color: 0xffedd0,
            emissive: 0xff9f4d,
            emissiveMap: map,
            emissiveIntensity: 1.05,
            roughness: 0.48,
            metalness: 0.04,
          })
        : new THREE.MeshStandardMaterial({
            map,
            bumpMap: resource ? rockSurface : planetSurface,
            bumpScale: resource ? 0.035 : 0.02,
            color: 0xffffff,
            metalness: 0.12,
            roughness: resource ? 0.58 : 0.48,
            emissive: tint,
            emissiveIntensity: 0.06,
            envMapIntensity: 0.8,
          });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.scale.setScalar(base);
      mesh.userData.id = node.id;


      const glowMaterial = new THREE.SpriteMaterial({
        ...glowMaterialBase,
        color: node.admin ? C.goldLit : tint,
        opacity: node.admin ? 0.42 : 0.18,
      });
      const glow = new THREE.Sprite(glowMaterial);
      glow.scale.setScalar(node.admin ? 0.34 : base * 3.2);

      const ringMaterial = new THREE.MeshBasicMaterial({
        color: node.admin ? C.gold : tint,
        transparent: true,
        opacity: node.admin ? 0.5 : resource ? 0.38 : 0.22,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.scale.setScalar(base);
      ring.rotation.x = Math.PI / 2 + ((hash % 5) - 2) * 0.06;
      ring.rotation.z = ((hash % 11) - 5) * 0.08;
      hash = (hash * 31 + 7) % 997;

      let ringDisk: THREE.Mesh | undefined;
      let ringDiskMaterial: THREE.MeshBasicMaterial | undefined;
      ringDiskMaterial = new THREE.MeshBasicMaterial({
        map: ringDiskMap,
        color: node.admin ? C.gold : tint,
        transparent: true,
        opacity: node.admin ? 0.38 : resource ? 0.3 : 0.22,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      });
      ringDisk = new THREE.Mesh(new THREE.RingGeometry(1.45, 2.65, 96), ringDiskMaterial);
      ringDisk.scale.setScalar(base);
      ringDisk.rotation.x = Math.PI / 2 + ((hash % 5) - 2) * 0.05;
      ringDisk.rotation.z = ((hash % 11) - 5) * 0.07;

      const atmosphere = new THREE.Mesh(
        new THREE.SphereGeometry(1.045, 36, 26),
        new THREE.ShaderMaterial({
          uniforms: { uColor: { value: new THREE.Color(node.admin ? C.goldLit : tint) } },
          vertexShader: `
            varying vec3 vNormal;
            varying vec3 vView;
            void main() {
              vec4 mv = modelViewMatrix * vec4(position, 1.0);
              vNormal = normalize(normalMatrix * normal);
              vView = normalize(-mv.xyz);
              gl_Position = projectionMatrix * mv;
            }
          `,
          fragmentShader: `
            uniform vec3 uColor;
            varying vec3 vNormal;
            varying vec3 vView;
            void main() {
              float rim = pow(1.0 - max(dot(normalize(vNormal), normalize(vView)), 0.0), 3.0);
              gl_FragColor = vec4(uColor, rim * 0.46);
            }
          `,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          toneMapped: false,
        }),
      );
      atmosphere.scale.setScalar(base);

      const group = new THREE.Group();
      group.position.set(node.x, node.y, node.z);
      group.add(mesh, ring, ringDisk, glow, atmosphere);
      hash = (hash * 23 + 11) % 991;

      let trail: THREE.Line | undefined;
      let trailPositions: THREE.BufferAttribute | undefined;
      if (!node.admin) {
        const trailArray = new Float32Array(9 * 3);
        const trailGeometry = new THREE.BufferGeometry();
        trailPositions = new THREE.BufferAttribute(trailArray, 3);
        trailGeometry.setAttribute("position", trailPositions);
        trail = new THREE.Line(
          trailGeometry,
          new THREE.LineBasicMaterial({
            color: tint,
            transparent: true,
            opacity: 0.14,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            toneMapped: false,
          }),
        );
        trail.frustumCulled = false;
        field.add(trail);
      }

      let ringTwo: THREE.Mesh | undefined;
      let ringTwoMaterial: THREE.MeshBasicMaterial | undefined;
      if (resource || node.admin) {
        ringTwoMaterial = new THREE.MeshBasicMaterial({
          color: node.admin ? 0xffdd9a : C.signal,
          transparent: true,
          opacity: node.admin ? 0.22 : 0.2,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          toneMapped: false,
        });
        ringTwo = new THREE.Mesh(ringGeometry, ringTwoMaterial);
        ringTwo.scale.setScalar(base * 1.28);
        ringTwo.rotation.x = Math.PI / 2 - 0.16;
        ringTwo.rotation.z = 0.24;
        group.add(ringTwo);
      }

      let moon: THREE.Mesh | undefined;
      if ((resource || node.kind === "group") && !node.admin) {
        moon = new THREE.Mesh(moonGeometry, moonMaterial);
        moon.scale.setScalar(base * 0.23);
        moon.position.set(base * 2.3, 0, 0);
        group.add(moon);
      }

      if (node.admin) {
        const core = new THREE.Mesh(sunCoreGeometry, sunCoreMaterial);
        core.scale.setScalar(base * 0.52);
        group.add(core);
      }

      field.add(group);

      const radius = Math.hypot(node.x, node.z);
      const angle = Math.atan2(node.z, node.x);
      const depth = node.depth;
      const speed = node.admin ? 0.06 : 0.018 + 0.052 / (depth + 1);

      const visual: NodeVisual = {
        node,
        group,
        mesh,
        material,
        glow,
        glowMaterial,
        ring,
        ringMaterial,
        ringDisk,
        ringDiskMaterial,
        trail,
        trailPositions,
        ringTwo,
        ringTwoMaterial,
        moon,
        moonPhase: (hash % 29) / 29,
        base,
        targetScale: 1,
        orbitRadius: node.admin ? 0.1 : radius,
        orbitAngle: node.admin ? (adminIndex / 2) * Math.PI : angle,
        orbitSpeed: speed,
        orbitY: node.y,
        rest: new THREE.Vector3(node.x, node.y, node.z),
        dragged: false,
      };
      nodes.set(node.id, visual);
      if (node.admin) adminIndex += 1;
    }

    /* ------------------------------------------------------------- orbits */
    const ringItems: { mesh: THREE.Mesh; material: THREE.MeshBasicMaterial }[] = [];
    const depthColors = [C.blue, C.signal, C.violet, C.gold, C.mint, C.rose];
    for (const ring of layout.rings) {
      const color = depthColors[(ring.depth - 1) % depthColors.length];
      const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.17,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      });
      const mesh = new THREE.Mesh(
        new THREE.TorusGeometry(ring.radius, 0.0016, 5, 220),
        material,
      );
      mesh.rotation.x = Math.PI / 2;
      mesh.position.y = ring.y;
      field.add(mesh);
      ringItems.push({ mesh, material });
    }

    // Dashed shells: the deeper instrument read.
    const shells: { group: THREE.Group; material: THREE.LineDashedMaterial }[] = [];
    const shellColors = [0x5b8dff, 0x6fd9ff, 0x9a8cff, 0xe7c98b, 0x71f0c8];
    for (let i = 0; i < 9; i += 1) {
      const radius = 0.82 + i * 0.24;
      const group = new THREE.Group();
      group.rotation.x = 0.14 + i * 0.09;
      group.rotation.z = i * 0.47;
      group.position.y = (i - 4) * 0.032;
      const points: THREE.Vector3[] = [];
      for (let step = 0; step <= 200; step += 1) {
        const a = (step / 200) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
      }
      const material = new THREE.LineDashedMaterial({
        color: shellColors[i % shellColors.length],
        dashSize: 0.03,
        gapSize: 0.044,
        transparent: true,
        opacity: 0.15 - i * 0.008,
        depthWrite: false,
        toneMapped: false,
      });
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material);
      line.computeLineDistances();
      group.add(line);
      field.add(group);
      shells.push({ group, material });
    }

    // Faint radial spokes for the mechanical-orrery read.
    const spokePositions: number[] = [];
    for (let i = 0; i < 18; i += 1) {
      const angle = (i / 18) * Math.PI * 2;
      spokePositions.push(
        Math.cos(angle) * 0.34,
        0.01,
        Math.sin(angle) * 0.34,
        Math.cos(angle) * 2.42,
        0.01,
        Math.sin(angle) * 2.42,
      );
    }
    const spokes = new THREE.LineSegments(
      new THREE.BufferGeometry().setAttribute(
        "position",
        new THREE.Float32BufferAttribute(spokePositions, 3),
      ),
      new THREE.LineBasicMaterial({
        color: 0x8fa6d8,
        transparent: true,
        opacity: 0.045,
        depthWrite: false,
      }),
    );
    field.add(spokes);

    /* --------------------------------------------------------------- edges */
    const edges = new Map<string, EdgeVisual>();
    const edgesByNode = new Map<string, string[]>();
    const connect = (nodeId: string, edgeId: string) => {
      const list = edgesByNode.get(nodeId);
      if (list) list.push(edgeId);
      else edgesByNode.set(nodeId, [edgeId]);
    };

    for (const edge of bundle.edges) {
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
      );
      const positions = new Float32Array(33 * 3);
      const geometry = new THREE.BufferGeometry();
      const attr = new THREE.BufferAttribute(positions, 3);
      geometry.setAttribute("position", attr);
      const material = new THREE.LineBasicMaterial({
        color: 0x2b416d,
        transparent: true,
        opacity: 0.38,
        depthWrite: false,
        toneMapped: false,
      });
      const line = new THREE.Line(geometry, material);
      line.frustumCulled = false;
      line.renderOrder = 1;
      field.add(line);

      const dashedPositions = new Float32Array(49 * 3);
      const dashedGeometry = new THREE.BufferGeometry();
      const dashedAttr = new THREE.BufferAttribute(dashedPositions, 3);
      dashedGeometry.setAttribute("position", dashedAttr);
      const dashedMaterial = new THREE.LineDashedMaterial({
        color: C.rose,
        dashSize: 0.034,
        gapSize: 0.028,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        toneMapped: false,
      });
      const dashed = new THREE.Line(dashedGeometry, dashedMaterial);
      dashed.frustumCulled = false;
      dashed.visible = false;
      dashed.renderOrder = 2;
      field.add(dashed);

      const pulse = new THREE.Mesh(
        new THREE.SphereGeometry(0.015, 12, 8),
        new THREE.MeshBasicMaterial({
          color: C.signal,
          transparent: true,
          opacity: 0.95,
          toneMapped: false,
        }),
      );
      pulse.visible = false;
      field.add(pulse);

      edges.set(edge.id, {
        source: edge.source,
        target: edge.target,
        curve,
        line,
        positions: attr,
        material,
        dashed,
        dashedPositions: dashedAttr,
        dashedMaterial,
        pulse,
      });
      connect(edge.source, edge.id);
      connect(edge.target, edge.id);
    }

    const updateEdge = (visual: EdgeVisual) => {
      const a = nodes.get(visual.source)?.group.position;
      const b = nodes.get(visual.target)?.group.position;
      if (!a || !b) return;
      const mid = a.clone().add(b).multiplyScalar(0.5);
      const distance = a.distanceTo(b);
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const length = Math.max(0.0001, Math.hypot(dx, dz));
      mid.x += (-dz / length) * 0.2;
      mid.z += (dx / length) * 0.2;
      mid.y += 0.055 + distance * 0.05;
      visual.curve.v0.copy(a);
      visual.curve.v1.copy(mid);
      visual.curve.v2.copy(b);
      for (let i = 0; i <= 32; i += 1) {
        const point = visual.curve.getPoint(i / 32);
        visual.positions.setXYZ(i, point.x, point.y, point.z);
      }
      visual.positions.needsUpdate = true;
      if (visual.dashed.visible) {
        for (let i = 0; i <= 48; i += 1) {
          const point = visual.curve.getPoint(i / 48);
          visual.dashedPositions.setXYZ(i, point.x, point.y, point.z);
        }
        visual.dashedPositions.needsUpdate = true;
        visual.dashed.computeLineDistances();
      }
    };

    const updateAllEdges = () => {
      for (const visual of edges.values()) updateEdge(visual);
    };

    /* ------------------------------------------------------------ particles */
    const dust = (() => {
      const count = 1500;
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const rand = seeded(29);
      const palette = [
        new THREE.Color(0xdce8ff),
        new THREE.Color(0x8faee8),
        new THREE.Color(0xffdfae),
      ];
      for (let i = 0; i < count; i += 1) {
        const theta = rand() * Math.PI * 2;
        const phi = Math.acos(2 * rand() - 1);
        const radius = 3.4 + rand() * 8.4;
        positions[i * 3] = Math.sin(phi) * Math.cos(theta) * radius;
        positions[i * 3 + 1] = Math.cos(phi) * radius * 0.8;
        positions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius;
        const color = palette[Math.floor(rand() * palette.length)];
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      const material = new THREE.PointsMaterial({
        map: starMap,
        vertexColors: true,
        size: 0.045,
        transparent: true,
        opacity: 0.56,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      });
      const points = new THREE.Points(geometry, material);
      scene.add(points);
      return { points, geometry, material };
    })();

    const galaxy = (() => {
      const count = 2200;
      const positions = new Float32Array(count * 3);
      const rand = seeded(131);
      for (let i = 0; i < count; i += 1) {
        const radius = 0.4 + rand() * 5.2;
        const angle = radius * 2.1 + (rand() - 0.5) * 0.5;
        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = Math.sin(angle) * radius * 0.58;
        positions[i * 3 + 2] = (rand() - 0.5) * 0.42;
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const material = new THREE.PointsMaterial({
        map: starMap,
        color: 0x8faee8,
        size: 0.05,
        transparent: true,
        opacity: 0.42,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      });
      const points = new THREE.Points(geometry, material);
      points.position.set(-1.8, 2.0, -6.8);
      points.rotation.z = 0.34;
      scene.add(points);
      const core = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: nebulaMap,
          color: 0xdfe8ff,
          transparent: true,
          opacity: 0.4,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          toneMapped: false,
        }),
      );
      core.scale.set(1.5, 1.5, 1);
      core.position.copy(points.position);
      scene.add(core);
      return { points, geometry, material, core };
    })();

    const cluster = (() => {
      const count = 140;
      const positions = new Float32Array(count * 3);
      const rand = seeded(701);
      for (let i = 0; i < count; i += 1) {
        const theta = rand() * Math.PI * 2;
        const phi = Math.acos(2 * rand() - 1);
        const radius = Math.pow(rand(), 0.6) * 0.34;
        positions[i * 3] = Math.sin(phi) * Math.cos(theta) * radius;
        positions[i * 3 + 1] = Math.cos(phi) * radius;
        positions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius;
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const material = new THREE.PointsMaterial({
        map: starMap,
        color: 0xffe0b8,
        size: 0.06,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      });
      const points = new THREE.Points(geometry, material);
      points.position.set(-2.8, 1.9, -6.8);
      scene.add(points);
      return { points, material };
    })();

    const belt = (() => {
      const count = 700;
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const spread = seeded(211);
      const warm = new THREE.Color(0xe7c98b);
      const cool = new THREE.Color(0x7f96be);
      for (let i = 0; i < count; i += 1) {
        const angle = spread() * Math.PI * 2;
        const radius = 2.03 + spread() * 0.19;
        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = (spread() - 0.5) * 0.14;
        positions[i * 3 + 2] = Math.sin(angle) * radius;
        const color = spread() > 0.72 ? warm : cool;
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      const material = new THREE.PointsMaterial({
        vertexColors: true,
        size: 0.019,
        transparent: true,
        opacity: 0.56,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      });
      const points = new THREE.Points(geometry, material);
      field.add(points);
      return { points, material };
    })();

    const kuiper = (() => {
      const count = 500;
      const positions = new Float32Array(count * 3);
      const spread = seeded(919);
      for (let i = 0; i < count; i += 1) {
        const angle = spread() * Math.PI * 2;
        const radius = 2.72 + spread() * 0.42;
        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = (spread() - 0.5) * 0.3;
        positions[i * 3 + 2] = Math.sin(angle) * radius;
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const material = new THREE.PointsMaterial({
        color: 0x9a8cff,
        size: 0.016,
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      });
      const points = new THREE.Points(geometry, material);
      field.add(points);
      return { points, material };
    })();

    /* --------------------------------------------------- deep-field objects */
    const gasGiant = new THREE.Group();
    gasGiant.position.set(-4, -1.75, -7);
    gasGiant.scale.setScalar(0.6);
    const gasBody = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 48, 32),
      new THREE.MeshStandardMaterial({
        color: 0xb98b64,
        map: planetMaps.saturn,
        bumpMap: planetSurface,
        bumpScale: 0.02,
        roughness: 0.66,
        metalness: 0.08,
        emissive: 0x2a1608,
        emissiveIntensity: 0.18,
      }),
    );
    gasGiant.add(gasBody);
    // Saturn's rings need a real annulus; a thin torus reads as a stray orbit line.
    const ringCanvas = document.createElement("canvas");
    ringCanvas.width = 256;
    ringCanvas.height = 256;
    const ringCtx = ringCanvas.getContext("2d");
    if (ringCtx) {
      for (let r = 67; r <= 126; r += 1) {
        const band = (r - 67) / 59;
        let alpha = 0.16 + 0.3 * Math.abs(Math.sin(band * 17 + 0.7)) * (1 - 0.35 * band);
        if (band > 0.52 && band < 0.62) alpha *= 0.2;
        if (band < 0.05 || band > 0.94) alpha *= 0.25;
        ringCtx.strokeStyle = `rgba(234, 206, 166, ${alpha.toFixed(3)})`;
        ringCtx.beginPath();
        ringCtx.arc(128, 128, r, 0, Math.PI * 2);
        ringCtx.stroke();
      }
    }
    const gasRingMap = new THREE.CanvasTexture(ringCanvas);
    gasRingMap.colorSpace = THREE.SRGBColorSpace;
    gasRingMap.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const gasRing = new THREE.Mesh(
      new THREE.RingGeometry(0.62, 1.17, 160, 1),
      new THREE.MeshBasicMaterial({
        map: gasRingMap,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    gasRing.rotation.x = Math.PI / 2 + 0.56;
    gasRing.rotation.z = -0.18;
    gasGiant.add(gasRing);
    const gasMoon = new THREE.Mesh(moonGeometry, moonMaterial);
    gasMoon.scale.setScalar(0.075);
    gasMoon.position.set(1.2, 0.2, 0.2);
    gasGiant.add(gasMoon);
    const gasGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowMap,
        color: 0xffc68a,
        transparent: true,
        opacity: 0.1,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    gasGlow.scale.set(1.2, 1.2, 1);
    gasGiant.add(gasGlow);
    scene.add(gasGiant);

    // A neutron star: a hot core, two soft lighthouse beams along a tilted
    // magnetic axis, and the equatorial field rings that spin with it.
    const pulsar = new THREE.Group();
    pulsar.position.set(-5.5, -0.5, -4.0);
    pulsar.scale.setScalar(0.5);
    const pulsarCore = new THREE.Mesh(
      new THREE.SphereGeometry(0.075, 24, 16),
      new THREE.MeshBasicMaterial({ color: 0xeaf8ff, toneMapped: false }),
    );
    pulsar.add(pulsarCore);

    const BEAM_LENGTH = 1.25;
    const makeBeamMaterial = (opacity: number) => {
      const material = new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color(0xbcdcff) },
          uOpacity: { value: opacity },
        },
        vertexShader: `
          varying float vT;
          varying vec3 vNormal;
          varying vec3 vView;
          void main() {
            vT = clamp(position.y / ${BEAM_LENGTH.toFixed(2)}, 0.0, 1.0);
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vNormal = normalize(normalMatrix * normal);
            vView = normalize(-mv.xyz);
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          uniform float uOpacity;
          varying float vT;
          varying vec3 vNormal;
          varying vec3 vView;
          void main() {
            float edge = abs(dot(normalize(vNormal), normalize(vView)));
            float core = pow(vT, 2.0);
            float soft = smoothstep(0.0, 0.72, edge);
            gl_FragColor = vec4(uColor, uOpacity * core * soft);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      });
      material.userData.baseOpacity = opacity;
      return material;
    };

    const makeBeamGeometry = (radius: number) => {
      const geometry = new THREE.CylinderGeometry(
        radius * 0.14,
        radius,
        BEAM_LENGTH,
        24,
        10,
        true,
      );
      // The narrow end sits at the core; the wide end fades into the field.
      geometry.translate(0, BEAM_LENGTH / 2, 0);
      return geometry;
    };

    const beams = new THREE.Group();
    beams.rotation.z = 1.02;
    const beamMaterials: THREE.ShaderMaterial[] = [];
    for (const [radius, opacity] of [
      [0.17, 0.42],
      [0.36, 0.11],
    ] as const) {
      const material = makeBeamMaterial(opacity);
      beamMaterials.push(material);
      const outward = new THREE.Mesh(makeBeamGeometry(radius), material);
      const inward = new THREE.Mesh(makeBeamGeometry(radius), material);
      inward.rotation.z = Math.PI;
      beams.add(outward, inward);
    }
    pulsar.add(beams);

    const fieldRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.34, 0.014, 8, 96),
      new THREE.MeshBasicMaterial({
        color: 0x9db9ff,
        transparent: true,
        opacity: 0.62,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    fieldRing.rotation.x = Math.PI / 2 + 0.22;
    const fieldRingOuter = new THREE.Mesh(
      new THREE.TorusGeometry(0.5, 0.009, 8, 96),
      new THREE.MeshBasicMaterial({
        color: 0x8aa4d8,
        transparent: true,
        opacity: 0.36,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    fieldRingOuter.rotation.x = Math.PI / 2 - 0.26;
    pulsar.add(fieldRing, fieldRingOuter);

    const pulsarGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowMap,
        color: 0xcfe6ff,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    pulsarGlow.scale.set(0.55, 0.55, 1);
    pulsar.add(pulsarGlow);
    scene.add(pulsar);

    const comet = new THREE.Group();
    const cometHead = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowMap,
        color: 0xd8f6ff,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    cometHead.scale.set(0.07, 0.07, 1);
    const cometTailPositions = new Float32Array(14 * 3);
    const cometTailGeometry = new THREE.BufferGeometry();
    cometTailGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(cometTailPositions, 3),
    );
    const cometTail = new THREE.Points(
      cometTailGeometry,
      new THREE.PointsMaterial({
        map: glowMap,
        color: 0x9fe8ff,
        size: 0.038,
        transparent: true,
        opacity: 0.42,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    cometTail.frustumCulled = false;
    comet.add(cometHead, cometTail);
    scene.add(comet);

    /* -------------------------------------------------------------- labels */
    const projected = new THREE.Vector3();
    const labelPositions = new Map<string, { x: number; y: number }>();
    const labelSides = new Map<string, "left" | "right">();

    const updateLabels = () => {
      if (!labelRefs.current.size) return;
      const width = Math.max(1, stage.clientWidth);
      const height = Math.max(1, stage.clientHeight);
      const narrow = width < 760;
      const safeWidth = width > 1180 && variant === "survey" ? width - 430 : width;
      const state = stateRef.current;

      const entries = layout.nodes
        .map((node) => {
          const visual = nodes.get(node.id);
          const el = labelRefs.current.get(node.id);
          if (!visual || !el) return null;
          const world = visual.group.getWorldPosition(projected);
          const vector = world.clone().project(camera);
          const x = (vector.x * 0.5 + 0.5) * width;
          const y = (-vector.y * 0.5 + 0.5) * height;
          const isSelected = state.selected === node.id;
          const weight = isSelected ? 0 : node.admin ? 1 : el.dataset.active === "true" ? 2 : 3;
          return {
            node,
            el,
            x,
            y,
            weight,
            behind: vector.z > 1,
            selected: isSelected,
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
        .sort((a, b) => a.weight - b.weight || a.node.id.localeCompare(b.node.id));

      const hideLeader = (id: string) => {
        const line = leaderRefs.current.get(id);
        if (line) line.style.display = "none";
      };

      const placed: { x: number; y: number; w: number; h: number }[] = [];

      for (const entry of entries) {
        const visible =
          entry.el.dataset.visible === "true" &&
          !entry.behind &&
          entry.x > -40 &&
          entry.x < width + 40 &&
          entry.y > -40 &&
          entry.y < height + 40 &&
          (!narrow || entry.selected || entry.node.admin);

        if (!visible) {
          entry.el.style.visibility = "hidden";
          hideLeader(entry.node.id);
          continue;
        }

        const labelW = Math.min(218, Math.max(82, entry.node.label.length * 8.1 + 22));
        const labelH = 26;
        const desiredLeft = entry.x < safeWidth * 0.5;
        let side = labelSides.get(entry.node.id) ?? (desiredLeft ? "left" : "right");
        const canRight = entry.x + 13 + labelW <= safeWidth - 8;
        const canLeft = entry.x - 13 - labelW >= 8;
        if (side === "right" && !canRight) side = "left";
        if (side === "left" && !canLeft) side = "right";
        labelSides.set(entry.node.id, side);
        const preferLeft = side === "left";
        const primaryX = preferLeft ? entry.x - 13 - labelW : entry.x + 13;
        const alternateX = preferLeft ? entry.x + 13 : entry.x - 13 - labelW;
        const offsets = [0, -28, 28, -56, 56, -84, 84, -112, 112, -140, 140];
        const previous = labelPositions.get(entry.node.id);
        let boxX = clamp(primaryX, 8, Math.max(8, safeWidth - labelW - 8));
        let boxY = clamp(entry.y - 15, 8, height - labelH - 8);
        let bestScore = Number.POSITIVE_INFINITY;

        for (const [index, anchorX] of [primaryX, alternateX].entries()) {
          for (const offset of offsets) {
            const candidateX = clamp(anchorX, 8, Math.max(8, safeWidth - labelW - 8));
            const candidateY = clamp(entry.y - 15 + offset, 8, height - labelH - 8);
            const collides = placed.some(
              (rect) =>
                candidateX < rect.x + rect.w + 7 &&
                candidateX + labelW + 7 > rect.x &&
                candidateY < rect.y + rect.h + 7 &&
                candidateY + labelH + 7 > rect.y,
            );
            if (collides) continue;
            const drift = previous
              ? Math.hypot(candidateX - previous.x, candidateY - previous.y) * 0.05
              : 0;
            const score = Math.abs(offset) + index * 60 + drift;
            if (score < bestScore) {
              bestScore = score;
              boxX = candidateX;
              boxY = candidateY;
            }
          }
        }

        placed.push({ x: boxX, y: boxY, w: labelW, h: labelH });
        const ease = previous && stateRef.current.run ? 0.24 : 1;
        const drawX = previous ? previous.x + (boxX - previous.x) * ease : boxX;
        const drawY = previous ? previous.y + (boxY - previous.y) * ease : boxY;
        labelPositions.set(entry.node.id, { x: drawX, y: drawY });
        entry.el.style.transform = `translate3d(${drawX.toFixed(1)}px, ${drawY.toFixed(1)}px, 0)`;
        entry.el.style.visibility = "visible";
        entry.el.dataset.side = preferLeft ? "left" : "right";

        const line = leaderRefs.current.get(entry.node.id);
        if (line) {
          const lineX = preferLeft ? drawX + labelW : drawX;
          const lineY = drawY + labelH / 2;
          const distance = Math.hypot(entry.x - lineX, entry.y - lineY);
          if (distance > 16) {
            line.setAttribute("x1", entry.x.toFixed(1));
            line.setAttribute("y1", entry.y.toFixed(1));
            line.setAttribute("x2", lineX.toFixed(1));
            line.setAttribute("y2", lineY.toFixed(1));
            line.style.display = "";
          } else {
            line.style.display = "none";
          }
        }
      }
    };

    /* ------------------------------------------------------------- camera */
    const targetRadius = 5.65;
    const startRadius = 7.3;
    const baseAngle = 0.3;
    const guideX = -0.7;
    const baseY = 3.0;
    let userAngle = 0;
    let userTilt = 0;
    let panX = 0;
    let panY = 0;
    let zoom = 1;
    let zoomTarget = 1;
    let velocity = 0;
    let dragging = false;
    let panning = false;
    let dragNode: NodeVisual | null = null;
    let dragMoved = false;
    let lastX = 0;
    let lastY = 0;
    let downX = 0;
    let downY = 0;
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const dragPlane = new THREE.Plane();
    const ray = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const dragPoint = new THREE.Vector3();

    const orbitAt = (visual: NodeVisual, t: number) => {
      if (visual.dragged) return;
      if (visual.node.admin) {
        const angle = visual.orbitAngle + t * visual.orbitSpeed;
        visual.group.position.set(
          Math.cos(angle) * visual.orbitRadius,
          0.03 + Math.sin(t * 0.12) * 0.008,
          Math.sin(angle) * visual.orbitRadius,
        );
        return;
      }
      const angle = visual.orbitAngle + t * visual.orbitSpeed;
      visual.group.position.set(
        Math.cos(angle) * visual.orbitRadius,
        visual.orbitY + Math.sin(angle * 2 + visual.moonPhase * 6.28) * 0.008,
        Math.sin(angle) * visual.orbitRadius,
      );
    };

    const updateBodies = (t: number) => {
      let index = 0;
      for (const visual of nodes.values()) {
        orbitAt(visual, t);
        const spin = 0.11 + (index % 7) * 0.016;
        visual.mesh.rotation.y = t * spin;
        visual.mesh.rotation.x = Math.sin(t * 0.12 + index) * 0.14;
        if (visual.ringTwo) visual.ringTwo.rotation.z = t * 0.06 + 0.24;
        if (visual.moon) {
          const a = t * 0.55 + visual.moonPhase * Math.PI * 2;
          const radius = visual.base * 2.3;
          visual.moon.position.set(
            Math.cos(a) * radius,
            Math.sin(a * 0.7) * radius * 0.18,
            Math.sin(a) * radius,
          );
        }
        if (visual.trail && visual.trailPositions) {
          if (visual.node.admin || visual.dragged) {
            visual.trail.visible = false;
          } else {
            visual.trail.visible = true;
            const angle = visual.orbitAngle + t * visual.orbitSpeed;
            for (let i = 0; i < 9; i += 1) {
              const a = angle - i * 0.024;
              visual.trailPositions.setXYZ(
                i,
                Math.cos(a) * visual.orbitRadius,
                visual.orbitY + Math.sin(a * 2 + visual.moonPhase * 6.28) * 0.008,
                Math.sin(a) * visual.orbitRadius,
              );
            }
            visual.trailPositions.needsUpdate = true;
          }
        }
        const current = visual.group.scale.x;
        visual.group.scale.setScalar(
          stateRef.current.run
            ? current + (visual.targetScale - current) * 0.16
            : visual.targetScale,
        );
        index += 1;
      }
      for (const shell of shells) {
        shell.group.rotation.y = t * 0.018;
      }
      gasBody.rotation.y = t * 0.035;
      gasMoon.position.set(
        Math.cos(t * 0.3) * 1.2,
        0.2 + Math.sin(t * 0.4) * 0.12,
        Math.sin(t * 0.3) * 1.2,
      );
      pulsar.rotation.y = t * 0.34;
      const dim = stateRef.current.cutEdges.size > 0 ? 0.32 : 1;
      const pulse = 0.5 + 0.5 * Math.pow(0.5 + 0.5 * Math.sin(t * 1.6), 3);
      for (const material of beamMaterials) {
        material.uniforms.uOpacity.value =
          (material.userData.baseOpacity as number) * (0.55 + 0.85 * pulse) * dim;
      }
      pulsarGlow.material.opacity = (0.3 + 0.22 * pulse) * dim;
      fieldRing.material.opacity = (0.22 + 0.16 * pulse) * dim;
      fieldRingOuter.material.opacity = (0.12 + 0.1 * pulse) * dim;

      const cometAngle = t * 0.045 + 1.3;
      const cometRadius = 3.5;
      const cx = Math.cos(cometAngle) * cometRadius;
      const cz = Math.sin(cometAngle) * cometRadius;
      const cy = 0.38 + Math.sin(cometAngle * 1.4) * 0.36;
      comet.position.set(cx, cy, cz);
      cometTailPositions[0] = 0;
      cometTailPositions[1] = 0;
      cometTailPositions[2] = 0;
      for (let i = 0; i < 14; i += 1) {
        const f = i / 13;
        cometTailPositions[i * 3] = 0.12 + -Math.cos(cometAngle) * 2.1 * f;
        cometTailPositions[i * 3 + 1] = -0.04 * f;
        cometTailPositions[i * 3 + 2] = -Math.sin(cometAngle) * 2.1 * f;
      }
      cometTailGeometry.attributes.position.needsUpdate = true;

      for (const visual of edges.values()) {
        if (visual.pulse.visible) {
          const pulse = (t * 0.14) % 1;
          visual.pulse.position.copy(visual.curve.getPoint(pulse));
        }
      }
    };

    const applyCamera = (t: number, intro: boolean) => {
      const introEase = intro ? 1 - Math.pow(1 - Math.min(1, (t * 1000) / 1600), 3) : 1;
      const radius = (startRadius + (targetRadius - startRadius) * introEase) * zoom;
      const angle =
        baseAngle + Math.sin(t * 0.045) * 0.07 + pointer.x * 0.12 + userAngle;
      camera.position.set(
        Math.sin(angle) * radius + panX,
        (baseY + Math.sin(t * 0.08) * 0.035 + pointer.y * 0.08 + userTilt) * zoom + panY,
        Math.cos(angle) * radius,
      );
      camera.lookAt(guideX + panX, panY, 0);
      camera.updateMatrixWorld();
    };

    const renderScene = (intro = false) => {
      updateBodies(time);
      applyCamera(time, intro);
      updateAllEdges();
      updateLabels();
      composer.render();
    };

    const frame = (now: number) => {
      if (disposed) return;
      running = false;
      const state = stateRef.current;
      if (!state.run) {
        renderScene(false);
        return;
      }
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      time = (now - start) / 1000;
      if (!dragging && !dragNode && !panning) {
        userAngle += velocity * dt;
        velocity *= Math.pow(0.12, dt);
      }
      pointer.x += (pointer.tx - pointer.x) * 0.06;
      pointer.y += (pointer.ty - pointer.y) * 0.06;
      zoom += (zoomTarget - zoom) * Math.min(1, dt * 9);
      updateBodies(time);
      applyCamera(time, true);
      updateAllEdges();
      if (now - lastLabelSync > 100) {
        updateLabels();
        lastLabelSync = now;
      }
      composer.render();
      raf = window.requestAnimationFrame(frame);
    };

    const kick = () => {
      if (disposed || running) return;
      if (!stateRef.current.run) {
        renderScene(false);
        return;
      }
      running = true;
      last = performance.now();
      raf = window.requestAnimationFrame(frame);
    };

    const resize = (width: number, height: number) => {
      const w = Math.max(1, width);
      const h = Math.max(1, height);
      renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
      renderer.setSize(w, h);
      composer.setSize(w, h);
      camera.aspect = w / h;
      camera.fov = fovFor(camera.aspect);
      camera.updateProjectionMatrix();
      renderScene(false);
    };

    const apply = () => {
      const state = stateRef.current;
      const sever = state.cutEdges.size > 0;
      for (const [id, visual] of nodes) {
        const active = state.activeNodes.has(id);
        const chosen = state.selected === id;
        const hover = state.hovered === id;
        const admin = visual.node.admin;
        const resource = RESOURCE.has(visual.node.kind);

        if (!admin) {
          if (chosen) {
            visual.material.color.setHex(0xf5f6f0);
            visual.material.emissive.setHex(0xffffff);
            visual.material.emissiveIntensity = sever ? 0.16 : 0.34;
            visual.glowMaterial.color.setHex(0xf5f6f0);
            visual.glowMaterial.opacity = sever ? 0.06 : 0.24;
            visual.glow.scale.setScalar(visual.base * 2.6);
            visual.ringMaterial.color.setHex(0xf5f6f0);
            visual.ringMaterial.opacity = 0.92;
            visual.targetScale = 1.6;
          } else if (active) {
            visual.material.color.setHex(0x0a3c4a);
            visual.material.emissive.setHex(C.signal);
            visual.material.emissiveIntensity = sever ? 0.05 : 0.62;
            visual.glowMaterial.color.setHex(C.signal);
            visual.glowMaterial.opacity = sever ? 0.03 : 0.15;
            visual.glow.scale.setScalar(visual.base * 2.4);
            visual.ringMaterial.color.setHex(C.signal);
            visual.ringMaterial.opacity = sever ? 0.08 : 0.85;
            visual.targetScale = 1.48;
          } else {
            const tint = planetTint(visual.node.kind);
            visual.material.color.setHex(tint);
            visual.material.emissive.setHex(tint);
            visual.material.emissiveIntensity = sever ? 0.06 : resource ? 0.34 : 0.2;
            visual.glowMaterial.color.setHex(tint);
            visual.glowMaterial.opacity = sever ? 0.02 : hover ? 0.32 : 0.12;
            visual.glow.scale.setScalar(visual.base * (hover ? 3.6 : 2.6));
            visual.ringMaterial.color.setHex(tint);
            visual.ringMaterial.opacity = sever ? 0.04 : hover ? 0.55 : 0.26;
            visual.targetScale = hover ? 1.34 : 1;
          }
        } else {
          visual.glowMaterial.color.setHex(C.goldLit);
          visual.glowMaterial.opacity = sever ? 0.12 : 0.42;
          visual.glow.scale.setScalar(0.34);
          visual.ringMaterial.color.setHex(C.gold);
          visual.ringMaterial.opacity = 0.5;
          visual.targetScale = 1;
        }
      }

      for (const [id, visual] of edges) {
        const active = state.activeEdges.has(id) && !sever;
        const cut = state.cutEdges.has(id);
        visual.line.visible = !cut;
        visual.dashed.visible = cut;
        visual.pulse.visible = active;
        if (cut) {
          visual.material.opacity = 0;
          visual.dashedMaterial.opacity = 0.95;
          continue;
        }
        if (active) {
          visual.material.color.setHex(C.signal);
          visual.material.opacity = 1;
          visual.material.blending = THREE.AdditiveBlending;
        } else {
          visual.material.color.setHex(0x2b416d);
          visual.material.opacity = sever ? 0.1 : 0.38;
          visual.material.blending = THREE.NormalBlending;
        }
      }

      for (const item of ringItems) item.material.opacity = sever ? 0.07 : 0.17;
      for (const shell of shells) shell.material.opacity = sever ? 0.05 : 0.16;
      sunHalo.material.opacity = sever ? 0.1 : 0.16;
      sunCorona.material.opacity = sever ? 0.04 : 0.07;
      gasGlow.material.opacity = sever ? 0.04 : 0.1;
      pulsarGlow.material.opacity = sever ? 0.06 : 0.12;
    };

    /* -------------------------------------------------------------- pointer */
    const pick = (clientX: number, clientY: number): NodeVisual | null => {
      const rect = canvas.getBoundingClientRect();
      const mx = clientX - rect.left;
      const my = clientY - rect.top;
      let best: NodeVisual | null = null;
      let bestDistance = 30;
      camera.updateMatrixWorld();
      for (const visual of nodes.values()) {
        const world = visual.group.getWorldPosition(new THREE.Vector3());
        const vector = world.project(camera);
        if (vector.z > 1) continue;
        const sx = (vector.x * 0.5 + 0.5) * rect.width;
        const sy = (-vector.y * 0.5 + 0.5) * rect.height;
        const distance = Math.hypot(mx - sx, my - sy);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = visual;
        }
      }
      return best;
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) / Math.max(1, rect.width);
      const y = (event.clientY - rect.top) / Math.max(1, rect.height);
      pointer.tx = (x - 0.5) * 2;
      pointer.ty = (y - 0.5) * 2;

      if (dragNode) {
        const local = dragPoint;
        mouse.set(x * 2 - 1, -(y * 2 - 1));
        ray.setFromCamera(mouse, camera);
        if (ray.ray.intersectPlane(dragPlane, local)) {
          field.worldToLocal(local);
          dragNode.group.position.set(local.x, local.y, local.z);
          if (Math.hypot(event.clientX - downX, event.clientY - downY) > 4) {
            dragMoved = true;
          }
          const connected = edgesByNode.get(dragNode.node.id) ?? [];
          for (const edgeId of connected) {
            const visual = edges.get(edgeId);
            if (visual) updateEdge(visual);
          }
          renderScene(false);
        }
        return;
      }

      if (panning) {
        const dx = event.clientX - lastX;
        const dy = event.clientY - lastY;
        panX -= dx * 0.006 * zoom;
        panY += dy * 0.006 * zoom;
        panX = clamp(panX, -4, 4);
        panY = clamp(panY, -2.4, 2.4);
        lastX = event.clientX;
        lastY = event.clientY;
        renderScene(false);
        return;
      }

      if (dragging) {
        const dx = event.clientX - lastX;
        const dy = event.clientY - lastY;
        if (Math.abs(dx) + Math.abs(dy) > 1) dragMoved = true;
        userAngle -= dx * 0.006;
        userTilt = clamp(userTilt + dy * 0.004, -1.1, 1.1);
        velocity = -dx * 0.12;
        lastX = event.clientX;
        lastY = event.clientY;
        canvas.style.cursor = "grabbing";
        renderScene(false);
        return;
      }

      const hit = pick(event.clientX, event.clientY);
      const id = hit?.node.id ?? null;
      setHovered((current) => (current === id ? current : id));
      canvas.style.cursor = hit ? "pointer" : "grab";
    };

    const onPointerDown = (event: PointerEvent) => {
      downX = event.clientX;
      downY = event.clientY;
      lastX = event.clientX;
      lastY = event.clientY;
      dragMoved = false;
      try {
        canvas.setPointerCapture(event.pointerId);
      } catch {
        // synthetic pointers and older browsers have no capture
      }

      if (event.button === 2 || event.shiftKey) {
        panning = true;
        canvas.style.cursor = "grabbing";
        return;
      }

      const hit = pick(event.clientX, event.clientY);
      if (hit) {
        stateRef.current.onSelect?.(hit.node.id);
        if (hit.node.admin) {
          dragging = true;
          canvas.style.cursor = "grabbing";
          return;
        }
        dragNode = hit;
        hit.dragged = true;
        const world = hit.group.getWorldPosition(new THREE.Vector3());
        const normal = camera.getWorldDirection(new THREE.Vector3()).negate();
        dragPlane.setFromNormalAndCoplanarPoint(normal, world);
        canvas.style.cursor = "grabbing";
        return;
      }

      dragging = true;
      canvas.style.cursor = "grabbing";
    };

    const onPointerUp = (event: PointerEvent) => {
      if (dragNode) {
        const visual = dragNode;
        dragNode = null;
        if (!dragMoved) {
          visual.dragged = false;
          stateRef.current.onSelect?.(visual.node.id);
        }
        canvas.style.cursor = "grab";
        return;
      }
      if (panning) {
        panning = false;
        canvas.style.cursor = "grab";
        return;
      }
      if (dragging) {
        dragging = false;
        canvas.style.cursor = "grab";
      }
    };

    const onWheel = (event: WheelEvent) => {
      if (!(event.ctrlKey || event.metaKey || event.altKey)) return;
      event.preventDefault();
      zoomTarget = clamp(zoomTarget * (event.deltaY > 0 ? 1.08 : 0.925), 0.56, 1.55);
      if (!stateRef.current.run) {
        zoom = zoomTarget;
        renderScene(false);
      }
    };

    const resetView = () => {
      userAngle = 0;
      userTilt = 0;
      panX = 0;
      panY = 0;
      zoom = 1;
      zoomTarget = 1;
      velocity = 0;
      pointer.tx = 0;
      pointer.ty = 0;
      pointer.x = 0;
      pointer.y = 0;
      for (const visual of nodes.values()) {
        visual.dragged = false;
        visual.group.position.copy(visual.rest);
        visual.targetScale = 1;
      }
      apply();
      renderScene(false);
      kick();
    };

    const zoomBy = (factor: number) => {
      zoomTarget = clamp(zoomTarget * factor, 0.56, 1.55);
      if (!stateRef.current.run) {
        zoom = zoomTarget;
        renderScene(false);
      } else kick();
    };

    const api: Api = {
      apply,
      kick,
      renderOnce: () => renderScene(false),
      resize,
      zoomBy,
      resetView,
    };
    apiRef.current = api;
    if (controls) controls.current = api;

    const onReset = () => resetView();
    const onContext = (event: MouseEvent) => event.preventDefault();
    canvas.addEventListener("pointermove", onPointerMove, { passive: true });
    canvas.addEventListener("pointerdown", onPointerDown, { passive: true });
    canvas.addEventListener("pointerup", onPointerUp, { passive: true });
    canvas.addEventListener("pointercancel", onPointerUp, { passive: true });
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("dblclick", onReset);
    canvas.addEventListener("contextmenu", onContext);

    apply();
    renderScene(true);
    kick();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(raf);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("dblclick", onReset);
      canvas.removeEventListener("contextmenu", onContext);
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(material)) material.forEach((item) => item.dispose());
        else material?.dispose();
      });
      glowMap.dispose();
      nebulaMap.dispose();
      galaxyMap.dispose();
      backdropMap.dispose();
      ringDiskMap.dispose();
      planetSurface.dispose();
      rockSurface.dispose();
      Object.values(planetMaps).forEach((texture) => texture.dispose());
      envTexture.dispose();
      composer.dispose();
      renderer.dispose();
      apiRef.current = null;
      if (controls) controls.current = null;
      labelRefs.current.clear();
      leaderRefs.current.clear();
      labelPositions.clear();
      labelSides.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bundle, variant]);

  useEffect(() => {
    const api = apiRef.current;
    if (!api) return;
    api.apply();
    if (!stateRef.current.run) api.renderOnce();
  }, [activeNodes, activeEdges, cutEdges, selected, hovered, variant]);

  useEffect(() => {
    const api = apiRef.current;
    if (!api) return;
    if (motionOn && inView) api.kick();
    else api.renderOnce();
  }, [motionOn, inView]);

  useEffect(() => {
    const api = apiRef.current;
    if (!api || size.w < 20 || size.h < 20) return;
    api.resize(size.w, size.h);
    api.renderOnce();
  }, [size.w, size.h]);

  const labelVisible = (node: SpatialNode) => {
    const chosen = selected === node.id;
    const admin = node.admin;
    const hover = hovered === node.id;
    return variant === "hero" ? admin : chosen || admin || hover;
  };

  return (
    <div className="constellation" ref={stageRef} data-variant={variant}>
      <canvas className="constellation__canvas" ref={canvasRef} aria-hidden="true" />
      <svg className="constellation__leaders" aria-hidden="true">
        {layout.nodes.map((node) => (
          <line
            key={node.id}
            ref={(el) => {
              if (el) leaderRefs.current.set(node.id, el);
              else leaderRefs.current.delete(node.id);
            }}
          />
        ))}
      </svg>
      <div className="constellation__labels" aria-hidden="true">
        {layout.nodes.map((node) => {
          const active = activeNodes.has(node.id);
          const chosen = selected === node.id;
          return (
            <span
              key={node.id}
              ref={(el) => {
                if (el) labelRefs.current.set(node.id, el);
                else labelRefs.current.delete(node.id);
              }}
              className="constellation__label"
              data-visible={labelVisible(node) ? "true" : "false"}
              data-active={active ? "true" : undefined}
              data-selected={chosen ? "true" : undefined}
              data-admin={node.admin ? "true" : undefined}
            >
              {node.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
