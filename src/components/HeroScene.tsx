import { useEffect, useRef } from 'react';
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Fog,
  Group,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
} from 'three';
import { heroState } from '../lib/heroState';
import { isMotionPaused, MOTION_EVENT } from '../lib/motion';

const BLUE = new Color('#2579DC');
const BLUE_DEEP = new Color('#1653A9');
const BLUE_SOFT = new Color('#8DB8F2');

/* Particle field: a long tube of soft points the camera travels into on scroll */
const particleVert = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  attribute float aScale;
  attribute float aSeed;
  varying float vAlpha;
  varying float vSeed;
  varying float vNear;
  void main() {
    vec3 p = position;
    p.x += sin(uTime * 0.18 + aSeed * 6.2831) * 0.28;
    p.y += cos(uTime * 0.14 + aSeed * 4.0) * 0.28;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float depth = -mv.z;
    gl_PointSize = uSize * aScale * uPixelRatio * (10.0 / max(depth, 0.1));
    vAlpha = smoothstep(42.0, 8.0, depth) * smoothstep(0.2, 1.4, depth);
    // Points close to the lens fall out of focus: bigger, softer, fainter (bokeh).
    vNear = smoothstep(5.0, 1.2, depth);
    gl_PointSize *= 1.0 + vNear * 2.2;
    vSeed = aSeed;
  }
`;
const particleFrag = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying float vAlpha;
  varying float vSeed;
  varying float vNear;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float sharp = pow(smoothstep(0.5, 0.0, d), 1.7);
    float soft = smoothstep(0.5, 0.15, d) * 0.9;
    float a = mix(sharp, soft, vNear) * mix(1.0, 0.28, vNear);
    gl_FragColor = vec4(mix(uColorA, uColorB, vSeed), a * vAlpha * 0.85);
  }
`;

/* Light blades: translucent strokes echoing the W emblem's diagonals */
const bladeVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const bladeFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    float edge = smoothstep(0.0, 0.5, vUv.x) * smoothstep(1.0, 0.5, vUv.x);
    float along = smoothstep(0.0, 0.45, vUv.y) * smoothstep(1.0, 0.55, vUv.y);
    vec3 col = mix(uColor, vec3(1.0), (1.0 - vUv.y) * 0.45);
    gl_FragColor = vec4(col, pow(edge, 0.8) * along * uOpacity);
  }
`;

function buildParticles(count: number, pixelRatio: number) {
  const g = new BufferGeometry();
  const pos = new Float32Array(count * 3);
  const scale = new Float32Array(count);
  const seed = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 30;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 18;
    pos[i * 3 + 2] = 6 - Math.random() * 64;
    scale[i] = 0.35 + Math.random() * Math.random() * 1.6;
    seed[i] = Math.random();
  }
  g.setAttribute('position', new BufferAttribute(pos, 3));
  g.setAttribute('aScale', new BufferAttribute(scale, 1));
  g.setAttribute('aSeed', new BufferAttribute(seed, 1));
  const m = new ShaderMaterial({
    vertexShader: particleVert,
    fragmentShader: particleFrag,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uSize: { value: 9 },
      uPixelRatio: { value: pixelRatio },
      uColorA: { value: BLUE },
      uColorB: { value: BLUE_SOFT },
    },
  });
  return new Points(g, m);
}

function buildBlades(count: number) {
  const group = new Group();
  const geometry = new PlaneGeometry(1, 1);
  const palette = [BLUE, BLUE_SOFT, BLUE, BLUE_DEEP];
  const specs = Array.from({ length: count }, (_, i) => {
    const side = i % 2 === 0 ? -1 : 1;
    const spec = {
      y: (Math.random() - 0.5) * 9,
      // W strokes lean ~26°; alternate the lean like the letter's V shapes
      rot: (i % 3 === 0 ? -1 : 1) * (0.42 + Math.random() * 0.08),
      speed: 0.2 + Math.random() * 0.35,
      phase: Math.random() * Math.PI * 2,
    };
    const mesh = new Mesh(
      geometry,
      new ShaderMaterial({
        vertexShader: bladeVert,
        fragmentShader: bladeFrag,
        transparent: true,
        depthWrite: false,
        side: DoubleSide,
        uniforms: {
          uColor: { value: palette[i % palette.length] },
          uOpacity: { value: 0.1 + Math.random() * 0.2 },
        },
      }),
    );
    mesh.position.set(side * (3.2 + Math.random() * 7), spec.y, 2 - Math.random() * 34);
    mesh.rotation.z = spec.rot;
    mesh.scale.set(0.12 + Math.random() * 0.32, 4 + Math.random() * 6, 1);
    group.add(mesh);
    return spec;
  });
  const update = (t: number) => {
    group.children.forEach((child, i) => {
      const s = specs[i];
      child.position.y = s.y + Math.sin(t * s.speed + s.phase) * 0.35;
      child.rotation.z = s.rot + Math.sin(t * s.speed * 0.6 + s.phase) * 0.03;
    });
  };
  return { group, update };
}

function buildRing(radius: number, tilt: [number, number, number], opacity: number) {
  const outer = new Group();
  outer.rotation.set(...tilt);
  const spin = new Group();
  const pts: Vector3[] = [];
  for (let i = 0; i <= 160; i++) {
    const a = (i / 160) * Math.PI * 2;
    pts.push(new Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0));
  }
  spin.add(
    new Line(
      new BufferGeometry().setFromPoints(pts),
      new LineBasicMaterial({ color: '#7FA9EC', transparent: true, opacity }),
    ),
  );
  const big = new Mesh(new SphereGeometry(0.07, 16, 16), new MeshBasicMaterial({ color: '#2579DC' }));
  big.position.set(radius, 0, 0);
  const small = new Mesh(new SphereGeometry(0.04, 12, 12), new MeshBasicMaterial({ color: '#8DB8F2' }));
  small.position.set(-radius * 0.7071, radius * 0.7071, 0);
  spin.add(big, small);
  outer.add(spin);
  return { outer, spin };
}

export default function HeroScene({
  active,
  reduced,
  mobile,
  onReady,
}: {
  active: boolean;
  reduced: boolean;
  mobile: boolean;
  onReady?: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<{ start: () => void; stop: () => void; renderOnce: () => void } | null>(null);

  useEffect(() => {
    const el = host.current!;
    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ antialias: !mobile, alpha: true, powerPreference: 'high-performance' });
    } catch {
      return; // No WebGL: the CSS backdrop remains, which is a fine fallback.
    }
    const pixelRatio = Math.min(window.devicePixelRatio, mobile ? 1.5 : 2);
    renderer.setPixelRatio(pixelRatio);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    const scene = new Scene();
    scene.fog = new Fog('#F3F7FF', 10, 40);
    const camera = new PerspectiveCamera(45, 1, 0.1, 80);
    camera.position.set(0, 0, 8);

    const world = new Group();
    scene.add(world);
    const particles = buildParticles(mobile ? 650 : 1700, pixelRatio);
    world.add(particles);
    const blades = buildBlades(mobile ? 8 : 16);
    world.add(blades.group);
    const ringHolder = new Group();
    ringHolder.position.z = -3;
    const rings = [
      { ...buildRing(5.6, [1.15, 0.2, 0], 0.45), speed: 0.05 },
      { ...buildRing(7.4, [1.3, -0.35, 0.4], 0.3), speed: -0.035 },
      ...(mobile ? [] : [{ ...buildRing(4.2, [0.9, 0.5, -0.3], 0.25), speed: 0.07 }]),
    ];
    rings.forEach((r) => ringHolder.add(r.outer));
    world.add(ringHolder);

    const resize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    const smooth = { p: heroState.progress, x: 0, y: 0 };
    let elapsed = 0;
    let last = performance.now();
    let raf = 0;

    const draw = (dt: number) => {
      elapsed += dt;
      const k = 1 - Math.pow(0.001, dt); // frame-rate independent damping
      smooth.p += (heroState.progress - smooth.p) * k;
      smooth.x += (heroState.pointerX - smooth.x) * k * 0.6;
      smooth.y += (heroState.pointerY - smooth.y) * k * 0.6;
      const e = smooth.p * smooth.p * (3 - 2 * smooth.p);
      const ex = heroState.exit;

      (particles.material as ShaderMaterial).uniforms.uTime.value = elapsed;
      blades.update(elapsed);
      rings.forEach((r) => (r.spin.rotation.z += dt * r.speed));
      world.rotation.z = e * 0.18 + ex * 0.12;

      camera.position.set(smooth.x * 0.7, -smooth.y * 0.45 - e * 0.6 - ex * 1.5, 8 - e * 22 - ex * 12);
      camera.lookAt(smooth.x * 0.2, -e * 1.2 - ex * 2, camera.position.z - 10);
      renderer.render(scene, camera);
    };

    const loop = (now: number) => {
      const dt = Math.max(0, Math.min((now - last) / 1000, 0.05));
      last = now;
      draw(dt);
      raf = requestAnimationFrame(loop);
    };

    api.current = {
      start: () => {
        if (raf) return;
        last = performance.now();
        raf = requestAnimationFrame(loop);
      },
      stop: () => {
        cancelAnimationFrame(raf);
        raf = 0;
      },
      renderOnce: () => draw(0.016),
    };

    if (reduced || isMotionPaused()) api.current.renderOnce();
    else api.current.start();
    requestAnimationFrame(() => onReady?.());

    return () => {
      api.current?.stop();
      api.current = null;
      ro.disconnect();
      scene.traverse((o) => {
        const m = o as Mesh;
        m.geometry?.dispose();
        const mat = m.material as { dispose?: () => void } | undefined;
        mat?.dispose?.();
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
    // Scene is rebuilt only when the device class changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobile, reduced]);

  // Pause rendering when the hero is off-screen, or when the visitor pauses motion.
  useEffect(() => {
    if (reduced) return;
    const sync = () => {
      if (active && !isMotionPaused()) api.current?.start();
      else api.current?.stop();
    };
    sync();
    window.addEventListener(MOTION_EVENT, sync);
    return () => window.removeEventListener(MOTION_EVENT, sync);
  }, [active, reduced]);

  return <div ref={host} className="hero__gl" aria-hidden="true" />;
}
