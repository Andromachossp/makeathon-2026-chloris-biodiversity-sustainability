"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { MapIcon, PinIcon, ScanIcon } from "./Icons";
import { SafetyNotice } from "./SafetyNotice";

/** First tab: one sentence and three big buttons. */
export function HomeView() {
  const { t } = useI18n();
  const buttons = [
    { href: "/scan", Icon: ScanIcon, label: t.home.scan, sub: t.home.scanSub, primary: true },
    { href: "/near", Icon: PinIcon, label: t.home.near, sub: t.home.nearSub, primary: false },
    { href: "/map", Icon: MapIcon, label: t.home.map, sub: t.home.mapSub, primary: false },
  ];
  return (
    <section className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-8">
      <h1 className="font-display text-3xl font-semibold leading-tight md:text-4xl">{t.home.sentence}</h1>
      <ul className="flex flex-col gap-4">
        {buttons.map(({ href, Icon, label, sub, primary }) => (
          <li key={href}>
            <Link href={href} className={`flex min-h-[104px] items-center gap-4 rounded-[18px] px-5 py-4 ${primary ? "bg-saffron text-ink" : "border border-line bg-surface text-text hover:bg-surface-2"}`}>
              <Icon className="h-10 w-10 shrink-0" />
              <span>
                <span className="block font-display text-2xl font-semibold leading-tight">{label}</span>
                <span className={`mt-0.5 block text-sm ${primary ? "text-ink/80" : "text-dim"}`}>{sub}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <SafetyNotice />
    </section>
  );
}
