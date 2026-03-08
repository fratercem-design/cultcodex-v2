export type EntityType = "episode" | "person" | "lore" | "topic" | "series" | "quote";

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
}

export interface ArchiveStats {
  episodes: number;
  people: number;
  loreEntries: number;
  quotes: number;
  series: number;
  topics: number;
}
