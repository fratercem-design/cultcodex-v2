/**
 * Paste this entire script into the browser DevTools console while on cultcodex.me
 * It calls /api/admin/enrich-topics in a loop until all topics are enriched.
 *
 * Progress is logged to the console. You can stop at any time with Ctrl+C
 * or by setting window.__enrichStop = true in the console.
 */
(async function enrichTopics() {
  // Secret is prompted for at runtime — never hard-code it in this file.
  // Paste the value of ENRICH_SECRET when asked.
  const SECRET = window.prompt("ENRICH_SECRET:");
  if (!SECRET) { console.error("No secret provided — aborting."); return; }

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
        body: JSON.stringify({ batch: BATCH, minEpisodes: MIN_EP }),
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
