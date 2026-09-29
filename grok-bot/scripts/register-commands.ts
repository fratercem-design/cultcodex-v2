// Registers the slash commands with Discord. Run once after changing
// src/commands.ts:  npm run register
// With DISCORD_GUILD_ID set, commands appear in that server immediately;
// otherwise they are registered globally (can take up to an hour).
import { REST, Routes } from "discord.js";
import { commands } from "../src/commands.js";

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID?.trim();
if (!token || !clientId) {
  console.error("Set DISCORD_TOKEN and DISCORD_CLIENT_ID first.");
  process.exit(1);
}

const rest = new REST().setToken(token);
const body = commands.map((c) => c.toJSON());
const route = guildId ? Routes.applicationGuildCommands(clientId, guildId) : Routes.applicationCommands(clientId);
await rest.put(route, { body });
console.log(`Registered ${body.length} commands ${guildId ? `to guild ${guildId}` : "globally"}.`);
