/** Apply variant for the Run DB Script workflow, which cannot pass --apply. */
import { run } from "./rumble-transcripts";
import { disconnect } from "../ingest/lib";

run(true).catch(async (e) => {
  console.error(e);
  await disconnect();
  process.exit(1);
});
