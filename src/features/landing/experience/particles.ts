import * as THREE from "three";

/**
 * The particle universe: one instanced point cloud that morphs through
 * seven formations as the page story progresses.
 *
 *   0 scatter  — hero: a calm cloud of "data fragments"
 *   1 storm    — chaos: a wide turbulent ellipsoid
 *   2 clusters — connect: 8 source clusters streaming into a core
 *   3 lattice  — understand: a 3D schema grid of nodes + edges
 *   4 bars     — answer: a glowing bar chart rising from a floor
 *   5 vault    — private: a hollow protective shell
 *   6 open     — finale: the universe released, wide and calm
 */

export const MORPH_MAX = 6;

/** Source cluster centers shared with <ConnectOrbs> so particles and
 *  meshes agree on where each database lives. Ring in the XZ plane. */
export const CLUSTER_COUNT = 8;

export function clusterCenter(i: number): THREE.Vector3 {
  const a = (i / CLUSTER_COUNT) * Math.PI * 2 + 0.35;
  const r = 8.6;
  const y = Math.sin(a * 1.7) * 1.6 + 0.4;
  return new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
}

export interface Formations {
  targets: Float32Array[];
  rand: Float32Array;
  size: Float32Array;
}

export function buildFormations(count: number): Formations {
  const scatter = new Float32Array(count * 3);
  const storm = new Float32Array(count * 3);
  const clusters = new Float32Array(count * 3);
  const lattice = new Float32Array(count * 3);
  const bars = new Float32Array(count * 3);
  const vault = new Float32Array(count * 3);
  const open = new Float32Array(count * 3);
  const rand = new Float32Array(count);
  const size = new Float32Array(count);

  const GOLDEN = Math.PI * (3 - Math.sqrt(5));

  // lattice grid: nodes along edges of a 3D grid
  const NX = 7;
  const NY = 4;
  const NZ = 7;
  const LX = 13;
  const LY = 6.5;
  const LZ = 9;
  const ly0 = -1.4;
  const gridNode = (ix: number, iy: number, iz: number): [number, number, number] => [
    (ix / (NX - 1) - 0.5) * LX,
    ly0 + (iy / (NY - 1)) * LY,
    (iz / (NZ - 1) - 0.5) * LZ,
  ];

  // bars: 5 series × 4 groups of columns on a floor
  const BCOLS = 5;
  const BROWS = 4;
  const barHeights: number[] = [];
  for (let g = 0; g < BROWS; g++) {
    for (let c = 0; c < BCOLS; c++) {
      const h =
        1.1 +
        3.6 *
          (0.35 +
            0.65 *
              Math.abs(
                Math.sin(c * 1.31 + g * 0.83) * 0.72 + Math.sin(c * 0.53 - g * 1.19) * 0.38
              ));
      barHeights.push(Math.min(5.2, h));
    }
  }

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const r1 = Math.random();
    const r2 = Math.random();
    const r3 = Math.random();

    // ── 0 scatter: fibonacci shell with thickness ──
    {
      const y = 1 - ((i + 0.5) / count) * 2;
      const rad = Math.sqrt(Math.max(0, 1 - y * y));
      const t = GOLDEN * i;
      const rr = 6.2 + (r1 - 0.5) * 2.6;
      scatter[i3] = Math.cos(t) * rad * rr;
      scatter[i3 + 1] = y * rr * 0.82 + (r2 - 0.5) * 0.8;
      scatter[i3 + 2] = Math.sin(t) * rad * rr;
    }

    // ── 1 storm: wide turbulent ellipsoid ──
    {
      const th = r1 * Math.PI * 2;
      const ph = Math.acos(2 * r2 - 1);
      const rr = 4.5 + Math.pow(r3, 0.5) * 14;
      storm[i3] = Math.sin(ph) * Math.cos(th) * rr * 1.5;
      storm[i3 + 1] = Math.cos(ph) * rr * 0.78;
      storm[i3 + 2] = Math.sin(ph) * Math.sin(th) * rr;
    }

    // ── 2 clusters: 8 source clusters + streams to the core ──
    {
      const c = clusterCenter(i % CLUSTER_COUNT);
      if (r3 < 0.55) {
        // tight gaussian-ish blob around the source
        clusters[i3] = c.x + (r1 - 0.5) * 2 * 0.9;
        clusters[i3 + 1] = c.y + (r2 - 0.5) * 2 * 0.9;
        clusters[i3 + 2] = c.z + ((r1 + r2) / 2 - 0.5) * 2 * 0.9;
      } else {
        // quadratic bezier stream: source → lifted midpoint → core
        const t = r1;
        const mx = c.x * 0.5;
        const my = c.y * 0.5 + 2.4;
        const mz = c.z * 0.5;
        const u = 1 - t;
        const wob = (r2 - 0.5) * 0.5;
        clusters[i3] = u * u * c.x + 2 * u * t * mx + wob;
        clusters[i3 + 1] = u * u * c.y + 2 * u * t * my + (r3 - 0.75) * 0.4;
        clusters[i3 + 2] = u * u * c.z + 2 * u * t * mz - wob;
      }
    }

    // ── 3 lattice: nodes + edges of a 3D grid ──
    {
      const ix = Math.floor(r1 * NX);
      const iy = Math.floor(r2 * NY);
      const iz = Math.floor(r3 * NZ);
      const [nx, ny, nz] = gridNode(ix, iy, iz);
      if ((i + Math.floor(r1 * 10)) % 10 < 7) {
        // on an edge to a neighbour (x, y, or z axis)
        const axis = i % 3;
        const t = Math.random();
        let [ex, ey, ez] = [nx, ny, nz];
        if (axis === 0 && ix < NX - 1) [ex] = gridNode(ix + 1, iy, iz);
        else if (axis === 1 && iy < NY - 1) [, ey] = gridNode(ix, iy + 1, iz);
        else if (axis === 2 && iz < NZ - 1) [, , ez] = gridNode(ix, iy, iz + 1);
        lattice[i3] = nx + (ex - nx) * t;
        lattice[i3 + 1] = ny + (ey - ny) * t;
        lattice[i3 + 2] = nz + (ez - nz) * t;
      } else {
        // hug a node
        lattice[i3] = nx + (Math.random() - 0.5) * 0.22;
        lattice[i3 + 1] = ny + (Math.random() - 0.5) * 0.22;
        lattice[i3 + 2] = nz + (Math.random() - 0.5) * 0.22;
      }
    }

    // ── 4 bars: columns of a floor chart ──
    {
      const col = i % BCOLS;
      const grp = Math.floor(i / BCOLS) % BROWS;
      const h = barHeights[grp * BCOLS + col];
      const bx = (col / (BCOLS - 1) - 0.5) * 7.2;
      const bz = (grp / (BROWS - 1) - 0.5) * 4.4;
      const by = -2.1 + Math.pow(r2, 1.35) * h; // denser at the base
      bars[i3] = bx + (r1 - 0.5) * 0.55;
      bars[i3 + 1] = by;
      bars[i3 + 2] = bz + (r3 - 0.5) * 0.55;
    }

    // ── 5 vault: hollow protective shell ──
    {
      const y = 1 - ((i + 0.5) / count) * 2;
      const rad = Math.sqrt(Math.max(0, 1 - y * y));
      const t = GOLDEN * i;
      const rr = 5.4 + (r1 - 0.5) * 0.5;
      vault[i3] = Math.cos(t) * rad * rr;
      vault[i3 + 1] = y * rr;
      vault[i3 + 2] = Math.sin(t) * rad * rr;
    }

    // ── 6 open: released universe, wide and calm ──
    {
      const y = 1 - ((i + 0.5) / count) * 2;
      const rad = Math.sqrt(Math.max(0, 1 - y * y));
      const t = GOLDEN * i;
      const rr = 8.5 + Math.pow(r2, 0.6) * 6;
      open[i3] = Math.cos(t) * rad * rr * 1.25;
      open[i3 + 1] = y * rr * 0.7;
      open[i3 + 2] = Math.sin(t) * rad * rr;
    }

    rand[i] = Math.random();
    size[i] = 0.5 + Math.random() * 1.15;
  }

  return {
    targets: [scatter, storm, clusters, lattice, bars, vault, open],
    rand,
    size,
  };
}

export function buildGeometry(count: number): THREE.BufferGeometry {
  const f = buildFormations(count);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(f.targets[0].slice(), 3));
  f.targets.forEach((t, idx) => {
    g.setAttribute(`aT${idx}`, new THREE.BufferAttribute(t, 3));
  });
  g.setAttribute("aRand", new THREE.BufferAttribute(f.rand, 1));
  g.setAttribute("aSize", new THREE.BufferAttribute(f.size, 1));
  return g;
}

export const particleVertexShader = /* glsl */ `
  attribute vec3 aT0;
  attribute vec3 aT1;
  attribute vec3 aT2;
  attribute vec3 aT3;
  attribute vec3 aT4;
  attribute vec3 aT5;
  attribute vec3 aT6;
  attribute float aRand;
  attribute float aSize;

  uniform float uTime;
  uniform float uProgress;
  uniform float uPixelRatio;
  uniform float uAsk;

  varying float vRand;
  varying float vDepth;
  varying float vTwinkle;
  varying float vProgress;

  void main() {
    vRand = aRand;
    vProgress = uProgress;
    float s = uProgress;

    vec3 pos = aT0;
    pos = mix(pos, aT1, smoothstep(0.0, 1.0, s));
    pos = mix(pos, aT2, smoothstep(1.0, 2.0, s));
    pos = mix(pos, aT3, smoothstep(2.0, 3.0, s));
    pos = mix(pos, aT4, smoothstep(3.0, 4.0, s));
    pos = mix(pos, aT5, smoothstep(4.0, 5.0, s));
    pos = mix(pos, aT6, smoothstep(5.0, 6.0, s));

    // Turbulence peaks inside the storm chapter, calms as order emerges.
    float storm = 1.0 - smoothstep(0.0, 1.5, abs(s - 1.0));
    float wob = mix(0.14, 0.9, storm);
    wob = mix(wob, 0.1, smoothstep(5.0, 6.0, s) * 0.5);
    pos.x += wob * sin(uTime * 0.7 + aRand * 37.0 + pos.y * 0.45);
    pos.y += wob * sin(uTime * 0.9 + aRand * 51.0 + pos.z * 0.4);
    pos.z += wob * sin(uTime * 0.6 + aRand * 67.0 + pos.x * 0.5);

    // Hero "ask": the universe leans in while the query runs.
    pos = mix(pos, pos * 0.58, uAsk * 0.65);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    float depth = -mv.z;
    vDepth = depth;
    vTwinkle = 0.72 + 0.28 * sin(uTime * 2.0 + aRand * 42.0);
    gl_PointSize = min(aSize * (1.0 + uAsk * 0.5) * uPixelRatio * (30.0 / max(depth, 0.1)), 64.0);
  }
`;

export const particleFragmentShader = /* glsl */ `
  precision highp float;

  uniform float uAsk;
  uniform vec3 uTint;
  uniform float uTintAmt;

  varying float vRand;
  varying float vDepth;
  varying float vTwinkle;
  varying float vProgress;

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
    col = mix(col, uTint, uTintAmt);

    float farFade = smoothstep(42.0, 15.0, vDepth) * 0.85 + 0.15;
    float nearFade = smoothstep(0.4, 3.2, vDepth);
    float alpha = a * (0.85 + uAsk * 0.35) * farFade * nearFade * vTwinkle;
    gl_FragColor = vec4(col, alpha);
  }
`;
