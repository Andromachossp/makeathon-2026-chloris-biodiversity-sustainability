export const en = {
  appName: "Chloris",
  tagline: "Where Greece's medicinal plants grow, which are at risk, and how we keep them.",
  loading: "Loading…",
  offlineBanner: "Offline — identification will run when you're back online.",
  language: "Language",
  nav: {
    label: "Main navigation",
    map: "Map",
    scan: "Scan",
    priorities: "Priorities",
    search: "Search",
  },
  pages: {
    map: { title: "Map", placeholder: "The map of Greece's medicinal plants arrives in Phase 3." },
    scan: { title: "Scan a plant", placeholder: "Photo identification arrives in Phase 4." },
    priorities: { title: "Priorities", placeholder: "Species ranked by risk arrive in Phase 3." },
    search: { title: "Search", placeholder: "Search by Greek, English or scientific name arrives in Phase 3." },
    sightings: { title: "My sightings", placeholder: "Your queued and synced sightings arrive in Phase 4." },
    about: { title: "About the data", placeholder: "Sources, method, scoring and limitations arrive in Phase 3." },
    species: { title: "Species card", placeholder: "The specimen card arrives in Phase 3." },
    home: { title: "Chloris", cta: "Open Chloris" },
  },
  iucn: {
    CR: "Critically endangered",
    EN: "Endangered",
    VU: "Vulnerable",
    NT: "Near threatened",
    LC: "Least concern",
    DD: "Data deficient",
    NE: "Not assessed",
    label: "IUCN Red List",
    note: "Not assessed means no IUCN assessment exists. It does not mean the plant is safe.",
  },
  notMedicalAdvice: "Chloris is not medical advice. Documented uses are shown for information only.",
} as const;

type Widen<T> = T extends string ? string : { [K in keyof T]: Widen<T[K]> };
export type Dictionary = Widen<typeof en>;
