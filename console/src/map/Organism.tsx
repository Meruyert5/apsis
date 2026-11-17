import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { Bundle, GraphEdge } from "../lib/types";
import type { OrganismModel, OrganismRoute } from "../lib/organism";

interface Props {
  bundle: Bundle;
  model: OrganismModel;
  source: string | null;
  node: string | null;
  route: OrganismRoute | null;
  cut: boolean;
  onSelect: (id: string) => void;
}

interface Runtime {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  group: THREE.Group;
  nodeMeshes: THREE.Mesh[];
  points: THREE.Sprite[];
  membrane: THREE.Mesh | null;
  pulse: THREE.Sprite | null;
  pulse2: THREE.Sprite | null;
  routeCurve: THREE.CatmullRomCurve3 | null;
  raycaster: THREE.Raycaster;
  pointer: THREE.Vector2;
  rotX: number;
  rotY: number;
  drag: { x: number; y: number; rx: number; ry: number } | null;
  moved: number;
  raf: number;
  visible: boolean;
  motion: boolean;
  glow: THREE.Texture;
  resize: ResizeObserver | null;
}

const COLORS: Record<string, number> = {
  user: 0x8b7bff,
  role: 0x4fe3c1,
  group: 0xd6fff2,
  admin: 0xffd27a,
  lambda: 0x9fe8ff,
  ec2: 0x9fe8ff,
  ecs: 0x9fe8ff,
  glue: 0x9fe8ff,
  sagemaker: 0x9fe8ff,
  cloudformation: 0x9fe8ff,
};

function glowTexture(): THREE.Texture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.2, "rgba(255,255,255,.55)");
    gradient.addColorStop(0.55, "rgba(255,255,255,.1)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
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

export function Organism({ bundle, model, source, node, route, cut, onSelect }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<Runtime | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 1, 4000);
    camera.position.set(0, 190, 1280);
    camera.lookAt(0, 0, 0);
    const group = new THREE.Group();
    scene.add(group);

    const motion = !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
      document.documentElement.dataset.motion !== "off";

    const runtime: Runtime = {
      renderer, scene, camera, group,
      nodeMeshes: [], points: [], membrane: null, pulse: null, pulse2: null,
      routeCurve: null, raycaster: new THREE.Raycaster(),
      pointer: new THREE.Vector2(), rotX: -0.38, rotY: 0.55,
      drag: null, moved: 0, raf: 0, visible: true, motion,
      glow: glowTexture(), resize: null,
    };
    runtimeRef.current = runtime;
    runtime.raycaster.params.Points.threshold = 8;

    const resize = () => {
      const width = canvas.clientWidth || 700;
      const height = canvas.clientHeight || 640;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();
    runtime.resize = new ResizeObserver(resize);
    runtime.resize.observe(canvas);

    const hideTip = () => {
      if (tipRef.current) tipRef.current.classList.remove("on");
    };

    const raycasterHit = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      runtime.pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      runtime.raycaster.setFromCamera(runtime.pointer, camera);
      return runtime.raycaster.intersectObjects(runtime.nodeMeshes, false);
    };

    const onPointerDown = (event: PointerEvent) => {
      canvas.setPointerCapture(event.pointerId);
      runtime.drag = { x: event.clientX, y: event.clientY, rx: runtime.rotX, ry: runtime.rotY };
      runtime.moved = 0;
      canvas.style.cursor = "grabbing";
    };
    const onPointerMove = (event: PointerEvent) => {
      if (runtime.drag) {
        const dx = event.clientX - runtime.drag.x;
        const dy = event.clientY - runtime.drag.y;
        runtime.moved += Math.abs(dx) + Math.abs(dy);
        runtime.rotY = runtime.drag.ry + dx * 0.005;
        runtime.rotX = Math.max(-1.1, Math.min(0.45, runtime.drag.rx + dy * 0.004));
        hideTip();
        return;
      }
      const hits = raycasterHit(event);
      const tip = tipRef.current;
      if (!tip) return;
      if (hits.length === 0) {
        hideTip();
        return;
      }
      const id = hits[0].object.userData.id as string;
      const item = model.nodeById.get(id);
      if (!item) return;
      const depth = model.depth.get(id) ?? 0;
      tip.innerHTML = "";
      const title = document.createElement("b");
      title.textContent = item.label;
      const kind = document.createElement("span");
      kind.textContent = `${item.kind} / ${depth} hops to administrator`;
      const count = document.createElement("em");
      count.textContent = `${item.degree} connection${item.degree === 1 ? "" : "s"}`;
      tip.append(title, kind, count);
      const rect = canvas.getBoundingClientRect();
      tip.style.left = `${event.clientX - rect.left}px`;
      tip.style.top = `${event.clientY - rect.top}px`;
      tip.classList.add("on");
    };
    const onPointerUp = (event: PointerEvent) => {
      if (runtime.drag && runtime.moved < 5) {
        const hits = raycasterHit(event);
        if (hits.length > 0) {
          const id = hits[0].object.userData.id as string;
          if (id) onSelect(id);
        }
      }
      runtime.drag = null;
      canvas.style.cursor = "grab";
    };
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      camera.position.z = Math.max(500, Math.min(1400, camera.position.z + event.deltaY * 0.5));
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", () => { runtime.drag = null; canvas.style.cursor = "grab"; });
    canvas.addEventListener("pointerleave", hideTip);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    const observer = new IntersectionObserver(
      ([entry]) => {
        runtime.visible = entry.isIntersecting;
        if (runtime.visible && runtime.motion) {
          cancelAnimationFrame(runtime.raf);
          runtime.raf = requestAnimationFrame(loop);
        } else {
          cancelAnimationFrame(runtime.raf);
        }
      },
      { threshold: 0.05 },
    );
    observer.observe(canvas);

    const loop = () => {
      if (!runtime.visible || !runtime.motion) return;
      runtime.raf = requestAnimationFrame(loop);
      if (!runtime.drag) runtime.rotY += 0.0007;
      group.rotation.set(runtime.rotX, runtime.rotY, 0);
      if (runtime.membrane) {
        const scale = 1 + Math.sin(Date.now() * 0.0006) * 0.004;
        runtime.membrane.scale.setScalar(scale);
      }
      if (runtime.pulse && runtime.routeCurve) {
        runtime.pulse.position.copy(runtime.routeCurve.getPoint((performance.now() * 0.00011) % 1));
      }
      if (runtime.pulse2 && runtime.routeCurve) {
        runtime.pulse2.position.copy(runtime.routeCurve.getPoint((performance.now() * 0.00011 + 0.46) % 1));
      }
      renderer.render(scene, camera);
    };
    if (runtime.motion) runtime.raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(runtime.raf);
      observer.disconnect();
      runtime.resize?.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointerleave", hideTip);
      canvas.removeEventListener("wheel", onWheel);
      runtime.glow.dispose();
      disposeGroup(group);
      renderer.dispose();
      runtimeRef.current = null;
    };
  }, [bundle, model, onSelect]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    const { group, scene, camera, renderer } = runtime;
    disposeGroup(group);
    runtime.nodeMeshes = [];
    runtime.membrane = null;
    runtime.pulse = null;
    runtime.pulse2 = null;
    runtime.routeCurve = null;

    const radius = model.maxRadius * 1.16 + 26;
    const membrane = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 64, 40),
      new THREE.ShaderMaterial({
        vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.0); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
        fragmentShader: `varying vec3 vN; varying vec3 vV; void main(){ float rim=pow(1.0-abs(dot(vN,vV)),2.6); gl_FragColor=vec4(vec3(0.31,0.89,0.76),rim*0.3); }`,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      }),
    );
    runtime.membrane = membrane;
    group.add(membrane);

    // plankton
    const count = 220;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const r = radius * (0.7 + Math.random() * 0.65);
      const a = Math.random() * Math.PI * 2;
      const b = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = Math.sin(b) * Math.cos(a) * r;
      positions[i * 3 + 1] = Math.cos(b) * r;
      positions[i * 3 + 2] = Math.sin(b) * Math.sin(a) * r;
    }
    const planktonGeo = new THREE.BufferGeometry();
    planktonGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    group.add(new THREE.Points(planktonGeo, new THREE.PointsMaterial({
      color: 0x7ffff0, size: 1.6, map: runtime.glow, transparent: true, opacity: 0.35,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })));

    const routeIds = new Set(route && !cut ? route.nodes : []);
    const routeEdges = new Set(route && !cut ? route.edges.map((edge: GraphEdge) => edge.id) : []);
    const cutEdges = new Set(cut ? bundle.sever.edgeCut.edges : []);

    // growth rings
    for (let d = 1; d <= model.maxDepth; d += 1) {
      const points: THREE.Vector3[] = [];
      const ringRadius = 72 + d * 38;
      for (let k = 0; k < 128; k += 1) {
        const a = (k / 128) * Math.PI * 2;
        points.push(new THREE.Vector3(
          Math.cos(a) * ringRadius,
          Math.sin(a) * ringRadius,
          Math.sin(a * 1.6 + d) * 20,
        ));
      }
      group.add(new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({
          color: 0x4fe3c1, transparent: true,
          opacity: route?.hops === d ? 0.28 : 0.1,
          blending: THREE.AdditiveBlending,
        }),
      ));
    }

    // veins
    for (const edge of bundle.edges) {
      const a = model.positions.get(edge.source);
      const b = model.positions.get(edge.target);
      if (!a || !b) continue;
      const p1 = new THREE.Vector3(a.x, a.y, a.z);
      const p2 = new THREE.Vector3(b.x, b.y, b.z);
      const mid = p1.clone().add(p2).multiplyScalar(0.5);
      mid.multiplyScalar(1.04);
      mid.z += 24;
      const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
      const lineOn = routeEdges.has(edge.id);
      const cutOn = cutEdges.has(edge.id);
      group.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(curve.getPoints(28)),
        new THREE.LineBasicMaterial({
          color: cutOn ? 0xff8fa3 : lineOn ? 0xd6fff2 : 0x2f9f8a,
          transparent: true,
          opacity: cutOn ? 0.6 : lineOn ? 1 : 0.2,
          blending: THREE.AdditiveBlending,
        }),
      ));
      if (cutOn) {
        group.add(new THREE.Mesh(
          new THREE.TubeGeometry(curve, 24, 2.4, 6, false),
          new THREE.MeshBasicMaterial({ color: 0xff8fa3, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }),
        ));
        const mark = new THREE.Sprite(new THREE.SpriteMaterial({
          map: runtime.glow, color: 0xff8fa3, transparent: true, opacity: 0.5,
          blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        mark.position.copy(curve.getPoint(0.5));
        mark.scale.set(48, 48, 1);
        group.add(mark);
      }
      if (lineOn) {
        group.add(new THREE.Mesh(
          new THREE.TubeGeometry(curve, 24, 1.3, 6, false),
          new THREE.MeshBasicMaterial({ color: 0xd6fff2, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false }),
        ));
        group.add(new THREE.Mesh(
          new THREE.TubeGeometry(curve, 24, 4.4, 6, false),
          new THREE.MeshBasicMaterial({ color: 0x4fe3c1, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false }),
        ));
      }
    }

    // nucleus
    const nucleus = new THREE.Sprite(new THREE.SpriteMaterial({
      map: runtime.glow, color: 0xffd27a, transparent: true, opacity: 0.4,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    nucleus.scale.set(260, 260, 1);
    group.add(nucleus);
    group.add(new THREE.Mesh(
      new THREE.TorusGeometry(36, 0.8, 8, 64),
      new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false }),
    ));

    // cells
    for (const item of bundle.nodes) {
      const point = model.positions.get(item.id);
      if (!point) continue;
      const selected = item.id === source || item.id === node;
      const onRoute = routeIds.has(item.id);
      const base = item.admin ? 10 : 3.6 + item.degree * 1.4;
      const scale = selected ? 1.5 : onRoute ? 1.15 : 0.9;
      const color = COLORS[item.kind] ?? 0x4fe3c1;
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(base * scale, 20, 20),
        new THREE.MeshBasicMaterial({
          color, transparent: true,
          opacity: cut ? 0.4 : onRoute || selected ? 1 : 0.68,
        }),
      );
      mesh.position.set(point.x, point.y, point.z);
      mesh.userData.id = item.id;
      group.add(mesh);
      runtime.nodeMeshes.push(mesh);
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({
        map: runtime.glow, color, transparent: true,
        opacity: cut ? 0.18 : onRoute || selected ? 0.9 : 0.42,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      glow.position.copy(mesh.position);
      const size = item.admin ? 150 : 48 + item.degree * 8 + (onRoute ? 30 : 0);
      glow.scale.set(size, size, 1);
      group.add(glow);
    }

    // route pulses
    if (route && !cut) {
      const routePoints = route.nodes
        .map((id) => model.positions.get(id))
        .filter((point): point is { x: number; y: number; z: number } => Boolean(point))
        .map((point) => new THREE.Vector3(point.x, point.y, point.z));
      if (routePoints.length > 1) {
        const curve = new THREE.CatmullRomCurve3(routePoints);
        runtime.routeCurve = curve;
        const pulse = new THREE.Sprite(new THREE.SpriteMaterial({
          map: runtime.glow, color: 0xd6fff2, transparent: true, opacity: 0.9,
          blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        pulse.scale.set(34, 34, 1);
        runtime.pulse = pulse;
        group.add(pulse);
        const pulse2 = new THREE.Sprite(new THREE.SpriteMaterial({
          map: runtime.glow, color: 0x4fe3c1, transparent: true, opacity: 0.55,
          blending: THREE.AdditiveBlending, depthWrite: false,
        }));
        pulse2.scale.set(22, 22, 1);
        runtime.pulse2 = pulse2;
        group.add(pulse2);
      }
    }

    group.rotation.set(runtime.rotX, runtime.rotY, 0);
    renderer.render(scene, camera);
  }, [bundle, model, source, node, route, cut, onSelect]);

  return (
    <>
      <canvas ref={canvasRef} aria-hidden="true" />
      <div className="bio-tip" ref={tipRef} role="status" aria-live="polite" />
    </>
  );
}
