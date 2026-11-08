/** Species-level human hazard references. Source-checked, not specialist-reviewed. */
export const HUMAN_HAZARDS: Record<string, { kind: "poison" | "sting" | "rash" | "sunRash" | "pollen"; sourceUrl: string; source: "ncState" | "pubmed" }> = {
  "atropa-bella-donna": { kind: "poison", sourceUrl: "https://plants.ces.ncsu.edu/plants/atropa-bella-donna/", source: "ncState" },
  "colchicum-autumnale": { kind: "poison", sourceUrl: "https://plants.ces.ncsu.edu/plants/colchicum-autumnale/", source: "ncState" },
  "dittrichia-graveolens": { kind: "rash", sourceUrl: "https://plants.ces.ncsu.edu/plants/dittrichia-graveolens/", source: "ncState" },
  "nerium-oleander": { kind: "poison", sourceUrl: "https://plants.ces.ncsu.edu/plants/nerium-oleander/", source: "ncState" },
  "parietaria-judaica": { kind: "pollen", sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/12646120/", source: "pubmed" },
  "ruta-chalepensis": { kind: "sunRash", sourceUrl: "https://pubmed.ncbi.nlm.nih.gov/4017576/", source: "pubmed" },
  "taxus-baccata": { kind: "poison", sourceUrl: "https://plants.ces.ncsu.edu/plants/taxus-baccata/", source: "ncState" },
  "urtica-dioica": { kind: "sting", sourceUrl: "https://plants.ces.ncsu.edu/plants/urtica-dioica/", source: "ncState" },
};
