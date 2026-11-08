"use client";

import Link from "next/link";
import Image from "next/image";
import { useI18n, type Locale } from "@/lib/i18n";
import { useOnline } from "@/lib/useOnline";
import { OfflineIcon } from "./Icons";

export function TopBar() {
  const { locale, setLocale, t } = useI18n();
  const online = useOnline();
  const options: Locale[] = ["el", "en"];

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-ink/95 backdrop-blur md:pl-24">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/home" className="group flex items-center gap-2.5 text-text" aria-label={t.appName}>
          <Image src="/chloris-mark.png" alt="" width={40} height={40} className="h-10 w-10 object-contain transition-transform duration-200 group-hover:scale-105" />
          <span className="font-display text-xl font-semibold tracking-tight">{t.appName}</span>
        </Link>
        <div role="group" aria-label={t.language} className="flex rounded-full border border-line p-0.5">
          {options.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLocale(l)}
              aria-pressed={locale === l}
              aria-label={t.languageNames[l]}
              title={t.languageNames[l]}
              className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full px-1.5 ${
                locale === l ? "bg-saffron text-ink" : "text-dim"
              }`}
            >
              <Image src={`/flags/${l}.png`} alt="" width={32} height={32} className="h-8 w-8 object-contain" />
            </button>
          ))}
        </div>
      </div>
      {!online && (
        <p role="status" className="flex items-center gap-2 bg-surface px-4 py-2 text-sm text-lavender">
          <OfflineIcon className="h-4 w-4 shrink-0" />
          {t.offlineBanner}
        </p>
      )}
    </header>
  );
}
