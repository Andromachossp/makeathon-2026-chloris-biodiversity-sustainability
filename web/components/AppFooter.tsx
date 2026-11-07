"use client";

import { useI18n } from "@/lib/i18n";

export function AppFooter() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-line px-5 py-6 pb-24 text-center text-xs text-dim md:ml-24 md:pb-6">
      {t.copyright}
    </footer>
  );
}
