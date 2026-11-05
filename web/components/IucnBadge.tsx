"use client";

import { useI18n } from "@/lib/i18n";
import { isIucnAssessed, type IucnCode } from "@/lib/iucn";
import { FlameIcon, HelpIcon, LeafIcon, OctagonIcon, TriangleIcon } from "./Icons";

const ICON: Record<IucnCode, typeof LeafIcon> = {
  CR: OctagonIcon, EN: FlameIcon, VU: FlameIcon, NT: TriangleIcon, LC: LeafIcon, DD: HelpIcon, NE: HelpIcon,
};
/** IUCN colours reuse the risk ramp (LC gets the small green OK accent). NE and DD are neutral and dashed. */
const COLOUR: Record<IucnCode, string> = {
  CR: "text-risk-critical-line border-risk-critical-line",
  EN: "text-risk-high-line border-risk-high-line",
  VU: "text-risk-moderate-line border-risk-moderate-line",
  NT: "text-risk-low-line border-risk-low-line",
  LC: "text-ok border-ok",
  DD: "text-dim border-dim border-dashed",
  NE: "text-dim border-dim border-dashed",
};

/** IUCN category: always icon + text. NE reads "Not assessed" and is visually neutral, never green. */
export function IucnBadge({ code, onPaper = false }: { code: IucnCode; onPaper?: boolean }) {
  const { t } = useI18n();
  const Icon = ICON[code];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${onPaper ? `border-paper-ink/50 text-paper-ink ${isIucnAssessed(code) ? "" : "border-dashed"}` : COLOUR[code]}`}
      title={isIucnAssessed(code) ? undefined : t.iucn.note}
    >
      <Icon className="h-4 w-4" />
      <span className="font-mono">{code === "NE" ? "" : code}</span>
      <span>{t.iucn[code]}</span>
    </span>
  );
}
