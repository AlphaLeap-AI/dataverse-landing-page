"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

import { scrollState } from "./scroll-driver";

/**
 * Cinematic camera: one continuous flight through the story, driven by
 * scroll. Keyframes are placed on a "camera time" axis that mirrors the
 * morph axis in scroll-driver.ts:
 *
 *   t 0    hero idle            t 1→2  dive through the chaos storm
 *   t 2→3  orbit the sources    t 3→4  rise over the schema lattice
 *   t 4→5  descend to the chart t 5→6  frame the vault
 *   t 6→7  finale pull-back
 */

interface Key {
  t: number;
  pos: [number, number, number];
  look: [number, number, number];
}

const KEYS: Key[] = [
  { t: 0.0, pos: [0, 0.7, 13.5], look: [0, 0.2, 0] },
  { t: 1.0, pos: [0, 0.3, 10.0], look: [0, 0, 0] },
  { t: 1.55, pos: [1.6, -0.6, 7.4], look: [0, 0, -2] },
  { t: 2.0, pos: [11.0, 3.4, 5.5], look: [0, 0.3, 0] },
  { t: 2.5, pos: [7.5, 2.6, 10.0], look: [0, 0.3, 0] },
  { t: 3.0, pos: [1.5, 3.2, 12.0], look: [0, 0.6, 0] },
  { t: 3.5, pos: [0, 8.0, 11.0], look: [0, 0.8, 0] },
  { t: 4.0, pos: [0, 6.5, 9.5], look: [0, 0.8, 0] },
  { t: 4.5, pos: [0, 1.6, 8.6], look: [0, 0.4, 0] },
  { t: 5.0, pos: [0, 0.9, 7.4], look: [0, 0.6, 0] },
  { t: 5.5, pos: [0, 0.8, 11.5], look: [0, 0, 0] },
  { t: 6.0, pos: [0, 0.5, 13.0], look: [0, 0, 0] },
  { t: 7.0, pos: [0, 3.5, 19.0], look: [0, 0.5, 0] },
];

const smooth = (t: number): number => t * t * (3 - 2 * t);

function sample(t: number): { pos: THREE.Vector3; look: THREE.Vector3 } {
  const first = KEYS[0];
  const last = KEYS[KEYS.length - 1];
  if (t <= first.t) return { pos: new THREE.Vector3(...first.pos), look: new THREE.Vector3(...first.look) };
  if (t >= last.t) return { pos: new THREE.Vector3(...last.pos), look: new THREE.Vector3(...last.look) };
  let i = 0;
  while (i < KEYS.length - 2 && KEYS[i + 1].t < t) i++;
  const a = KEYS[i];
  const b = KEYS[i + 1];
  const f = smooth((t - a.t) / (b.t - a.t));
  return {
    pos: new THREE.Vector3(...a.pos).lerp(new THREE.Vector3(...b.pos), f),
    look: new THREE.Vector3(...a.look).lerp(new THREE.Vector3(...b.look), f),
  };
}

/** Map scroll state to camera time (mirrors morphTarget). */
export function cameraTime(s: typeof scrollState): number {
  if (s.finale > 0) return 6 + s.finale;
  if (s.journey > 0) return 1 + s.journey * 5;
  return s.heroExit;
}

export function CameraRig() {
  const smoothT = useRef(0);
  const pointer = useRef({ x: 0, y: 0 });
  const smoothPointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // No parallax on touch: pointermove fires during scroll drags, which
    // reads as the camera swaying under your thumb.
    const coarse = window.matchMedia("(pointer: coarse)");
    const onMove = (e: PointerEvent) => {
      if (coarse.matches) return;
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame(({ camera }, dt) => {
    const target = cameraTime(scrollState);
    smoothT.current = THREE.MathUtils.damp(smoothT.current, target, 2.6, dt);
    const t = THREE.MathUtils.clamp(smoothT.current, 0, 7);

    const sp = smoothPointer.current;
    sp.x = THREE.MathUtils.damp(sp.x, pointer.current.x, 3.2, dt);
    sp.y = THREE.MathUtils.damp(sp.y, pointer.current.y, 3.2, dt);

    const { pos, look } = sample(t);
    // Parallax fades during the storm dive so it never feels seasick.
    const parallax = 1 - 0.6 * (1 - Math.min(1, Math.abs(t - 1.3) / 0.9));
    camera.position.set(pos.x + sp.x * 0.7 * parallax, pos.y + sp.y * 0.45 * parallax, pos.z);
    camera.lookAt(look.x + sp.x * 0.5 * parallax, look.y + sp.y * 0.35 * parallax, look.z);
  });

  return null;
}
