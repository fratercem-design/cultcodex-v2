export type EntityType = "episode" | "person" | "lore" | "topic" | "series" | "quote";

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
}
