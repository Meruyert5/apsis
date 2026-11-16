import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { motionAllowed, MOTION_CHANGE } from "../lib/motion";
import { useStageSize } from "../lib/useStageSize";

const atmosphereVertex = `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const atmosphereFragment = `
  uniform vec3 uSunView;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float rim = pow(1.0 - max(dot(normalize(vNormal), normalize(vView)), 0.0), 2.35);
    float sun = dot(normalize(vNormal), normalize(uSunView));
    float lit = smoothstep(-0.42, 0.58, sun);
    vec3 cold = vec3(0.09, 0.22, 0.62);
    vec3 warm = vec3(0.52, 0.78, 1.0);
    vec3 col = mix(cold, warm, lit);
    gl_FragColor = vec4(col, rim * (0.16 + 0.62 * lit));
  }
`;

const lightsVertex = `
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const lightsFragment = `
  uniform sampler2D uMap;
  uniform vec3 uSunView;
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    float sun = dot(normalize(vNormal), normalize(uSunView));
    float night = smoothstep(0.18, -0.32, sun);
    vec3 city = texture2D(uMap, vUv).rgb;
    gl_FragColor = vec4(city * vec3(1.0, 0.68, 0.34) * night * 1.15, night);
  }
`;

function radialTexture(inner: string, outer: string, size = 256): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, inner);
    gradient.addColorStop(0.32, inner);
    gradient.addColorStop(0.62, outer);
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
    ctx.clearRect(0, 0, size, size);
    ctx.globalCompositeOperation = "lighter";
    const puffs: [number, number, number, string][] = [
      [0.46, 0.48, 0.42, "rgba(64,116,255,0.34)"],
      [0.58, 0.42, 0.3, "rgba(138,112,255,0.24)"],
      [0.37, 0.56, 0.24, "rgba(56,205,255,0.18)"],
      [0.63, 0.6, 0.2, "rgba(255,156,94,0.11)"],
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
      gradient.addColorStop(0.5, color.replace(/[\d.]+\)$/, "0.08)"));
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** The opening world: a lit Earth turning under city lights, with a moon,
 *  two satellites, three permission rings, and a deep, quiet sky. */
export function PlanetHero() {
  const [stageRef, size] = useStageSize<HTMLDivElement>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resizeRef = useRef<() => void>(() => {});

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;

    let disposed = false;
    let raf = 0;
    let running = false;
    let visible = true;
    let animate = motionAllowed();
    const start = performance.now();

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 80);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    if (window.innerWidth >= 760) {
      composer.addPass(
        new UnrealBloomPass(new THREE.Vector2(1440, 900), 0.3, 0.58, 0.9),
      );
    }
    composer.addPass(new OutputPass());

    const loader = new THREE.TextureLoader();
    const tex = (name: string) => `${import.meta.env.BASE_URL}textures/${name}`;
    const dayMap = loader.load(tex("earth_atmos_2048.jpg"));
    dayMap.colorSpace = THREE.SRGBColorSpace;
    dayMap.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const normalMap = loader.load(tex("earth_normal_2048.jpg"));
    const specularMap = loader.load(tex("earth_specular_2048.jpg"));
    const cloudsMap = loader.load(tex("earth_clouds_1024.png"));
    cloudsMap.colorSpace = THREE.SRGBColorSpace;
    const lightsMap = loader.load(tex("earth_lights_2048.png"));
    lightsMap.colorSpace = THREE.SRGBColorSpace;
    const moonMap = loader.load(tex("moon_1024.jpg"));
    moonMap.colorSpace = THREE.SRGBColorSpace;

    const earthGroup = new THREE.Group();
    earthGroup.rotation.z = 0.36;
    scene.add(earthGroup);

    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(1, 128, 80),
      new THREE.MeshPhongMaterial({
        color: 0xffffff,
        map: dayMap,
        normalMap,
        normalScale: new THREE.Vector2(0.78, 0.78),
        specularMap,
        specular: new THREE.Color(0x3a6f9f),
        shininess: 22,
        emissive: new THREE.Color(0x01040c),
      }),
    );
    earth.rotation.y = 4.35;
    earthGroup.add(earth);

    const night = new THREE.Mesh(
      new THREE.SphereGeometry(1.002, 128, 80),
      new THREE.ShaderMaterial({
        uniforms: {
          uMap: { value: lightsMap },
          uSunView: { value: new THREE.Vector3(0.7, 0.4, 0.6) },
        },
        vertexShader: lightsVertex,
        fragmentShader: lightsFragment,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    night.rotation.y = earth.rotation.y;
    earthGroup.add(night);

    const clouds = new THREE.Mesh(
      new THREE.SphereGeometry(1.006, 128, 80),
      new THREE.MeshPhongMaterial({
        map: cloudsMap,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        blending: THREE.NormalBlending,
      }),
    );
    clouds.rotation.y = 4.5;
    earthGroup.add(clouds);

    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.028, 96, 64),
      new THREE.ShaderMaterial({
        uniforms: { uSunView: { value: new THREE.Vector3(0.7, 0.4, 0.6) } },
        vertexShader: atmosphereVertex,
        fragmentShader: atmosphereFragment,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    earthGroup.add(atmosphere);

    const novaMap = radialTexture("rgba(255,250,236,1)", "rgba(88,150,255,0.4)");
    const blueMap = radialTexture("rgba(160,225,255,0.9)", "rgba(48,110,255,0.24)");
    const goldMap = radialTexture("rgba(255,232,186,0.95)", "rgba(255,166,84,0.2)");

    // A soft solar corona behind the world.
    const corona = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: goldMap,
        color: 0x9fc8ff,
        transparent: true,
        opacity: 0.1,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    corona.scale.set(5, 5, 1);
    corona.position.set(2.7, 1.8, -3.2);
    scene.add(corona);

    const nebulaMap = nebulaTexture();
    const nebulaA = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: nebulaMap,
        color: 0x4f80ff,
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    nebulaA.scale.set(12, 12, 1);
    nebulaA.position.set(-5, 2.5, -10);
    scene.add(nebulaA);
    const nebulaB = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: nebulaMap,
        color: 0x8f6cff,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    nebulaB.scale.set(9, 9, 1);
    nebulaB.position.set(5.5, -3, -11);
    scene.add(nebulaB);

    const sun = new THREE.DirectionalLight(0xfff0d3, 3.8);
    sun.position.set(3.2, 1.8, 3.2);
    const rim = new THREE.DirectionalLight(0x4f8cff, 1.15);
    rim.position.set(-3.2, -1.2, -1.6);
    const fill = new THREE.DirectionalLight(0x9fc8ff, 0.55);
    fill.position.set(0, 0.4, 4);
    const ambient = new THREE.AmbientLight(0x1b2c4f, 0.62);
    scene.add(sun, rim, fill, ambient);

    // Orbit rings: the ecliptic, drawn three ways.
    const ringGroup = new THREE.Group();
    ringGroup.rotation.z = -0.18;
    ringGroup.rotation.x = 0.34;
    earthGroup.add(ringGroup);
    const ringSpecs = [
      { radius: 1.33, color: 0xe7c98b, opacity: 0.36, tilt: 0.2, tube: 0.0024 },
      { radius: 1.54, color: 0x6fd9ff, opacity: 0.24, tilt: -0.28, tube: 0.0018 },
      { radius: 1.8, color: 0x9a8cff, opacity: 0.14, tilt: 0.48, tube: 0.0014 },
    ];
    for (const spec of ringSpecs) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(spec.radius, spec.tube, 3, 260),
        new THREE.MeshBasicMaterial({
          color: spec.color,
          transparent: true,
          opacity: spec.opacity,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          toneMapped: false,
        }),
      );
      ring.rotation.x = Math.PI / 2;
      ring.rotation.y = spec.tilt;
      ringGroup.add(ring);
    }

    const moonOrbit = new THREE.Group();
    moonOrbit.rotation.x = 0.34;
    moonOrbit.rotation.z = -0.12;
    earthGroup.add(moonOrbit);
    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(0.096, 40, 28),
      new THREE.MeshStandardMaterial({
        map: moonMap,
        color: 0xd6dbe4,
        emissive: 0x1a2230,
        emissiveIntensity: 0.3,
        roughness: 0.98,
        metalness: 0.02,
      }),
    );
    moon.position.set(-1.62, 0.24, 0.52);
    moonOrbit.add(moon);
    const moonHalo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: blueMap,
        color: 0xbcd6ff,
        transparent: true,
        opacity: 0.16,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    moonHalo.scale.set(0.5, 0.5, 1);
    moon.add(moonHalo);

    // Two small satellites in crossing orbits.
    const satGroup = new THREE.Group();
    satGroup.rotation.x = 0.48;
    satGroup.rotation.z = 0.2;
    ringGroup.add(satGroup);
    satGroup.visible = false;
    const satellites: { group: THREE.Group; radius: number; speed: number; phase: number }[] = [];
    for (let i = 0; i < 2; i += 1) {
      const group = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.018, 0),
        new THREE.MeshBasicMaterial({ color: i === 0 ? 0x6fd9ff : 0xe7c98b, toneMapped: false }),
      );
      const panelMaterial = new THREE.MeshBasicMaterial({
        color: 0x284a86,
        transparent: true,
        opacity: 0.92,
        toneMapped: false,
      });
      const panelA = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.001, 0.018), panelMaterial);
      const panelB = panelA.clone();
      panelA.position.x = -0.037;
      panelB.position.x = 0.037;
      group.add(body, panelA, panelB);
      const radius = 1.4 + i * 0.3;
      const phase = 1.1 + i * 2.6;
      group.position.set(Math.cos(phase) * radius, 0.12, Math.sin(phase) * radius);
      satGroup.add(group);
      satellites.push({ group, radius, speed: 0.075 + i * 0.03, phase });
    }

    // Deterministic star field with three temperatures.
    const starCount = 1800;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    const palette = [
      new THREE.Color(0xdce8ff),
      new THREE.Color(0x9dbcff),
      new THREE.Color(0xffe1b0),
      new THREE.Color(0xffffff),
    ];
    let seed = 53;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let i = 0; i < starCount; i += 1) {
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      const radius = 5.5 + rand() * 20;
      starPositions[i * 3] = Math.sin(phi) * Math.cos(theta) * radius;
      starPositions[i * 3 + 1] = Math.cos(phi) * radius;
      starPositions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius;
      const color = palette[Math.floor(rand() * palette.length)];
      starColors[i * 3] = color.r;
      starColors[i * 3 + 1] = color.g;
      starColors[i * 3 + 2] = color.b;
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute("color", new THREE.BufferAttribute(starColors, 3));
    const stars = new THREE.Points(
      starGeometry,
      new THREE.PointsMaterial({
        vertexColors: true,
        size: 0.026,
        transparent: true,
        opacity: 0.72,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    );
    scene.add(stars);

    // A loose galactic band behind the world.
    const bandCount = 900;
    const bandPositions = new Float32Array(bandCount * 3);
    const bandRand = (() => {
      let s = 991;
      return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
      };
    })();
    for (let i = 0; i < bandCount; i += 1) {
      const angle = bandRand() * Math.PI * 2;
      const radius = 7 + bandRand() * 9;
      const spread = (bandRand() - 0.5) * (1.2 + bandRand() * 2.8);
      bandPositions[i * 3] = Math.cos(angle) * radius;
      bandPositions[i * 3 + 1] = spread + Math.sin(angle) * radius * 0.16;
      bandPositions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    const bandGeometry = new THREE.BufferGeometry();
    bandGeometry.setAttribute("position", new THREE.BufferAttribute(bandPositions, 3));
    const band = new THREE.Points(
      bandGeometry,
      new THREE.PointsMaterial({
        map: novaMap,
        color: 0x9db9ff,
        size: 0.05,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    );
    band.rotation.z = 0.48;
    scene.add(band);

    // One comet crossing the far field.
    const comet = new THREE.Group();
    const cometHead = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: novaMap,
        color: 0xd7f4ff,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    cometHead.scale.set(0.34, 0.34, 1);
    const cometTailGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-0.7, 0.06, -0.1),
    ]);
    const cometTail = new THREE.Line(
      cometTailGeometry,
      new THREE.LineBasicMaterial({
        color: 0xa8e7ff,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    comet.add(cometHead, cometTail);
    scene.add(comet);

    const sunWorld = new THREE.Vector3(3.2, 1.8, 2.6).normalize();
    const sunView = new THREE.Vector3();

    const resize = () => {
      const w = Math.max(1, stage.clientWidth);
      const h = Math.max(1, stage.clientHeight);
      renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
      renderer.setSize(w, h, false);
      composer.setSize(w, h);
      camera.aspect = w / h;
      const wide = w / h > 1.08;
      camera.fov = wide ? 34 : 48;
      camera.position.set(0, 0, wide ? 4.35 : 3.55);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
      earthGroup.position.set(wide ? 1.02 : 0.34, wide ? -0.02 : 0.2, 0);
      earthGroup.scale.setScalar(wide ? 1 : 1.02);
      sunView.copy(sunWorld).transformDirection(camera.matrixWorldInverse);
      (night.material as THREE.ShaderMaterial).uniforms.uSunView.value.copy(sunView);
      (atmosphere.material as THREE.ShaderMaterial).uniforms.uSunView.value.copy(sunView);
    };
    resizeRef.current = resize;

    const renderStatic = () => {
      earth.rotation.y = 4.35;
      night.rotation.y = 4.35;
      clouds.rotation.y = 4.5;
      moon.position.set(-1.62, 0.24, 0.52);
      for (let i = 0; i < satellites.length; i += 1) {
        const item = satellites[i];
        item.group.position.set(
          Math.cos(item.phase) * item.radius,
          0.12,
          Math.sin(item.phase) * item.radius,
        );
      }
      stars.rotation.y = 0;
      band.rotation.z = 0.48;
      comet.position.set(4.6, 2.2, -3.4);
      renderer.render(scene, camera);
      composer.render();
    };

    const frame = (now: number) => {
      if (disposed) return;
      running = false;
      if (!animate || !visible) {
        renderStatic();
        return;
      }
      const time = (now - start) / 1000;

      sunView.copy(sunWorld).transformDirection(camera.matrixWorldInverse);
      (night.material as THREE.ShaderMaterial).uniforms.uSunView.value.copy(sunView);
      (atmosphere.material as THREE.ShaderMaterial).uniforms.uSunView.value.copy(sunView);

      earth.rotation.y = 4.35 + time * 0.026;
      night.rotation.y = earth.rotation.y;
      clouds.rotation.y = 4.5 + time * 0.032;
      moonOrbit.rotation.y = time * 0.055;
      for (const item of satellites) {
        const angle = item.phase + time * item.speed;
        item.group.position.set(
          Math.cos(angle) * item.radius,
          0.12 + Math.sin(angle * 1.7) * 0.02,
          Math.sin(angle) * item.radius,
        );
      }
      ringGroup.rotation.y = Math.sin(time * 0.05) * 0.05;
      stars.rotation.y = time * 0.0035;
      band.rotation.z = 0.48 + Math.sin(time * 0.01) * 0.02;
      nebulaA.position.x = -5 + Math.sin(time * 0.018) * 0.4;
      nebulaB.position.y = -3 + Math.cos(time * 0.015) * 0.3;

      const cometT = (time % 26) / 26;
      const show = false;
      comet.visible = show;
      if (show) {
        const t = cometT / 0.2;
        comet.position.set(5.8 - t * 8.8, 2.8 - t * 2.2, -4.8 + t * 1.2);
        cometTailGeometry.setFromPoints([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(-0.9, 0.12, -0.16),
        ]);
        const material = cometTail.material as THREE.LineBasicMaterial;
        material.opacity = Math.sin(t * Math.PI) * 0.42;
        (cometHead.material as THREE.SpriteMaterial).opacity = Math.sin(t * Math.PI) * 0.9;
      }

      composer.render();
      raf = window.requestAnimationFrame(frame);
    };

    const kick = () => {
      if (disposed || running) return;
      if (!animate || !visible) {
        renderStatic();
        return;
      }
      running = true;
      raf = window.requestAnimationFrame(frame);
    };

    const stageObserver = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? false;
        if (visible) kick();
        else {
          window.cancelAnimationFrame(raf);
          running = false;
          renderStatic();
        }
      },
      { threshold: 0.02 },
    );
    stageObserver.observe(stage);

    const onMotion = () => {
      animate = motionAllowed();
      if (animate) kick();
      else {
        window.cancelAnimationFrame(raf);
        running = false;
        renderStatic();
      }
    };
    window.addEventListener(MOTION_CHANGE, onMotion);

    const onResize = () => {
      resize();
      if (!animate || !visible) renderStatic();
    };
    window.addEventListener("resize", onResize);

    resize();
    renderStatic();
    kick();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener(MOTION_CHANGE, onMotion);
      stageObserver.disconnect();
      for (const texture of [dayMap, normalMap, specularMap, cloudsMap, lightsMap, moonMap]) {
        texture.dispose();
      }
      novaMap.dispose();
      blueMap.dispose();
      goldMap.dispose();
      nebulaMap.dispose();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageRef]);

  useEffect(() => {
    resizeRef.current();
  }, [size.w, size.h]);

  return (
    <div className="planet-hero" ref={stageRef} aria-hidden="true">
      <canvas className="planet-hero__canvas" ref={canvasRef} />
    </div>
  );
}
