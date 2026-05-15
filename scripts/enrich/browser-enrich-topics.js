/**
 * Paste this entire script into the browser DevTools console while on cultcodex.me
 * It calls /api/admin/enrich-topics in a loop until all topics are enriched.
 *
 * Progress is logged to the console. You can stop at any time with Ctrl+C
 * or by setting window.__enrichStop = true in the console.
 */
(async function enrichTopics() {
  const SECRET  = "2633f3d5c23cfa60765748e5de4dcd633ac100e3e8f8b241";
  const API_KEY = "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";
  const BATCH   = 10;   // topics per round — keep low to stay under 60s Vercel limit
  const MIN_EP  = 2;    // minimum episode count

  window.__enrichStop = false;
  let round = 0;
  let totalDone = 0;

  console.log("%c── CultCodex Topic Enrichment ──", "font-weight:bold;color:#a78bfa");
  console.log(`Batch: ${BATCH} | Min episodes: ${MIN_EP}`);
  console.log('Set window.__enrichStop = true to halt early.\n');

  while (!window.__enrichStop) {
    round++;
    console.log(`Round ${round}…`);

    let data;
    try {
      const res = await fetch("/api/admin/enrich-topics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-enrich-secret": SECRET,
        },
        body: JSON.stringify({ batch: BATCH, minEpisodes: MIN_EP, anthropicKey: API_KEY }),
      });
      data = await res.json();
      if (!res.ok) {
        console.error("HTTP error", res.status, data);
        break;
      }
    } catch (err) {
      console.error("Fetch error:", err);
      console.log("Retrying in 10s…");
      await new Promise(r => setTimeout(r, 10000));
      continue;
    }

    totalDone += data.processed ?? 0;

    for (const r of (data.results ?? [])) {
      console.log(`  ${r.ok ? "✓" : "✗"} ${r.title}${r.error ? " — " + r.error : ""}`);
    }

    console.log(`  processed=${data.processed}  remaining=${data.remaining}  total done=${totalDone}`);

    if (data.done || data.remaining <= 0) {
      console.log(`%c\n✅ All topics enriched! Total: ${totalDone}`, "color:green;font-weight:bold");
      break;
    }

    // Short pause between rounds
    await new Promise(r => setTimeout(r, 1500));
  }

  if (window.__enrichStop) {
    console.log(`Stopped after ${round} rounds. ${totalDone} topics enriched so far.`);
  }
})();
