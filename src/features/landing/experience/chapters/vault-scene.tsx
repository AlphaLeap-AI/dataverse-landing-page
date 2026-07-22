"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { CHAPTERS, envelope, scrollState } from "../scroll-driver";

const WIN = CHAPTERS.find((c) => c.key === "vault")!.window;

/**
 * 05 · Private — a crystalline wireframe shell locks around the particle
 * sphere. The core stays lit inside: your data, behind your walls.
 */
export function VaultScene() {
  const group = useRef<THREE.Group>(null);
  const shell = useRef<THREE.LineSegments>(null);
  const core = useRef<THREE.Mesh>(null);
  const opacity = useRef(0);

  const edges = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(6.1, 1);
    return new THREE.EdgesGeometry(geo);
  }, []);
  const shellMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: "#4ade80",
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    []
  );
  const coreGeo = useMemo(() => new THREE.IcosahedronGeometry(0.85, 3), []);
  const coreMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: "#b8ffd4", transparent: true, opacity: 0, toneMapped: false }),
    []
  );

  useFrame(({ clock }) => {
    const env = envelope(scrollState.journey, WIN[0], WIN[1], 0.035);
    opacity.current = THREE.MathUtils.damp(opacity.current, env, 5, 1 / 60);
    const o = opacity.current;
    if (group.current) group.current.visible = o > 0.01;
    if (o <= 0.01) return;

    const t = clock.elapsedTime;
    shellMat.opacity = o * 0.5;
    coreMat.opacity = o * (0.42 + 0.18 * Math.sin(t * 1.8));
    if (shell.current) {
      shell.current.rotation.y = t * 0.06;
      shell.current.rotation.x = Math.sin(t * 0.11) * 0.08;
      const breathe = 1 + 0.015 * Math.sin(t * 0.9);
      shell.current.scale.setScalar(breathe);
    }
    if (core.current) core.current.scale.setScalar(1 + 0.1 * Math.sin(t * 1.8));
  });

  return (
    <group ref={group} visible={false}>
      <lineSegments ref={shell} geometry={edges} material={shellMat} />
      <mesh ref={core} geometry={coreGeo} material={coreMat} />
    </group>
  );
}
