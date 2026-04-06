/**
 * External links for people in the archive.
 * This is a simple mapping until we add a proper `links` JSON field to the Person model.
 * Key = person slug, value = array of { label, url, icon? }.
 */

export interface ExternalLink {
  label: string;
  url: string;
  /** Optional emoji or descriptor for the link type */
  icon?: string;
}

const PERSON_LINKS: Record<string, ExternalLink[]> = {
  "alexandra-mayers": [
    { label: "irlnewstime", url: "https://www.youtube.com/@irlnewstime", icon: "▶" },
    { label: "AlexandraMayers", url: "https://www.youtube.com/@AlexandraMayers", icon: "▶" },
    { label: "ip2wiki.info", url: "https://ip2wiki.info", icon: "🔗" },
  ],
  "psyche": [
    { label: "Cult of Psyche", url: "https://www.youtube.com/@cultofpsyche", icon: "▶" },
  ],
};

export function getExternalLinks(slug: string): ExternalLink[] {
  return PERSON_LINKS[slug] ?? [];
}
