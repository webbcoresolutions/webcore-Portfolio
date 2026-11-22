import { useEffect, useRef } from 'react';
import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Points,
  RingGeometry,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
} from 'three';
import { offices } from '../data/company';
import { isMotionPaused, MOTION_EVENT } from '../lib/motion';

const DEG = Math.PI / 180;

/** lat/lon → point on a unit sphere (three.js, y-up). */
function toVec(lat: number, lon: number, r = 1) {
  const la = lat * DEG;
  const lo = lon * DEG;
  return new Vector3(Math.cos(la) * Math.cos(lo) * r, Math.sin(la) * r, -Math.cos(la) * Math.sin(lo) * r);
}

const dotVert = /* glsl */ `
  uniform float uSize;
  uniform float uPixelRatio;
  attribute float aSeed;
  varying float vFacing;
  varying float vSeed;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vec3 n = normalize(normalMatrix * position);
    vFacing = n.z;
    vSeed = aSeed;
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * uPixelRatio * (0.65 + aSeed * 0.7);
  }
`;
const dotFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uTime;
  varying float vFacing;
  varying float vSeed;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.15, d);
    float facing = smoothstep(-0.15, 0.55, vFacing);
    float twinkle = 0.75 + 0.25 * sin(uTime * 1.5 + vSeed * 40.0);
    gl_FragColor = vec4(uColor, a * facing * twinkle * 0.85);
  }
`;
const atmoVert = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const atmoFrag = /* glsl */ `
  uniform vec3 uColor;
  varying vec3 vNormal;
  void main() {
    float i = pow(0.68 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 4.0);
    gl_FragColor = vec4(uColor, 1.0) * i * 0.85;
  }
`;

export default function ContactGlobe({ reduced, mobile }: { reduced: boolean; mobile: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const labels = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const el = host.current!;
    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch {
      el.classList.add('is-fallback');
      return;
    }
    const pr = Math.min(window.devicePixelRatio, mobile ? 1.5 : 2);
    renderer.setPixelRatio(pr);
    renderer.setClearColor(0x000000, 0);
    el.prepend(renderer.domElement);

    const scene = new Scene();
    const camera = new PerspectiveCamera(32, 1, 0.1, 50);
    camera.position.set(0, 0, 4.4);

    // Tilt (lat) on the outer group, spin (lon) on the inner — so it turns around Earth's axis.
    const tilt = new Group();
    const globe = new Group();
    tilt.add(globe);
    scene.add(tilt);
    const centreLat = 34;
    const centreLon = 36;
    tilt.rotation.x = centreLat * DEG;
    const baseSpin = -Math.PI / 2 - centreLon * DEG;
    globe.rotation.y = baseSpin;

    // Body
    globe.add(new Mesh(new SphereGeometry(0.985, 64, 64), new MeshBasicMaterial({ color: '#081a44' })));

    // Dotted surface (Fibonacci sphere)
    const N = mobile ? 1800 : 3400;
    const pos = new Float32Array(N * 3);
    const seed = new Float32Array(N);
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const t = golden * i;
      pos[i * 3] = Math.cos(t) * r;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = Math.sin(t) * r;
      seed[i] = Math.random();
    }
    const dotGeo = new BufferGeometry();
    dotGeo.setAttribute('position', new BufferAttribute(pos, 3));
    dotGeo.setAttribute('aSeed', new BufferAttribute(seed, 1));
    const dotMat = new ShaderMaterial({
      vertexShader: dotVert,
      fragmentShader: dotFrag,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uSize: { value: mobile ? 2.4 : 2.8 },
        uPixelRatio: { value: pr },
        uColor: { value: new Color('#8DB8F2') },
        uTime: { value: 0 },
      },
    });
    globe.add(new Points(dotGeo, dotMat));

    // Atmosphere glow
    const atmo = new Mesh(
      new SphereGeometry(1.16, 64, 64),
      new ShaderMaterial({
        vertexShader: atmoVert,
        fragmentShader: atmoFrag,
        blending: AdditiveBlending,
        side: BackSide,
        transparent: true,
        depthWrite: false,
        uniforms: { uColor: { value: new Color('#3f8ef0') } },
      }),
    );
    scene.add(atmo);

    // Office markers
    const markers = offices.map((o) => {
      const p = toVec(o.lat, o.lon, 1.002);
      const dot = new Mesh(new SphereGeometry(o.hq ? 0.03 : 0.022, 20, 20), new MeshBasicMaterial({ color: o.hq ? '#ffffff' : '#bfd8ff' }));
      dot.position.copy(p);
      const ring = new Mesh(
        new RingGeometry(0.035, 0.045, 48),
        new MeshBasicMaterial({ color: '#5aa0f5', transparent: true, opacity: 0.8, depthWrite: false }),
      );
      ring.position.copy(p.clone().multiplyScalar(1.001));
      ring.lookAt(p.clone().multiplyScalar(2));
      globe.add(dot, ring);
      return { p, ring, hq: !!o.hq };
    });

    // Arcs from HQ to the other offices, with a travelling signal on each
    const hq = markers.find((m) => m.hq)!;
    const SEG = 96;
    const arcs = markers
      .filter((m) => !m.hq)
      .map((m, i) => {
        const pts: Vector3[] = [];
        const angle = hq.p.angleTo(m.p);
        for (let s = 0; s <= SEG; s++) {
          const t = s / SEG;
          const v = new Vector3().copy(hq.p).lerp(m.p, t).normalize();
          v.multiplyScalar(1 + Math.sin(Math.PI * t) * angle * 0.32);
          pts.push(v);
        }
        const geo = new BufferGeometry().setFromPoints(pts);
        geo.setDrawRange(0, 0);
        const line = new Line(geo, new LineBasicMaterial({ color: '#6fb0ff', transparent: true, opacity: 0.85 }));
        const comet = new Mesh(new SphereGeometry(0.016, 12, 12), new MeshBasicMaterial({ color: '#ffffff' }));
        globe.add(line, comet);
        return { pts, geo, comet, offset: i * 0.5 };
      });

    // Faint orbit ring around the globe
    const orbitPts: Vector3[] = [];
    for (let i = 0; i <= 200; i++) {
      const a = (i / 200) * Math.PI * 2;
      orbitPts.push(new Vector3(Math.cos(a) * 1.42, 0, Math.sin(a) * 1.42));
    }
    const orbit = new Line(
      new BufferGeometry().setFromPoints(orbitPts),
      new LineBasicMaterial({ color: '#8DB8F2', transparent: true, opacity: 0.18 }),
    );
    orbit.rotation.set(1.25, 0.2, 0.3);
    scene.add(orbit);

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

    const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX / window.innerWidth - 0.5;
      pointer.y = e.clientY / window.innerHeight - 0.5;
    };
    if (!mobile && !reduced) window.addEventListener('pointermove', onMove, { passive: true });

    const tmp = new Vector3();
    const camDir = new Vector3();
    let t = 0;
    let last = performance.now();
    let raf = 0;
    let visible = true;

    const draw = (dt: number) => {
      t += dt;
      pointer.sx += (pointer.x - pointer.sx) * Math.min(1, dt * 3);
      pointer.sy += (pointer.y - pointer.sy) * Math.min(1, dt * 3);
      dotMat.uniforms.uTime.value = t;
      globe.rotation.y = baseSpin + Math.sin(t * 0.12) * 0.14 + pointer.sx * 0.4;
      tilt.rotation.x = centreLat * DEG + pointer.sy * 0.25;
      orbit.rotation.z += dt * 0.05;

      markers.forEach((m, i) => {
        const k = ((t * 0.6 + i * 0.33) % 1);
        m.ring.scale.setScalar(1 + k * 2.2);
        (m.ring.material as MeshBasicMaterial).opacity = (1 - k) * 0.8;
      });

      arcs.forEach((a) => {
        const grow = Math.min(1, Math.max(0, (t - 0.6 - a.offset) / 1.4));
        a.geo.setDrawRange(0, Math.floor(grow * (SEG + 1)));
        const k = ((t * 0.35 + a.offset) % 1);
        const idx = Math.max(0, Math.min(SEG, Math.floor(k * SEG)));
        a.comet.position.copy(a.pts[idx]);
        a.comet.visible = grow >= 1;
      });

      renderer.render(scene, camera);

      // Project labels onto the markers; hide those turning away.
      camera.getWorldDirection(camDir);
      markers.forEach((m, i) => {
        const label = labels.current[i];
        if (!label) return;
        m.ring.getWorldPosition(tmp);
        const facing = tmp.clone().normalize().dot(camDir.clone().negate());
        tmp.project(camera);
        const x = (tmp.x * 0.5 + 0.5) * el.clientWidth;
        const y = (-tmp.y * 0.5 + 0.5) * el.clientHeight;
        const oy = offices[i].hq ? 16 : offices[i].lon > 60 ? -16 : 0;
        label.style.transform = `translate3d(${x.toFixed(1)}px, ${(y + oy).toFixed(1)}px, 0) translateY(-50%)`;
        label.style.opacity = String(Math.max(0, Math.min(1, (facing - 0.1) * 4)));
      });
    };

    const loop = (now: number) => {
      const dt = Math.max(0, Math.min((now - last) / 1000, 0.05));
      last = now;
      draw(dt);
      if (visible && !isMotionPaused()) raf = requestAnimationFrame(loop);
    };

    const settled = () => {
      if (t < 3) t = 3; // a settled frame with the arcs drawn
      draw(0);
    };
    const resume = () => {
      cancelAnimationFrame(raf);
      if (!visible || reduced || isMotionPaused()) return;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };
    if (reduced || isMotionPaused()) settled();
    else raf = requestAnimationFrame(loop);

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      resume();
    });
    io.observe(el);
    const onMotion = () => (isMotionPaused() ? (cancelAnimationFrame(raf), settled()) : resume());
    window.addEventListener(MOTION_EVENT, onMotion);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener(MOTION_EVENT, onMotion);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener('pointermove', onMove);
      scene.traverse((o) => {
        const m = o as Mesh;
        m.geometry?.dispose();
        (m.material as { dispose?: () => void } | undefined)?.dispose?.();
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [mobile, reduced]);

  return (
    <div className="globe" ref={host} aria-hidden="true">
      {offices.map((o, i) => (
        <span key={o.region} className={`globe__label ${o.hq ? 'is-hq' : ''}`} ref={(n) => (labels.current[i] = n)}>
          <i />
          <span>
            {o.region}
            {o.hq && <b>HQ</b>}
          </span>
        </span>
      ))}
    </div>
  );
}
