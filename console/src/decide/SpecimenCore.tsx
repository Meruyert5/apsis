import { useEffect, useRef } from "react";
import * as THREE from "three";

interface Account {
  key: string;
  short: string;
  title: string;
}
interface Tech {
  id: string;
  name: string;
  category: string;
}
interface Props {
  accounts: Account[];
  techniques: Tech[];
  table: Map<string, Map<string, number>>;
  techId: string;
  accountKey: string | null;
  onSelect: (techId: string, accountKey: string) => void;
}

const COLORS: Record<string, number> = { identity: 0xff6fa5, compute: 0x3ff0b0, trust: 0x4fe3ff };
const R0 = 90;
const R1 = 310;

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
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function disposeGroup(group: THREE.Group) {
  while (group.children.length > 0) {
    const child = group.children.pop();
    if (!child) continue;
    child.traverse((node) => {
      const mesh = node as THREE.Mesh;
      mesh.geometry?.dispose?.();
      const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(material)) material.forEach((item) => item.dispose());
      else material?.dispose?.();
    });
    group.remove(child);
  }
}

export function SpecimenCore({ accounts, techniques, table, techId, accountKey, onSelect }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const runtime = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    group: THREE.Group;
    points: THREE.Points | null;
    cells: { tech: Tech; account: Account; count: number }[];
    raycaster: THREE.Raycaster;
    pointer: THREE.Vector2;
    rotX: number;
    rotY: number;
    drag: { x: number; y: number; rx: number; ry: number } | null;
    moved: number;
    raf: number;
    motion: boolean;
    glow: THREE.Texture;
  } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 1, 4000);
    camera.position.set(0, 210, 1150);
    camera.lookAt(0, 0, 0);
    const group = new THREE.Group();
    scene.add(group);
    const state = {
      renderer, scene, camera, group,
      points: null as THREE.Points | null,
      cells: [] as { tech: Tech; account: Account; count: number }[],
      raycaster: new THREE.Raycaster(),
      pointer: new THREE.Vector2(),
      rotX: -0.6, rotY: 0.55,
      drag: null as { x: number; y: number; rx: number; ry: number } | null,
      moved: 0, raf: 0,
      motion: !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
        document.documentElement.dataset.motion !== "off",
      glow: glowTexture(),
    };
    runtime.current = state;
    state.raycaster.params.Points.threshold = 7;

    const resize = () => {
      const width = canvas.clientWidth || 600;
      const height = canvas.clientHeight || 600;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const pointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      state.pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      state.raycaster.setFromCamera(state.pointer, camera);
      return state.raycaster.intersectObject(state.points as THREE.Points);
    };
    const hideTip = () => tipRef.current?.classList.remove("on");
    const onDown = (event: PointerEvent) => {
      canvas.setPointerCapture(event.pointerId);
      state.drag = { x: event.clientX, y: event.clientY, rx: state.rotX, ry: state.rotY };
      state.moved = 0;
    };
    const onMove = (event: PointerEvent) => {
      if (state.drag) {
        const dx = event.clientX - state.drag.x;
        const dy = event.clientY - state.drag.y;
        state.moved += Math.abs(dx) + Math.abs(dy);
        state.rotY = state.drag.ry + dx * 0.005;
        state.rotX = Math.max(-1.1, Math.min(0.45, state.drag.rx + dy * 0.004));
        hideTip();
        return;
      }
      if (!state.points) return;
      const hits = pointer(event);
      const tip = tipRef.current;
      if (!tip) return;
      if (hits.length === 0) { hideTip(); return; }
      const index = hits[0]?.index;
      const cell = index === undefined ? undefined : state.cells[index];
      if (!cell) { hideTip(); return; }
      tip.innerHTML = "";
      const title = document.createElement("b");
      title.textContent = cell.tech.name;
      const account = document.createElement("span");
      account.textContent = cell.account.title;
      const count = document.createElement("em");
      count.textContent = `${cell.count} edge${cell.count === 1 ? "" : "s"} observed`;
      tip.append(title, account, count);
      const rect = canvas.getBoundingClientRect();
      tip.style.left = `${event.clientX - rect.left}px`;
      tip.style.top = `${event.clientY - rect.top}px`;
      tip.classList.add("on");
    };
    const onUp = (event: PointerEvent) => {
      if (state.drag && state.moved < 5 && state.points) {
        const hits = pointer(event);
        const index = hits[0]?.index;
        const cell = index === undefined ? null : state.cells[index];
        if (cell) onSelect(cell.tech.id, cell.account.key);
      }
      state.drag = null;
    };
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      camera.position.z = Math.max(520, Math.min(1400, camera.position.z + event.deltaY * 0.5));
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", () => { state.drag = null; });
    canvas.addEventListener("pointerleave", hideTip);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    const loop = () => {
      if (!state.motion) return;
      state.raf = requestAnimationFrame(loop);
      if (!state.drag) state.rotY += 0.0011;
      group.rotation.set(state.rotX, state.rotY, 0);
      renderer.render(scene, camera);
    };
    if (state.motion) state.raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(state.raf);
      observer.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointerleave", hideTip);
      canvas.removeEventListener("wheel", onWheel);
      state.glow.dispose();
      disposeGroup(group);
      renderer.dispose();
      runtime.current = null;
    };
  }, [onSelect]);

  useEffect(() => {
    const state = runtime.current;
    if (!state) return;
    const { group, renderer, scene, camera } = state;
    disposeGroup(group);
    state.cells = [];
    const n = accounts.length;
    const m = techniques.length;
    const techIndex = techniques.findIndex((item) => item.id === techId);
    const accountIndex = accounts.findIndex((item) => item.key === accountKey);
    const zOf = (index: number) => (index - (n - 1) / 2) * 9.5;
    const rOf = (index: number) => R0 + ((R1 - R0) * index) / Math.max(1, n - 1);

    const bed = new THREE.Sprite(new THREE.SpriteMaterial({
      map: state.glow, color: 0x3ff0b0, transparent: true, opacity: 0.2,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    bed.scale.set(560, 560, 1);
    group.add(bed);

    for (let i = 0; i < n; i += 1) {
      const points: THREE.Vector3[] = [];
      for (let k = 0; k < 128; k += 1) {
        const a = (k / 128) * Math.PI * 2;
        points.push(new THREE.Vector3(
          Math.cos(a) * rOf(i),
          Math.sin(a) * rOf(i),
          zOf(i) + Math.sin(a * 5 + i) * 3,
        ));
      }
      group.add(new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({
          color: i === accountIndex ? 0x4fe3ff : 0x3ff0b0,
          transparent: true,
          opacity: i === accountIndex ? 0.9 : 0.2,
          blending: THREE.AdditiveBlending,
        }),
      ));
    }

    for (let j = 0; j < m; j += 1) {
      const a = ((-90 + (j * 360) / m) * Math.PI) / 180;
      const points: THREE.Vector3[] = [];
      for (let i = 0; i < n; i += 1) {
        const bend = Math.sin(i * 0.8 + j) * 5;
        points.push(new THREE.Vector3(
          Math.cos(a) * rOf(i) + Math.cos(a + Math.PI / 2) * bend,
          Math.sin(a) * rOf(i) + Math.sin(a + Math.PI / 2) * bend,
          zOf(i),
        ));
      }
      const tech = techniques[j];
      group.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({
          color: j === techIndex ? 0xff6fa5 : COLORS[tech.category] ?? 0x2a4a52,
          transparent: true,
          opacity: j === techIndex ? 0.95 : 0.18,
          blending: THREE.AdditiveBlending,
        }),
      ));
    }

    const positions: number[] = [];
    const colors: number[] = [];
    const sizes: number[] = [];
    const cells: { tech: Tech; account: Account; count: number }[] = [];
    accounts.forEach((account, ai) => {
      techniques.forEach((tech, ti) => {
        const count = table.get(account.key)?.get(tech.id) ?? 0;
        const a = ((-90 + (ti * 360) / m) * Math.PI) / 180;
        positions.push(Math.cos(a) * rOf(ai), Math.sin(a) * rOf(ai), zOf(ai));
        const color = new THREE.Color(COLORS[tech.category] ?? 0x3ff0b0);
        const selected = ti === techIndex || ai === accountIndex;
        const dim = ti !== techIndex && (accountIndex < 0 || ai !== accountIndex);
        color.multiplyScalar(count === 0 ? 0.5 : selected ? 1 : dim ? 0.4 : 0.85);
        colors.push(color.r, color.g, color.b);
        let size = count === 0 ? 1.8 : 5 + Math.sqrt(count) * 2.6;
        if (ti === techIndex && count > 0) size *= 1.5;
        sizes.push(size);
        cells.push({ tech, account, count });
      });
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.Float32BufferAttribute(sizes, 1));
    const points = new THREE.Points(geometry, new THREE.ShaderMaterial({
      vertexShader: `attribute float size; attribute vec3 color; varying vec3 vColor; void main(){ vColor=color; vec4 mv=modelViewMatrix*vec4(position,1.0); gl_PointSize=size*(1450.0/-mv.z); gl_Position=projectionMatrix*mv; }`,
      fragmentShader: `varying vec3 vColor; void main(){ vec2 c=gl_PointCoord-0.5; float d=length(c); float a=smoothstep(0.5,0.04,d); gl_FragColor=vec4(vColor,a*0.92); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    points.frustumCulled = false;
    group.add(points);
    state.points = points;
    state.cells = cells;

    const selectedTech = techniques[techIndex];
    const selectedAccount = accounts[accountIndex];
    if (selectedTech && selectedAccount) {
      const count = table.get(selectedAccount.key)?.get(selectedTech.id) ?? 0;
      if (count > 0) {
        const a = ((-90 + (techIndex * 360) / m) * Math.PI) / 180;
        const mark = new THREE.Sprite(new THREE.SpriteMaterial({
          map: state.glow, color: COLORS[selectedTech.category] ?? 0x4fe3ff,
          transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        mark.position.set(Math.cos(a) * rOf(accountIndex), Math.sin(a) * rOf(accountIndex), zOf(accountIndex));
        mark.scale.set(58, 58, 1);
        group.add(mark);
      }
    }

    const centre = new THREE.Sprite(new THREE.SpriteMaterial({
      map: state.glow, color: 0x4fe3ff, transparent: true, opacity: 0.6,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    centre.scale.set(150, 150, 1);
    group.add(centre);

    group.rotation.set(state.rotX, state.rotY, 0);
    renderer.render(scene, camera);
  }, [accounts, techniques, table, techId, accountKey, onSelect]);

  return (
    <>
      <canvas ref={canvasRef} aria-hidden="true" />
      <div className="bio-tip" ref={tipRef} role="status" aria-live="polite" />
    </>
  );
}
