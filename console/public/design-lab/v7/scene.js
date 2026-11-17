import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

const obsidian = 0x000000;
const blue = 0x1a1aff;
const white = 0xffffff;
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

const starMap = starTexture();

function addStar(root, x, y, z, scale) {
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: starMap,
    color: white,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }));
  sprite.position.set(x, y, z);
  sprite.scale.set(scale, scale, 1);
  root.add(sprite);
}

/* ---------------------------------------------------------------- orb */
function mountOrb() {
  const stage = document.querySelector("[data-orb]");
  if (!stage) return;
  const canvas = stage.querySelector("canvas");
  const fallback = stage.querySelector("[data-orb-fallback]");
  const toggle = stage.querySelector("[data-orb-toggle]");
  if (!canvas) return;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch {
    stage.dataset.mode = "fallback";
    if (fallback) fallback.hidden = false;
    return;
  }
  renderer.setClearColor(obsidian, 0);
  renderer.setPixelRatio(Math.min(1.75, window.devicePixelRatio || 1));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 1.25, 11.6);
  camera.lookAt(0, 0.15, 0);

  const root = new THREE.Group();
  root.rotation.x = 0.12;
  scene.add(root);

  stage.dataset.mode = "live";

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
      color: blue, wireframe: true, transparent: true, opacity: 0.38,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }),
  );
  root.add(shell);

  const shellOuter = new THREE.Mesh(
    new THREE.SphereGeometry(2.58, 16, 12),
    new THREE.MeshBasicMaterial({
      color: white, wireframe: true, transparent: true, opacity: 0.1,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }),
  );
  root.add(shellOuter);

  const orbitPoints = [];
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
      color: white, transparent: true, opacity: 0.72,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }),
  );
  root.add(ring);

  for (let i = 0; i < 7; i += 1) {
    const point = orbit.getPointAt(i / 7);
    const admin = i === 6;
    const node = new THREE.Mesh(
      new THREE.OctahedronGeometry(admin ? 0.105 : 0.058, 0),
      new THREE.MeshBasicMaterial({
        color: admin ? blue : white,
        transparent: true, opacity: admin ? 1 : 0.9,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }),
    );
    node.position.copy(point);
    root.add(node);
    if (admin) addStar(root, point.x, point.y, point.z, 0.8);
  }

  // atlas dust: the atlas is a field, not just a shell.
  const dustCount = 420;
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
    color: blue, size: 0.022, transparent: true, opacity: 0.72,
    blending: THREE.AdditiveBlending, depthWrite: false,
  })));

  const ghost = new THREE.Mesh(
    new THREE.SphereGeometry(1.05, 18, 12),
    new THREE.MeshBasicMaterial({
      color: blue, wireframe: true, transparent: true, opacity: 0.16,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }),
  );
  ghost.position.set(-3.3, 2.25, -2.6);
  root.add(ghost);

  const ghostTwo = new THREE.Mesh(
    new THREE.SphereGeometry(0.62, 12, 8),
    new THREE.MeshBasicMaterial({
      color: white, wireframe: true, transparent: true, opacity: 0.12,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }),
  );
  ghostTwo.position.set(3.2, -2.2, -2.1);
  root.add(ghostTwo);

  const polar = new THREE.PolarGridHelper(4.3, 8, 4, 64, blue, blue);
  polar.position.y = -2.65;
  polar.material.transparent = true;
  polar.material.opacity = 0.12;
  const polarGroup = new THREE.Group();
  polarGroup.add(polar);
  root.add(polarGroup);

  const stars = [
    [-2.9, 2.2, 1.1, 0.6],
    [2.95, -1.7, 0.9, 0.44],
    [1.4, 2.75, -0.8, 0.34],
  ];
  stars.forEach(([x, y, z, scale]) => addStar(root, x, y, z, scale));

  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let targetX = 0;
  let targetY = 0.2;
  let rotX = 0;
  let rotY = 0;
  let zoom = 1;
  let fallbackMode = false;
  let raf = 0;
  let visible = true;
  const clock = new THREE.Clock();

  const resize = () => {
    const width = stage.clientWidth || 700;
    const height = stage.clientHeight || 700;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
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
    targetY += (event.clientX - lastX) * 0.006;
    targetX += (event.clientY - lastY) * 0.004;
    lastX = event.clientX;
    lastY = event.clientY;
  };
  const onUp = (event) => {
    dragging = false;
    canvas.releasePointerCapture?.(event.pointerId);
    canvas.style.cursor = "grab";
  };
  const onWheel = (event) => {
    if (fallbackMode) return;
    event.preventDefault();
    zoom = Math.min(1.28, Math.max(0.78, zoom + event.deltaY * 0.0006));
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

  const setFallback = (on) => {
    fallbackMode = on;
    stage.dataset.mode = on ? "fallback" : "live";
    if (fallback) fallback.hidden = !on;
    if (toggle) toggle.textContent = on ? "USE 3D" : "USE 2D";
    if (on) {
      cancelAnimationFrame(raf);
    } else if (visible) {
      raf = requestAnimationFrame(loop);
    }
  };
  if (toggle) toggle.addEventListener("click", () => setFallback(!fallbackMode));

  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && !fallbackMode) {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(loop);
    } else {
      cancelAnimationFrame(raf);
    }
  }, { threshold: 0.05 });
  observer.observe(stage);

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(stage);
  resize();

  function loop() {
    if (!visible || fallbackMode) return;
    raf = requestAnimationFrame(loop);
    const time = clock.getElapsedTime();
    uniforms.uTime.value = time;
    if (!reduce) targetY += 0.0009;
    rotX += (targetX - rotX) * 0.07;
    rotY += (targetY - rotY) * 0.07;
    root.rotation.x = 0.12 + rotX;
    root.rotation.y = rotY;
    polarGroup.rotation.y = -rotY * 0.2;
    camera.position.set(0, 1.25 / zoom, 11.6 / zoom);
    camera.lookAt(0, 0.15, 0);
    renderer.render(scene, camera);
  }

  renderer.render(scene, camera);
  raf = requestAnimationFrame(loop);
}

/* ---------------------------------------------------------------- wave */
function mountWave() {
  const stage = document.querySelector("[data-wave]");
  if (!stage) return;
  const canvas = stage.querySelector("canvas");
  if (!canvas) return;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch {
    return;
  }
  renderer.setClearColor(obsidian, 0);
  renderer.setPixelRatio(Math.min(1.75, window.devicePixelRatio || 1));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 1.9, 7.4);
  camera.lookAt(0, -0.15, 0);

  const group = new THREE.Group();
  group.rotation.x = -1.02;
  scene.add(group);

  const geometry = new THREE.PlaneGeometry(10, 5, 74, 37);
  const base = Float32Array.from(geometry.attributes.position.array);
  const points = new THREE.Points(geometry, new THREE.PointsMaterial({
    color: blue, size: 0.038, transparent: true, opacity: 0.82,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  group.add(points);

  const sparkGeo = new THREE.BufferGeometry();
  const sparkPositions = new Float32Array(base.length);
  sparkPositions.set(base);
  sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPositions, 3));
  const sparkPoints = new THREE.Points(sparkGeo, new THREE.PointsMaterial({
    color: white, size: 0.026, transparent: true, opacity: 0.38,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  group.add(sparkPoints);

  const wireGeo = new THREE.PlaneGeometry(10, 5, 34, 17);
  const wireBase = Float32Array.from(wireGeo.attributes.position.array);
  const wire = new THREE.Mesh(wireGeo, new THREE.MeshBasicMaterial({
    color: blue, wireframe: true, transparent: true, opacity: 0.11,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  group.add(wire);

  const resize = () => {
    const width = stage.clientWidth || 500;
    const height = stage.clientHeight || 260;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  const shape = (x, y, time) =>
    Math.sin(x * 1.05 + time * 0.55) * 0.3 + Math.cos(y * 1.8 + time * 0.4) * 0.2;

  let raf = 0;
  let visible = true;
  const clock = new THREE.Clock();

  function animate() {
    const time = reduce ? 1.4 : clock.getElapsedTime();
    const positions = geometry.attributes.position.array;
    const sparks = sparkGeo.attributes.position.array;
    for (let i = 0; i < positions.length / 3; i += 1) {
      const x = base[i * 3];
      const y = base[i * 3 + 1];
      const z = shape(x, y, time);
      positions[i * 3 + 2] = z;
      sparks[i * 3 + 2] = z + 0.012;
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
  }

  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && !reduce) {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(raf);
    }
  }, { threshold: 0.05 });
  observer.observe(stage);

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(stage);
  resize();
  animate();
}

mountOrb();
mountWave();
