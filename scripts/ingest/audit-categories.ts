import { getPrisma, disconnect } from "./lib";

async function main() {
  const p = getPrisma();

  const totalEps = await p.episode.count();
  const topics = await p.topic.findMany({ select: { id: true, title: true, slug: true } });
  const people = await p.person.findMany({ select: { id: true, displayName: true, slug: true } });
  const lore = await p.loreEntry.count();
  const series = await p.series.findMany({ select: { id: true, title: true, slug: true } });
  const epWithTopics = await p.episode.count({ where: { topics: { some: {} } } });
  const epWithGuests = await p.episode.count({ where: { guests: { some: {} } } });
  const epWithSeries = await p.episode.count({ where: { seriesId: { not: null } } });
  const withRumble = await p.episode.count({ where: { rumbleVideoId: { not: null } } });
  const withYt = await p.episode.count({ where: { youtubeVideoId: { not: null } } });
  const rumbleOnly = await p.episode.count({ where: { rumbleVideoId: { not: null }, youtubeVideoId: null } });

  console.log(`=== CultCodex Category Audit ===`);
  console.log(`Total episodes: ${totalEps}`);
  console.log(`  With YouTube: ${withYt}`);
  console.log(`  With Rumble: ${withRumble} (${rumbleOnly} Rumble-only)`);
  console.log(`  With topics: ${epWithTopics}/${totalEps}`);
  console.log(`  With guests: ${epWithGuests}/${totalEps}`);
  console.log(`  With series: ${epWithSeries}/${totalEps}`);
  console.log(`\nTopics (${topics.length}): ${topics.map(t => t.title).join(', ') || 'NONE'}`);
  console.log(`People (${people.length}): ${people.map(p => p.displayName).join(', ') || 'NONE'}`);
  console.log(`Lore entries: ${lore}`);
  console.log(`Series (${series.length}): ${series.map(s => s.title).join(', ') || 'NONE'}`);

  // Sample titles to see patterns
  const sampleTitles = await p.episode.findMany({
    select: { title: true },
    orderBy: { episodeNumber: "desc" },
    take: 50,
  });
  console.log(`\nSample recent titles:`);
  sampleTitles.forEach(e => console.log(`  - ${e.title}`));

  await disconnect();
}
main();
