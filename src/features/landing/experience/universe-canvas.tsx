"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";

import { CameraRig } from "./camera-rig";
import { AnswerScene } from "./chapters/answer-scene";
import { ConnectScene } from "./chapters/connect-scene";
import { VaultScene } from "./chapters/vault-scene";
import styles from "./experience.module.css";
import { buildGeometry, MORPH_MAX, particleFragmentShader, particleVertexShader } from "./particles";
import { askState, morphTarget, scrollState } from "./scroll-driver";

const COUNT_HIGH = 5800;
const COUNT_MED = 3400;
const COUNT_LOW = 2800;

function particleBudget(): number {
  if (typeof window === "undefined") return COUNT_MED;
  const w = window.innerWidth;
  const cores = navigator.hardwareConcurrency || 4;
  const saveData =
    "connection" in navigator &&
    (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
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

/* Chapter accent tints: the field blushes red in the chaos storm, turns
   gold for the answer, mint inside the vault. */
const TINTS: { at: number; color: THREE.Color; amt: number }[] = [
  { at: 1, color: new THREE.Color("#ff8a76"), amt: 0.4 },
  { at: 4, color: new THREE.Color("#ffd24d"), amt: 0.32 },
  { at: 5, color: new THREE.Color("#4ade80"), amt: 0.4 },
];

function tintAt(s: number, out: THREE.Color): number {
  let amt = 0;
  out.setRGB(1, 1, 1);
  for (const t of TINTS) {
    const w = 1 - THREE.MathUtils.smoothstep(Math.abs(s - t.at), 0, 0.85);
    if (w > 0.01) {
      out.lerp(t.color, Math.min(1, w / Math.max(amt + w, 0.001)) * (w > amt ? 1 : 0));
      if (w > amt) {
        out.copy(t.color);
        amt = w * t.amt;
      }
    }
  }
  return amt;
}

function Particles({ count }: { count: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const smooth = useRef(0);
  const smoothAsk = useRef(0);
  const visibleRef = useRef(true);
  const tmpColor = useMemo(() => new THREE.Color(), []);

  const geometry = useMemo(() => buildGeometry(count), [count]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uProgress: { value: 0 },
      // Mobile runs without bloom — compensate with slightly larger points.
      uPixelRatio: {
        value:
          typeof window !== "undefined"
            ? Math.min(window.devicePixelRatio, 1.75) * (window.innerWidth <= 720 ? 1.22 : 1)
            : 1,
      },
      uAsk: { value: 0 },
      uTint: { value: new THREE.Color("#ffffff") },
      uTintAmt: { value: 0 },
    }),
    []
  );

  useEffect(() => {
    const onVis = () => {
      visibleRef.current = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useFrame((state, dt) => {
    if (!visibleRef.current) return;
    const t = state.clock.elapsedTime;
    uniforms.uTime.value = t;

    smooth.current = THREE.MathUtils.damp(smooth.current, morphTarget(scrollState), 3.2, dt);
    const s = THREE.MathUtils.clamp(smooth.current, 0, MORPH_MAX);
    uniforms.uProgress.value = s;

    // The ask pulse belongs to the hero — release it as the hero exits so
    // it never damps the storm's turbulence.
    const heroHold = 1 - THREE.MathUtils.clamp(scrollState.heroExit * 6, 0, 1);
    smoothAsk.current = THREE.MathUtils.damp(smoothAsk.current, askState.pulse * heroHold, 3.5, dt);
    uniforms.uAsk.value = smoothAsk.current;

    const tint = uniforms.uTint.value as THREE.Color;
    uniforms.uTintAmt.value = tintAt(s, tmpColor);
    tint.copy(tmpColor);

    if (groupRef.current) {
      const spinRate = 0.028 + smoothAsk.current * 0.05;
      groupRef.current.rotation.y = t * spinRate;
      // Fit the field into narrow (portrait) viewports — keep the floor at
      // 0.55 so phones get edge-bleeding immersion, not a distant dim ball.
      const aspect = state.size.width / Math.max(1, state.size.height);
      const fit = THREE.MathUtils.clamp(aspect / 1.25, 0.6, 1);
      groupRef.current.scale.setScalar(fit);
    }
  });

  return (
    <group ref={groupRef}>
      <points geometry={geometry} frustumCulled={false}>
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={particleVertexShader}
          fragmentShader={particleFragmentShader}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

/** Scale scene content to fit narrow (portrait) viewports — same formula
    as the particle field, so orbs/vault/beam never clip at screen edges. */
function FittedGroup({ children }: { children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const aspect = state.size.width / Math.max(1, state.size.height);
    const fit = THREE.MathUtils.clamp(aspect / 1.25, 0.6, 1);
    ref.current.scale.setScalar(fit);
  });
  return <group ref={ref}>{children}</group>;
}

class Boundary extends Component<{ children: ReactNode; fallback: ReactNode }, { err: boolean }> {
  state = { err: false };
  static getDerivedStateFromError() {
    return { err: true };
  }
  render() {
    return this.state.err ? this.props.fallback : this.props.children;
  }
}

interface UniverseCanvasProps {
  /** When true (prefers-reduced-motion), skip WebGL — CSS glow only. */
  reducedMotion?: boolean;
}

/**
 * The single fixed WebGL backdrop for the whole page: one particle
 * universe morphing through the story, a cinematic scroll-driven camera,
 * and bloom post-processing. Falls back to a CSS glow without WebGL.
 */
export function UniverseCanvas({ reducedMotion = false }: UniverseCanvasProps) {
  const [webglOk, setWebglOk] = useState(false);
  const [count, setCount] = useState(COUNT_MED);
  const [failed, setFailed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setWebglOk(supportsWebGL());
    setCount(particleBudget());
    setIsMobile(window.innerWidth <= 720);
  }, []);

  const showCanvas = webglOk && !reducedMotion && !failed;
  const postFx = showCanvas && !isMobile;

  return (
    <div className={styles.root} aria-hidden="true">
      <div className={styles.glow} />
      {showCanvas ? (
        <Boundary fallback={<div className={styles.fallback} />}>
          <Canvas
            dpr={isMobile ? [1, 1.25] : [1, 1.75]}
            camera={{ fov: 55, position: [0, 0.7, 13.5] }}
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
              if (!ctx || ctx.isContextLost?.()) setFailed(true);
            }}
            onError={() => setFailed(true)}
          >
            <Particles count={count} />
            <CameraRig />
            <FittedGroup>
              <ConnectScene />
              <AnswerScene />
              <VaultScene />
            </FittedGroup>
            {postFx ? (
              <EffectComposer multisampling={4}>
                <Bloom intensity={0.85} luminanceThreshold={0.18} luminanceSmoothing={0.32} mipmapBlur radius={0.72} />
                <Vignette eskil={false} offset={0.24} darkness={0.62} />
              </EffectComposer>
            ) : null}
          </Canvas>
        </Boundary>
      ) : null}
    </div>
  );
}
