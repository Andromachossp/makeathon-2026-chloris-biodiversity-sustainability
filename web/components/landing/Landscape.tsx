"use client";

import { Canvas, useFrame, useThree, type RootState } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import type { Landscape } from "./geometry";

interface Keyframe { az: number; el: number; d: number; tx: number; tz: number }
// camera path driven by scroll progress (0 = hero, 1 = where, 2 = risk, 3 = pulled back for the text panels)
const PATH: Keyframe[] = [
  { az: 0, el: 46, d: 9.2, tx: 0, tz: 0.2 },
  { az: 18, el: 38, d: 7.4, tx: -0.9, tz: 0.1 },
  { az: -22, el: 30, d: 5.8, tx: 0.7, tz: -0.5 },
  { az: -8, el: 56, d: 12.5, tx: 0, tz: 0 },
];
const STATIC_KEY: Keyframe = { az: 12, el: 40, d: 8.6, tx: -0.2, tz: 0.1 };

const smooth = (t: number) => t * t * (3 - 2 * t);
function sample(p: number): Keyframe {
  const x = Math.min(Math.max(p, 0), PATH.length - 1);
  const i = Math.min(Math.floor(x), PATH.length - 2);
  const f = smooth(x - i);
  const a = PATH[i], b = PATH[i + 1];
  const m = (u: number, v: number) => u + (v - u) * f;
  return { az: m(a.az, b.az), el: m(a.el, b.el), d: m(a.d, b.d), tx: m(a.tx, b.tx), tz: m(a.tz, b.tz) };
}

function Columns({ data }: { data: Landscape }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const o = new THREE.Object3D();
    const c = new THREE.Color();
    data.columns.forEach((col, i) => {
      o.position.set(col.x, col.h / 2, col.z);
      o.scale.set(data.cell, col.h, data.cell);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      c.setRGB(col.color[0], col.color[1], col.color[2], THREE.SRGBColorSpace);
      m.setColorAt(i, c);
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [data]);
  useLayoutEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <instancedMesh ref={mesh} args={[geometry, undefined, data.columns.length]} frustumCulled={false}>
      <meshStandardMaterial roughness={0.55} metalness={0.05} />
    </instancedMesh>
  );
}

type RigState = Pick<RootState, "camera" | "size" | "scene">;

/** Place the camera for scroll progress p at time t (seconds). Works on R3F state objects, not hook values. */
function place(st: RigState, animate: boolean, p: number, t: number) {
  const { camera, size, scene } = st;
  const aspect = size.width / size.height;
  const fit = Math.max(1, 1.28 / aspect); // keep Greece inside narrow screens
  const k = animate ? sample(p) : STATIC_KEY;
  const az = THREE.MathUtils.degToRad(k.az + (animate ? Math.cos(t * 0.09) * 3 : 0));
  const el = THREE.MathUtils.degToRad(k.el + (animate ? Math.sin(t * 0.12) * 2.5 : 0)); // slow tilt
  const d = k.d * (p > 2.2 ? Math.pow(fit, 0.7) : fit);
  // on tall screens look slightly south of Greece so the map sits in the upper part, above the title
  const shift = fit > 1 ? 1.1 * (fit - 1) : 0;
  camera.position.set(k.tx + Math.sin(az) * Math.cos(el) * d, Math.sin(el) * d, k.tz + shift + Math.cos(az) * Math.cos(el) * d);
  camera.lookAt(k.tx, 0.2, k.tz + shift);
  if (scene.fog instanceof THREE.Fog) { scene.fog.near = d * 0.75; scene.fog.far = d * 2.6; } // fog scales with the camera distance
}

function Rig({ progress, animate }: { progress: RefObject<number>; animate: boolean }) {
  const light = useRef<THREE.PointLight>(null);
  const get = useThree((s) => s.get);
  const size = useThree((s) => s.size);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    place(state, animate, progress.current ?? 0, t);
    if (light.current) {
      light.current.position.x = Math.sin(t * 0.32) * 4.6; // sweeping warm light
      light.current.position.z = Math.cos(t * 0.21) * 1.6 + 0.2;
    }
  });

  useLayoutEffect(() => {
    if (animate) return;
    const st = get();
    place(st, false, 0, 0);
    if (light.current) light.current.position.set(-1.6, 1.7, 0.8);
    st.invalidate(); // static render: draw once
  }, [animate, get, size.width, size.height]);

  return <pointLight ref={light} color="#F6B93B" intensity={26} distance={9} decay={2} position={[-4, 1.7, 0.5]} />;
}

export default function LandscapeScene({ data, progress, animate }: { data: Landscape; progress: RefObject<number>; animate: boolean }) {
  return (
    <Canvas dpr={[1, 1.5]} frameloop={animate ? "always" : "demand"} camera={{ fov: 38, near: 0.1, far: 80 }}
      gl={{ antialias: true, powerPreference: "high-performance" }} aria-hidden="true">
      <color attach="background" args={["#0D1220"]} />
      <fog attach="fog" args={["#0D1220", 11, 26]} />
      <ambientLight intensity={0.55} color="#9AA6D8" />
      <directionalLight position={[-4, 7, 5]} intensity={1.35} color="#F4EFE6" />
      <hemisphereLight args={["#6F7FC8", "#0D1220", 0.5]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#141B33" roughness={0.85} />
      </mesh>
      <Columns data={data} />
      <Rig progress={progress} animate={animate} />
    </Canvas>
  );
}
