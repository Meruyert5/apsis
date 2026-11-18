import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

export type FigureVariant = "orb" | "dish" | "ascent" | "atlas" | "prism" | "bloom" | "stack";

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

const BLUE = 0x1a1aff;
const WHITE = 0xffffff;

function wire(color = WHITE, opacity = 0.6) {
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

/* ---------------------------------------------------------------- orb */
function buildOrb(glow: THREE.Texture, star: THREE.Texture): Built {
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

  root.add(new THREE.Mesh(new THREE.SphereGeometry(2.36, 32, 22), wire(BLUE, 0.34)));
  root.add(new THREE.Mesh(new THREE.SphereGeometry(2.58, 16, 12), wire(WHITE, 0.08)));

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

  const equator = new THREE.Mesh(new THREE.TorusGeometry(2.52, 0.006, 6, 180), basic(WHITE, 0.22));
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
    basic(WHITE, 0.68),
  ));

  const orbitNodes: THREE.Mesh[] = [];
  const orbitHalos: THREE.Sprite[] = [];
  for (let i = 0; i < 7; i += 1) {
    const point = orbit.getPointAt(i / 7);
    const node = new THREE.Mesh(
      new THREE.OctahedronGeometry(i === 6 ? 0.1 : 0.065, 0),
      basic(i === 6 ? BLUE : WHITE, i === 6 ? 1 : 0.9),
    );
    node.position.copy(point);
    root.add(node);
    orbitNodes.push(node);
    const halo = sprite(glow, i === 6 ? BLUE : WHITE, 0.28, 0.8);
    halo.position.copy(point);
    root.add(halo);
    orbitHalos.push(halo);
  }

  const comet = sprite(glow, WHITE, 0.9, 1.2);
  const cometTrail = sprite(glow, BLUE, 0.5, 2.6);
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
    color: BLUE, size: 0.02, transparent: true, opacity: 0.7,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  root.add(dust);

  const ghost = new THREE.Mesh(new THREE.SphereGeometry(0.92, 16, 12), wire(BLUE, 0.15));
  ghost.position.set(-3.25, 2.15, -2.5);
  root.add(ghost);

  const polar = new THREE.PolarGridHelper(4.2, 8, 4, 64, BLUE, BLUE);
  const polarMaterial = polar.material as THREE.LineBasicMaterial;
  polarMaterial.transparent = true;
  polarMaterial.opacity = 0.1;
  polar.position.y = -2.6;
  root.add(polar);

  const coreGlow = sprite(glow, BLUE, 0.55, 4.2);
  root.add(coreGlow);
  [ [-2.9, 2.1, 1.0, 0.55], [2.9, -1.7, 0.8, 0.4] ].forEach(([x, y, z, scale]) => {
    const item = sprite(star, WHITE, 0.9, scale);
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
function buildDish(glow: THREE.Texture): Built {
  const root = new THREE.Group();
  root.rotation.x = 0.22;

  const profile: THREE.Vector2[] = [];
  for (let i = 0; i <= 20; i += 1) {
    const t = i / 20;
    profile.push(new THREE.Vector2(0.16 + t * 2.45, t * t * 0.92));
  }
  const lathe = new THREE.LatheGeometry(profile, 72);
  const dish = new THREE.Mesh(lathe, wire(BLUE, 0.26));
  dish.position.y = -0.46;
  root.add(dish);

  const skin = new THREE.Mesh(lathe, new THREE.MeshBasicMaterial({
    color: BLUE,
    transparent: true,
    opacity: 0.035,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }));
  skin.position.y = -0.46;
  root.add(skin);

  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.16, 1.05, 12), wire(BLUE, 0.35));
  stand.position.y = -1.0;
  root.add(stand);
  const base = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.02, 6, 64), basic(BLUE, 0.4));
  base.rotation.x = Math.PI / 2;
  base.position.y = -1.5;
  root.add(base);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(2.61, 0.022, 8, 180), basic(WHITE, 0.8));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.46;
  root.add(rim);

  for (let i = 1; i <= 3; i += 1) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry((i / 3.6) * 2.3, 0.01, 6, 140),
      basic(BLUE, 0.34),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.46 - i * 0.13 - i * i * 0.02;
    root.add(ring);
  }

  const feedLine = line([
    new THREE.Vector3(0, 0.5, 0),
    new THREE.Vector3(0, 2.2, 0),
  ], WHITE, 0.8);
  root.add(feedLine);
  const feed = new THREE.Mesh(new THREE.OctahedronGeometry(0.13, 0), basic(WHITE, 1));
  feed.position.y = 2.2;
  root.add(feed);
  const feedGlow = sprite(glow, BLUE, 0.55, 1.4);
  feedGlow.position.y = 2.2;
  root.add(feedGlow);

  const sweep = new THREE.Group();
  sweep.add(line([
    new THREE.Vector3(0, 0.48, 0),
    new THREE.Vector3(2.45, 0.48, 0),
  ], WHITE, 0.6));
  const wedge = new THREE.Mesh(
    new THREE.CircleGeometry(2.45, 36, 0, 0.26),
    new THREE.MeshBasicMaterial({
      color: BLUE, transparent: true, opacity: 0.18, side: THREE.DoubleSide,
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
      basic(i % 5 === 0 ? BLUE : WHITE, 0.8),
    );
    dot.position.set(Math.cos(angle) * radius, 0.9 + (i % 5) * 0.14, Math.sin(angle) * radius);
    root.add(dot);
    contacts.push(dot);
  }

  const floorRing = new THREE.Mesh(new THREE.TorusGeometry(3.1, 0.01, 6, 180), basic(BLUE, 0.3));
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
function buildAscent(glow: THREE.Texture): Built {
  const root = new THREE.Group();
  root.rotation.x = 0.08;

  const nodeCount = 8;
  const nodes: THREE.Mesh[] = [];
  const segments: THREE.Mesh[] = [];
  const halos: THREE.Sprite[] = [];
  const platforms: THREE.Mesh[] = [];
  const pickables: THREE.Object3D[] = [];

  for (let i = 0; i < nodeCount; i += 1) {
    const node = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 0), basic(BLUE, 0.4));
    node.userData.index = i;
    root.add(node);
    nodes.push(node);
    pickables.push(node);
    const platform = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.006, 6, 40), basic(BLUE, 0.25));
    platform.rotation.x = Math.PI / 2;
    root.add(platform);
    platforms.push(platform);
  }
  for (let i = 0; i < nodeCount - 1; i += 1) {
    const segment = new THREE.Mesh(
      new THREE.CylinderGeometry(0.024, 0.024, 1, 6),
      basic(BLUE, 0.25),
    );
    root.add(segment);
    segments.push(segment);
  }

  const glowTex = glow;

  for (let i = 0; i < nodeCount; i += 1) {
    const halo = sprite(glowTex, WHITE, 0, 1.4);
    root.add(halo);
    halos.push(halo);
  }

  const cutGroup = new THREE.Group();
  const cutLineA = line([new THREE.Vector3(-0.16, 0, 0), new THREE.Vector3(0.16, 0, 0)], WHITE, 1);
  const cutLineB = line([new THREE.Vector3(0.16, 0, 0), new THREE.Vector3(-0.16, 0, 0)], WHITE, 1);
  cutLineA.rotation.z = 0.7;
  cutLineB.rotation.z = -0.7;
  cutGroup.add(cutLineA, cutLineB);
  cutGroup.visible = false;
  root.add(cutGroup);

  const axis = line([
    new THREE.Vector3(0, -2.4, 0),
    new THREE.Vector3(0, 2.5, 0),
  ], BLUE, 0.15);
  root.add(axis);

  const floor = new THREE.Mesh(new THREE.RingGeometry(1.8, 3.2, 64), new THREE.MeshBasicMaterial({
    color: BLUE, transparent: true, opacity: 0.06, side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.4;
  root.add(floor);

  const stage = new THREE.PolarGridHelper(3.4, 8, 3, 48, BLUE, BLUE);
  const stageMaterial = stage.material as THREE.LineBasicMaterial;
  stageMaterial.transparent = true;
  stageMaterial.opacity = 0.08;
  stage.position.y = -2.4;
  root.add(stage);

  const positions: THREE.Vector3[] = [];
  const travelPulse = sprite(glow, WHITE, 0.9, 0.8);
  root.add(travelPulse);

  return {
    root,
    pickables,
    update: (time, state) => {
      const count = Math.max(2, Math.min(nodeCount, state.count));
      const active = Math.max(0, Math.min(count - 1, state.active));
      positions.length = 0;

      for (let i = 0; i < count; i += 1) {
        const u = i / (count - 1);
        const angle = 0.32 + u * Math.PI * 0.92;
        const point = new THREE.Vector3(
          -Math.cos(angle) * 1.95,
          -2.1 + u * 4.2,
          Math.sin(angle) * 1.05,
        );
        positions.push(point);
        const node = nodes[i];
        node.visible = true;
        node.position.copy(point);
        const isActive = i === active && !state.cut;
        const isVisited = i < active;
        const isTarget = i === count - 1;
        const material = node.material as THREE.MeshBasicMaterial;
        material.color.setHex(isActive || isTarget ? WHITE : BLUE);
        material.opacity = state.cut
          ? i === count - 1
            ? 0.3
            : 0.4
          : isActive
            ? 1
            : isVisited
              ? 0.95
              : 0.5;
        node.scale.setScalar(isActive ? 1.65 + Math.sin(time * 3) * 0.1 : isVisited ? 1.1 : isTarget ? 1.3 : 0.95);
        const halo = halos[i];
        halo.visible = true;
        halo.position.copy(point);
        (halo.material as THREE.SpriteMaterial).opacity = isActive ? 0.22 : isVisited ? 0.05 : 0.025;
        halo.scale.setScalar(isActive ? 1.35 + Math.sin(time * 3) * 0.1 : isVisited ? 0.75 : 0.5);
        const platform = platforms[i];
        platform.visible = true;
        platform.position.copy(point);
        platform.position.y -= 0.2;
        (platform.material as THREE.MeshBasicMaterial).color.setHex(isActive ? WHITE : BLUE);
        (platform.material as THREE.MeshBasicMaterial).opacity = state.cut ? 0.2 : isActive ? 0.9 : isVisited ? 0.35 : 0.2;
        platform.scale.setScalar(isActive ? 1.25 + Math.sin(time * 2.4) * 0.08 : 1);
      }
      for (let i = count; i < nodeCount; i += 1) {
        nodes[i].visible = false;
        halos[i].visible = false;
        platforms[i].visible = false;
      }

      if (!state.cut && active < count - 1) {
        const progress = (time * 0.85) % 1;
        travelPulse.visible = true;
        travelPulse.position.copy(positions[active]).lerp(positions[active + 1], progress);
        travelPulse.material.opacity = 0.55;
        travelPulse.scale.setScalar(0.5 + Math.sin(time * 8) * 0.07);
      } else {
        travelPulse.visible = false;
      }

      for (let i = 0; i < segments.length; i += 1) {
        const segment = segments[i];
        if (i >= count - 1) {
          segment.visible = false;
          continue;
        }
        segment.visible = true;
        const start = positions[i];
        const end = positions[i + 1];
        const direction = end.clone().sub(start);
        const length = direction.length();
        segment.position.copy(start).add(end).multiplyScalar(0.5);
        segment.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
        segment.scale.set(1, Math.max(0.001, length), 1);
        const material = segment.material as THREE.MeshBasicMaterial;
        if (state.cut && i === count - 2) {
          material.color.setHex(WHITE);
          material.opacity = 0.08;
        } else if (i < active) {
          material.color.setHex(BLUE);
          material.opacity = 0.95;
        } else if (i === active) {
          material.color.setHex(WHITE);
          material.opacity = 1;
        } else {
          material.color.setHex(BLUE);
          material.opacity = 0.45;
        }
      }

      const last = positions[count - 1];
      cutGroup.visible = state.cut;
      cutGroup.position.copy(last);
      cutGroup.position.y -= 0.35;
    },
  };
}

/* ---------------------------------------------------------------- atlas */
function buildAtlas(glow: THREE.Texture): Built {
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
      new THREE.OctahedronGeometry(i % 4 === 0 ? 0.17 : 0.13, 0),
      basic(i % 4 === 0 ? WHITE : BLUE, 0.9),
    );
    node.position.set(
      Math.cos(angle) * radius,
      Math.sin(i * 1.7) * 0.18,
      Math.sin(angle) * radius,
    );
    node.userData.index = i;
    root.add(node);
    nodes.push(node);
    pickables.push(node);
    const halo = sprite(glow, i % 4 === 0 ? WHITE : BLUE, 0.16, 0.65);
    halo.position.copy(node.position);
    root.add(halo);
    nodeHalos.push(halo);
  }

  const arc = (a: THREE.Vector3, b: THREE.Vector3, color: number, opacity: number) => {
    const mid = a.clone().add(b).multiplyScalar(0.5);
    mid.multiplyScalar(1.18);
    mid.y += 0.1;
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    return new THREE.Mesh(
      new THREE.TubeGeometry(curve, 18, 0.008, 4, false),
      basic(color, opacity),
    );
  };

  for (let i = 0; i < count; i += 1) {
    const next = nodes[(i + 1) % count];
    const chord = nodes[(i + 5) % count];
    root.add(arc(nodes[i].position.clone(), next.position.clone(), BLUE, 0.24));
    if (i % 2 === 0) {
      root.add(arc(nodes[i].position.clone(), chord.position.clone(), WHITE, 0.1));
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
    color: BLUE, size: 0.018, transparent: true, opacity: 0.55,
    blending: THREE.AdditiveBlending, depthWrite: false,
  })));

  const grid = new THREE.PolarGridHelper(4.0, 8, 4, 64, BLUE, BLUE);
  const gridMaterial = grid.material as THREE.LineBasicMaterial;
  gridMaterial.transparent = true;
  gridMaterial.opacity = 0.12;
  grid.position.y = -1.1;
  root.add(grid);

  const focusRing = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.01, 6, 64), basic(WHITE, 0.9));
  focusRing.rotation.x = Math.PI / 2;
  root.add(focusRing);

  const focusGlow = sprite(glow, BLUE, 0.32, 1.2);
  root.add(focusGlow);

  const centerGlow = sprite(glow, BLUE, 0.14, 4.2);
  centerGlow.position.y = -0.2;
  root.add(centerGlow);

  return {
    root,
    pickables,
    update: (time, state) => {
      const focus = Math.max(0, Math.min(count - 1, state.focus));
      centerGlow.material.opacity = 0.1 + Math.sin(time * 0.8) * 0.04;
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
      focusGlow.position.copy(focusNode.position);
      focusGlow.material.opacity = 0.24 + Math.sin(time * 2) * 0.09;
    },
  };
}

/* ---------------------------------------------------------------- prism */
function buildPrism(glow: THREE.Texture): Built {
  const root = new THREE.Group();
  root.rotation.x = 0.12;

  const outer = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(2.4, 3.5, 2.4)),
    new THREE.LineBasicMaterial({
      color: WHITE, transparent: true, opacity: 0.6,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }),
  );
  root.add(outer);

  const inner = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(1.75, 2.7, 1.75)),
    new THREE.LineBasicMaterial({
      color: BLUE, transparent: true, opacity: 0.5,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }),
  );
  root.add(inner);

  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(2.15, 3.15, 2.15),
    new THREE.MeshBasicMaterial({
      color: BLUE, transparent: true, opacity: 0.035, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }),
  );
  root.add(glass);

  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 4.2, 6),
    basic(WHITE, 0.28),
  );
  root.add(beam);

  const halos: THREE.Mesh[] = [];
  for (let i = 0; i < 3; i += 1) {
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(1.95, 0.006, 6, 120),
      basic(i === 1 ? WHITE : BLUE, 0.2),
    );
    halo.rotation.x = Math.PI / 2;
    halo.position.y = -1.4 + i * 1.4;
    root.add(halo);
    halos.push(halo);
  }

  const scan = new THREE.Mesh(
    new THREE.PlaneGeometry(2.45, 2.45),
    new THREE.MeshBasicMaterial({
      color: BLUE, transparent: true, opacity: 0.08, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }),
  );
  scan.rotation.x = -Math.PI / 2;
  root.add(scan);

  const scanLine = new THREE.Mesh(
    new THREE.BoxGeometry(2.45, 0.008, 0.008),
    basic(WHITE, 0.8),
  );
  root.add(scanLine);

  const core = sprite(glow, BLUE, 0.6, 2.4);
  root.add(core);

  const motes: THREE.Mesh[] = [];
  for (let i = 0; i < 12; i += 1) {
    const mote = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.07), basic(i % 3 === 0 ? WHITE : BLUE, 0.6));
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
function buildBloom(glow: THREE.Texture): Built {
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
    const torus = new THREE.Mesh(new THREE.TorusGeometry(2.15, 0.012, 6, 140), basic(ringIndex % 2 === 0 ? WHITE : BLUE, 0.42));
    ring.add(torus);
    for (let i = 0; i < 3; i += 1) {
      const angle = (i / 3) * Math.PI * 2 + ringIndex * 0.4;
      const node = new THREE.Mesh(new THREE.OctahedronGeometry(0.075, 0), basic(i === 0 ? BLUE : WHITE, 0.8));
      node.position.set(Math.cos(angle) * 2.15, Math.sin(angle) * 2.15, 0);
      node.userData.index = nodes.length;
      ring.add(node);
      nodes.push(node);
      pickables.push(node);
      const halo = sprite(glow, i === 0 ? BLUE : WHITE, 0.18, 0.6);
      halo.position.copy(node.position);
      ring.add(halo);
      nodeHalos.push(halo);
    }
    root.add(ring);
    rings.push(ring);
  });

  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 1), wire(WHITE, 0.5));
  root.add(core);
  const coreGlow = sprite(glow, BLUE, 0.16, 1.6);
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
function buildStack(): Built {
  const root = new THREE.Group();
  root.rotation.x = 0.3;

  const layers: THREE.Mesh[] = [];
  const outlines: THREE.LineSegments[] = [];
  for (let i = 0; i < 5; i += 1) {
    const width = 3.5 - i * 0.22;
    const depth = 2.4 - i * 0.16;
    const geometry = new THREE.PlaneGeometry(width, depth, 10, 7);
    const layer = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
      color: i === 4 ? WHITE : BLUE,
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
        color: i === 4 ? WHITE : BLUE,
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
      ], BLUE, 0.12);
      root.add(connector);
      connectors.push(connector);
    }
  }

  const beam = new THREE.Mesh(
    new THREE.PlaneGeometry(4.4, 3.1),
    new THREE.MeshBasicMaterial({
      color: BLUE, transparent: true, opacity: 0.06, side: THREE.DoubleSide,
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

/* ---------------------------------------------------------------- fallback */
function Fallback({ variant }: { variant: FigureVariant }) {
  const label = {
    orb: "Wireframe globe with a seven-node orbit",
    dish: "Wireframe survey dish with a radar sweep",
    ascent: "Rising wireframe escalation path with seven steps",
    atlas: "Constellation of sixteen account nodes",
    prism: "Wireframe terminal monolith with a scan plane",
    bloom: "Six interlocking rings with eighteen technique nodes",
    stack: "Five stacked wireframe layers",
  }[variant];

  return (
    <svg className="fig-fallback" viewBox="0 0 640 480" role="img" aria-label={label}>
      <defs>
        <linearGradient id={`fallback-${variant}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1a1aff" stopOpacity=".8" />
          <stop offset=".55" stopColor="#ffffff" stopOpacity=".9" />
          <stop offset="1" stopColor="#1a1aff" stopOpacity=".25" />
        </linearGradient>
      </defs>
      <g fill="none" stroke={`url(#fallback-${variant})`} strokeWidth="1.2" opacity=".85">
        {variant === "orb" ? (
          <>
            <circle cx="320" cy="240" r="150" />
            <ellipse cx="320" cy="240" rx="150" ry="54" />
            <ellipse cx="320" cy="240" rx="54" ry="150" />
            <ellipse cx="320" cy="240" rx="210" ry="62" transform="rotate(-18 320 240)" />
            <circle cx="320" cy="240" r="92" fill="rgba(26,26,255,.18)" />
            <g fill="#fff"><circle cx="128" cy="212" r="4" /><circle cx="216" cy="172" r="4" /><circle cx="320" cy="196" r="5" /><circle cx="438" cy="264" r="4" /><circle cx="518" cy="292" r="6" /></g>
          </>
        ) : null}
        {variant === "dish" ? (
          <>
            <path d="M120 250 Q320 70 520 250" />
            <path d="M170 250 Q320 120 470 250" />
            <path d="M220 250 Q320 168 420 250" />
            <line x1="320" y1="250" x2="320" y2="404" />
            <line x1="320" y1="118" x2="320" y2="250" />
            <circle cx="320" cy="118" r="5" fill="#fff" />
            <circle cx="320" cy="250" r="190" strokeDasharray="3 8" opacity=".4" />
            <g fill="#fff"><circle cx="180" cy="154" r="3" /><circle cx="256" cy="110" r="3" /><circle cx="420" cy="136" r="3" /><circle cx="496" cy="190" r="3" /></g>
          </>
        ) : null}
        {variant === "ascent" ? (
          <>
            <path d="M120 380 L200 330 L280 350 L360 260 L440 280 L520 170 L560 130" />
            <g fill="#1a1aff" stroke="#fff">
              <circle cx="120" cy="380" r="6" /><circle cx="200" cy="330" r="6" /><circle cx="280" cy="350" r="6" /><circle cx="360" cy="260" r="6" /><circle cx="440" cy="280" r="6" /><circle cx="520" cy="170" r="6" /><circle cx="560" cy="130" r="7" />
            </g>
          </>
        ) : null}
        {variant === "atlas" ? (
          <>
            <g fill="#fff">
              {Array.from({ length: 16 }, (_, index) => {
                const angle = index * 2.399;
                const radius = 60 + (index % 8) * 24;
                return <circle key={index} cx={320 + Math.cos(angle) * radius} cy={240 + Math.sin(angle) * radius * 0.55} r={index % 4 === 0 ? 5 : 3} />;
              })}
            </g>
            <circle cx="320" cy="240" r="220" strokeDasharray="2 7" opacity=".4" />
          </>
        ) : null}
        {variant === "prism" ? (
          <>
            <path d="M220 360 L220 120 L420 80 L420 320 Z" />
            <path d="M220 120 L280 160 L480 120 L420 80" />
            <path d="M420 320 L480 360 L480 120" />
            <path d="M220 240 L420 200" stroke="#1a1aff" />
            <path d="M240 290 L440 250" strokeDasharray="4 6" opacity=".5" />
            <g fill="#fff"><rect x="160" y="350" width="6" height="6" /><rect x="500" y="110" width="6" height="6" /><rect x="140" y="150" width="4" height="4" /></g>
          </>
        ) : null}
        {variant === "bloom" ? (
          <>
            <ellipse cx="320" cy="240" rx="180" ry="62" transform="rotate(22 320 240)" />
            <ellipse cx="320" cy="240" rx="180" ry="62" transform="rotate(-42 320 240)" />
            <ellipse cx="320" cy="240" rx="180" ry="62" transform="rotate(82 320 240)" />
            <circle cx="320" cy="240" r="17" fill="rgba(26,26,255,.4)" />
            <g fill="#fff">
              {Array.from({ length: 18 }, (_, index) => {
                const angle = (index / 18) * Math.PI * 2;
                return <circle key={index} cx={320 + Math.cos(angle) * (150 + (index % 3) * 18)} cy={240 + Math.sin(angle) * (150 + (index % 3) * 18) * 0.55} r={index % 6 === 0 ? 4 : 2.5} />;
              })}
            </g>
          </>
        ) : null}
        {variant === "stack" ? (
          <>
            {[0, 1, 2, 3, 4].map((index) => (
              <rect key={index} x={150 + index * 22} y={130 + index * 44} width={340 - index * 44} height={40 + index * 8} transform={`skewX(-12)`} opacity={0.35 + index * 0.12} />
            ))}
            <line x1="150" y1="380" x2="150" y2="120" />
            <line x1="490" y1="400" x2="490" y2="140" />
          </>
        ) : null}
      </g>
    </svg>
  );
}

/* ---------------------------------------------------------------- camera */
const CAMERA: Record<FigureVariant, { position: [number, number, number]; look: [number, number, number]; fov: number; auto: number }> = {
  orb: { position: [0, 1.1, 10.4], look: [0, 0.1, 0], fov: 40, auto: 0.0008 },
  dish: { position: [0, 1.8, 8.2], look: [0, 0.55, 0], fov: 40, auto: 0.0004 },
  ascent: { position: [0, 0.5, 8.4], look: [0, 0, 0], fov: 40, auto: 0.0005 },
  atlas: { position: [0, 3.1, 6.2], look: [0, 0.1, 0], fov: 42, auto: 0.0005 },
  prism: { position: [0, 0.5, 8.2], look: [0, 0, 0], fov: 40, auto: 0.0006 },
  bloom: { position: [0, 1.2, 8.8], look: [0, 0, 0], fov: 40, auto: 0.0005 },
  stack: { position: [0, 2.4, 8.6], look: [0, 0, 0], fov: 40, auto: 0.0003 },
};

export function Figure3D({
  variant,
  motion = true,
  active = 0,
  count = 8,
  cut = false,
  focus = 0,
  onPick,
  label,
}: {
  variant: FigureVariant;
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

    renderer.setClearColor(0x000000, 1);
    renderer.setPixelRatio(Math.min(1.7, window.devicePixelRatio || 1));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    const preset = CAMERA[variant];
    const camera = new THREE.PerspectiveCamera(preset.fov, 1, 0.1, 100);
    camera.position.set(...preset.position);
    camera.lookAt(...preset.look);

    const composer = new EffectComposer(renderer);
    composer.setPixelRatio(Math.min(1.35, window.devicePixelRatio || 1));
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.36, 0.55, 0.24);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());

    const glow = glowTexture();
    const star = starTexture();
    let built: Built;
    if (variant === "orb") built = buildOrb(glow, star);
    else if (variant === "dish") built = buildDish(glow);
    else if (variant === "ascent") built = buildAscent(glow);
    else if (variant === "atlas") built = buildAtlas(glow);
    else if (variant === "prism") built = buildPrism(glow);
    else if (variant === "bloom") built = buildBloom(glow);
    else built = buildStack();

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
      const first = hits[0]?.object.userData.index;
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
        preset.position[0] / zoom,
        preset.position[1] / zoom,
        preset.position[2] / zoom,
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
  }, [variant]);

  const toggleFallback = () => {
    if (failedRef.current) return;
    const next = !fallback;
    setFallback(next);
    pausedRef.current = next;
    if (!next) startRef.current();
  };

  return (
    <div className="fig" ref={hostRef} data-variant={variant}>
      {fallback ? <Fallback variant={variant} /> : null}
      <div className="fig-controls">
        <button type="button" onClick={() => resetRef.current()} aria-label="Reset view">Reset</button>
        <button
          type="button"
          onClick={toggleFallback}
          aria-pressed={fallback}
          aria-label={fallback ? "Use 3D view" : "Use 2D view"}
          disabled={failedRef.current}
        >
          {fallback ? "3D" : "2D"}
        </button>
      </div>
      <p className="fig-hint" aria-hidden="true">
        {onPick ? "Click a node / drag / scroll / double-click reset" : "Drag / scroll / double-click reset"}
      </p>
      <span className="sr-only">{label}. Use Reset or 2D for a static fallback.</span>
    </div>
  );
}
