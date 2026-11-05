import { RICH_RAMP, RISK_RAMP, rampAt } from "./ramps";

/** Flower pin icons, drawn as SVG and added to the map with map.addImage (crisp, tiny, GPU-rendered).
    The stem's foot is the bottom-centre of the image: with icon-anchor "bottom" it sits exactly on the cell centre. */
export const ICON_W = 64;
export const ICON_H = 88;
const INK = "#1A2036";
const CREAM = "#F4EFE6";

const hex = (c: readonly number[]) => "#" + c.map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("");

const stem = (h: number) =>
  `<path d="M32 86 C32 ${86 - h * 0.45} 30 ${86 - h * 0.8} 32 ${86 - h}" fill="none" stroke="${CREAM}" stroke-width="6" stroke-linecap="round"/>` +
  `<path d="M32 86 C32 ${86 - h * 0.45} 30 ${86 - h * 0.8} 32 ${86 - h}" fill="none" stroke="#4E6B4A" stroke-width="3" stroke-linecap="round"/>` +
  `<ellipse cx="40" cy="${86 - h * 0.45}" rx="7" ry="3.6" transform="rotate(-35 40 ${86 - h * 0.45})" fill="#4E6B4A" stroke="${CREAM}" stroke-width="1.2"/>`;

/** Five-petal bloom. */
function bloom(colour: string): string {
  const petals = [0, 1, 2, 3, 4].map((i) => `<ellipse cx="32" cy="12" rx="9" ry="14" transform="rotate(${i * 72} 32 27)" fill="${colour}" stroke="${INK}" stroke-width="2"/>`).join("");
  return `${stem(52)}${petals}<circle cx="32" cy="27" r="6.5" fill="${CREAM}" stroke="${INK}" stroke-width="2"/>`;
}

/** Hotspot marker: an eight-point starburst, a different silhouette from the bloom (never colour alone). */
function burst(colour: string): string {
  const pts: string[] = [];
  for (let i = 0; i < 16; i++) {
    const r = i % 2 === 0 ? 25 : 11;
    const a = (Math.PI * 2 * i) / 16 - Math.PI / 2;
    pts.push(`${(32 + r * Math.cos(a)).toFixed(1)},${(27 + r * Math.sin(a)).toFixed(1)}`);
  }
  return `${stem(52)}<polygon points="${pts.join(" ")}" fill="${colour}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><circle cx="32" cy="27" r="5.5" fill="${INK}"/>`;
}

/** Small muted bud for cells with too little data. */
function bud(colour: string): string {
  return `${stem(34)}<path d="M32 32 C20 24 22 12 32 4 C42 12 44 24 32 32Z" fill="${colour}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`;
}

const svg = (inner: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="${ICON_W}" height="${ICON_H}" viewBox="0 0 ${ICON_W} ${ICON_H}">${inner}</svg>`;

export const STEPS = 8;
export interface IconDef { name: string; svg: string }

export function iconDefs(): IconDef[] {
  const defs: IconDef[] = [];
  for (let i = 0; i < STEPS; i++) {
    defs.push({ name: `risk-${i}`, svg: svg(bloom(hex(rampAt(RISK_RAMP, i / (STEPS - 1))))) });
    defs.push({ name: `rich-${i}`, svg: svg(bloom(hex(rampAt(RICH_RAMP, i / (STEPS - 1))))) });
  }
  defs.push({ name: "hot", svg: svg(burst("#F0533A")) });
  defs.push({ name: "nodata", svg: svg(bud("#6B7694")) });
  defs.push({ name: "then", svg: svg(bloom("#F6B93B")) });
  defs.push({ name: "now", svg: svg(bloom("#2EA8D8")) });
  defs.push({ name: "lost", svg: svg(bloom("#9B8CFF")) });
  return defs;
}

export const svgDataUrl = (s: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(s)}`;

/** SVG -> ImageData at 2x for map.addImage(name, data, { pixelRatio: 2 }). */
export async function rasterise(s: string): Promise<ImageData> {
  const img = new Image(ICON_W * 2, ICON_H * 2);
  img.src = svgDataUrl(s);
  await img.decode();
  const c = document.createElement("canvas");
  c.width = ICON_W * 2;
  c.height = ICON_H * 2;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("no 2d context");
  ctx.drawImage(img, 0, 0, c.width, c.height);
  return ctx.getImageData(0, 0, c.width, c.height);
}

export const iconBucket = (t: number) => Math.round(Math.min(Math.max(t, 0), 1) * (STEPS - 1));
