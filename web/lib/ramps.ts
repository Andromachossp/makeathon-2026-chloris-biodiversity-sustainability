/** Colour ramps shared by the map and the landing scene. Values mirror the tokens in app/globals.css (see docs/DESIGN.md). */
export const RISK_RAMP = ["#F9E58A", "#F5A04A", "#C7303A", "#7B2A8C"] as const; // pale yellow -> orange -> crimson -> deep purple
export const RICH_RAMP = ["#DDF1FB", "#9ED6F2", "#5FB0EA", "#5B86EE", "#6A5FE0", "#5233B8"] as const; // ice blue -> indigo
export const NODATA = "#46506F"; // muted slate: not enough data
export const POPPY = "#F0533A";
export const SAFFRON = "#F6B93B";
export const AEGEAN = "#2EA8D8";
export const LAVENDER = "#9B8CFF";

export type Stop = [number, string];

/** MapLibre `interpolate` expression over a numeric property, with strictly increasing stops. */
export function interpolateExpr(prop: string, stops: Stop[]): unknown[] {
  const clean: Stop[] = [];
  for (const s of stops) if (!clean.length || s[0] > clean[clean.length - 1][0]) clean.push(s);
  if (clean.length === 1) clean.push([clean[0][0] + 1, clean[0][1]]);
  return ["interpolate", ["linear"], ["get", prop], ...clean.flat()];
}

export function gradientCss(colors: readonly string[]): string {
  return `linear-gradient(90deg, ${colors.join(", ")})`;
}

export function quantile(sorted: number[], q: number): number {
  if (!sorted.length) return 0;
  const i = (sorted.length - 1) * q;
  const lo = Math.floor(i), hi = Math.ceil(i);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}

/** Linear blend of a ramp at t in [0,1] -> "#rrggbb" (used by the 3D landscape). */
export function rampAt(colors: readonly string[], t: number): [number, number, number] {
  const x = Math.min(Math.max(t, 0), 1) * (colors.length - 1);
  const i = Math.min(Math.floor(x), colors.length - 2);
  const f = x - i;
  const p = (h: string) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16) / 255);
  const a = p(colors[i]), b = p(colors[i + 1]);
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}
