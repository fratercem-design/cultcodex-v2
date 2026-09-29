import { createBot } from "./bot.js";
import { loadConfig } from "./config.js";

const config = loadConfig();
const client = createBot(config);

async function shutdown(signal: string) {
  console.log(`${signal} received, shutting down…`);
  await client.destroy();
  process.exit(0);
}
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("unhandledRejection", (err) => console.error("Unhandled rejection:", err));

await client.login(config.discordToken);
