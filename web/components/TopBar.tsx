"use client";

import Link from "next/link";
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
        <Link href="/map" className="font-sans text-lg font-extrabold tracking-wide text-text">
          {t.appName}
        </Link>
        <div role="group" aria-label={t.language} className="flex rounded-full border border-line p-0.5">
          {options.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLocale(l)}
              aria-pressed={locale === l}
              className={`min-h-[44px] min-w-[44px] rounded-full px-3 font-mono text-xs uppercase ${
                locale === l ? "bg-saffron text-ink" : "text-dim"
              }`}
            >
              {l}
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
