"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { CHAPTERS, envelope, scrollState } from "../scroll-driver";

const WIN = CHAPTERS.find((c) => c.key === "answer")!.window;

/**
 * 04 · Answer — a glowing floor grid materializes beneath the particle
 * bar chart while a golden query beam sweeps across the scene.
 */
export function AnswerScene() {
  const group = useRef<THREE.Group>(null);
  const beam = useRef<THREE.Mesh>(null);
  const opacity = useRef(0);

  const grid = useMemo(() => {
    const g = new THREE.GridHelper(16, 24, new THREE.Color("#ffd24d"), new THREE.Color("#3d82ff"));
    const mat = g.material as THREE.LineBasicMaterial;
    mat.transparent = true;
    mat.opacity = 0;
    mat.depthWrite = false;
    return g;
  }, []);

  const beamGeo = useMemo(() => new THREE.CylinderGeometry(0.035, 0.035, 26, 6, 1, true), []);
  const beamMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#ffd24d",
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    []
  );

  useFrame(({ clock }) => {
    const env = envelope(scrollState.journey, WIN[0], WIN[1], 0.03);
    opacity.current = THREE.MathUtils.damp(opacity.current, env, 5, 1 / 60);
    const o = opacity.current;
    if (group.current) group.current.visible = o > 0.01;
    if (o <= 0.01) return;

    (grid.material as THREE.LineBasicMaterial).opacity = o * 0.32;

    // The beam fires once per few seconds across the chart.
    const cycle = (clock.elapsedTime % 3.4) / 3.4;
    const sweep = cycle < 0.35 ? cycle / 0.35 : 0;
    beamMat.opacity = o * (sweep > 0 && sweep < 1 ? Math.sin(sweep * Math.PI) * 0.85 : 0);
    if (beam.current) {
      beam.current.position.x = THREE.MathUtils.lerp(-9, 9, sweep);
    }
  });

  return (
    <group ref={group} visible={false}>
      <primitive object={grid} position={[0, -2.18, 0]} />
      <mesh ref={beam} geometry={beamGeo} material={beamMat} rotation={[0, 0, Math.PI / 2]} position={[0, 1.2, 0]} />
    </group>
  );
}
