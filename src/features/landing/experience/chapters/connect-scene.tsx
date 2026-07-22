"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { CLUSTER_COUNT, clusterCenter } from "../particles";
import { CHAPTERS, envelope, scrollState } from "../scroll-driver";

const ORB_COLORS = [
  "#6aa6dd",
  "#13c25b",
  "#8b9aff",
  "#7fd4ff",
  "#5f9bff",
  "#ffd24d",
  "#ff9a8a",
  "#c9a6ff",
];

function makeGlowTexture(): THREE.Texture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(255,255,255,0.9)");
    g.addColorStop(0.25, "rgba(255,255,255,0.28)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

const WIN = CHAPTERS.find((c) => c.key === "connect")!.window;

/**
 * 02 · Connect — eight glowing source orbs on a ring, streaming into a
 * pulsing core. Particles (cluster formation) carry the streams; these
 * meshes give each source a physical presence.
 */
export function ConnectScene() {
  const group = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const orbRefs = useRef<(THREE.Group | null)[]>([]);
  const opacity = useRef(0);

  const glowTex = useMemo(() => makeGlowTexture(), []);
  const orbGeo = useMemo(() => new THREE.IcosahedronGeometry(0.34, 2), []);
  const coreGeo = useMemo(() => new THREE.IcosahedronGeometry(0.55, 3), []);
  const haloGeo = useMemo(() => new THREE.PlaneGeometry(1.7, 1.7), []);
  const coreHaloGeo = useMemo(() => new THREE.PlaneGeometry(3.2, 3.2), []);

  const orbMats = useMemo(
    () =>
      ORB_COLORS.map(
        (c) =>
          new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, toneMapped: false })
      ),
    []
  );
  const haloMats = useMemo(
    () =>
      ORB_COLORS.map(
        (c) =>
          new THREE.MeshBasicMaterial({
            map: glowTex,
            color: c,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            toneMapped: false,
          })
      ),
    [glowTex]
  );
  const coreMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: "#bcd8ff", transparent: true, opacity: 0, toneMapped: false }),
    []
  );
  const coreHaloMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: glowTex,
        color: "#7fb0ff",
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    [glowTex]
  );

  const centers = useMemo(() => Array.from({ length: CLUSTER_COUNT }, (_, i) => clusterCenter(i)), []);

  useFrame(({ clock, camera }) => {
    const t = clock.elapsedTime;
    const env = envelope(scrollState.journey, WIN[0], WIN[1], 0.03);
    opacity.current = THREE.MathUtils.damp(opacity.current, env, 5, 1 / 60);
    const o = opacity.current;
    if (group.current) group.current.visible = o > 0.01;
    if (o <= 0.01) return;

    const pulse = 0.75 + 0.25 * Math.sin(t * 2.2);
    orbMats.forEach((m, i) => {
      m.opacity = o * (0.85 + 0.15 * Math.sin(t * 1.6 + i * 1.3));
    });
    haloMats.forEach((m, i) => {
      m.opacity = o * 0.32 * (0.7 + 0.3 * Math.sin(t * 1.6 + i * 1.3));
    });
    coreMat.opacity = o * pulse;
    coreHaloMat.opacity = o * 0.38 * pulse;

    centers.forEach((c, i) => {
      const g = orbRefs.current[i];
      if (!g) return;
      g.position.set(c.x, c.y + Math.sin(t * 0.9 + i * 1.7) * 0.28, c.z);
      const s = 1 + 0.1 * Math.sin(t * 1.6 + i * 1.3);
      g.scale.setScalar(s);
      // halos face the camera
      const halo = g.children[1];
      if (halo) halo.lookAt(camera.position);
    });
    if (core.current) {
      core.current.scale.setScalar(1 + 0.12 * Math.sin(t * 2.2));
      const halo = core.current.children[0];
      if (halo) halo.lookAt(camera.position);
    }
  });

  return (
    <group ref={group} visible={false}>
      {centers.map((c, i) => (
        <group
          key={ORB_COLORS[i]}
          position={[c.x, c.y, c.z]}
          ref={(el) => {
            orbRefs.current[i] = el;
          }}
        >
          <mesh geometry={orbGeo} material={orbMats[i]} />
          <mesh geometry={haloGeo} material={haloMats[i]} />
        </group>
      ))}
      <mesh ref={core} geometry={coreGeo} material={coreMat}>
        <mesh geometry={coreHaloGeo} material={coreHaloMat} />
      </mesh>
    </group>
  );
}
