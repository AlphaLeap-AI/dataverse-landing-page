"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Component,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import * as THREE from "three";

import styles from "./data-universe.module.css";

const COUNT_HIGH = 6200;
const COUNT_MED = 3200;
const COUNT_LOW = 1800;
const MORPH_MAX = 4;

function particleBudget(): number {
  if (typeof window === "undefined") return COUNT_MED;
  const w = window.innerWidth;
  const cores = navigator.hardwareConcurrency || 4;
  const saveData = "connection" in navigator && (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
  if (saveData || w < 480) return COUNT_LOW;
  if (w <= 720 || cores <= 4) return COUNT_MED;
  return COUNT_HIGH;
}

function supportsWebGL(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl") || c.getContext("experimental-webgl"));
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/*  Formations: chaos → sphere → rings → grid → tunnel                 */
/* ------------------------------------------------------------------ */

function buildFormations(count: number) {
  const chaos = new Float32Array(count * 3);
  const sphere = new Float32Array(count * 3);
  const rings = new Float32Array(count * 3);
  const grid = new Float32Array(count * 3);
  const tunnel = new Float32Array(count * 3);
  const rand = new Float32Array(count);
  const size = new Float32Array(count);

  const GOLDEN = Math.PI * (3 - Math.sqrt(5));
  const cols = Math.ceil(Math.sqrt(count * 1.5));
  const rows = Math.ceil(count / cols);
  const ringTilts = [-0.55, 0.38, -0.18, 0.66, 0.08];

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;

    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    const rr = 5 + Math.pow(Math.random(), 0.55) * 13;
    chaos[i3] = Math.sin(ph) * Math.cos(th) * rr * 1.4;
    chaos[i3 + 1] = Math.cos(ph) * rr * 0.75;
    chaos[i3 + 2] = Math.sin(ph) * Math.sin(th) * rr;

    const y = 1 - (i / Math.max(1, count - 1)) * 2;
    const rad = Math.sqrt(Math.max(0, 1 - y * y));
    const t = GOLDEN * i;
    sphere[i3] = Math.cos(t) * rad * 6.4;
    sphere[i3 + 1] = y * 6.4;
    sphere[i3 + 2] = Math.sin(t) * rad * 6.4;

    const ring = i % 5;
    const a = (i / count) * Math.PI * 2 * 5 + ring * 1.256 + Math.random() * 0.05;
    const R = 3.4 + ring * 0.95;
    const x = Math.cos(a) * R;
    const yy = (Math.random() - 0.5) * 0.1;
    const z = Math.sin(a) * R;
    const tilt = ringTilts[ring];
    const y2 = yy * Math.cos(tilt) - z * Math.sin(tilt);
    const z2 = yy * Math.sin(tilt) + z * Math.cos(tilt);
    const spin = ring * 0.7;
    rings[i3] = x * Math.cos(spin) + z2 * Math.sin(spin);
    rings[i3 + 1] = y2;
    rings[i3 + 2] = -x * Math.sin(spin) + z2 * Math.cos(spin);

    const gx = (i % cols) / cols;
    const gz = Math.floor(i / cols) / rows;
    const px = (gx - 0.5) * 32;
    const pz = (gz - 0.5) * 22;
    grid[i3] = px;
    grid[i3 + 1] = Math.sin(px * 0.42) * Math.cos(pz * 0.5) * 1.15 - 2.4;
    grid[i3 + 2] = pz;

    const ta = Math.random() * Math.PI * 2;
    const tr = 3.6 + Math.pow(Math.random(), 1.6) * 2.4;
    const tz = 16 - Math.random() * 54;
    const twist = tz * 0.055;
    tunnel[i3] = Math.cos(ta + twist) * tr;
    tunnel[i3 + 1] = Math.sin(ta + twist) * tr;
    tunnel[i3 + 2] = tz;

    rand[i] = Math.random();
    size[i] = 0.5 + Math.random() * 1.15;
  }

  return { chaos, sphere, rings, grid, tunnel, rand, size };
}

const vertexShader = /* glsl */ `
  attribute vec3 aChaos;
  attribute vec3 aSphere;
  attribute vec3 aRings;
  attribute vec3 aGrid;
  attribute vec3 aTunnel;
  attribute float aRand;
  attribute float aSize;

  uniform float uTime;
  uniform float uProgress;
  uniform float uPixelRatio;

  varying float vRand;
  varying float vDepth;
  varying float vTwinkle;

  void main() {
    vRand = aRand;
    float s = uProgress;

    vec3 pos = aChaos;
    pos = mix(pos, aSphere, smoothstep(0.0, 1.0, s));
    pos = mix(pos, aRings,  smoothstep(1.0, 2.0, s));
    pos = mix(pos, aGrid,   smoothstep(2.0, 3.0, s));
    pos = mix(pos, aTunnel, smoothstep(3.0, 4.0, s));

    float wob = mix(0.6, 0.06, smoothstep(0.0, 1.1, s));
    pos.x += wob * sin(uTime * 0.7 + aRand * 37.0 + pos.y * 0.45);
    pos.y += wob * sin(uTime * 0.9 + aRand * 51.0 + pos.z * 0.4);
    pos.z += wob * sin(uTime * 0.6 + aRand * 67.0 + pos.x * 0.5);

    float gridMix = smoothstep(2.0, 3.0, s) * (1.0 - smoothstep(3.0, 4.0, s));
    pos.y += gridMix * 0.5 * sin(uTime * 0.8 + pos.x * 0.35 + pos.z * 0.3);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    float depth = -mv.z;
    vDepth = depth;
    vTwinkle = 0.72 + 0.28 * sin(uTime * 2.0 + aRand * 42.0);
    gl_PointSize = min(aSize * uPixelRatio * (30.0 / max(depth, 0.1)), 64.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  varying float vRand;
  varying float vDepth;
  varying float vTwinkle;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    float a = smoothstep(0.5, 0.02, d);
    a *= a;

    vec3 cyan = vec3(0.42, 0.91, 1.0);
    vec3 violet = vec3(0.63, 0.55, 1.0);
    vec3 amber = vec3(1.0, 0.77, 0.45);
    vec3 col = mix(cyan, violet, smoothstep(0.12, 0.88, vRand));
    col = mix(col, amber, step(0.94, vRand));

    float farFade = smoothstep(40.0, 15.0, vDepth) * 0.85 + 0.15;
    float nearFade = smoothstep(0.4, 3.2, vDepth);
    gl_FragColor = vec4(col, a * 0.85 * farFade * nearFade * vTwinkle);
  }
`;

/* ------------------------------------------------------------------ */

export type MorphProgressRef = RefObject<number>;
export type MorphMapperRef = RefObject<((p: number) => number) | null>;

interface SceneProps {
  progress: MorphProgressRef;
  mapper: MorphMapperRef;
  count: number;
}

function Scene({ progress, mapper, count }: SceneProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const groupRef = useRef<THREE.Group>(null);
  const smooth = useRef(0);
  const pointer = useRef({ x: 0, y: 0 });
  const smoothPointer = useRef({ x: 0, y: 0 });
  const { camera } = useThree();
  const visibleRef = useRef(true);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    const onVis = () => {
      visibleRef.current = document.visibilityState === "visible";
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const geometry = useMemo(() => {
    const f = buildFormations(count);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(f.chaos.slice(), 3));
    g.setAttribute("aChaos", new THREE.BufferAttribute(f.chaos, 3));
    g.setAttribute("aSphere", new THREE.BufferAttribute(f.sphere, 3));
    g.setAttribute("aRings", new THREE.BufferAttribute(f.rings, 3));
    g.setAttribute("aGrid", new THREE.BufferAttribute(f.grid, 3));
    g.setAttribute("aTunnel", new THREE.BufferAttribute(f.tunnel, 3));
    g.setAttribute("aRand", new THREE.BufferAttribute(f.rand, 1));
    g.setAttribute("aSize", new THREE.BufferAttribute(f.size, 1));
    return g;
  }, [count]);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uPixelRatio: { value: typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 1.75) : 1 },
    }),
    []
  );

  useFrame((state, dt) => {
    if (!visibleRef.current) return;

    const t = state.clock.elapsedTime;
    uniforms.uTime.value = t;

    const raw = progress.current ?? 0;
    const mapped = mapper.current ? mapper.current(raw) : raw * MORPH_MAX;
    smooth.current = THREE.MathUtils.damp(smooth.current, mapped, 3.2, dt);
    const s = THREE.MathUtils.clamp(smooth.current, 0, MORPH_MAX);
    uniforms.uProgress.value = s;

    const sp = smoothPointer.current;
    sp.x = THREE.MathUtils.damp(sp.x, pointer.current.x, 3.5, dt);
    sp.y = THREE.MathUtils.damp(sp.y, pointer.current.y, 3.5, dt);

    const tunnelT = THREE.MathUtils.smoothstep(s, 2.95, 4);
    const gridT = THREE.MathUtils.smoothstep(s, 2.0, 3.0);
    camera.position.z = THREE.MathUtils.lerp(11.2, 5.0, tunnelT);
    camera.position.y = THREE.MathUtils.lerp(0.35, 2.6, gridT * (1 - tunnelT));
    camera.position.x = sp.x * 0.55 * (1 - tunnelT);
    camera.lookAt(0, THREE.MathUtils.lerp(0, -0.5, gridT * (1 - tunnelT)), THREE.MathUtils.lerp(0, -20, tunnelT));

    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.028 + sp.x * 0.12 * (1 - tunnelT);
      groupRef.current.rotation.x = -sp.y * 0.08 * (1 - tunnelT);
      // The 55° FOV is vertical — portrait viewports see only ~±2.7 world
      // units of width at z=11.2, so the sphere/rings would sit off-screen.
      // Uniformly fit the field to the viewport width (point size is
      // depth-based, so particles keep their apparent size).
      const aspect = state.size.width / Math.max(1, state.size.height);
      const fit = THREE.MathUtils.clamp(aspect / 1.25, 0.36, 1);
      groupRef.current.scale.setScalar(fit);
    }

    if (matRef.current) matRef.current.uniformsNeedUpdate = false;
  });

  return (
    <group ref={groupRef}>
      <points geometry={geometry} frustumCulled={false}>
        <shaderMaterial
          ref={matRef}
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

/* ------------------------------------------------------------------ */

class Boundary extends Component<{ children: ReactNode; fallback: ReactNode }, { err: boolean }> {
  state = { err: false };
  static getDerivedStateFromError() {
    return { err: true };
  }
  render() {
    return this.state.err ? this.props.fallback : this.props.children;
  }
}

const glowStyle: CSSProperties = {
  background:
    "radial-gradient(60% 50% at 50% 0%, rgba(67,120,255,0.10), transparent 70%), radial-gradient(50% 40% at 80% 80%, rgba(167,139,250,0.08), transparent 70%), radial-gradient(45% 45% at 15% 75%, rgba(103,232,249,0.05), transparent 70%)",
};

interface DataUniverseProps {
  progress: MorphProgressRef;
  mapper: MorphMapperRef;
  /** When true (prefers-reduced-motion), skip WebGL and show CSS glow only. */
  reducedMotion?: boolean;
}

/**
 * Scroll-driven interactive particle universe from the redesign prototype.
 * Morphs chaos → sphere → rings → grid → tunnel as the page story progresses.
 * Fixed full-viewport backdrop; pointer parallax; CSS glow fallback if WebGL fails.
 */
export function DataUniverse({ progress, mapper, reducedMotion = false }: DataUniverseProps) {
  const [webglOk, setWebglOk] = useState(false);
  const [count, setCount] = useState(COUNT_MED);
  const [failed, setFailed] = useState(false);
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 720;

  useEffect(() => {
    setWebglOk(supportsWebGL());
    setCount(particleBudget());
  }, []);

  const showCanvas = webglOk && !reducedMotion && !failed;

  return (
    <div className={styles.root} aria-hidden="true">
      <div className={styles.glow} style={glowStyle} />
      {showCanvas ? (
        <Boundary fallback={<div className={styles.fallback} />}>
          <Canvas
            dpr={isMobile ? [1, 1.25] : [1, 1.75]}
            camera={{ fov: 55, position: [0, 0.35, 11.2] }}
            gl={{
              antialias: !isMobile,
              alpha: true,
              powerPreference: isMobile ? "default" : "high-performance",
              failIfMajorPerformanceCaveat: false,
            }}
            style={{ background: "transparent" }}
            className={styles.canvas}
            onCreated={({ gl }) => {
              const ctx = gl.getContext();
              if (!ctx || ctx.isContextLost?.()) {
                setFailed(true);
              }
            }}
            onError={() => setFailed(true)}
          >
            <Scene progress={progress} mapper={mapper} count={count} />
          </Canvas>
        </Boundary>
      ) : null}
    </div>
  );
}
