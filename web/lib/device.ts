/** Flat / static by default on low-end devices: few cores, little memory, data saver or reduced motion. */
export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function deviceIsCapable(): boolean {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const cores = nav.hardwareConcurrency ?? 4;
  return !prefersReducedMotion() && !nav.connection?.saveData && cores >= 6 && (nav.deviceMemory === undefined || nav.deviceMemory >= 4);
}

export function canWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}
