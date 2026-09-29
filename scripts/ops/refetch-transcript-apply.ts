/** Apply variant for the Run DB Script workflow, which cannot pass --apply. */
import { run } from "./refetch-transcript";
import { disconnect } from "../ingest/lib";

run(true)
  .then(disconnect)
  .catch(async (e) => {
    console.error(e);
    await disconnect();
    process.exit(1);
  });
