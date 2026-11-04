"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { ListIcon, MapIcon, ScanIcon, SearchIcon } from "./Icons";

export function TabBar() {
  const pathname = usePathname();
  const { t } = useI18n();
  const tabs = [
    { href: "/map", label: t.nav.map, Icon: MapIcon, raised: false },
    { href: "/scan", label: t.nav.scan, Icon: ScanIcon, raised: true },
    { href: "/priorities", label: t.nav.priorities, Icon: ListIcon, raised: false },
    { href: "/search", label: t.nav.search, Icon: SearchIcon, raised: false },
  ];

  return (
    <nav
      aria-label={t.nav.label}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-moss/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:inset-y-0 md:left-0 md:right-auto md:w-24 md:border-r md:border-t-0 md:pb-0"
    >
      <ul className="mx-auto flex max-w-xl items-end justify-around md:h-full md:max-w-none md:flex-col md:items-center md:justify-start md:gap-6 md:pt-20">
        {tabs.map(({ href, label, Icon, raised }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className={raised ? "-mt-5 md:mt-0" : ""}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[56px] min-w-[64px] flex-col items-center justify-center gap-1 px-2 text-xs ${
                  active ? "text-chlorophyll" : "text-dim"
                }`}
              >
                <span
                  className={
                    raised
                      ? "flex h-14 w-14 items-center justify-center rounded-full bg-chlorophyll text-ink md:h-12 md:w-12"
                      : ""
                  }
                >
                  <Icon className={raised ? "h-7 w-7" : "h-6 w-6"} />
                </span>
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
