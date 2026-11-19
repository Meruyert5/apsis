import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

export type FigureVariant =
  | "orb"
  | "dish"
  | "ascent"
  | "atlas"
  | "drift"
  | "prism"
  | "bloom"
  | "stack"
  | "horizon";

export type FigureMode = "planets" | "wireframe";

interface FigureState {
  active: number;
  count: number;
  cut: boolean;
  focus: number;
  motion: boolean;
}

interface Built {
  root: THREE.Group;
  update: (time: number, state: FigureState) => void;
  pickables?: THREE.Object3D[];
}

const BLUE = 0x7b86c9;
const WHITE = 0xf2eee4;

const VARIANT_ACCENT: Record<FigureVariant, number> = {
  orb: 0x7ce7ff,
  dish: 0x9ff0c8,
  ascent: 0xffb26b,
  atlas: 0xa78bfa,
  drift: 0xff9ecb,
  prism: 0x9ff0c8,
  bloom: 0xa78bfa,
  stack: 0xffb26b,
  horizon: 0xffb26b,
};

const BONE = 0xf2eee4;
const MINT = 0x9ff0c8;
const AMBER = 0xffb26b;
const VIOLET = 0xa78bfa;

/**
 * The wire pass is tinted to the view accent: `base` for structure, `pale` for
 * changed/active lines and `hot` for the highlight that used to be bone.
 */
function wirePalette(accent: number) {
  const base = new THREE.Color(accent);
  return {
    base: accent,
    pale: base.clone().lerp(new THREE.Color(BONE), 0.36).getHex(),
    hot: base.clone().lerp(new THREE.Color(BONE), 0.6).getHex(),
  };
}

function wire(color = WHITE, opacity = 0.68) {
  return new THREE.MeshBasicMaterial({
    color, wireframe: true, transparent: true, opacity,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
}

function basic(color = WHITE, opacity = 0.9) {
  return new THREE.MeshBasicMaterial({
    color, transparent: true, opacity,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
}

function line(points: THREE.Vector3[], color = WHITE, opacity = 0.7) {
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({
      color, transparent: true, opacity,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }),
  );
}

function glowTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.2, "rgba(210,220,255,.6)");
    gradient.addColorStop(0.55, "rgba(26,26,255,.18)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function starTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.translate(64, 64);
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    for (let i = 0; i < 8; i += 1) {
      const radius = i % 2 === 0 ? 52 : 8;
      const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
      if (i === 0) ctx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      else ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
    }
    ctx.closePath();
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function sprite(map: THREE.Texture, color: number, opacity: number, scale: number) {
  const item = new THREE.Sprite(new THREE.SpriteMaterial({
    map, color, transparent: true, opacity,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  item.scale.set(scale, scale, 1);
  return item;
}

function numberSprite(value: number, accent: number) {
  const size = 96;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "rgba(8, 9, 11, .78)";
    ctx.beginPath();
    ctx.arc(48, 48, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#" + accent.toString(16).padStart(6, "0");
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(48, 48, 34, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#f4efe3";
    ctx.font = '500 38px "IBM Plex Mono", monospace';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(value), 48, 50);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const item = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture, transparent: true, depthWrite: false,
  }));
  item.scale.set(0.42, 0.42, 1);
  return item;
}

function hitSphere(radius: number, index: number) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 8, 6),
    new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
      colorWrite: false,
    }),
  );
  mesh.userData.index = index;
  return mesh;
}

/* ---------------------------------------------------------------- orb */
function buildOrb(glow: THREE.Texture, star: THREE.Texture, accent: number): Built {
  const palette = wirePalette(accent);
  const root = new THREE.Group();
  root.rotation.x = 0.12;
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

  root.add(new THREE.Mesh(new THREE.SphereGeometry(2.36, 32, 22), wire(palette.base, 0.34)));
  root.add(new THREE.Mesh(new THREE.SphereGeometry(2.58, 16, 12), wire(palette.hot, 0.08)));

  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(2.08, 64, 48),
    new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vN;
        varying vec3 vV;
        void main() {
          vN = normalize(normalMatrix * normal);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vV = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        varying vec3 vN;
        varying vec3 vV;
        void main() {
          float rim = pow(1.0 - abs(dot(vN, vV)), 2.4);
          gl_FragColor = vec4(vec3(0.14, 0.2, 1.0), rim * 0.62);
          #include <colorspace_fragment>
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.BackSide,
    }),
  );
  root.add(atmosphere);

  const equator = new THREE.Mesh(new THREE.TorusGeometry(2.52, 0.006, 6, 180), basic(palette.hot, 0.22));
  equator.rotation.x = 1.18;
  equator.rotation.z = -0.2;
  root.add(equator);

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
  root.add(new THREE.Mesh(
    new THREE.TubeGeometry(orbit, 200, 0.012, 6, true),
    basic(palette.hot, 0.68),
  ));

  const orbitNodes: THREE.Mesh[] = [];
  const orbitHalos: THREE.Sprite[] = [];
  for (let i = 0; i < 7; i += 1) {
    const point = orbit.getPointAt(i / 7);
    const node = new THREE.Mesh(
      new THREE.OctahedronGeometry(i === 6 ? 0.1 : 0.065, 0),
      basic(i === 6 ? palette.base : palette.hot, i === 6 ? 1 : 0.9),
    );
    node.position.copy(point);
    root.add(node);
    orbitNodes.push(node);
    const halo = sprite(glow, i === 6 ? palette.base : palette.hot, 0.28, 0.8);
    halo.position.copy(point);
    root.add(halo);
    orbitHalos.push(halo);
  }

  const comet = sprite(glow, palette.hot, 0.9, 1.2);
  const cometTrail = sprite(glow, palette.base, 0.5, 2.6);
  root.add(comet, cometTrail);

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
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
    color: palette.base, size: 0.02, transparent: true, opacity: 0.7,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  root.add(dust);

  const ghost = new THREE.Mesh(new THREE.SphereGeometry(0.92, 16, 12), wire(palette.base, 0.15));
  ghost.position.set(-3.25, 2.15, -2.5);
  root.add(ghost);

  const polar = new THREE.PolarGridHelper(4.2, 8, 4, 64, palette.base, palette.base);
  const polarMaterial = polar.material as THREE.LineBasicMaterial;
  polarMaterial.transparent = true;
  polarMaterial.opacity = 0.1;
  polar.position.y = -2.6;
  root.add(polar);

  const coreGlow = sprite(glow, palette.base, 0.55, 4.2);
  root.add(coreGlow);
  [ [-2.9, 2.1, 1.0, 0.55], [2.9, -1.7, 0.8, 0.4] ].forEach(([x, y, z, scale]) => {
    const item = sprite(star, palette.hot, 0.9, scale);
    item.position.set(x, y, z);
    root.add(item);
  });

  return {
    root,
    update: (time) => {
      uniforms.uTime.value = time;
      core.rotation.y = time * 0.08;
      coreGlow.material.opacity = 0.42 + Math.sin(time * 1.2) * 0.1;
      dust.rotation.y = time * 0.05;
      equator.rotation.y = time * 0.1;
      orbitNodes.forEach((node, index) => {
        const pulse = 1 + Math.sin(time * 2 + index) * 0.22;
        node.scale.setScalar(pulse);
        const halo = orbitHalos[index];
        halo.scale.setScalar(0.65 + Math.sin(time * 2 + index) * 0.15);
        (halo.material as THREE.SpriteMaterial).opacity = 0.18 + Math.sin(time * 2 + index) * 0.08;
      });
      const orbitT = (time * 0.075) % 1;
      comet.position.copy(orbit.getPointAt(orbitT));
      cometTrail.position.copy(orbit.getPointAt((orbitT + 0.988) % 1));
      comet.material.opacity = 0.8 + Math.sin(time * 3) * 0.15;
      cometTrail.material.opacity = 0.32 + Math.sin(time * 3) * 0.08;
    },
  };
}

/* ---------------------------------------------------------------- dish */
function buildDish(glow: THREE.Texture, accent: number): Built {
  const palette = wirePalette(accent);
  const root = new THREE.Group();
  root.rotation.x = 0.22;

  const profile: THREE.Vector2[] = [];
  for (let i = 0; i <= 20; i += 1) {
    const t = i / 20;
    profile.push(new THREE.Vector2(0.16 + t * 2.45, t * t * 0.92));
  }
  const lathe = new THREE.LatheGeometry(profile, 72);
  const dish = new THREE.Mesh(lathe, wire(palette.base, 0.26));
  dish.position.y = -0.46;
  root.add(dish);

  const skin = new THREE.Mesh(lathe, new THREE.MeshBasicMaterial({
    color: palette.base,
    transparent: true,
    opacity: 0.035,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }));
  skin.position.y = -0.46;
  root.add(skin);

  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.16, 1.05, 12), wire(palette.base, 0.35));
  stand.position.y = -1.0;
  root.add(stand);
  const base = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.02, 6, 64), basic(palette.base, 0.4));
  base.rotation.x = Math.PI / 2;
  base.position.y = -1.5;
  root.add(base);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(2.61, 0.022, 8, 180), basic(palette.hot, 0.8));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.46;
  root.add(rim);

  for (let i = 1; i <= 3; i += 1) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry((i / 3.6) * 2.3, 0.01, 6, 140),
      basic(palette.base, 0.34),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.46 - i * 0.13 - i * i * 0.02;
    root.add(ring);
  }

  const feedLine = line([
    new THREE.Vector3(0, 0.5, 0),
    new THREE.Vector3(0, 2.2, 0),
  ], palette.hot, 0.8);
  root.add(feedLine);
  const feed = new THREE.Mesh(new THREE.OctahedronGeometry(0.13, 0), basic(palette.hot, 1));
  feed.position.y = 2.2;
  root.add(feed);
  const feedGlow = sprite(glow, palette.base, 0.55, 1.4);
  feedGlow.position.y = 2.2;
  root.add(feedGlow);

  const sweep = new THREE.Group();
  sweep.add(line([
    new THREE.Vector3(0, 0.48, 0),
    new THREE.Vector3(2.45, 0.48, 0),
  ], palette.hot, 0.6));
  const wedge = new THREE.Mesh(
    new THREE.CircleGeometry(2.45, 36, 0, 0.26),
    new THREE.MeshBasicMaterial({
      color: palette.base, transparent: true, opacity: 0.18, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }),
  );
  wedge.rotation.x = -Math.PI / 2;
  wedge.position.y = 0.48;
  sweep.add(wedge);
  root.add(sweep);

  const contacts: THREE.Mesh[] = [];
  for (let i = 0; i < 28; i += 1) {
    const angle = i * 2.399;
    const radius = 0.55 + (i % 8) * 0.24;
    const dot = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.05, 0),
      basic(i % 5 === 0 ? palette.base : palette.hot, 0.8),
    );
    dot.position.set(Math.cos(angle) * radius, 0.9 + (i % 5) * 0.14, Math.sin(angle) * radius);
    root.add(dot);
    contacts.push(dot);
  }

  const floorRing = new THREE.Mesh(new THREE.TorusGeometry(3.1, 0.01, 6, 180), basic(palette.base, 0.3));
  floorRing.rotation.x = Math.PI / 2;
  floorRing.position.y = -1.5;
  root.add(floorRing);

  return {
    root,
    update: (time) => {
      sweep.rotation.y = time * 0.85;
      feedGlow.material.opacity = 0.65 + Math.sin(time * 2.2) * 0.2;
      contacts.forEach((dot, index) => {
        const pulse = 0.5 + Math.sin(time * 1.8 + index * 0.7) * 0.5;
        dot.scale.setScalar(0.7 + pulse * 0.7);
        (dot.material as THREE.MeshBasicMaterial).opacity = 0.25 + pulse * 0.75;
      });
      dish.rotation.z = Math.sin(time * 0.2) * 0.025;
      skin.rotation.z = dish.rotation.z;
    },
  };
}

/* ---------------------------------------------------------------- ascent */
function buildAscent(glow: THREE.Texture, accent: number): Built {
  const palette = wirePalette(accent);
  const root = new THREE.Group();
  root.rotation.x = 0.05;
  root.position.set(0.12, -0.05, 0);

  const nodeCount = 8;
  const nodes: THREE.Mesh[] = [];
  const halos: THREE.Sprite[] = [];
  const gates: THREE.Group[] = [];
  const gateMats: THREE.MeshBasicMaterial[][] = [];
  const platforms: THREE.Group[] = [];
  const platformMats: THREE.MeshBasicMaterial[][] = [];
  const beams: THREE.Mesh[] = [];
  const beamMats: THREE.MeshBasicMaterial[] = [];
  const segments: { core: THREE.Mesh; halo: THREE.Mesh }[] = [];
  const segmentMats: { core: THREE.MeshBasicMaterial; halo: THREE.MeshBasicMaterial }[] = [];
  const pickables: THREE.Object3D[] = [];
  const hits: THREE.Mesh[] = [];
  const sparks: THREE.Sprite[] = [];

  for (let i = 0; i < nodeCount; i += 1) {
    const node = new THREE.Mesh(new THREE.OctahedronGeometry(0.17, 0), wire(palette.base, 0.6));
    node.userData.index = i;
    root.add(node);
    nodes.push(node);
    const hit = hitSphere(0.42, i);
    root.add(hit);
    hits.push(hit);
    pickables.push(hit);

    const halo = sprite(glow, palette.hot, 0, 1.1);
    root.add(halo);
    halos.push(halo);

    const gate = new THREE.Group();
    const outerMat = basic(palette.base, 0.2);
    const innerMat = basic(palette.base, 0.1);
    const outer = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.008, 6, 72), outerMat);
    outer.rotation.x = Math.PI / 2;
    const inner = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.004, 4, 56), innerMat);
    inner.rotation.x = Math.PI / 2;
    gate.add(outer, inner);
    root.add(gate);
    gates.push(gate);
    gateMats.push([outerMat, innerMat]);

    const platform = new THREE.Group();
    const discMat = new THREE.MeshBasicMaterial({
      color: palette.base, transparent: true, opacity: 0.1, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.012, 6), discMat);
    const plateMat = wire(palette.base, 0.5);
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.02, 6), plateMat);
    const rimMat = basic(palette.base, 0.35);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.005, 4, 48), rimMat);
    rim.rotation.x = Math.PI / 2;
    platform.add(disc, plate, rim);
    platform.rotation.x = -0.22;
    root.add(platform);
    platforms.push(platform);
    platformMats.push([discMat, plateMat, rimMat]);

    const beamMat = basic(palette.hot, 0);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 1, 5), beamMat);
    root.add(beam);
    beams.push(beam);
    beamMats.push(beamMat);
  }

  for (let i = 0; i < nodeCount - 1; i += 1) {
    const coreMat = basic(palette.base, 0.35);
    const haloMat = basic(palette.base, 0.04);
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 1, 8), coreMat);
    const halo = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1, 8), haloMat);
    root.add(core, halo);
    segments.push({ core, halo });
    segmentMats.push({ core: coreMat, halo: haloMat });
  }

  [2.55, 3.3].forEach((radius) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.006, 4, 120), basic(palette.base, 0.07));
    ring.position.z = -1.4;
    ring.scale.y = 1.2;
    root.add(ring);
  });

  for (let i = 0; i < nodeCount; i += 1) {
    const y = -2.05 + (i / (nodeCount - 1)) * 4.0;
    root.add(line([
      new THREE.Vector3(-2.62, y, 0),
      new THREE.Vector3(-2.34, y, 0),
    ], palette.base, 0.16));
    root.add(line([
      new THREE.Vector3(2.62, y, 0),
      new THREE.Vector3(2.4, y, 0),
    ], palette.base, 0.08));
  }
  root.add(line([
    new THREE.Vector3(2.74, -2.15, 0),
    new THREE.Vector3(2.74, 2.15, 0),
  ], palette.base, 0.08));
  root.add(line([
    new THREE.Vector3(0, -2.3, 0),
    new THREE.Vector3(0, 2.3, 0),
  ], palette.base, 0.09));

  const contextItems: { star: THREE.Mesh; link: THREE.Line }[] = [];
  for (let i = 0; i < 16; i += 1) {
    const angle = i * 2.399 + 0.6;
    const radius = 2.45 + (i % 4) * 0.35;
    const y = -1.95 + ((i * 0.618) % 1) * 3.85;
    const star = new THREE.Mesh(
      new THREE.OctahedronGeometry(i % 5 === 0 ? 0.095 : 0.06, 0),
      basic(palette.base, 0.35),
    );
    star.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius * 0.72);
    root.add(star);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
    const link = new THREE.Line(
      geometry,
      new THREE.LineBasicMaterial({
        color: palette.base, transparent: true, opacity: 0.05,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }),
    );
    root.add(link);
    contextItems.push({ star, link });
  }

  const floor = new THREE.Mesh(
    new THREE.RingGeometry(1.9, 3.2, 64),
    new THREE.MeshBasicMaterial({
      color: palette.base, transparent: true, opacity: 0.05, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.45;
  root.add(floor);

  const stage = new THREE.PolarGridHelper(3.3, 8, 3, 48, palette.base, palette.base);
  const stageMaterial = stage.material as THREE.LineBasicMaterial;
  stageMaterial.transparent = true;
  stageMaterial.opacity = 0.09;
  stage.position.y = -2.45;
  root.add(stage);

  const beacon = new THREE.Group();
  const beaconMat = basic(palette.hot, 0);
  const beaconBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.8, 5), beaconMat);
  beaconBeam.position.y = 0.4;
  const beaconRingMat = basic(palette.hot, 0);
  const beaconRing = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.006, 4, 48), beaconRingMat);
  beaconRing.rotation.x = Math.PI / 2;
  beaconRing.position.y = 0.8;
  const beaconStar = sprite(glow, palette.hot, 0, 1.5);
  beaconStar.position.y = 0.8;
  beacon.add(beaconBeam, beaconRing, beaconStar);
  root.add(beacon);

  const cutGroup = new THREE.Group();
  const cutA = line([new THREE.Vector3(-0.18, -0.18, 0), new THREE.Vector3(0.18, 0.18, 0)], palette.hot, 1);
  const cutB = line([new THREE.Vector3(0.18, -0.18, 0), new THREE.Vector3(-0.18, 0.18, 0)], palette.hot, 1);
  cutGroup.add(cutA, cutB);
  cutGroup.visible = false;
  root.add(cutGroup);

  const travelPulse = sprite(glow, palette.hot, 0, 0.75);
  const travelTrail = sprite(glow, palette.base, 0, 1.35);
  root.add(travelPulse, travelTrail);
  for (let i = 0; i < 6; i += 1) {
    const spark = sprite(glow, palette.hot, 0, 0.28);
    root.add(spark);
    sparks.push(spark);
  }

  const shockRings: { mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial }[] = [];
  for (let i = 0; i < 3; i += 1) {
    const mat = basic(palette.hot, 0);
    const mesh = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.007, 4, 48), mat);
    mesh.rotation.x = Math.PI / 2;
    root.add(mesh);
    shockRings.push({ mesh, mat });
  }

  const positions: THREE.Vector3[] = [];

  return {
    root,
    pickables,
    update: (time, state) => {
      const count = Math.max(2, Math.min(nodeCount, state.count));
      const active = Math.max(0, Math.min(count - 1, state.active));
      positions.length = 0;

      for (let i = 0; i < count; i += 1) {
        const u = i / (count - 1);
        const angle = -0.35 + u * Math.PI * 2 * 0.72;
        const radius = 1.9 - u * 0.18;
        const point = new THREE.Vector3(
          Math.cos(angle) * radius,
          -2.0 + u * 4.0,
          Math.sin(angle) * radius * 0.8,
        );
        positions.push(point);
        const isActive = i === active && !state.cut;
        const isVisited = i < active;
        const isTarget = i === count - 1;

        const node = nodes[i];
        node.visible = true;
        node.position.copy(point);
        node.position.y += Math.sin(time * 2 + i * 0.9) * 0.025;
        hits[i].visible = true;
        hits[i].position.copy(point);
        const material = node.material as THREE.MeshBasicMaterial;
        material.color.setHex(isActive ? palette.pale : isTarget ? palette.hot : palette.base);
        material.opacity = state.cut ? 0.32 : isActive ? 1 : isVisited ? 0.9 : 0.45;
        node.scale.setScalar(
          isActive ? 1.35 + Math.sin(time * 3) * 0.08 : isTarget ? 1.2 : isVisited ? 1.02 : 0.85,
        );
        node.rotation.y = time * (isActive ? 1.4 : 0.4) + i;

        const halo = halos[i];
        halo.visible = true;
        halo.position.copy(point);
        (halo.material as THREE.SpriteMaterial).opacity = state.cut
          ? 0.02
          : isActive ? 0.08 : isTarget ? 0.06 : isVisited ? 0.03 : 0.018;
        halo.scale.setScalar(
          isActive ? 0.4 + Math.sin(time * 3) * 0.04 : isTarget ? 0.4 : isVisited ? 0.34 : 0.3,
        );

        const gate = gates[i];
        gate.visible = true;
        gate.position.copy(point);
        gate.rotation.z = time * (isActive ? 0.45 : 0.08) + i * 0.4;
        gate.scale.setScalar(isActive ? 1.08 + Math.sin(time * 2.4) * 0.04 : 1);
        const gateColor = isActive || isTarget ? palette.hot : palette.base;
        const [gateOuter, gateInner] = gateMats[i];
        gateOuter.color.setHex(gateColor);
        gateInner.color.setHex(gateColor);
        gateOuter.opacity = state.cut ? 0.08 : isActive ? 0.6 : isTarget ? 0.5 : isVisited ? 0.4 : 0.16;
        gateInner.opacity = state.cut ? 0.04 : isActive ? 0.3 : isVisited ? 0.2 : 0.08;

        const platform = platforms[i];
        platform.visible = true;
        platform.position.set(point.x, point.y - 0.3, point.z);
        platform.rotation.y = time * 0.12 + i * 0.5;
        platform.scale.setScalar(isActive ? 1.15 + Math.sin(time * 2.4) * 0.05 : 1);
        const [discMat, plateMat, rimMat] = platformMats[i];
        const platformColor = isActive ? palette.hot : isTarget ? palette.hot : palette.base;
        discMat.color.setHex(platformColor);
        plateMat.color.setHex(platformColor);
        rimMat.color.setHex(platformColor);
        discMat.opacity = state.cut ? 0.03 : isActive ? 0.22 : isVisited ? 0.12 : 0.07;
        plateMat.opacity = state.cut ? 0.12 : isActive ? 0.9 : isVisited ? 0.5 : 0.28;
        rimMat.opacity = state.cut ? 0.1 : isActive ? 0.95 : isVisited ? 0.4 : 0.2;

        const beam = beams[i];
        beam.visible = true;
        beam.position.set(point.x, point.y - 0.15, point.z);
        beam.scale.set(1, 0.3, 1);
        beamMats[i].color.setHex(isActive ? palette.hot : palette.base);
        beamMats[i].opacity = state.cut ? 0.06 : isActive ? 0.75 : isVisited ? 0.2 : 0.07;
      }

      for (let i = count; i < nodeCount; i += 1) {
        nodes[i].visible = false;
        halos[i].visible = false;
        gates[i].visible = false;
        platforms[i].visible = false;
        beams[i].visible = false;
        hits[i].visible = false;
      }

      for (let i = 0; i < nodeCount - 1; i += 1) {
        const { core, halo } = segments[i];
        if (i >= count - 1) {
          core.visible = false;
          halo.visible = false;
          continue;
        }
        const cutHere = state.cut && i === count - 2;
        core.visible = !cutHere;
        halo.visible = !cutHere;
        if (cutHere) continue;

        const start = positions[i];
        const end = positions[i + 1];
        const direction = end.clone().sub(start);
        const length = direction.length();
        const middle = start.clone().add(end).multiplyScalar(0.5);
        const rotation = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          direction.clone().normalize(),
        );
        for (const part of [core, halo]) {
          part.position.copy(middle);
          part.quaternion.copy(rotation);
          part.scale.set(1, Math.max(0.001, length), 1);
        }
        const mats = segmentMats[i];
        if (i < active) {
          mats.core.color.setHex(palette.base);
          mats.core.opacity = 0.9;
        } else if (i === active) {
          mats.core.color.setHex(palette.hot);
          mats.core.opacity = 1;
        } else {
          mats.core.color.setHex(palette.base);
          mats.core.opacity = 0.25;
        }
        mats.halo.color.copy(mats.core.color);
        mats.halo.opacity = mats.core.opacity * 0.12;
      }

      if (!state.cut && active < count - 1) {
        const progress = (time * 0.9) % 1;
        const from = positions[active];
        const to = positions[active + 1];
        travelPulse.visible = true;
        travelPulse.position.copy(from).lerp(to, progress);
        (travelPulse.material as THREE.SpriteMaterial).opacity = 0.4;
        travelPulse.scale.setScalar(0.34 + Math.sin(time * 9) * 0.03);
        travelTrail.visible = true;
        travelTrail.position.copy(from).lerp(to, Math.max(0, progress - 0.12));
        (travelTrail.material as THREE.SpriteMaterial).opacity = 0.12;
        travelTrail.scale.setScalar(0.5);
      } else {
        travelPulse.visible = false;
        travelTrail.visible = false;
      }

      const activeNode = nodes[active];
      sparks.forEach((spark, index) => {
        if (state.cut) {
          spark.visible = false;
          return;
        }
        const angle = time * 1.6 + (index / sparks.length) * Math.PI * 2;
        const radius = 0.34 + (index % 2) * 0.1;
        spark.visible = true;
        spark.position.set(
          activeNode.position.x + Math.cos(angle) * radius,
          activeNode.position.y + Math.sin(time * 2.4 + index) * 0.16,
          activeNode.position.z + Math.sin(angle) * radius,
        );
        (spark.material as THREE.SpriteMaterial).opacity = 0.22 + Math.sin(time * 3 + index) * 0.08;
        spark.scale.setScalar(0.12 + (index % 3) * 0.025);
      });

      const activePoint = positions[active];
      shockRings.forEach(({ mesh, mat }, index) => {
        if (state.cut) {
          mat.opacity = 0;
          return;
        }
        const phase = (time * 0.55 + index / shockRings.length) % 1;
        mesh.position.set(activePoint.x, activePoint.y - 0.28, activePoint.z);
        mesh.scale.setScalar(0.4 + phase * 1.5);
        mat.opacity = (1 - phase) * 0.075;
      });

      contextItems.forEach((item, index) => {
        const anchor = positions[index % count];
        const attribute = item.link.geometry.getAttribute("position") as THREE.BufferAttribute;
        attribute.setXYZ(0, item.star.position.x, item.star.position.y, item.star.position.z);
        attribute.setXYZ(1, anchor.x, anchor.y, anchor.z);
        attribute.needsUpdate = true;
        (item.star.material as THREE.MeshBasicMaterial).opacity =
          0.2 + Math.sin(time * 0.5 + index * 1.3) * 0.09;
        (item.link.material as THREE.LineBasicMaterial).opacity =
          0.04 + Math.sin(time * 0.4 + index) * 0.02;
      });

      const targetPoint = positions[count - 1];
      beacon.visible = true;
      beacon.position.copy(targetPoint);
      const reached = active >= count - 1;
      const beaconAlpha = state.cut ? 0.12 : reached ? 0.8 : 0.24;
      beaconMat.opacity = beaconAlpha * 0.4;
      beaconRingMat.opacity = beaconAlpha * 0.55;
      beaconRing.rotation.z = time * 0.5;
      beaconRing.scale.setScalar(1 + Math.sin(time * 1.6) * 0.08);
      (beaconStar.material as THREE.SpriteMaterial).opacity = beaconAlpha * 0.45;
      beaconStar.scale.setScalar(reached ? 0.7 + Math.sin(time * 3) * 0.06 : 0.55);

      cutGroup.visible = state.cut;
      if (count > 1) {
        cutGroup.position.copy(positions[count - 2]).lerp(positions[count - 1], 0.55);
        cutGroup.rotation.z = Math.sin(time * 0.6) * 0.08;
      }
    },
  };
}

/* ---------------------------------------------------------------- atlas */
function buildAtlas(glow: THREE.Texture, accent: number): Built {
  const palette = wirePalette(accent);
  const root = new THREE.Group();
  root.rotation.x = 0.18;

  const pickables: THREE.Object3D[] = [];
  const nodes: THREE.Mesh[] = [];
  const nodeHalos: THREE.Sprite[] = [];
  const count = 16;

  for (let i = 0; i < count; i += 1) {
    const angle = i * 2.399 + 0.3;
    const radius = 0.9 + (i % 8) * 0.34;
    const node = new THREE.Mesh(
      new THREE.OctahedronGeometry(i % 4 === 0 ? 0.22 : 0.17, 0),
      basic(i % 4 === 0 ? palette.hot : palette.base, 0.9),
    );
    node.position.set(
      Math.cos(angle) * radius,
      Math.sin(i * 1.7) * 0.46,
      Math.sin(angle) * radius,
    );
    node.userData.index = i;
    root.add(node);
    nodes.push(node);
    const hit = hitSphere(0.38, i);
    hit.position.copy(node.position);
    root.add(hit);
    pickables.push(hit);
    const halo = sprite(glow, i % 4 === 0 ? palette.hot : palette.base, 0.2, 0.75);
    halo.position.copy(node.position);
    root.add(halo);
    nodeHalos.push(halo);
  }

  const orbiting: THREE.Mesh[] = [];
  for (let i = 0; i < count; i += 1) {
    if (i % 4 !== 0) continue;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.006, 5, 48), basic(palette.hot, 0.35));
    ring.position.copy(nodes[i].position);
    ring.rotation.set(1.1 + i * 0.22, i * 0.7, i * 0.35);
    root.add(ring);
    orbiting.push(ring);
  }

  for (let i = 0; i < count; i += 1) {
    const node = nodes[i];
    const base = new THREE.Vector3(node.position.x, -1.05, node.position.z);
    root.add(line([
      base.clone(),
      new THREE.Vector3(node.position.x, node.position.y, node.position.z),
    ], palette.base, 0.13));
    const dot = new THREE.Mesh(new THREE.OctahedronGeometry(0.035, 0), basic(palette.base, 0.5));
    dot.position.copy(base);
    root.add(dot);
  }

  const nucleus = new THREE.Mesh(new THREE.IcosahedronGeometry(0.24, 1), wire(palette.base, 0.55));
  root.add(nucleus);
  const nucleusGlow = sprite(glow, palette.base, 0.16, 2.2);
  root.add(nucleusGlow);

  const nebula = sprite(glow, palette.base, 0.14, 8);
  nebula.position.set(0, 0.2, -2.4);
  root.add(nebula);

  const motes: THREE.Sprite[] = [];
  for (let i = 0; i < 3; i += 1) {
    const mote = sprite(glow, i === 1 ? palette.hot : palette.base, 0.3, 0.5);
    root.add(mote);
    motes.push(mote);
  }

  const orbitRing = new THREE.Mesh(new THREE.TorusGeometry(3.65, 0.005, 4, 180), basic(palette.hot, 0.1));
  orbitRing.rotation.x = Math.PI / 2;
  orbitRing.position.y = -0.95;
  root.add(orbitRing);

  const orbitRing2 = new THREE.Mesh(new THREE.TorusGeometry(3.95, 0.004, 4, 180), basic(palette.base, 0.12));
  orbitRing2.rotation.x = 1.42;
  root.add(orbitRing2);

  const orbitPulse = sprite(glow, palette.hot, 0.35, 0.7);
  root.add(orbitPulse);
  const orbitPulse2 = sprite(glow, palette.base, 0.3, 0.9);
  root.add(orbitPulse2);

  const arc = (a: THREE.Vector3, b: THREE.Vector3, color: number, opacity: number) => {
    const mid = a.clone().add(b).multiplyScalar(0.5);
    mid.multiplyScalar(1.18);
    mid.y += 0.1;
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    return new THREE.Mesh(
      new THREE.TubeGeometry(curve, 18, 0.011, 4, false),
      basic(color, opacity),
    );
  };

  for (let i = 0; i < count; i += 1) {
    const next = nodes[(i + 1) % count];
    const chord = nodes[(i + 5) % count];
    root.add(arc(nodes[i].position.clone(), next.position.clone(), palette.base, 0.28));
    if (i % 2 === 0) {
      root.add(arc(nodes[i].position.clone(), chord.position.clone(), palette.hot, 0.1));
    }
  }

  const dustCount = 260;
  const dustPositions = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 1.4 + Math.random() * 2.6;
    dustPositions[i * 3] = Math.cos(angle) * radius;
    dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 0.8;
    dustPositions[i * 3 + 2] = Math.sin(angle) * radius;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
  root.add(new THREE.Points(dustGeo, new THREE.PointsMaterial({
    color: palette.base, size: 0.018, transparent: true, opacity: 0.55,
    blending: THREE.AdditiveBlending, depthWrite: false,
  })));

  const grid = new THREE.PolarGridHelper(4.0, 8, 4, 64, palette.base, palette.base);
  const gridMaterial = grid.material as THREE.LineBasicMaterial;
  gridMaterial.transparent = true;
  gridMaterial.opacity = 0.12;
  grid.position.y = -1.1;
  root.add(grid);

  const focusRing = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.01, 6, 64), basic(palette.hot, 0.9));
  focusRing.rotation.x = Math.PI / 2;
  root.add(focusRing);

  const focusRing2 = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.006, 5, 56), basic(palette.base, 0.45));
  focusRing2.rotation.x = 1.2;
  root.add(focusRing2);

  const focusBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1, 5), basic(palette.hot, 0.35));
  root.add(focusBeam);

  const focusGlow = sprite(glow, palette.base, 0.2, 1.0);
  root.add(focusGlow);

  const centerGlow = sprite(glow, palette.base, 0.14, 4.2);
  centerGlow.position.y = -0.2;
  root.add(centerGlow);

  return {
    root,
    pickables,
    update: (time, state) => {
      const focus = Math.max(0, Math.min(count - 1, state.focus));
      centerGlow.material.opacity = 0.1 + Math.sin(time * 0.8) * 0.04;
      nebula.material.opacity = 0.1 + Math.sin(time * 0.45) * 0.03;
      nodes.forEach((node, index) => {
        const pulse = 1 + Math.sin(time * 1.6 + index * 0.8) * 0.16;
        node.scale.setScalar(index === focus ? 1.9 + Math.sin(time * 2.4) * 0.1 : pulse);
        const material = node.material as THREE.MeshBasicMaterial;
        material.opacity = index === focus ? 1 : 0.75 + Math.sin(time * 1.2 + index) * 0.2;
        const halo = nodeHalos[index];
        halo.position.copy(node.position);
        halo.scale.setScalar(index === focus ? 1.15 : 0.55 + Math.sin(time * 1.6 + index) * 0.1);
        (halo.material as THREE.SpriteMaterial).opacity = index === focus ? 0.28 : 0.07 + Math.sin(time * 1.6 + index) * 0.03;
      });
      const focusNode = nodes[focus];
      focusRing.position.copy(focusNode.position);
      focusRing.rotation.z = time * 0.4;
      focusRing2.position.copy(focusNode.position);
      focusRing2.rotation.y = time * 0.5;
      focusRing2.rotation.z = -time * 0.3;
      focusGlow.position.copy(focusNode.position);
      focusGlow.material.opacity = 0.24 + Math.sin(time * 2) * 0.09;
      const beamHeight = Math.max(0.001, focusNode.position.y + 1.05);
      focusBeam.position.set(
        focusNode.position.x,
        focusNode.position.y - beamHeight / 2,
        focusNode.position.z,
      );
      focusBeam.scale.set(1, beamHeight, 1);
      focusBeam.material.opacity = 0.28 + Math.sin(time * 1.6) * 0.1;
      nucleus.rotation.y = time * 0.28;
      nucleus.rotation.x = Math.sin(time * 0.2) * 0.35;
      nucleusGlow.material.opacity = 0.2 + Math.sin(time * 1.1) * 0.06;
      orbiting.forEach((ring, index) => {
        ring.rotation.y = time * (0.18 + index * 0.02) + index * 1.3;
        ring.rotation.z = time * 0.09 + index * 0.6;
        (ring.material as THREE.MeshBasicMaterial).opacity = 0.22 + Math.sin(time * 1.4 + index) * 0.08;
      });
      motes.forEach((mote, index) => {
        const angle = time * (0.2 + index * 0.06) + index * 2.2;
        const radius = 1.35 + index * 0.62;
        mote.position.set(
          Math.cos(angle) * radius,
          0.36 + Math.sin(time * 0.6 + index * 1.7) * 0.24,
          Math.sin(angle) * radius,
        );
        (mote.material as THREE.SpriteMaterial).opacity = 0.2 + Math.sin(time * 0.9 + index) * 0.08;
      });
      const orbitAngle = time * 0.32;
      orbitPulse.position.set(Math.cos(orbitAngle) * 3.65, -0.9, Math.sin(orbitAngle) * 3.65);
      (orbitPulse.material as THREE.SpriteMaterial).opacity = 0.22 + Math.sin(time * 2) * 0.08;
      orbitPulse.scale.setScalar(0.55 + Math.sin(time * 2.2) * 0.08);
      orbitPulse2.position.set(Math.cos(orbitAngle + Math.PI) * 3.65, -0.9, Math.sin(orbitAngle + Math.PI) * 3.65);
      (orbitPulse2.material as THREE.SpriteMaterial).opacity = 0.2 + Math.sin(time * 1.7) * 0.07;
      orbitRing2.rotation.z = time * 0.04;
    },
  };
}

/* ---------------------------------------------------------------- prism */
function buildPrism(glow: THREE.Texture, accent: number): Built {
  const palette = wirePalette(accent);
  const root = new THREE.Group();
  root.rotation.x = 0.12;

  const outer = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(2.4, 3.5, 2.4)),
    new THREE.LineBasicMaterial({
      color: palette.hot, transparent: true, opacity: 0.6,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }),
  );
  root.add(outer);

  const inner = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(1.75, 2.7, 1.75)),
    new THREE.LineBasicMaterial({
      color: palette.base, transparent: true, opacity: 0.5,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }),
  );
  root.add(inner);

  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(2.15, 3.15, 2.15),
    new THREE.MeshBasicMaterial({
      color: palette.base, transparent: true, opacity: 0.035, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }),
  );
  root.add(glass);

  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 4.2, 6),
    basic(palette.hot, 0.28),
  );
  root.add(beam);

  const halos: THREE.Mesh[] = [];
  for (let i = 0; i < 3; i += 1) {
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(1.95, 0.006, 6, 120),
      basic(i === 1 ? palette.hot : palette.base, 0.2),
    );
    halo.rotation.x = Math.PI / 2;
    halo.position.y = -1.4 + i * 1.4;
    root.add(halo);
    halos.push(halo);
  }

  const scan = new THREE.Mesh(
    new THREE.PlaneGeometry(2.45, 2.45),
    new THREE.MeshBasicMaterial({
      color: palette.base, transparent: true, opacity: 0.08, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }),
  );
  scan.rotation.x = -Math.PI / 2;
  root.add(scan);

  const scanLine = new THREE.Mesh(
    new THREE.BoxGeometry(2.45, 0.008, 0.008),
    basic(palette.hot, 0.8),
  );
  root.add(scanLine);

  const core = sprite(glow, palette.base, 0.6, 2.4);
  root.add(core);

  const motes: THREE.Mesh[] = [];
  for (let i = 0; i < 12; i += 1) {
    const mote = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.07), basic(i % 3 === 0 ? palette.hot : palette.base, 0.6));
    root.add(mote);
    motes.push(mote);
  }

  return {
    root,
    update: (time) => {
      const scanY = -1.5 + ((Math.sin(time * 0.55) + 1) / 2) * 3.0;
      scan.position.y = scanY;
      scanLine.position.y = scanY;
      inner.rotation.y = time * 0.18;
      inner.rotation.x = Math.sin(time * 0.2) * 0.06;
      core.material.opacity = 0.35 + Math.sin(time * 1.4) * 0.12;
      halos.forEach((halo, index) => {
        halo.rotation.z = time * (index % 2 === 0 ? 0.1 : -0.08);
        (halo.material as THREE.MeshBasicMaterial).opacity = 0.12 + Math.sin(time * 0.8 + index) * 0.06;
      });
      motes.forEach((mote, index) => {
        const angle = time * 0.25 + index * 1.7;
        const radius = 1.8 + (index % 3) * 0.3;
        mote.position.set(
          Math.cos(angle) * radius,
          Math.sin(index * 1.2 + time * 0.4) * 1.5,
          Math.sin(angle) * radius,
        );
        mote.rotation.x = time * 0.6;
        mote.rotation.y = time * 0.4;
      });
    },
  };
}

/* ---------------------------------------------------------------- bloom */
function buildBloom(glow: THREE.Texture, accent: number): Built {
  const palette = wirePalette(accent);
  const root = new THREE.Group();
  root.rotation.x = 0.2;

  const rings: THREE.Group[] = [];
  const nodes: THREE.Mesh[] = [];
  const nodeHalos: THREE.Sprite[] = [];
  const pickables: THREE.Object3D[] = [];
  const rotations = [
    [0, 0, 0], [0, Math.PI / 3, 0], [0, (Math.PI * 2) / 3, 0],
    [Math.PI / 3, 0, 0], [Math.PI / 3, Math.PI / 3, 0], [Math.PI / 3, (Math.PI * 2) / 3, 0],
  ];

  rotations.forEach((rotation, ringIndex) => {
    const ring = new THREE.Group();
    ring.rotation.set(rotation[0], rotation[1], rotation[2]);
    const torus = new THREE.Mesh(new THREE.TorusGeometry(2.15, 0.012, 6, 140), basic(ringIndex % 2 === 0 ? palette.hot : palette.base, 0.42));
    ring.add(torus);
    for (let i = 0; i < 3; i += 1) {
      const angle = (i / 3) * Math.PI * 2 + ringIndex * 0.4;
      const node = new THREE.Mesh(new THREE.OctahedronGeometry(0.075, 0), basic(i === 0 ? palette.base : palette.hot, 0.8));
      node.position.set(Math.cos(angle) * 2.15, Math.sin(angle) * 2.15, 0);
      node.userData.index = nodes.length;
      ring.add(node);
      nodes.push(node);
      const hit = hitSphere(0.34, node.userData.index);
      hit.position.copy(node.position);
      ring.add(hit);
      pickables.push(hit);
      const halo = sprite(glow, i === 0 ? palette.base : palette.hot, 0.18, 0.6);
      halo.position.copy(node.position);
      ring.add(halo);
      nodeHalos.push(halo);
    }
    root.add(ring);
    rings.push(ring);
  });

  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 1), wire(palette.hot, 0.5));
  root.add(core);
  const coreGlow = sprite(glow, palette.base, 0.16, 1.6);
  root.add(coreGlow);

  return {
    root,
    pickables,
    update: (time, state) => {
      rings.forEach((ring, index) => {
        ring.rotation.z = time * (index % 2 === 0 ? 0.12 : -0.09) + index * 0.3;
      });
      core.rotation.y = time * 0.2;
      coreGlow.material.opacity = 0.4 + Math.sin(time * 1.6) * 0.12;
      const focus = Math.max(0, Math.min(nodes.length - 1, state.focus));
      nodes.forEach((node, index) => {
        const pulse = 1 + Math.sin(time * 2 + index) * 0.18;
        node.scale.setScalar(index === focus ? 1.9 : pulse);
        (node.material as THREE.MeshBasicMaterial).opacity = index === focus ? 1 : 0.65;
        const halo = nodeHalos[index];
        halo.scale.setScalar(index === focus ? 1.4 : 0.5 + Math.sin(time * 2 + index) * 0.1);
        (halo.material as THREE.SpriteMaterial).opacity = index === focus ? 0.55 : 0.12;
      });
    },
  };
}

/* ---------------------------------------------------------------- stack */
function buildStack(accent: number): Built {
  const palette = wirePalette(accent);
  const root = new THREE.Group();
  root.rotation.x = 0.3;

  const layers: THREE.Mesh[] = [];
  const outlines: THREE.LineSegments[] = [];
  for (let i = 0; i < 5; i += 1) {
    const width = 3.5 - i * 0.22;
    const depth = 2.4 - i * 0.16;
    const geometry = new THREE.PlaneGeometry(width, depth, 10, 7);
    const layer = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
      color: i === 4 ? palette.hot : palette.base,
      wireframe: true,
      transparent: true,
      opacity: i === 4 ? 0.36 : 0.22,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    }));
    layer.rotation.x = -Math.PI / 2;
    root.add(layer);
    layers.push(layer);
    const outline = new THREE.LineSegments(
      new THREE.EdgesGeometry(geometry),
      new THREE.LineBasicMaterial({
        color: i === 4 ? palette.hot : palette.base,
        transparent: true,
        opacity: i === 4 ? 0.5 : 0.28,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    outline.rotation.x = -Math.PI / 2;
    root.add(outline);
    outlines.push(outline);
  }

  const connectors: THREE.Line[] = [];
  for (const x of [-1.5, 1.5]) {
    for (const z of [-1, 1]) {
      const connector = line([
        new THREE.Vector3(x, -1.5, z),
        new THREE.Vector3(x, 1.7, z),
      ], palette.base, 0.12);
      root.add(connector);
      connectors.push(connector);
    }
  }

  const beam = new THREE.Mesh(
    new THREE.PlaneGeometry(4.4, 3.1),
    new THREE.MeshBasicMaterial({
      color: palette.base, transparent: true, opacity: 0.06, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }),
  );
  beam.rotation.x = -Math.PI / 2;
  root.add(beam);

  return {
    root,
    update: (time) => {
      layers.forEach((layer, index) => {
        const separation = Math.sin(time * 0.55 + index * 0.4) * 0.1;
        layer.position.y = -1.5 + index * 0.75 + separation;
        layer.rotation.z = Math.sin(time * 0.2 + index) * 0.02;
        (layer.material as THREE.MeshBasicMaterial).opacity = index === 4 ? 0.4 : 0.16 + Math.sin(time * 0.8 + index) * 0.06;
        const outline = outlines[index];
        outline.position.y = layer.position.y;
        outline.rotation.z = layer.rotation.z;
        (outline.material as THREE.LineBasicMaterial).opacity = index === 4 ? 0.55 : 0.24;
      });
      const y = -1.4 + ((Math.sin(time * 0.4) + 1) / 2) * 3.0;
      beam.position.y = y;
      connectors.forEach((connector) => {
        const material = connector.material as THREE.LineBasicMaterial;
        material.opacity = 0.08 + Math.sin(time * 0.6) * 0.04;
      });
    },
  };
}
/* ---------------------------------------------------------------- drift */
function buildDrift(glow: THREE.Texture, accent: number): Built {
  const palette = wirePalette(accent);
  const root = new THREE.Group();
  root.rotation.x = 0.06;
  root.position.y = 0.22;

  const panelMats: THREE.MeshBasicMaterial[] = [];
  const nodes: THREE.Mesh[] = [];
  const nodeMats: THREE.MeshBasicMaterial[] = [];
  const connectorMats: THREE.LineBasicMaterial[] = [];

  const points: [number, number][] = [
    [-0.62, 1.3],
    [0.5, 0.94],
    [-0.24, 0.4],
    [0.58, -0.12],
    [-0.5, -0.64],
    [0.18, -1.14],
    [-0.12, -1.52],
  ];
  const spread = 1.3;

  for (const side of [-1, 1]) {
    const panelMat = wire(palette.base, 0.22);
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 4.0, 6, 8), panelMat);
    panel.position.set(side * spread, 0, 0);
    panel.rotation.y = side * -0.07;
    root.add(panel);
    panelMats.push(panelMat);

    for (const [px, py] of points) {
      const nodeMat = basic(palette.base, 0.7);
      const node = new THREE.Mesh(new THREE.OctahedronGeometry(0.095, 0), nodeMat);
      node.position.set(side * spread + px, py, 0.02);
      root.add(node);
      nodes.push(node);
      nodeMats.push(nodeMat);
    }
  }

  for (let index = 0; index < points.length; index += 1) {
    const a = nodes[index];
    const b = nodes[index + points.length];
    const mat = new THREE.LineBasicMaterial({
      color: palette.base, transparent: true, opacity: 0.25,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const connector = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([a.position.clone(), b.position.clone()]),
      mat,
    );
    root.add(connector);
    connectorMats.push(mat);
  }

  const seam = line([
    new THREE.Vector3(0, -1.98, 0),
    new THREE.Vector3(0, 1.98, 0),
  ], palette.hot, 0.2);
  root.add(seam);

  // The floor holds both snapshots; the bar reads them line by line.
  const baseMat = wire(palette.base, 0.14);
  const base = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 1.7, 6, 4), baseMat);
  base.rotation.x = -Math.PI / 2;
  base.position.y = -2.06;
  root.add(base);

  const scanMat = basic(palette.hot, 0.32);
  const scan = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 0.015), scanMat);
  scan.position.z = 0.03;
  root.add(scan);

  const pulse = sprite(glow, palette.hot, 0.5, 0.85);
  root.add(pulse);

  const rings: THREE.Mesh[] = [];
  for (const y of [1.98]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.62, 0.006, 4, 90), basic(palette.base, 0.2));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    root.add(ring);
    rings.push(ring);
  }

  return {
    root,
    update: (time, state) => {
      const added = Math.max(0, Math.min(points.length, state.count));
      const removed = Math.max(0, Math.min(points.length - added, state.focus));
      panelMats.forEach((mat) => {
        mat.opacity = 0.16 + Math.sin(time * 0.7) * 0.04;
      });
      nodes.forEach((node, index) => {
        const isNew = index % points.length < added;
        const isOld = index % points.length >= points.length - removed;
        const mat = nodeMats[index];
        mat.color.setHex(isNew ? palette.pale : isOld ? palette.hot : palette.base);
        mat.opacity = 0.5 + Math.sin(time * 1.4 + index) * 0.2;
        node.scale.setScalar(1 + Math.sin(time * 1.8 + index) * 0.12);
      });
      connectorMats.forEach((mat, index) => {
        const isNew = index < added;
        const isOld = index >= points.length - removed;
        mat.color.setHex(isNew ? palette.pale : isOld ? palette.hot : palette.base);
        mat.opacity = isNew ? 0.85 : isOld ? 0.6 : 0.14;
      });
      const scanY = -1.95 + ((time * 0.22) % 1) * 3.9;
      scan.position.y = scanY;
      scanMat.opacity = 0.22 + Math.abs(Math.sin(time * 0.5)) * 0.16;
      const pulseY = -1.9 + ((time * 0.34) % 1) * 3.8;
      pulse.position.set(0, pulseY, 0);
      pulse.material.opacity = 0.35 + Math.sin(time * 2) * 0.1;
      pulse.scale.setScalar(0.55 + Math.sin(time * 3) * 0.06);
      rings.forEach((ring, index) => {
        ring.rotation.z = time * (index === 0 ? 0.1 : -0.08);
        (ring.material as THREE.MeshBasicMaterial).opacity = 0.12 + Math.sin(time * 0.9 + index) * 0.05;
      });
    },
  };
}

/* ---------------------------------------------------------------- orrery */
interface OrrerySpec {
  core: number;
  body: number;
  rings: number[];
  bodies: number;
  star?: boolean;
  hole?: boolean;
  band?: boolean;
  links?: boolean;
  dust?: number;
  tilt?: number;
  stack?: boolean;
  sweep?: boolean;
  beam?: boolean;
  pulsar?: boolean;
}

const ORRERY: Record<Exclude<FigureVariant, "drift" | "horizon">, OrrerySpec> = {
  orb: { core: 1.72, body: 0.1, rings: [2.55, 3.05], bodies: 7, dust: 90, tilt: 0.38 },
  dish: { core: 1.5, body: 0.085, rings: [2.15], bodies: 16, band: true, dust: 50, tilt: 0.34, sweep: true },
  ascent: {
    core: 0.34,
    body: 0.13,
    rings: [1.05, 1.35, 1.65, 1.95, 2.25, 2.55, 2.85, 3.15],
    bodies: 8,
    star: true,
    hole: true,
    links: true,
    dust: 70,
    tilt: 0.3,
  },
  atlas: { core: 0.34, body: 0.13, rings: [1.2, 1.8, 2.4], bodies: 16, star: true, links: true, dust: 80, tilt: 0.34 },
  prism: { core: 0.5, body: 0.075, rings: [1.95, 2.45], bodies: 10, pulsar: true, dust: 40, tilt: 0.16 },
  bloom: {
    core: 1.15,
    body: 0.075,
    rings: [1.55, 1.85, 2.15, 2.45, 2.75, 3.05],
    bodies: 18,
    band: true,
    dust: 60,
    tilt: 0.4,
  },
  stack: {
    core: 0.95,
    body: 0.09,
    rings: [1.4, 1.8, 2.2, 2.6, 3.0],
    bodies: 5,
    stack: true,
    dust: 55,
    tilt: 0.12,
    beam: true,
  },
};

const PLANET_CAMERA: Record<FigureVariant, Partial<{
  position: [number, number, number];
  look: [number, number, number];
  fov: number;
  auto: number;
  span: number;
}>> = {
  orb: { position: [0, 1.4, 10.6], look: [0, 0.1, 0] },
  dish: { position: [0, 1.9, 9.4], look: [0, 0.1, 0] },
  ascent: { position: [0, 1.2, 9.6], look: [0, 0, 0], span: 3.4 },
  atlas: { position: [0, 2.8, 7.2], look: [0, 0.1, 0], span: 3.3 },
  drift: { position: [0, 0.5, 7.6], look: [0, 0, 0] },
  prism: { position: [0, 0.9, 8.4], look: [0, 0, 0] },
  bloom: { position: [0, 1.6, 9.6], look: [0, 0, 0], span: 3.3 },
  stack: { position: [0, 1.0, 8.8], look: [0, 0, 0], span: 3.0 },
  horizon: { position: [0, 1.4, 8.4], look: [0, 0, 0], span: 2.8 },
};

function gloss(color: number, roughness = 0.26, metalness = 0.28) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    emissive: new THREE.Color(color).multiplyScalar(0.1),
    emissiveIntensity: 0.7,
  });
}

function rimShell(radius: number, color = 0x8db7ff, power = 2.6) {
  return new THREE.Mesh(
    new THREE.SphereGeometry(radius, 48, 32),
    new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color(color) }, uPower: { value: power } },
      vertexShader: `
        varying vec3 vN;
        varying vec3 vV;
        void main() {
          vN = normalize(normalMatrix * normal);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vV = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uPower;
        varying vec3 vN;
        varying vec3 vV;
        void main() {
          float rim = pow(1.0 - abs(dot(vN, vV)), uPower);
          gl_FragColor = vec4(uColor, rim * 0.9);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.FrontSide,
    }),
  );
}

function ringLine(radius: number, color: number, opacity: number, y = 0) {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= 180; i += 1) {
    const angle = (i / 180) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius));
  }
  return line(points, color, opacity);
}

function curveLink(a: THREE.Vector3, b: THREE.Vector3, bulge: number, color: number, opacity: number) {
  const mid = a.clone().add(b).multiplyScalar(0.5);
  const outward = mid.clone().setY(0).normalize().multiplyScalar(bulge);
  const curve = new THREE.QuadraticBezierCurve3(a.clone(), mid.add(outward), b.clone());
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(curve.getPoints(24)),
    new THREE.LineBasicMaterial({
      color, transparent: true, opacity,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }),
  );
}

function sunBody(radius: number, glow: THREE.Texture) {
  const group = new THREE.Group();
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 48, 32),
    new THREE.MeshStandardMaterial({
      color: 0xfff1d6,
      emissive: 0xffd9a0,
      emissiveIntensity: 1.0,
      roughness: 0.4,
    }),
  );
  const halo = sprite(glow, 0xffe3b0, 0.38, radius * 8);
  const inner = sprite(glow, 0xfff4dc, 0.28, radius * 3.1);
  group.add(core, halo, inner);
  return { group, core, halo, inner };
}

function holeBody(radius: number, glow: THREE.Texture, accent: number) {
  const group = new THREE.Group();
  const horizon = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 48, 32),
    new THREE.MeshBasicMaterial({ color: 0x000000 }),
  );
  horizon.renderOrder = 3;

  const photon = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 1.06, radius * 0.02, 8, 160),
    basic(0xffffff, 0.95),
  );
  photon.rotation.x = Math.PI / 2;
  photon.renderOrder = 4;

  const photonCyan = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 1.18, radius * 0.008, 6, 160),
    basic(accent, 0.6),
  );
  photonCyan.rotation.x = Math.PI / 2;
  photonCyan.renderOrder = 4;

  const lens = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 1.36, radius * 0.006, 6, 160, Math.PI * 1.25),
    basic(BONE, 0.55),
  );
  lens.rotation.set(1.15, 0.35, -0.4);
  lens.renderOrder = 4;

  const diskMats: THREE.MeshBasicMaterial[] = [];
  const disk = new THREE.Group();
  const diskShader = new THREE.ShaderMaterial({
    uniforms: {
      uAccent: { value: new THREE.Color(accent) },
      uTime: { value: 0 },
    },
    vertexShader: `
      varying vec2 vPos;
      void main() {
        vPos = position.xy;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uAccent;
      uniform float uTime;
      varying vec2 vPos;
      void main() {
        float r = length(vPos);
        float inner = 0.86;
        float outer = 2.55;
        float t = clamp((r - inner) / (outer - inner), 0.0, 1.0);
        float angle = atan(vPos.y, vPos.x);
        float bands = 0.5 + 0.5 * sin(angle * 11.0 + r * 17.0 - uTime * 2.4);
        float fine = 0.5 + 0.5 * sin(angle * 29.0 - r * 31.0 + uTime * 1.3);
        float hot = smoothstep(0.42, 1.0, bands) * (1.0 - t * 0.55);
        float doppler = 0.55 + 0.55 * cos(angle + 0.7);
        vec3 warm = vec3(1.0, 0.86, 0.68);
        vec3 col = mix(uAccent, warm, hot * 0.8);
        float edge = smoothstep(0.0, 0.12, t) * (1.0 - smoothstep(0.68, 1.0, t));
        float alpha = edge * (0.28 + bands * 0.34 + fine * 0.08) * doppler;
        gl_FragColor = vec4(col * (0.8 + hot * 1.7), alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const diskPlane = new THREE.Mesh(new THREE.RingGeometry(radius * 1.22, radius * 3.2, 180, 40), diskShader);
  diskPlane.rotation.x = -Math.PI / 2;
  diskPlane.renderOrder = 2;
  disk.add(diskPlane);

  for (let i = 0; i < 4; i += 1) {
    const inner = radius * (1.3 + i * 0.34);
    const outer = inner + radius * 0.08;
    const color = i % 2 === 0 ? BONE : accent;
    const mat = basic(color, 0.28 - i * 0.045);
    const ring = new THREE.Mesh(new THREE.RingGeometry(inner, outer, 160), mat);
    ring.rotation.x = -Math.PI / 2;
    disk.add(ring);
    diskMats.push(mat);
  }
  disk.rotation.z = 0.22;
  disk.renderOrder = 2;

  const halo = sprite(glow, BONE, 0.55, radius * 9);
  group.add(halo, disk, horizon, photon, photonCyan, lens);
  return { group, disk, diskMats, diskShader, halo, horizon, photon, photonCyan, lens };
}

function buildOrrery(variant: Exclude<FigureVariant, "drift" | "horizon">, glow: THREE.Texture, accent: number): Built {
  const spec = ORRERY[variant];
  const root = new THREE.Group();
  const system = new THREE.Group();
  system.rotation.x = spec.tilt ?? 0.32;
  root.add(system);

  const rings = spec.rings.map((radius, index) => {
    const y = spec.stack ? -1.0 + index * 0.5 : 0;
    const ring = ringLine(radius, index % 2 === 0 ? accent : BONE, spec.stack ? 0.2 : 0.13, y);
    if (spec.stack) ring.rotation.x = (index % 2 === 0 ? 1 : -1) * 0.18;
    system.add(ring);
    return ring;
  });

  if (spec.band) {
    for (let i = 0; i < 3; i += 1) {
      const mat = basic(i % 2 ? accent : BONE, 0.09 - i * 0.02);
      const mesh = new THREE.Mesh(
        new THREE.RingGeometry(spec.core * 1.85 + i * 0.14, spec.core * 2.15 + i * 0.14, 160),
        mat,
      );
      mesh.rotation.x = -Math.PI / 2;
      system.add(mesh);
    }
    for (let i = 0; i < 7; i += 1) {
      if (i === 3) continue;
      const radius = spec.core * (1.62 + i * 0.13);
      const mesh = new THREE.Mesh(
        new THREE.RingGeometry(radius, radius + 0.007, 160),
        basic(i % 2 ? accent : BONE, 0.18 - i * 0.018),
      );
      mesh.rotation.x = -Math.PI / 2;
      system.add(mesh);
    }
  }

  let coreMesh: THREE.Mesh | null = null;
  let sun: ReturnType<typeof sunBody> | null = null;
  let hole: ReturnType<typeof holeBody> | null = null;
  let pulsar: THREE.Group | null = null;

  if (spec.pulsar) {
    pulsar = new THREE.Group();
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(spec.core, 48, 32),
      basic(0xfffdf6, 1),
    );
    const halo = sprite(glow, accent, 0.85, spec.core * 7.5);
    pulsar.add(core, halo);
    for (const dir of [-1, 1]) {
      const beam = new THREE.Mesh(
        new THREE.ConeGeometry(spec.core * 0.72, 6.4, 24, 1, true),
        basic(dir > 0 ? BONE : accent, 0.18),
      );
      beam.position.y = dir * 3.2;
      beam.rotation.z = dir > 0 ? Math.PI : 0;
      pulsar.add(beam);
    }
    for (let i = 0; i < 2; i += 1) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(spec.core * (1.6 + i * 0.55), 0.008, 5, 96),
        basic(i === 0 ? accent : BONE, 0.3),
      );
      ring.rotation.x = 1.1 + i * 0.28;
      ring.rotation.z = 0.4 - i * 0.2;
      pulsar.add(ring);
    }
    system.add(pulsar);
  } else if (spec.star) {
    sun = sunBody(spec.core, glow);
    system.add(sun.group);
  } else {
    coreMesh = new THREE.Mesh(new THREE.SphereGeometry(spec.core, 96, 64), gloss(0x2a3247, 0.4, 0.22));
    system.add(coreMesh, rimShell(spec.core * 1.015, accent));
  }
  if (spec.hole) {
    hole = holeBody(spec.core * 1.5, glow, accent);
    hole.group.visible = false;
    system.add(hole.group);
  }

  const beam = spec.beam
    ? new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 5.6, 10), basic(accent, 0.26))
    : null;
  if (beam) system.add(beam);

  const bodies: Array<{
    mesh: THREE.Mesh;
    mat: THREE.MeshStandardMaterial;
    halo: THREE.Sprite;
    base: number;
  }> = [];
  const selectors: THREE.Mesh[] = [];
  const positions: THREE.Vector3[] = [];
  const pickables: THREE.Object3D[] = [];

  for (let i = 0; i < spec.bodies; i += 1) {
    const ringIndex = i % spec.rings.length;
    const radius = spec.rings[ringIndex];
    const angle = (i / spec.bodies) * Math.PI * 2 + ringIndex * 0.7;
    const y = spec.stack ? -1.0 + ringIndex * 0.5 : 0;
    const pos = new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    positions.push(pos);

    const color = i === 0 && !spec.star ? BONE : [accent, BONE, VIOLET, MINT, AMBER, 0x7b86c9][i % 6];
    const mat = gloss(color, 0.28, 0.24);
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(spec.body, 24, 18), mat);
    mesh.position.copy(pos);
    const halo = sprite(glow, color, 0.4, spec.body * 6);
    halo.position.copy(pos);
    const hit = hitSphere(spec.body * 2.8, i);
    hit.position.copy(pos);
    const selector = new THREE.Mesh(
      new THREE.TorusGeometry(spec.body * 2.4, 0.008, 6, 48),
      basic(0xffffff, 0.9),
    );
    selector.position.copy(pos);
    selector.rotation.x = Math.PI / 2;
    selector.visible = false;
    system.add(mesh, halo, hit, selector);
    pickables.push(hit);
    selectors.push(selector);
    bodies.push({ mesh, mat, halo, base: spec.body });
  }

  const numbers: THREE.Sprite[] = [];
  if (variant === "ascent") {
    positions.forEach((pos, index) => {
      const badge = numberSprite(index + 1, accent);
      badge.position.copy(pos).add(new THREE.Vector3(0, 0.34, 0));
      system.add(badge);
      numbers.push(badge);
    });
  }

  let sweep: THREE.Mesh | null = null;
  let routeCurve: THREE.CatmullRomCurve3 | null = null;
  let routePulse: THREE.Sprite | null = null;
  if (spec.links) {
    if (variant === "ascent" && positions.length > 2) {
      routeCurve = new THREE.CatmullRomCurve3(positions);
      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(routeCurve, 160, 0.022, 6, false),
        basic(accent, 0.8),
      );
      system.add(tube);
      routePulse = sprite(glow, BONE, 0.9, 0.4);
      system.add(routePulse);
    } else {
      for (let i = 0; i < positions.length - 1; i += 1) {
        system.add(curveLink(positions[i], positions[i + 1], 0.4, VIOLET, 0.24));
      }
    }
  }
  if (spec.sweep) {
    sweep = new THREE.Mesh(
      new THREE.RingGeometry(spec.rings[0] * 0.88, spec.rings[0], 64, 1, 0, Math.PI / 3),
      basic(accent, 0.32),
    );
    sweep.rotation.x = -Math.PI / 2;
    system.add(sweep);
  }

  if (spec.dust) {
    const dustPositions = new Float32Array(spec.dust * 3);
    for (let i = 0; i < spec.dust; i += 1) {
      const r = 3.3 + Math.random() * 3.4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      dustPositions[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
      dustPositions[i * 3 + 1] = Math.cos(phi) * r * 0.6;
      dustPositions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * r;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
    root.add(new THREE.Points(geo, new THREE.PointsMaterial({
      color: accent, size: 0.035, transparent: true, opacity: 0.55,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })));
  }

  const key = new THREE.DirectionalLight(0xe6efff, 3.4);
  key.position.set(-5, 6, 8);
  const fill = new THREE.PointLight(accent, 18, 30);
  fill.position.set(4, -2, 6);
  const highlight = new THREE.PointLight(0xffffff, 12, 18);
  highlight.position.set(-3, 3, 7);
  root.add(key, fill, highlight, new THREE.AmbientLight(0x223055, 0.45));

  let cutAmount = spec.hole ? 0 : 1;

  return {
    root,
    pickables,
    update: (time, state) => {
      system.rotation.y = time * (spec.stack ? 0.05 : 0.085);
      rings.forEach((ring, index) => {
        const mat = ring.material as THREE.LineBasicMaterial;
        mat.opacity = (spec.stack ? 0.18 : 0.11) + Math.sin(time * 0.8 + index) * 0.04;
      });
      if (coreMesh) coreMesh.rotation.y = time * 0.06;
      if (sun) {
        sun.halo.scale.setScalar(spec.core * (7.2 + Math.sin(time * 1.2) * 0.3));
        sun.inner.scale.setScalar(spec.core * (3.2 + Math.sin(time * 1.8) * 0.14));
      }
      if (pulsar) {
        pulsar.rotation.y = time * 0.65;
        pulsar.children.forEach((child, index) => {
          if (index < 2) return;
          const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
          mat.opacity = 0.12 + Math.abs(Math.sin(time * 0.9 + index)) * 0.16;
        });
      }
      bodies.forEach((body, index) => {
        const active = index === state.active;
        const focus = index === state.focus;
        body.mesh.scale.setScalar(active ? 2.1 : focus ? 1.55 : 1);
        body.halo.scale.setScalar(
          body.base * (active ? 11 : focus ? 8 : 6) * (0.92 + Math.sin(time * 1.6 + index) * 0.08),
        );
        body.mat.emissiveIntensity = active ? 2.2 : focus ? 1.6 : 0.7;
        (body.halo.material as THREE.SpriteMaterial).opacity = active ? 0.85 : focus ? 0.6 : 0.34;
      });
      selectors.forEach((selector, index) => {
        const active = index === state.active;
        const focus = index === state.focus;
        selector.visible = active || focus;
        if (selector.visible) {
          selector.scale.setScalar(1 + Math.sin(time * 2.2) * 0.16);
          const mat = selector.material as THREE.MeshBasicMaterial;
          mat.color.setHex(active ? BONE : accent);
          mat.opacity = active ? 0.95 : 0.6;
        }
      });
      numbers.forEach((badge, index) => {
        badge.scale.setScalar(index === state.active ? 0.5 : 0.38);
        (badge.material as THREE.SpriteMaterial).opacity = 0.95;
      });
      if (sweep) sweep.rotation.z = -time * 0.5;
      if (routeCurve && routePulse) {
        const pulse = routeCurve.getPointAt((time * 0.055) % 1);
        routePulse.position.copy(pulse);
        (routePulse.material as THREE.SpriteMaterial).opacity = 0.55 + Math.sin(time * 2.4) * 0.2;
        routePulse.scale.setScalar(0.34 + Math.sin(time * 3) * 0.04);
      }
      if (beam) {
        (beam.material as THREE.MeshBasicMaterial).opacity = 0.18 + Math.sin(time * 1.3) * 0.08;
      }
      if (hole) {
        cutAmount += ((state.cut ? 1 : 0) - cutAmount) * 0.08;
        hole.group.visible = cutAmount > 0.02;
        hole.group.scale.setScalar(0.55 + cutAmount * 0.45);
        hole.disk.rotation.y = time * 0.6;
        hole.diskShader.uniforms.uTime.value = time;
        hole.diskMats.forEach((mat, index) => {
          mat.opacity = (0.28 - index * 0.045) * cutAmount;
        });
        (hole.photon.material as THREE.MeshBasicMaterial).opacity = 0.95 * cutAmount;
        (hole.photonCyan.material as THREE.MeshBasicMaterial).opacity = 0.6 * cutAmount;
        (hole.lens.material as THREE.MeshBasicMaterial).opacity = 0.5 * cutAmount;
        (hole.halo.material as THREE.SpriteMaterial).opacity = 0.5 * cutAmount;
        if (sun) {
          sun.group.visible = cutAmount < 0.9;
          sun.group.scale.setScalar(Math.max(0.05, 1 - cutAmount));
        }
        bodies.forEach((body) => {
          body.mat.emissiveIntensity *= 1 - cutAmount * 0.55;
        });
        numbers.forEach((badge) => {
          (badge.material as THREE.SpriteMaterial).opacity = 0.9 * (1 - cutAmount * 0.75);
        });
      }
    },
  };
}

function buildHorizon(glow: THREE.Texture, mode: FigureMode, accent: number): Built {
  const root = new THREE.Group();
  root.rotation.x = 0.16;

  if (mode === "wireframe") {
    const palette = wirePalette(accent);
    const core = new THREE.Mesh(new THREE.SphereGeometry(1.08, 32, 24), wire(palette.hot, 0.55));
    const shell = new THREE.Mesh(new THREE.SphereGeometry(1.16, 20, 14), wire(palette.base, 0.24));
    const rings: THREE.Mesh[] = [];
    for (let i = 0; i < 3; i += 1) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.5 + i * 0.36, 0.008, 4, 110),
        basic(i % 2 ? palette.base : palette.pale, 0.42 - i * 0.08),
      );
      ring.rotation.x = Math.PI / 2 + (i - 1) * 0.16;
      root.add(ring);
      rings.push(ring);
    }
    root.add(core, shell);
    return {
      root,
      update: (time) => {
        core.rotation.y = time * 0.1;
        shell.rotation.y = -time * 0.06;
        rings.forEach((ring, index) => {
          ring.rotation.z = time * (index % 2 ? -0.12 : 0.1);
          (ring.material as THREE.MeshBasicMaterial).opacity = 0.3 + Math.sin(time * 0.9 + index) * 0.1;
        });
      },
    };
  }

  const hole = holeBody(1.05, glow, accent);
  root.add(hole.group);

  const ring = ringLine(2.5, accent, 0.2);
  root.add(ring);

  const moonOrbit = new THREE.Group();
  const moon = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 18), gloss(BONE, 0.3, 0.2));
  moon.position.set(2.5, 0, 0);
  const moonHalo = sprite(glow, BONE, 0.42, 0.9);
  moonHalo.position.copy(moon.position);
  moonOrbit.add(moon, moonHalo);
  root.add(moonOrbit);

  const dustPositions = new Float32Array(70 * 3);
  for (let i = 0; i < 70; i += 1) {
    const r = 2.9 + Math.random() * 3.4;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    dustPositions[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
    dustPositions[i * 3 + 1] = Math.cos(phi) * r * 0.6;
    dustPositions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * r;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
  root.add(new THREE.Points(dustGeo, new THREE.PointsMaterial({
    color: accent, size: 0.035, transparent: true, opacity: 0.5,
    blending: THREE.AdditiveBlending, depthWrite: false,
  })));

  const key = new THREE.DirectionalLight(0xe6efff, 3.2);
  key.position.set(-5, 6, 8);
  root.add(key, new THREE.AmbientLight(0x223055, 0.4));

  return {
    root,
    update: (time) => {
      hole.disk.rotation.y = time * 0.7;
      hole.diskShader.uniforms.uTime.value = time;
      hole.diskMats.forEach((mat, index) => {
        mat.opacity = (0.28 - index * 0.045) * (0.9 + Math.sin(time * 0.8 + index) * 0.1);
      });
      (hole.halo.material as THREE.SpriteMaterial).opacity = 0.4 + Math.sin(time * 0.9) * 0.05;
      (hole.photonCyan.material as THREE.MeshBasicMaterial).opacity = 0.5 + Math.sin(time * 1.2) * 0.12;
      (hole.lens.material as THREE.MeshBasicMaterial).opacity = 0.45 + Math.sin(time * 0.7) * 0.08;
      moonOrbit.rotation.y = time * 0.14;
      (moonHalo.material as THREE.SpriteMaterial).opacity = 0.3 + Math.sin(time * 1.6) * 0.08;
      (ring.material as THREE.LineBasicMaterial).opacity = 0.16 + Math.sin(time * 0.7) * 0.04;
    },
  };
}

function buildDriftPlanets(glow: THREE.Texture, accent: number): Built {
  const root = new THREE.Group();
  root.rotation.x = 0.12;

  const baseMat = wire(accent, 0.16);
  const base = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 2.0, 6, 4), baseMat);
  base.rotation.x = -Math.PI / 2;
  base.position.y = -1.95;
  root.add(base);

  const planets = [-1.45, 1.45].map((x) => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.92, 64, 48), gloss(0x2a3247, 0.38, 0.2));
    mesh.position.set(x, 0.2, 0);
    const shell = rimShell(0.94, accent);
    shell.position.copy(mesh.position);
    const ring = ringLine(1.32, accent, 0.3, 0.2);
    ring.position.x = x;
    const halo = sprite(glow, accent, 0.22, 3.2);
    halo.position.copy(mesh.position);
    root.add(mesh, shell, ring, halo);
    return mesh;
  });

  const mats: THREE.MeshStandardMaterial[] = [];
  const nodes: THREE.Mesh[] = [];
  const halos: THREE.Sprite[] = [];
  const points: THREE.Vector3[] = [];
  for (let i = 0; i < 7; i += 1) {
    const pos = new THREE.Vector3(0, 1.3 - i * 0.43, 0);
    points.push(pos);
    const color = i < 3 ? accent : BONE;
    const mat = gloss(color, 0.3, 0.2);
    const node = new THREE.Mesh(new THREE.SphereGeometry(0.13, 24, 18), mat);
    node.position.copy(pos);
    const halo = sprite(glow, color, 0.5, 0.9);
    halo.position.copy(pos);
    root.add(node, halo);
    nodes.push(node);
    mats.push(mat);
    halos.push(halo);
  }
  const links: THREE.Line[] = [];
  points.forEach((pos) => {
    planets.forEach((planet) => {
      const link = line([pos.clone(), planet.position.clone()], accent, 0.16);
      root.add(link);
      links.push(link);
    });
  });

  const scanMat = basic(WHITE, 0.3);
  const scan = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.015), scanMat);
  root.add(scan);
  const pulse = sprite(glow, WHITE, 0.5, 0.85);
  root.add(pulse);

  const key = new THREE.DirectionalLight(0xe6efff, 2.6);
  key.position.set(-4, 5, 6);
  const fill = new THREE.PointLight(accent, 18, 26);
  fill.position.set(4, -2, 6);
  root.add(key, fill, new THREE.AmbientLight(0x223055, 0.45));

  return {
    root,
    update: (time, state) => {
      planets.forEach((planet, index) => {
        planet.rotation.y = time * (index === 0 ? 0.2 : -0.16);
      });
      const added = Math.max(0, Math.min(7, state.count));
      const removed = Math.max(0, Math.min(7 - added, state.focus));
      nodes.forEach((node, index) => {
        const isNew = index < added;
        const isOld = index >= 7 - removed;
        const mat = mats[index];
        mat.color.setHex(isNew ? accent : isOld ? BONE : VIOLET);
        mat.emissive.setHex(isNew ? accent : isOld ? BONE : VIOLET);
        mat.emissiveIntensity = isNew ? 1.8 : isOld ? 1.2 : 0.5;
        node.scale.setScalar(1 + Math.sin(time * 1.7 + index) * 0.1);
        (halos[index].material as THREE.SpriteMaterial).opacity = isNew ? 0.8 : isOld ? 0.55 : 0.18;
      });
      links.forEach((link, index) => {
        (link.material as THREE.LineBasicMaterial).opacity = 0.1 + Math.abs(Math.sin(time * 0.8 + index)) * 0.08;
      });
      const scanY = -1.9 + ((time * 0.2) % 1) * 3.8;
      scan.position.y = scanY;
      scanMat.opacity = 0.18 + Math.abs(Math.sin(time * 0.5)) * 0.14;
      const pulseY = -1.85 + ((time * 0.32) % 1) * 3.7;
      pulse.position.set(0, pulseY, 0);
      (pulse.material as THREE.SpriteMaterial).opacity = 0.3 + Math.sin(time * 2) * 0.1;
      pulse.scale.setScalar(0.55 + Math.sin(time * 3) * 0.06);
      baseMat.opacity = 0.1 + Math.sin(time * 0.7) * 0.03;
    },
  };
}

/* ---------------------------------------------------------------- fallback */
function smoothPath(points: [number, number][]) {
  return points
    .map((point, index) => {
      if (index === 0) return `M ${point[0]} ${point[1]}`;
      const previous = points[index - 1];
      const control = (previous[0] + point[0]) / 2;
      return `C ${control} ${previous[1]}, ${control} ${point[1]}, ${point[0]} ${point[1]}`;
    })
    .join(" ");
}

function polarPoint(cx: number, cy: number, rx: number, ry: number, angle: number): [number, number] {
  return [cx + Math.cos(angle) * rx, cy + Math.sin(angle) * ry];
}

function Fallback({ variant }: { variant: FigureVariant }) {
  const label = {
    orb: "Fleet orb: a wireframe globe with a seven-node orbit and comet",
    dish: "Survey dish: a wireframe bowl, sweep and sixteen contacts",
    ascent: "Escalation ascent: eight gate rings on a rising route through the constellation",
    atlas: "Account constellation: sixteen nodes, arcs and an orbital ring",
    drift: "Drift split: before and after panels joined by changed escalation edges",
    prism: "Command prism: a wireframe monolith with a scan plane and rings",
    bloom: "Primitive bloom: six interlocking rings with eighteen technique nodes",
    stack: "System stack: five alternating layers and a rising beam",
    horizon: "Event horizon: a black hole with an accretion disk and one surviving moon",
  }[variant];

  const title = {
    orb: "FLEET ORB",
    dish: "SURVEY DISH",
    ascent: "ESCALATION ASCENT",
    atlas: "ACCOUNT CONSTELLATION",
    drift: "DRIFT SPLIT",
    prism: "COMMAND PRISM",
    bloom: "PRIMITIVE BLOOM",
    stack: "SYSTEM STACK",
    horizon: "EVENT HORIZON",
  }[variant];

  const note = {
    orb: "07 NODES / 01 ORBIT",
    dish: "16 CONTACTS / SWEEP",
    ascent: "08 GATES / ONE ROUTE",
    atlas: "16 NODES / ONE FLEET",
    drift: "BEFORE / AFTER",
    prism: "114 RUNS / READ-ONLY",
    bloom: "18 NODES / SIX RINGS",
    stack: "FIVE LAYERS / ONE EXPORT",
    horizon: "0 ROUTES / 37 CUTS",
  }[variant];

  const nodes: [number, number][] = [
    [70, 378],
    [150, 342],
    [225, 366],
    [300, 286],
    [380, 310],
    [455, 220],
    [520, 186],
    [566, 138],
  ];

  const atlasNodes = Array.from({ length: 16 }, (_, index) => {
    const angle = index * 2.399 + 0.3;
    const radius = 0.42 + (index % 8) * 0.075;
    return polarPoint(320, 250, radius * 270, radius * 120, angle);
  });

  const orbitNodes = Array.from({ length: 7 }, (_, index) => {
    const angle = (index / 7) * Math.PI * 2 + 0.2;
    return polarPoint(320, 236, 214, 70, angle);
  });

  const bloomRings = [0, 30, 60, 90, 120, 150];

  const palette = wirePalette(VARIANT_ACCENT[variant]);
  const css = (hex: number) => `#${hex.toString(16).padStart(6, "0")}`;
  const theme = {
    "--fb-ink": css(palette.base),
    "--fb-pale": css(palette.pale),
    "--fb-hot": css(palette.hot),
  } as CSSProperties;

  return (
    <div className="fig-fallback" style={theme}>
      <svg
        viewBox="0 0 640 480"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={label}
      >
        <defs>
          <radialGradient id={`${variant}-bg`} cx="54%" cy="42%" r="72%">
            <stop offset="0" stopColor="#0d1633" />
            <stop offset="0.55" stopColor="#070b16" />
            <stop offset="1" stopColor="#03050b" />
          </radialGradient>
          <linearGradient id={`${variant}-line`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={css(palette.hot)} stopOpacity="0.9" />
            <stop offset="0.5" stopColor={css(palette.pale)} stopOpacity="0.95" />
            <stop offset="1" stopColor={css(palette.base)} stopOpacity="0.55" />
          </linearGradient>
          <radialGradient id={`${variant}-core`} cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor={css(palette.hot)} />
            <stop offset="0.45" stopColor={css(palette.pale)} />
            <stop offset="1" stopColor={css(palette.base)} stopOpacity="0" />
          </radialGradient>
          <filter id={`${variant}-glow`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width="640" height="480" fill={`url(#${variant}-bg)`} />
        <g className="fb-grid" aria-hidden="true">
          {[80, 160, 240, 320, 400, 480, 560].map((x) => (
            <line key={`x${x}`} x1={x} y1="24" x2={x} y2="456" />
          ))}
          {[80, 160, 240, 320, 400].map((y) => (
            <line key={`y${y}`} x1="24" y1={y} x2="616" y2={y} />
          ))}
        </g>

        <g
          fill="none"
          stroke={`url(#${variant}-line)`}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#${variant}-glow)`}
        >
          {variant === "orb" ? (
            <>
              <circle cx="320" cy="236" r="116" />
              <ellipse cx="320" cy="236" rx="116" ry="38" strokeOpacity=".55" />
              <ellipse cx="320" cy="236" rx="116" ry="78" strokeOpacity=".35" />
              <ellipse cx="320" cy="236" rx="38" ry="116" strokeOpacity=".55" />
              <ellipse cx="320" cy="236" rx="78" ry="116" strokeOpacity=".35" />
              <circle cx="320" cy="236" r="18" fill={`url(#${variant}-core)`} stroke="none" />
              <ellipse cx="320" cy="236" rx="214" ry="70" transform="rotate(-14 320 236)" strokeOpacity=".8" />
              {orbitNodes.map(([x, y], index) => (
                <circle key={`on${index}`} cx={x} cy={y} r={index === 6 ? 6 : 3.5} className={index === 6 ? "fb-accent" : "fb-node"} />
              ))}
              <path d="M468 158 L472 178 L492 182 L472 186 L468 206 L464 186 L444 182 L464 178 Z" className="fb-accent" stroke="none" />
              <path d="M160 132 L163 144 L175 147 L163 150 L160 162 L157 150 L145 147 L157 144 Z" className="fb-star" stroke="none" />
              <path d="M498 318 L501 328 L511 331 L501 334 L498 344 L495 334 L485 331 L495 328 Z" className="fb-star" stroke="none" />
              <circle cx="320" cy="418" r="42" strokeOpacity=".2" />
              <ellipse cx="320" cy="418" rx="78" ry="14" strokeOpacity=".15" />
            </>
          ) : null}

          {variant === "dish" ? (
            <>
              <path d="M126 258 Q320 96 514 258" strokeWidth="2" />
              <path d="M170 258 Q320 140 470 258" strokeOpacity=".55" />
              <path d="M214 258 Q320 184 426 258" strokeOpacity=".45" />
              <path d="M126 258 Q320 420 514 258" strokeOpacity=".18" />
              <line x1="320" y1="258" x2="320" y2="112" />
              <path d="M320 100 L330 116 L320 132 L310 116 Z" className="fb-accent" />
              <path d="M320 258 L320 392" strokeOpacity=".65" />
              <path d="M270 414 Q320 432 370 414" strokeOpacity=".5" />
              <ellipse cx="320" cy="258" rx="194" ry="26" strokeOpacity=".2" />
              <path d="M320 258 L500 258 A194 26 0 0 0 470 196 Z" className="fb-sweep" stroke="none" />
              <line x1="320" y1="258" x2="500" y2="258" strokeWidth="2" />
              {Array.from({ length: 16 }, (_, index) => {
                const angle = index * 2.399;
                const radius = 0.34 + (index % 6) * 0.11;
                const [x, y] = polarPoint(320, 274, radius * 360, radius * 110, angle);
                return <circle key={`contact${index}`} cx={x} cy={y} r={index % 5 === 0 ? 4 : 2.6} className={index % 5 === 0 ? "fb-accent" : "fb-node"} />;
              })}
            </>
          ) : null}

          {variant === "ascent" ? (
            <>
              <path d={smoothPath(nodes)} strokeWidth="2.2" />
              {Array.from({ length: 10 }, (_, index) => {
                const angle = index * 2.399 + 0.7;
                const radius = 0.76 + (index % 4) * 0.1;
                const [x, y] = polarPoint(320, 250, radius * 380, radius * 190, angle);
                const anchor = nodes[index % nodes.length];
                return (
                  <g key={`ctx${index}`}>
                    <line x1={x} y1={y} x2={anchor[0]} y2={anchor[1]} strokeOpacity=".12" />
                    <circle cx={x} cy={y} r="3" className="fb-node" />
                  </g>
                );
              })}
              {nodes.map(([x, y], index) => (
                <g key={`hop${index}`}>
                  <ellipse cx={x} cy={y + 13} rx="24" ry="7" strokeOpacity={index <= 3 ? ".6" : ".22"} />
                  <line x1={x} y1={y - 10} x2={x} y2={y + 10} strokeOpacity=".35" />
                  <path d={`M${x - 8} ${y - 8} L${x} ${y - 16} L${x + 8} ${y - 8} L${x} ${y}`} className={index <= 3 ? "fb-node" : "fb-dim"} />
                </g>
              ))}
              <line x1="566" y1="138" x2="566" y2="86" className="fb-accent" />
              <ellipse cx="566" cy="82" rx="16" ry="5" className="fb-accent" />
              <path d="M566 62 L569 76 L583 80 L569 84 L566 98 L563 84 L549 80 L563 76 Z" className="fb-accent" stroke="none" />
              <text className="fb-label" x="54" y="402">START</text>
              <text className="fb-label" x="520" y="118">ADMIN</text>
            </>
          ) : null}

          {variant === "atlas" ? (
            <>
              <ellipse cx="320" cy="250" rx="266" ry="100" strokeOpacity=".3" transform="rotate(-6 320 250)" />
              <ellipse cx="320" cy="250" rx="238" ry="86" strokeOpacity=".18" transform="rotate(6 320 250)" />
              <path
                d={atlasNodes
                  .map(([x, y], index) => {
                    if (index === 0) return `M ${x} ${y}`;
                    const [cx, cy] = atlasNodes[index - 1];
                    const mx = (cx + x) / 2 + (y - cy) * 0.14;
                    const my = (cy + y) / 2 - (x - cx) * 0.14;
                    return `Q ${mx} ${my} ${x} ${y}`;
                  })
                  .join(" ")}
                strokeOpacity=".22"
              />
              {atlasNodes.map(([x, y], index) => (
                <g key={`an${index}`}>
                  {index % 2 === 0 ? <line x1={x} y1={y} x2="320" y2="250" strokeOpacity=".08" /> : null}
                  <circle cx={x} cy={y} r={index % 4 === 0 ? 6 : 4} className={index % 4 === 0 ? "fb-accent" : "fb-node"} />
                </g>
              ))}
              <circle cx="320" cy="250" r="16" strokeOpacity=".8" />
              <circle cx="320" cy="250" r="6" className="fb-accent" />
              <ellipse cx="462" cy="214" rx="30" ry="12" strokeOpacity=".8" className="fb-accent" />
              <line x1="462" y1="214" x2="462" y2="176" strokeOpacity=".4" />
              <circle cx="462" cy="172" r="4" className="fb-accent" />
            </>
          ) : null}

          {variant === "drift" ? (
            <>
              <rect x="160" y="96" width="150" height="286" strokeOpacity=".45" />
              <rect x="330" y="96" width="150" height="286" strokeOpacity=".45" />
              {[96, 138, 180, 222, 264, 306, 348, 382].map((y) => (
                <g key={`dgrid${y}`}>
                  <line x1="160" y1={y} x2="310" y2={y} strokeOpacity=".14" />
                  <line x1="330" y1={y} x2="480" y2={y} strokeOpacity=".14" />
                </g>
              ))}
              {[235, 320, 405].map((x) => (
                <g key={`dcol${x}`}>
                  <line x1={x} y1="96" x2={x} y2="382" strokeOpacity=".12" />
                </g>
              ))}
              {[130, 174, 218, 262, 306, 350].map((y, index) => (
                <g key={`dr${y}`}>
                  <line x1={190 + (index % 2) * 34} y1={y} x2={360 + (index % 2) * 34} y2={y} strokeOpacity={index < 2 ? ".8" : ".2"} className={index < 2 ? "fb-accent" : undefined} />
                  <circle cx={190 + (index % 2) * 34} cy={y} r={index < 2 ? 5 : 3.5} className={index < 2 ? "fb-accent" : "fb-node"} />
                  <circle cx={360 + (index % 2) * 34} cy={y} r={index < 2 ? 5 : 3.5} className={index < 2 ? "fb-accent" : "fb-node"} />
                </g>
              ))}
              <line x1="320" y1="76" x2="320" y2="402" className="fb-accent" strokeOpacity=".65" />
              <text className="fb-label" x="235" y="414" textAnchor="middle">BEFORE</text>
              <text className="fb-label" x="405" y="414" textAnchor="middle">AFTER</text>
            </>
          ) : null}

          {variant === "horizon" ? (
            <>
              <ellipse cx="320" cy="236" rx="176" ry="34" strokeOpacity=".22" />
              <ellipse cx="320" cy="236" rx="148" ry="26" className="fb-accent" strokeOpacity=".75" />
              <circle cx="320" cy="236" r="82" fill="#000" stroke="#fff" strokeOpacity=".55" />
              <circle cx="320" cy="236" r="90" strokeOpacity=".2" />
              <circle cx="320" cy="236" r="100" strokeOpacity=".12" />
              <circle cx="398" cy="214" r="5" className="fb-accent" />
              <line x1="320" y1="58" x2="320" y2="118" strokeOpacity=".24" />
              <text className="fb-label" x="320" y="352" textAnchor="middle">0 ROUTES REMAIN</text>
              <text className="fb-label" x="320" y="372" textAnchor="middle" strokeOpacity=".55">EVENT HORIZON VERIFIED</text>
            </>
          ) : null}

          {variant === "prism" ? (
            <>
              <path d="M236 372 L236 138 L422 92 L422 326 Z" strokeWidth="2" />
              <path d="M236 138 L300 168 L486 122 L422 92" />
              <path d="M422 326 L486 356 L486 122" />
              <path d="M300 168 L300 402 L486 356" strokeOpacity=".55" />
              <path d="M258 250 L440 208" className="fb-accent" />
              <line x1="320" y1="40" x2="320" y2="440" strokeOpacity=".35" />
              <ellipse cx="320" cy="150" rx="136" ry="38" strokeOpacity=".26" />
              <ellipse cx="320" cy="250" rx="136" ry="38" strokeOpacity=".2" />
              <ellipse cx="320" cy="350" rx="136" ry="38" strokeOpacity=".14" />
              <path d="M236 360 L422 316 L486 346" strokeOpacity=".2" fill="var(--fb-ink, #7b86c9)" fillOpacity=".08" />
              {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
                <rect
                  key={`mote${index}`}
                  x={index % 2 === 0 ? 188 + index * 34 : 524 - index * 12}
                  y={96 + index * 38}
                  width="4"
                  height="4"
                  className={index % 3 === 0 ? "fb-accent" : "fb-node"}
                />
              ))}
            </>
          ) : null}

          {variant === "bloom" ? (
            <>
              {bloomRings.map((rotation, index) => (
                <g key={`ring${index}`} transform={`rotate(${rotation} 320 238)`}>
                  <ellipse cx="320" cy="238" rx="188" ry="64" strokeOpacity={index % 2 === 0 ? ".8" : ".45"} />
                  {[0, 1, 2].map((node) => {
                    const angle = (node / 3) * Math.PI * 2 + index * 0.5;
                    const [x, y] = polarPoint(320, 238, 188, 64, angle);
                    return <circle key={`bn${index}-${node}`} cx={x} cy={y} r="3.4" className={node === 0 ? "fb-accent" : "fb-node"} />;
                  })}
                </g>
              ))}
              <circle cx="320" cy="238" r="24" strokeOpacity=".85" />
              <circle cx="320" cy="238" r="9" className="fb-accent" />
            </>
          ) : null}

          {variant === "stack" ? (
            <>
              {[0, 1, 2, 3, 4].map((index) => {
                const y = 126 + index * 56;
                const inset = index * 18;
                return (
                  <g key={`layer${index}`}>
                    <path d={`M${172 + inset} ${y} L${468 - inset} ${y} L${438 - inset} ${y + 34} L${142 + inset} ${y + 34} Z`} strokeOpacity={index === 4 ? ".95" : ".45"} />
                    {[0, 1, 2, 3].map((line) => (
                      <line
                        key={`l${line}`}
                        x1={172 + inset + (line * (296 - inset * 2)) / 4}
                        y1={y}
                        x2={142 + inset + (line * (296 - inset * 2)) / 4}
                        y2={y + 34}
                        strokeOpacity=".14"
                      />
                    ))}
                  </g>
                );
              })}
              {[0, 1].map((side) => (
                <g key={`conn${side}`}>
                  <line x1={162 + side * 310} y1="126" x2={132 + side * 310} y2="418" strokeOpacity=".22" />
                  <line x1={478 - side * 10} y1="126" x2={448 - side * 10} y2="418" strokeOpacity=".22" />
                </g>
              ))}
              <line x1="320" y1="404" x2="320" y2="106" className="fb-accent" strokeOpacity=".6" />
              <path d="M320 84 L323 100 L338 104 L323 108 L320 124 L317 108 L302 104 L317 100 Z" className="fb-accent" stroke="none" />
              <ellipse cx="320" cy="420" rx="150" ry="24" strokeOpacity=".22" />
            </>
          ) : null}
        </g>

        <text className="fb-tag" x="26" y="36">{title}</text>
        <text className="fb-note" x="614" y="456" textAnchor="end">{note}</text>
      </svg>
    </div>
  );
}

/* ---------------------------------------------------------------- camera */
const CAMERA: Record<FigureVariant, { position: [number, number, number]; look: [number, number, number]; fov: number; auto: number; span: number }> = {
  orb: { position: [0, 1.1, 10.4], look: [0, 0.1, 0], fov: 40, auto: 0.0008, span: 3.2 },
  dish: { position: [0, 1.8, 8.2], look: [0, 0.55, 0], fov: 40, auto: 0.0004, span: 2.9 },
  ascent: { position: [0, 0.45, 9.0], look: [0, 0.05, 0], fov: 40, auto: 0.0005, span: 2.9 },
  atlas: { position: [0, 3.1, 6.2], look: [0, 0.1, 0], fov: 42, auto: 0.0005, span: 3.55 },
  prism: { position: [0, 0.5, 8.2], look: [0, 0, 0], fov: 40, auto: 0.0006, span: 2.3 },
  bloom: { position: [0, 1.2, 8.8], look: [0, 0, 0], fov: 40, auto: 0.0005, span: 2.5 },
  drift: { position: [0, 0.14, 7.4], look: [0, 0, 0], fov: 40, auto: 0.0004, span: 3.1 },
  stack: { position: [0, 2.4, 8.6], look: [0, 0, 0], fov: 40, auto: 0.0003, span: 2.3 },
  horizon: { position: [0, 1.2, 8.0], look: [0, 0, 0], fov: 40, auto: 0.0004, span: 2.6 },
};

export function Figure3D({
  variant,
  mode = "planets",
  onMode,
  motion = true,
  active = 0,
  count = 8,
  cut = false,
  focus = 0,
  onPick,
  label,
}: {
  variant: FigureVariant;
  mode?: FigureMode;
  onMode?: (mode: FigureMode) => void;
  motion?: boolean;
  active?: number;
  count?: number;
  cut?: boolean;
  focus?: number;
  onPick?: (index: number) => void;
  label: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<FigureState>({ active, count, cut, focus, motion });
  const pickRef = useRef(onPick);
  const pausedRef = useRef(false);
  const failedRef = useRef(false);
  const startRef = useRef<() => void>(() => {});
  const resetRef = useRef<() => void>(() => {});
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    stateRef.current = { active, count, cut, focus, motion };
  }, [active, count, cut, focus, motion]);

  useEffect(() => {
    pickRef.current = onPick;
  }, [onPick]);

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
      failedRef.current = true;
      setFallback(true);
      return;
    }

    renderer.setClearColor(0x08090b, 1);
    renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x08090b);
    scene.fog = new THREE.FogExp2(0x08090b, 0.012);
    const preset = { ...CAMERA[variant], ...(mode === "planets" ? PLANET_CAMERA[variant] : {}) };
    const camera = new THREE.PerspectiveCamera(preset.fov, 1, 0.1, 100);
    camera.position.set(...preset.position);
    camera.lookAt(...preset.look);

    const composer = new EffectComposer(renderer);
    composer.setPixelRatio(Math.min(1.2, window.devicePixelRatio || 1));
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(1, 1),
      variant === "ascent" ? (mode === "planets" ? 0.52 : 0.26) : variant === "atlas" ? 0.34 : mode === "planets" ? 0.42 : 0.36,
      0.55,
      0.24,
    );
    composer.addPass(bloom);
    composer.addPass(new OutputPass());

    const glow = glowTexture();
    const star = starTexture();
    const accent = VARIANT_ACCENT[variant];
    let built: Built;
    if (mode === "planets") {
      if (variant === "drift") built = buildDriftPlanets(glow, accent);
      else if (variant === "horizon") built = buildHorizon(glow, "planets", accent);
      else built = buildOrrery(variant, glow, accent);
    } else if (variant === "horizon") built = buildHorizon(glow, "wireframe", accent);
    else if (variant === "orb") built = buildOrb(glow, star, accent);
    else if (variant === "dish") built = buildDish(glow, accent);
    else if (variant === "ascent") built = buildAscent(glow, accent);
    else if (variant === "atlas") built = buildAtlas(glow, accent);
    else if (variant === "drift") built = buildDrift(glow, accent);
    else if (variant === "prism") built = buildPrism(glow, accent);
    else if (variant === "bloom") built = buildBloom(glow, accent);
    else built = buildStack(accent);

    scene.add(built.root);

    let dragging = false;
    let moved = 0;
    let lastX = 0;
    let lastY = 0;
    let targetX = 0;
    let targetY = 0;
    let rotX = 0;
    let rotY = 0;
    let zoom = 1;
    let fitScale = 1;
    let autoY = 0;
    let raf = 0;
    let visible = true;
    let time = 0;
    let frameAccum = 0;
    const clock = new THREE.Clock();

    const resize = () => {
      const width = host.clientWidth || 520;
      const height = host.clientHeight || 360;
      renderer.setSize(width, height, false);
      composer.setSize(width, height);
      camera.aspect = width / height;
      const halfWidth =
        Math.tan((preset.fov * Math.PI) / 360) * preset.position[2] * camera.aspect;
      fitScale = Math.min(3.2, Math.max(1, preset.span / Math.max(0.001, halfWidth)));
      camera.updateProjectionMatrix();
    };

    const raycast = (event: PointerEvent) => {
      if (!built.pickables?.length || !pickRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const pointer = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(built.pickables, false);
      const first = hits.find((hit) => hit.object.visible)?.object.userData.index;
      if (typeof first === "number") pickRef.current(first);
    };

    const onDown = (event: PointerEvent) => {
      if (pausedRef.current) return;
      dragging = true;
      moved = 0;
      lastX = event.clientX;
      lastY = event.clientY;
      canvas.setPointerCapture?.(event.pointerId);
      canvas.style.cursor = "grabbing";
    };
    const onMove = (event: PointerEvent) => {
      if (!dragging) return;
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      moved += Math.abs(dx) + Math.abs(dy);
      targetY += dx * 0.006;
      targetX += dy * 0.004;
      lastX = event.clientX;
      lastY = event.clientY;
    };
    const onUp = (event: PointerEvent) => {
      if (dragging && moved < 6) raycast(event);
      dragging = false;
      canvas.releasePointerCapture?.(event.pointerId);
      canvas.style.cursor = "grab";
    };
    const onWheel = (event: WheelEvent) => {
      if (pausedRef.current) return;
      event.preventDefault();
      zoom = Math.min(1.3, Math.max(0.82, zoom + event.deltaY * 0.0006));
    };
    const reset = () => {
      targetX = 0;
      targetY = 0;
      zoom = 1;
    };
    resetRef.current = reset;

    const onDouble = () => reset();

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("dblclick", onDouble);

    const loop = () => {
      if (!visible || pausedRef.current) return;
      raf = requestAnimationFrame(loop);
      const delta = Math.min(0.05, clock.getDelta());
      const state = stateRef.current;
      frameAccum += delta;
      if (frameAccum < (state.motion ? 1 / 32 : 1 / 10)) return;
      frameAccum = 0;
      if (state.motion) time += delta;
      autoY += state.motion ? preset.auto : 0;
      rotX += (targetX - rotX) * 0.07;
      rotY += (targetY - rotY) * 0.07;
      built.root.rotation.x = 0.12 + rotX;
      built.root.rotation.y = autoY + rotY;
      camera.position.set(
        (preset.position[0] / zoom) * fitScale,
        (preset.position[1] / zoom) * fitScale,
        (preset.position[2] / zoom) * fitScale,
      );
      camera.lookAt(...preset.look);
      built.update(time, state);
      composer.render();
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
    }, { threshold: 0.04 });
    observer.observe(host);

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    renderer.render(scene, camera);
    composer.render();
    start();

    return () => {
      startRef.current = () => {};
      resetRef.current = () => {};
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
      glow.dispose();
      star.dispose();
      composer.dispose();
      renderer.dispose();
      canvas.remove();
    };
  }, [variant, mode]);

  return (
    <div className="fig" ref={hostRef} data-variant={variant} data-mode={mode}>
      {fallback ? <Fallback variant={variant} /> : null}
      <div className="fig-controls">
        {fallback ? (
          <span className="fig-flat">2D</span>
        ) : (
          <div className="fig-modes" role="group" aria-label="Figure style">
            <button
              type="button"
              aria-pressed={mode === "planets"}
              onClick={() => onMode?.("planets")}
            >
              Planets
            </button>
            <button
              type="button"
              aria-pressed={mode === "wireframe"}
              onClick={() => onMode?.("wireframe")}
            >
              Wire
            </button>
          </div>
        )}
        <button type="button" onClick={() => resetRef.current()} aria-label="Reset view">Reset</button>
      </div>
      <p className="fig-hint" aria-hidden="true">
        {onPick ? "Click a body / drag / scroll" : "Drag / scroll"}
      </p>
      <span className="sr-only">
        {label}. Switch between the planet and wireframe instruments. A static diagram appears if WebGL is unavailable. Double-click to reset.
      </span>
    </div>
  );
}




