// Every public section of the site, grouped by what a visitor is trying to do.
//
// The sidebar (src/lib/nav.ts) is deliberately short and its header promises
// that /explore links whatever the sidebar leaves out. Until 2026-11 /explore
// listed only the eight pillars, so 23 pages in the sitemap (stats, FAQ, the
// tarot oracle, the mythic map, the leaderboard and others) had no link from
// the sidebar, the footer, the homepage or /explore. /explore renders this
// list, which makes the promise true.
//
// Adding a public page: add it here. src/lib/__tests__/site-directory.test.ts
// fails if an href has no route under src/app.

export interface DirectoryLink {
  readonly href: string;
  readonly label: string;
  readonly blurb: string;
}

export interface DirectoryGroup {
  readonly title: string;
  readonly links: readonly DirectoryLink[];
}

export const SITE_DIRECTORY: readonly DirectoryGroup[] = [
  {
    title: "Browse the archive",
    links: [
      { href: "/episodes", label: "Episodes", blurb: "Every stream, with transcripts and timestamps." },
      { href: "/people", label: "People", blurb: "Guests, panelists and recurring voices." },
      { href: "/topics", label: "Topics", blurb: "Subjects the show keeps returning to." },
      { href: "/lore", label: "Lore", blurb: "Myths, running jokes and canon." },
      { href: "/series", label: "Series", blurb: "Episodes grouped into runs." },
      { href: "/collections", label: "Collections", blurb: "Hand-picked sets of episodes." },
      { href: "/quotes", label: "Quotes", blurb: "Lines worth keeping, linked to the moment." },
      { href: "/search", label: "Search", blurb: "Search every transcript." },
    ],
  },
  {
    title: "By date",
    links: [
      { href: "/this-week", label: "This Week", blurb: "What was added in the last seven days." },
      { href: "/on-this-day", label: "On This Day", blurb: "Streams from today's date in past years." },
      { href: "/timeline", label: "Timeline", blurb: "The archive in order." },
      { href: "/timeline/explore", label: "Timeline Explorer", blurb: "The archive by era." },
      { href: "/eras", label: "Eras", blurb: "The show's periods and what defined them." },
      { href: "/live", label: "Live", blurb: "What is streaming now." },
    ],
  },
  {
    title: "Maps and numbers",
    links: [
      { href: "/graph", label: "Relationship Map", blurb: "Who appears with whom." },
      { href: "/mythic-map", label: "Mythic Map", blurb: "The show's mythology laid out." },
      { href: "/stats", label: "Archive Stats", blurb: "Hours, episodes and coverage." },
      { href: "/reports", label: "Codex Reports", blurb: "Generated reports on people and themes." },
      { href: "/drama", label: "Drama Files", blurb: "Conflicts, documented from the transcripts." },
      { href: "/drama/feuds", label: "Feuds", blurb: "The long-running ones." },
    ],
  },
  {
    title: "Myth and symbol",
    links: [
      { href: "/psychenomicon", label: "Psychenomicon", blurb: "The archive retold as myth, chapter by chapter." },
      { href: "/lexicon", label: "Panelverse Lexicon", blurb: "The show's vocabulary, defined." },
      { href: "/symbols", label: "Symbol Encyclopedia", blurb: "Recurring symbols and their meanings." },
      { href: "/archetypes", label: "Archetypes", blurb: "The character types of the panel." },
      { href: "/archetype-quiz", label: "Archetype Quiz", blurb: "Find which archetype you are." },
      { href: "/tarot", label: "Codex Tarot", blurb: "The show's own deck. Join the waitlist." },
      { href: "/tarot/oracle", label: "Arcanum Oracle", blurb: "A reading from the Cult of Psyche tarot." },
      { href: "/bestiary", label: "Bestiary", blurb: "Creatures of the panelverse." },
      { href: "/trollopedia", label: "Trollopedia", blurb: "A field guide to the trolls." },
      { href: "/prophecies", label: "Prophecy Ledger", blurb: "Predictions made on stream, tracked." },
    ],
  },
  {
    title: "Play",
    links: [
      { href: "/fun", label: "The Fun Wing", blurb: "Games and toys built from the archive." },
      { href: "/gameshow", label: "Panelverse Game Show", blurb: "Trivia from the transcripts." },
      { href: "/draw", label: "Draw from the Deck", blurb: "Pull a card." },
      { href: "/cards", label: "Cards", blurb: "Collect the Codex trading cards." },
      { href: "/quests", label: "The Trials", blurb: "Quests that unlock hidden fragments." },
      { href: "/rank", label: "Your Rank", blurb: "Where you stand." },
      { href: "/leaderboard", label: "Leaderboard", blurb: "Who has climbed highest." },
      { href: "/initiation", label: "30-Day Initiation", blurb: "A free workbook." },
    ],
  },
  {
    title: "About and membership",
    links: [
      { href: "/start-here", label: "Start Here", blurb: "New to the show? Begin with these." },
      { href: "/about", label: "About", blurb: "What CultCodex is." },
      { href: "/about/methodology", label: "Methodology", blurb: "How the archive is built and checked." },
      { href: "/faq", label: "FAQ", blurb: "Common questions." },
      { href: "/guide", label: "Cult Master's Guide", blurb: "How to use the site." },
      { href: "/handbook", label: "Cult Master's Handbook", blurb: "The long version." },
      { href: "/articles", label: "Articles", blurb: "Writing drawn from the archive." },
      { href: "/corrections", label: "Corrections", blurb: "Report an error; see what was fixed." },
      { href: "/appear", label: "Appear on the Show", blurb: "How to get on a panel." },
      { href: "/media-kit", label: "Media Kit", blurb: "For press and collaborators." },
      { href: "/premium", label: "Membership", blurb: "What members get." },
      { href: "/join", label: "Join the Cult", blurb: "Sign up." },
      { href: "/youtube-members", label: "YouTube Members", blurb: "Linking a channel membership." },
      { href: "/contact", label: "Contact", blurb: "Reach the team." },
    ],
  },
];
