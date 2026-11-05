"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { HomeIcon, ListIcon, MapIcon, ScanIcon } from "./Icons";

export function TabBar() {
  const pathname = usePathname();
  const { t } = useI18n();
  // four tabs; related routes keep their tab highlighted (a plant page belongs to Plants, "near me" to Home)
  const tabs = [
    { href: "/home", label: t.nav.home, Icon: HomeIcon, raised: false, also: ["/near"] },
    { href: "/scan", label: t.nav.scan, Icon: ScanIcon, raised: true, also: [] as string[] },
    { href: "/map", label: t.nav.map, Icon: MapIcon, raised: false, also: [] as string[] },
    { href: "/plants", label: t.nav.plants, Icon: ListIcon, raised: false, also: ["/species", "/sightings"] },
  ];

  return (
    <nav
      aria-label={t.nav.label}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:inset-y-0 md:left-0 md:right-auto md:w-24 md:border-r md:border-t-0 md:pb-0"
    >
      <ul className="mx-auto flex max-w-xl items-end justify-around md:h-full md:max-w-none md:flex-col md:items-center md:justify-start md:gap-6 md:pt-20">
        {tabs.map(({ href, label, Icon, raised, also }) => {
          const active = [href, ...also].some((p) => pathname === p || pathname.startsWith(`${p}/`));
          return (
            <li key={href} className={raised ? "-mt-5 md:mt-0" : ""}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[56px] min-w-[64px] flex-col items-center justify-center gap-1 px-2 text-xs ${
                  active ? "text-saffron" : "text-dim"
                }`}
              >
                <span
                  className={
                    raised
                      ? "flex h-14 w-14 items-center justify-center rounded-full bg-saffron text-ink md:h-12 md:w-12"
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
