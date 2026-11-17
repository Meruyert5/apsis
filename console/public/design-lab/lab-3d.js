/* Apsis design lab — one shared 3D stage.
   Each kit mounts [data-3d] with data-scene and data-style. The scene is real
   WebGL; the SVG inside [data-3d-fallback] is the 2D path. */

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

const STYLES = {
  observatory: {
    ring: 0xece6d8, ringOpacity: 0.18, node: 0xece6d8, line: 0xd8b25e,
    accent: 0xd8b25e, additive: false, glow: true, glowOpacity: 0.55,
    cameraZ: 12.6, fov: 38, grid: false, auto: 0.00055,
  },
  orbital: {
    ring: 0x6f9bff, ringOpacity: 0.25, node: 0x4fe3ff, line: 0x4fe3ff,
    accent: 0xffc46b, additive: true, glow: true, glowOpacity: 0.9,
    cameraZ: 11.8, fov: 40, grid: true, gridColor: 0x6f9bff, auto: 0.0009,
  },
  swiss: {
    ring: 0x111111, ringOpacity: 0.85, node: 0x111111, line: 0xd4351c,
    accent: 0xd4351c, additive: false, glow: false,
    cameraZ: 13, fov: 32, grid: true, gridColor: 0x111111, auto: 0.00035, ortho: true,
  },
  bio: {
    ring: 0x3ff0d0, ringOpacity: 0.22, node: 0xeafff8, line: 0x3ff0d0,
    accent: 0xff8fa3, additive: true, glow: true, glowOpacity: 0.8,
    cameraZ: 12, fov: 40, grid: false, auto: 0.0005,
  },
  terminal: {
    ring: 0x2f2f2f, ringOpacity: 1, node: 0xc8ff00, line: 0xc8ff00,
    accent: 0xc8ff00, additive: false, glow: false,
    cameraZ: 13, fov: 42, grid: true, gridColor: 0x242424, auto: 0.0006,
  },
  grit: {
    ring: 0xf2f0e8, ringOpacity: 0.24, node: 0x62e6ff, line: 0xff3b1f,
    accent: 0xff3b1f, additive: false, glow: false,
    cameraZ: 12.2, fov: 40, grid: false, auto: 0.00075, starScale: 1.7,
  },
  survey: {
    ring: 0xb8c3cc, ringOpacity: 0.18, node: 0xe8e2d4, line: 0xc7482f,
    accent: 0xd8734a, additive: false, glow: true, glowOpacity: 0.42,
    cameraZ: 13.4, fov: 36, grid: false, auto: 0.00022, starScale: 3.2,
  },
  flight: {
    ring: 0xc9c2b2, ringOpacity: 0.2, node: 0xffb347, line: 0xff8a1f,
    accent: 0xffc46b, additive: false, glow: true, glowOpacity: 0.35,
    cameraZ: 12.4, fov: 40, grid: false, auto: 0.0004, starScale: 2.2,
  },
  notebook: {
    ring: 0x6e6a5f, ringOpacity: 0.32, node: 0x1d1c18, line: 0xb04a2e,
    accent: 0xb04a2e, additive: false, glow: false,
    cameraZ: 12.8, fov: 38, grid: false, auto: 0.00018, starScale: 1.4,
  },
  broadcast: {
    ring: 0x7dffb0, ringOpacity: 0.22, node: 0xfff2c0, line: 0x7dffb0,
    accent: 0xffb000, additive: true, glow: true, glowOpacity: 0.55,
    cameraZ: 12.6, fov: 40, grid: true, gridColor: 0x1a3a2a, auto: 0.0005, starScale: 2.4,
  },
  neon: {
    ring: 0xff4fa3, ringOpacity: 0.32, node: 0x62e6ff, line: 0xff4fa3,
    accent: 0xffb3d9, additive: true, glow: true, glowOpacity: 0.85,
    cameraZ: 12, fov: 40, grid: false, auto: 0.0007, starScale: 2.8,
  },
  pointcloud: {
    ring: 0x3dff88, ringOpacity: 0.38, node: 0x3dff88, line: 0x3dff88,
    accent: 0xb6ffcf, additive: true, glow: true, glowOpacity: 0.55,
    cameraZ: 12.5, fov: 42, grid: true, gridColor: 0x0f3a22, auto: 0.0005, starScale: 1.8,
  },
  retro: {
    ring: 0x9a8f7a, ringOpacity: 0.38, node: 0xd7c9a8, line: 0xc46a3a,
    accent: 0xd08a5a, additive: false, glow: false,
    cameraZ: 13, fov: 38, grid: false, auto: 0.00028, starScale: 1.4,
  },
  fantasy: {
    ring: 0x6a5a4a, ringOpacity: 0.42, node: 0xe8d8b8, line: 0x9a1f2e,
    accent: 0xe8d8b8, additive: false, glow: true, glowOpacity: 0.38,
    cameraZ: 12.4, fov: 36, grid: false, auto: 0.00028, starScale: 2.4,
  },
  surveillance: {
    ring: 0x6f7a7a, ringOpacity: 0.38, node: 0xffb000, line: 0x62e6ff,
    accent: 0xff5a1f, additive: true, glow: true, glowOpacity: 0.6,
    cameraZ: 12, fov: 40, grid: false, auto: 0.0004, starScale: 1.8,
  },
  chrome: {
    ring: 0x111111, ringOpacity: 0.72, node: 0x111111, line: 0x111111,
    accent: 0x8a949c, additive: false, glow: false,
    cameraZ: 12, fov: 38, grid: false, auto: 0.00032, starScale: 1.4,
  },
  vampire: {
    ring: 0x8a3a3a, ringOpacity: 0.36, node: 0xe8c8a8, line: 0xd94b4b,
    accent: 0xffd9b0, additive: false, glow: true, glowOpacity: 0.42,
    cameraZ: 12.2, fov: 36, grid: false, auto: 0.00022, starScale: 2.6,
  },
  bioluminescent: {
    ring: 0x4fffe0, ringOpacity: 0.3, node: 0xc9b8ff, line: 0xff8fa3,
    accent: 0x4fffe0, additive: true, glow: true, glowOpacity: 0.8,
    cameraZ: 12, fov: 40, grid: false, auto: 0.0004, starScale: 2.2,
  },
  acidlimbo: {
    ring: 0xc8ff00, ringOpacity: 0.36, node: 0x4fe3ff, line: 0xff3b1f,
    accent: 0xff6b35, additive: true, glow: true, glowOpacity: 0.85,
    cameraZ: 11.8, fov: 40, grid: false, auto: 0.0006, starScale: 2.6,
  },
};

function glowTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.22, "rgba(255,255,255,.55)");
    g.addColorStop(0.58, "rgba(255,255,255,.10)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const glow = glowTexture();

function ringLine(radius, color, opacity, additive) {
  const pts = [];
  for (let i = 0; i <= 180; i += 1) {
    const a = (i / 180) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
  }
  const mat = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    depthWrite: false,
  });
  return new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), mat);
}

function orrery(style, palette) {
  const root = new THREE.Group();
  const ringGroup = new THREE.Group();
  root.add(ringGroup);

  const radii = [2.2, 3.5, 4.8, 6.1];
  const tilts = [
    [0.22, -0.18],
    [-0.35, 0.32],
    [0.52, 0.12],
    [-0.12, -0.42],
  ];
  radii.forEach((r, i) => {
    const ring = ringLine(r, palette.ring, palette.ringOpacity, palette.additive);
    ring.rotation.x = tilts[i][0];
    ring.rotation.z = tilts[i][1];
    ringGroup.add(ring);
  });

  // nodes on rings
  const nodeGeo = new THREE.SphereGeometry(style === "swiss" ? 0.065 : 0.055, 16, 16);
  const nodeMat = new THREE.MeshBasicMaterial({
    color: palette.node,
    transparent: true,
    opacity: 0.92,
    blending: palette.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    depthWrite: false,
  });
  for (let i = 0; i < 16; i += 1) {
    const r = radii[i % radii.length];
    const a = i * 1.73 + 0.4;
    const tilt = tilts[i % tilts.length];
    const node = new THREE.Mesh(nodeGeo, nodeMat);
    const y = Math.sin(a) * r * Math.sin(tilt[0]);
    node.position.set(Math.cos(a) * r, y * 0.5, Math.sin(a) * r * Math.cos(tilt[1]));
    root.add(node);
    if (palette.glow && (style === "orbital" || style === "bio")) {
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glow, color: palette.node, transparent: true, opacity: 0.35,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      halo.position.copy(node.position);
      halo.scale.set(0.5, 0.5, 1);
      root.add(halo);
    }
  }

  // route into the primary
  const points = [
    new THREE.Vector3(-5.4, 0.6, 1.8),
    new THREE.Vector3(-3.4, 1.4, 0.4),
    new THREE.Vector3(-1.6, 0.9, -1.2),
    new THREE.Vector3(0.2, 0.3, -0.5),
    new THREE.Vector3(0, 0, 0),
  ];
  const curve = new THREE.CatmullRomCurve3(points);
  const route = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 90, style === "orbital" ? 0.035 : 0.022, 8, false),
    new THREE.MeshBasicMaterial({
      color: palette.line,
      transparent: true,
      opacity: style === "swiss" ? 1 : 0.85,
      blending: palette.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: false,
    }),
  );
  root.add(route);

  // primary
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(style === "swiss" ? 0.34 : 0.28, 24, 24),
    new THREE.MeshBasicMaterial({ color: palette.accent }),
  );
  root.add(core);
  if (palette.glow) {
    const star = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glow, color: palette.accent, transparent: true,
      opacity: palette.glowOpacity, blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    const starScale = palette.starScale || (style === "orbital" ? 2.6 : 2.1);
    star.scale.set(starScale, starScale, 1);
    root.add(star);
  }

  // membrane for the holographic / organic treatments
  if (style === "orbital" || style === "bio") {
    const membrane = new THREE.Mesh(
      new THREE.SphereGeometry(6.7, 48, 32),
      new THREE.ShaderMaterial({
        vertexShader: "varying vec3 vN; varying vec3 vV; void main(){ vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.0); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }",
        fragmentShader: "varying vec3 vN; varying vec3 vV; void main(){ float rim=pow(1.0-abs(dot(vN,vV)),2.6); gl_FragColor=vec4(vec3(0.28,0.86,1.0),rim*0.14); }",
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    );
    root.add(membrane);
  }

  // belt particles
  const count = 180;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const a = Math.random() * Math.PI * 2;
    const r = 6.6 + Math.random() * 1.8;
    positions[i * 3] = Math.cos(a) * r;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 0.8;
    positions[i * 3 + 2] = Math.sin(a) * r;
  }
  const beltGeo = new THREE.BufferGeometry();
  beltGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  root.add(new THREE.Points(beltGeo, new THREE.PointsMaterial({
    color: palette.node, size: style === "orbital" ? 0.05 : 0.035,
    transparent: true, opacity: style === "swiss" ? 0.5 : 0.4,
    blending: palette.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    depthWrite: false,
  })));

  if (palette.grid) {
    const grid = new THREE.GridHelper(18, 18, palette.gridColor, palette.gridColor);
    grid.position.y = -2.7;
    grid.material.transparent = true;
    grid.material.opacity = style === "swiss" ? 0.16 : 0.12;
    root.add(grid);
  }

  return { root, curve };
}

function specimen(palette) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  // bell
  const bell = new THREE.Mesh(
    new THREE.SphereGeometry(2.2, 48, 28, 0, Math.PI * 2, 0, Math.PI * 0.56),
    new THREE.MeshPhysicalMaterial({
      color: 0x1a8f7d,
      emissive: 0x0a4a40,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.24,
      roughness: 0.2,
      metalness: 0.05,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  bell.position.y = 0.6;
  body.add(bell);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(2.18, 0.012, 8, 120),
    new THREE.MeshBasicMaterial({ color: 0x3ff0d0, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending }),
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.22;
  body.add(rim);

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 20, 20),
    new THREE.MeshBasicMaterial({ color: 0xeafff8 }),
  );
  core.position.y = 0.5;
  body.add(core);
  const coreGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glow, color: 0x3ff0d0, transparent: true, opacity: 0.85,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  coreGlow.position.y = 0.5;
  coreGlow.scale.set(1.8, 1.8, 1);
  body.add(coreGlow);

  // tentacles
  for (let i = 0; i < 16; i += 1) {
    const a = (i / 16) * Math.PI * 2;
    const pts = [];
    for (let s = 0; s <= 16; s += 1) {
      const t = s / 16;
      const r = 2.1 - t * 0.5 + Math.sin(t * 4 + i) * 0.12;
      pts.push(new THREE.Vector3(
        Math.cos(a) * r,
        0.2 - t * 2.5,
        Math.sin(a) * r,
      ));
    }
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({
        color: i % 3 === 0 ? palette.accent : palette.line,
        transparent: true, opacity: 0.38, blending: THREE.AdditiveBlending,
      }),
    );
    body.add(line);
    for (let s = 2; s < 16; s += 4) {
      const dot = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glow, color: i % 3 === 0 ? palette.accent : palette.node,
        transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      dot.position.copy(pts[s]);
      dot.scale.set(0.22, 0.22, 1);
      body.add(dot);
    }
  }

  // plankton
  const count = 140;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const a = Math.random() * Math.PI * 2;
    const r = 3 + Math.random() * 4;
    positions[i * 3] = Math.cos(a) * r;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 6;
    positions[i * 3 + 2] = Math.sin(a) * r;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  root.add(new THREE.Points(geo, new THREE.PointsMaterial({
    color: 0x9fffe9, size: 0.04, transparent: true, opacity: 0.5,
    blending: THREE.AdditiveBlending, depthWrite: false,
  })));

  return { root, body };
}

function cluster(palette) {
  const root = new THREE.Group();
  const nodes = [];
  for (let i = 0; i < 16; i += 1) {
    const a = i * 2.37;
    const r = 1.4 + (i % 5) * 0.52;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const y = Math.sin(i * 1.7) * 1.05;
    const color = i % 5 === 0 ? 0xff3b1f : i % 3 === 0 ? 0xc8ff00 : 0x4fe3ff;
    const geo = i % 2 === 0 ? new THREE.BoxGeometry(0.36, 0.36, 0.36) : new THREE.IcosahedronGeometry(0.26, 1);
    const node = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: 0.92,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    node.position.set(x, y, z);
    node.rotation.set(i * 0.4, i * 0.7, i * 0.2);
    root.add(node);
    nodes.push(node.position.clone());
  }
  const route = new THREE.CatmullRomCurve3([
    nodes[0], nodes[3], nodes[6], nodes[9], nodes[12], nodes[15], new THREE.Vector3(0, 0, 0),
  ]);
  root.add(new THREE.Mesh(
    new THREE.TubeGeometry(route, 90, 0.035, 8, false),
    new THREE.MeshBasicMaterial({
      color: palette.line, transparent: true, opacity: 0.9,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }),
  ));
  root.add(new THREE.Mesh(
    new THREE.TorusGeometry(3.1, 0.018, 8, 140),
    new THREE.MeshBasicMaterial({
      color: palette.ring, transparent: true, opacity: 0.45,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }),
  ));
  const core = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glow, color: palette.accent, transparent: true, opacity: 0.95,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  core.scale.set(1.6, 1.6, 1);
  root.add(core);
  nodes.forEach((point, i) => {
    if (i % 3 !== 0) return;
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glow, color: i % 6 === 0 ? 0xff3b1f : 0x4fe3ff, transparent: true, opacity: 0.55,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    halo.position.copy(point);
    halo.scale.set(0.9, 0.9, 1);
    root.add(halo);
  });
  return { root };
}

function mount(el) {
  const canvas = el.querySelector("canvas");
  const fallback = el.querySelector("[data-3d-fallback]");
  const toggle = el.querySelector("[data-3d-toggle]");
  if (!canvas) return;

  const styleName = el.dataset.style || "observatory";
  const sceneName = el.dataset.scene || "orrery";
  const palette = STYLES[styleName] || STYLES.observatory;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch {
    el.dataset.mode = "fallback";
    if (fallback) fallback.hidden = false;
    return;
  }
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(1.6, window.devicePixelRatio || 1));
  el.dataset.mode = "live";
  if (fallback) fallback.hidden = true;

  const scene = new THREE.Scene();
  const camera = palette.ortho
    ? new THREE.OrthographicCamera(-8, 8, 6, -6, 0.1, 100)
    : new THREE.PerspectiveCamera(palette.fov || 40, 1, 0.1, 100);

  const built = sceneName === "specimen" ? specimen(palette) : sceneName === "cluster" ? cluster(palette) : orrery(styleName, palette);
  const root = built.root;
  scene.add(root);
  if (palette.ortho) root.rotation.x = 0.35;

  const cameraBase = new THREE.Vector3(0, palette.ortho ? 8 : 5.6, palette.cameraZ || 12);
  camera.position.copy(cameraBase);
  camera.lookAt(0, 0, 0);

  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let rotX = 0;
  let rotY = 0;
  let targetX = 0;
  let targetY = 0;
  let zoom = 1;
  let raf = 0;
  let visible = true;
  let fallbackMode = false;

  const resize = () => {
    const w = el.clientWidth || 600;
    const h = el.clientHeight || 420;
    renderer.setSize(w, h, false);
    if (palette.ortho) {
      const aspect = w / h;
      const span = 7.6;
      camera.left = -span * aspect;
      camera.right = span * aspect;
      camera.top = span;
      camera.bottom = -span;
    } else {
      camera.aspect = w / h;
    }
    camera.updateProjectionMatrix();
  };

  const onDown = (event) => {
    if (fallbackMode) return;
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    canvas.setPointerCapture?.(event.pointerId);
    canvas.style.cursor = "grabbing";
  };
  const onMove = (event) => {
    if (!dragging) return;
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;
    targetY += dx * 0.006;
    targetX += dy * 0.004;
  };
  const onUp = (event) => {
    dragging = false;
    canvas.releasePointerCapture?.(event.pointerId);
    canvas.style.cursor = "grab";
  };
  const onWheel = (event) => {
    if (fallbackMode) return;
    event.preventDefault();
    zoom = Math.min(1.7, Math.max(0.7, zoom + event.deltaY * 0.0007));
  };
  const onDouble = () => {
    targetX = 0;
    targetY = 0;
    zoom = 1;
  };

  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);
  canvas.addEventListener("wheel", onWheel, { passive: false });
  canvas.addEventListener("dblclick", onDouble);

  const setFallback = (on) => {
    fallbackMode = on;
    el.dataset.mode = on ? "fallback" : "live";
    if (fallback) fallback.hidden = !on;
    if (toggle) toggle.textContent = on ? "Use 3D" : "Use 2D";
    if (on) {
      cancelAnimationFrame(raf);
    } else {
      renderer.render(scene, camera);
      if (!reduce) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(loop);
      }
    }
  };

  if (toggle) {
    toggle.addEventListener("click", () => setFallback(!fallbackMode));
  }

  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && !fallbackMode && !reduce) {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(loop);
    } else {
      cancelAnimationFrame(raf);
    }
  }, { threshold: 0.05 });
  io.observe(el);

  const ro = new ResizeObserver(resize);
  ro.observe(el);
  resize();

  const clock = new THREE.Clock();
  function loop() {
    if (!visible || fallbackMode) return;
    raf = requestAnimationFrame(loop);
    const t = clock.getElapsedTime();
    if (!reduce) {
      targetY += palette.auto || 0.0005;
    }
    rotX += (targetX - rotX) * 0.08;
    rotY += (targetY - rotY) * 0.08;
    root.rotation.x = (palette.ortho ? 0.35 : 0.16) + rotX;
    root.rotation.y = rotY;
    if (sceneName === "specimen") {
      built.body.rotation.y = t * 0.08;
      built.body.scale.y = 1 + Math.sin(t * 0.8) * 0.035;
      built.body.position.y = Math.sin(t * 0.4) * 0.08;
    }
    camera.position.set(
      cameraBase.x / zoom,
      cameraBase.y / zoom,
      cameraBase.z / zoom,
    );
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  }

  renderer.render(scene, camera);
  if (!reduce) raf = requestAnimationFrame(loop);

  window.addEventListener("apsis:motion", () => {
    // The lab pages do not own the app motion switch; reduced motion is
    // handled by the media query at load and the Use 2D control.
  }, { once: true });
}

document.querySelectorAll("[data-3d]").forEach(mount);
