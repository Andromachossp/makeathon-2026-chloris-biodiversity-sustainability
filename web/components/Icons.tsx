type P = { className?: string };
const base = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

export const MapIcon = ({ className }: P) => (
  <svg {...base} className={className}><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" /><path d="M9 4v14M15 6v14" /></svg>
);
export const ScanIcon = ({ className }: P) => (
  <svg {...base} className={className}><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" /><circle cx="12" cy="12" r="3.5" /></svg>
);
export const ListIcon = ({ className }: P) => (
  <svg {...base} className={className}><path d="M9 6h11M9 12h11M9 18h11" /><path d="M4 6h.01M4 12h.01M4 18h.01" /></svg>
);
export const SearchIcon = ({ className }: P) => (
  <svg {...base} className={className}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4-4" /></svg>
);
export const OfflineIcon = ({ className }: P) => (
  <svg {...base} className={className}><path d="M2 8.8a15 15 0 0 1 4-2.3M22 8.8a15 15 0 0 0-9.5-3.7M5 12.9a10 10 0 0 1 3-1.8M19 12.9a10 10 0 0 0-3.6-2.1M8.5 16.4a5 5 0 0 1 7 0M12 20h.01M3 3l18 18" /></svg>
);
export const LeafIcon = ({ className }: P) => (
  <svg {...base} className={className}><path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15" /><path d="M5 19c3-5 6-8 10-10" /></svg>
);
export const TriangleIcon = ({ className }: P) => (
  <svg {...base} className={className}><path d="M12 4 3 20h18L12 4Z" /><path d="M12 10v4M12 17h.01" /></svg>
);
export const FlameIcon = ({ className }: P) => (
  <svg {...base} className={className}><path d="M12 3c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-10Z" /></svg>
);
export const OctagonIcon = ({ className }: P) => (
  <svg {...base} className={className}><path d="M8 3h8l5 5v8l-5 5H8l-5-5V8l5-5Z" /><path d="M12 8v5M12 16h.01" /></svg>
);
export const HelpIcon = ({ className }: P) => (
  <svg {...base} className={className}><circle cx="12" cy="12" r="9" strokeDasharray="3 3" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01" /></svg>
);
export const CheckIcon = ({ className }: P) => (
  <svg {...base} className={className}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
);
export const CrossIcon = ({ className }: P) => (
  <svg {...base} className={className}><path d="M6 6l12 12M18 6 6 18" /></svg>
);
export const WarnIcon = ({ className }: P) => (
  <svg {...base} className={className}><path d="M12 5v9M12 18.5h.01" /></svg>
);
export const LayersIcon = ({ className }: P) => (
  <svg {...base} className={className}><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5" /></svg>
);
export const LocateIcon = ({ className }: P) => (
  <svg {...base} className={className}><circle cx="12" cy="12" r="3" /><circle cx="12" cy="12" r="8" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg>
);
export const CloseIcon = ({ className }: P) => (
  <svg {...base} className={className}><path d="M6 6l12 12M18 6 6 18" /></svg>
);
export const ShieldIcon = ({ className }: P) => (
  <svg {...base} className={className}><path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z" /><path d="M12 8v4M12 15h.01" /></svg>
);
export const HomeIcon = ({ className }: P) => (
  <svg {...base} className={className}><path d="M4 11.5 12 5l8 6.5" /><path d="M6 10v9h12v-9" /><path d="M10 19v-5h4v5" /></svg>
);
export const PinIcon = ({ className }: P) => (
  <svg {...base} className={className}><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" /><circle cx="12" cy="10" r="2.4" /></svg>
);
export const ClockIcon = ({ className }: P) => (
  <svg {...base} className={className}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>
);
export const UserIcon = ({ className }: P) => (
  <svg {...base} className={className}><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20c.8-3.8 3.6-5.5 7-5.5s6.2 1.7 7 5.5" /></svg>
);
export const FlaskIcon = ({ className }: P) => (
  <svg {...base} className={className}><path d="M9.5 3.5h5M10.5 3.5v5.2L5.2 18a1.8 1.8 0 0 0 1.6 2.7h10.4a1.8 1.8 0 0 0 1.6-2.7l-5.3-9.3V3.5" /><path d="M8 14h8" /></svg>
);
export const DocIcon = ({ className }: P) => (
  <svg {...base} className={className}><path d="M7 3.5h7l4 4V20.5H7Z" /><path d="M14 3.5v4h4M9.5 12h6M9.5 15.5h6" /></svg>
);

export const FlowerIcon = ({ className }: P) => (
  <svg {...base} className={className}><circle cx="12" cy="12" r="2.2" /><path d="M12 9.8c-2.4-1-2.4-5.6 0-6.8 2.4 1.2 2.4 5.8 0 6.8Z" /><path d="M12 14.2c2.4 1 2.4 5.6 0 6.8-2.4-1.2-2.4-5.8 0-6.8Z" /><path d="M9.8 12c-1 2.4-5.6 2.4-6.8 0 1.2-2.4 5.8-2.4 6.8 0Z" /><path d="M14.2 12c1-2.4 5.6-2.4 6.8 0-1.2 2.4-5.8 2.4-6.8 0Z" /></svg>
);
