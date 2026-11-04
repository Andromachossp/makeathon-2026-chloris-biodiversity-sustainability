"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import type { CellsFile } from "@/lib/types";
import { buildParticles } from "./geometry";

const VERT = /* glsl */ `
  attribute vec3 aMap;
  attribute float aRand;
  attribute float aBright;
  attribute float aRisk;
  uniform float uProgress;
  uniform float uTime;
  uniform float uSize;
  uniform float uMapScale;
  varying float vBright;
  varying float vRisk;
  varying float vStage;
  void main() {
    float delay = aRand * 0.45;
    float m = smoothstep(delay, delay + 0.55, clamp(uProgress, 0.0, 1.0));
    vec3 p = mix(position, vec3(aMap.xy * uMapScale, aMap.z), m);
    // gentle breathing + a swirl while particles are in flight
    float flight = sin(m * 3.14159);
    p.x += sin(uTime * 0.6 + aRand * 40.0) * 0.012 + flight * sin(aRand * 20.0 + uTime) * 0.25;
    p.y += cos(uTime * 0.5 + aRand * 30.0) * 0.012 + flight * cos(aRand * 25.0) * 0.25;
    vBright = aBright;
    vRisk = aRisk;
    vStage = clamp(uProgress - 1.0, 0.0, 1.0);
    float pulse = 1.0 + vStage * aRisk * 0.6 * sin(uTime * 2.2 + aRand * 6.0);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = uSize * pulse * (1.0 + m * 0.25) * (5.2 / -mv.z);
    gl_Position = projectionMatrix * mv;
    // keep the leaf stage separate in colour: m==0 -> pure chlorophyll
    vBright = mix(0.5, aBright, m);
  }
`;
const FRAG = /* glsl */ `
  varying float vBright;
  varying float vRisk;
  varying float vStage;
  void main() {
    vec2 d = gl_PointCoord - 0.5;
    float r = length(d);
    if (r > 0.5) discard;
    float soft = smoothstep(0.5, 0.0, r);
    vec3 chloro = vec3(0.482, 0.894, 0.584);
    vec3 pollen = vec3(0.914, 0.851, 0.545);
    vec3 ember  = vec3(0.878, 0.396, 0.227);
    vec3 col = mix(chloro, pollen, smoothstep(0.55, 1.0, vBright));
    float alpha = (0.45 + 0.75 * vBright) * soft;
    // risk stage: at-risk cells glow ember, the rest dim
    col = mix(col, ember, vStage * vRisk);
    alpha *= mix(1.0, mix(0.22, 2.2, vRisk), vStage);
    gl_FragColor = vec4(col, alpha);
  }
`;

function Particles({ cells, progress, count, active }: { cells: CellsFile; progress: RefObject<number>; count: number; active: boolean }) {
  const data = useMemo(() => buildParticles(count, cells), [count, cells]);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(data.start, 3));
    g.setAttribute("aMap", new THREE.BufferAttribute(data.map, 3));
    g.setAttribute("aRand", new THREE.BufferAttribute(data.rand, 1));
    g.setAttribute("aBright", new THREE.BufferAttribute(data.bright, 1));
    g.setAttribute("aRisk", new THREE.BufferAttribute(data.risk, 1));
    return g;
  }, [data]);
  const mat = useMemo(
    () => new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uProgress: { value: 0 }, uTime: { value: 0 }, uSize: { value: 5 }, uMapScale: { value: 1 } },
    }),
    [],
  );
  useEffect(() => () => { geo.dispose(); mat.dispose(); }, [geo, mat]); // dispose on unmount

  const pts = useRef<THREE.Points>(null);
  useFrame(({ clock, size, gl, viewport }) => {
    const m = pts.current?.material as THREE.ShaderMaterial | undefined;
    if (!active || !m || !pts.current) return;
    m.uniforms.uMapScale.value = Math.min(1, (viewport.width * 0.94) / 4.4); // keep Greece inside narrow screens; the leaf stays full size
    m.uniforms.uTime.value = clock.elapsedTime;
    m.uniforms.uProgress.value += ((progress.current ?? 0) - m.uniforms.uProgress.value) * 0.08; // smoothed
    m.uniforms.uSize.value = Math.max(4, size.height * 0.0065) * gl.getPixelRatio();
  });
  return <points ref={pts} geometry={geo} material={mat} frustumCulled={false} />;
}

export default function LandingScene({ cells, progress }: { cells: CellsFile; progress: RefObject<number> }) {
  const [active, setActive] = useState(true);
  const [count] = useState(() => (typeof window !== "undefined" && window.innerWidth < 768 ? 3000 : 6000));

  // pause when the tab is hidden
  useEffect(() => {
    const onVis = () => setActive(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  return (
    <Canvas dpr={[1, 1.5]} frameloop={active ? "always" : "never"} camera={{ position: [0, 0, 5.2], fov: 50 }}
      gl={{ antialias: false, powerPreference: "high-performance" }} aria-hidden="true">
      <Particles cells={cells} progress={progress} count={count} active={active} />
    </Canvas>
  );
}
