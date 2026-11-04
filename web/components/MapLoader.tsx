"use client";

import dynamic from "next/dynamic";
import { MapSkeleton } from "./Skeleton";

// MapLibre is large: load it only on /map.
const MapView = dynamic(() => import("./MapView"), { ssr: false, loading: () => <MapSkeleton /> });

export function MapLoader() {
  return <MapView />;
}
