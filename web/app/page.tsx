"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

// Placeholder landing. The cinematic WebGL story arrives in Phase 5 (Three.js loads only here).
export default function Home() {
  const { t } = useI18n();
  return (
    <main className="flex min-h-dvh flex-col justify-end gap-6 p-6">
      <p className="max-w-md text-dim">{t.tagline}</p>
      <h1 className="font-sans text-[22vw] font-black uppercase leading-none tracking-tight" style={{ fontStretch: "30%" }}>
        {t.appName}
      </h1>
      <Link href="/map" className="self-start rounded-full bg-chlorophyll px-6 py-3 font-semibold text-ink">
        {t.pages.home.cta}
      </Link>
    </main>
  );
}
