"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/** Renders `fallback` on the server and during hydration, then the children. Data views fetch static JSON in the browser only. */
export function ClientOnly({ children, fallback }: { children: React.ReactNode; fallback: React.ReactNode }) {
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  return <>{mounted ? children : fallback}</>;
}
