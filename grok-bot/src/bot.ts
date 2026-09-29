import {
  AttachmentBuilder,
  ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  Message,
  MessageFlags,
  Partials,
} from "discord.js";
import type { Config } from "./config.js";
import { chunkMessage, previewText } from "./lib/chunk.js";
import { GrokClient, GrokError, type ChatMessage } from "./lib/grok.js";
import { ConversationMemory } from "./lib/memory.js";
import { PERSONAS, systemPrompt, type PersonaId } from "./lib/personas.js";
import { RateLimiter } from "./lib/rate-limit.js";

const EDIT_INTERVAL_MS = 1200;
const REQUEST_TIMEOUT_MS = 90_000;
const BRAND_COLOR = 0x1d9bf0;

export function createBot(config: Config) {
  const intents = [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages];
  if (config.messageContentIntent) intents.push(GatewayIntentBits.MessageContent);

  const client = new Client({ intents, partials: [Partials.Channel] });
  const grok = new GrokClient({
    apiKey: config.xaiApiKey,
    baseUrl: config.xaiBaseUrl,
    chatModel: config.chatModel,
    imageModel: config.imageModel,
  });
  const memory = new ConversationMemory(config.memoryTurns, config.memoryTtlMs);
  const limiter = new RateLimiter(config.ratePerMinute);
  const startedAt = Date.now();
  let answered = 0;

  const personaFor = (channelId: string, override?: PersonaId | null): PersonaId =>
    override ?? memory.persona(channelId) ?? config.defaultPersona;

  const buildMessages = (persona: PersonaId, history: ChatMessage[], prompt: string, speaker: string) => [
    { role: "system" as const, content: systemPrompt(persona) },
    ...history,
    { role: "user" as const, content: `${speaker}: ${prompt}` },
  ];

  /**
   * Streams a Grok reply, calling `render` with a throttled preview and
   * returning the full text. Discord rate-limits edits, so we never edit
   * more than once per EDIT_INTERVAL_MS.
   */
  async function stream(messages: ChatMessage[], temperature: number, render: (text: string) => Promise<unknown>) {
    const signal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
    let text = "";
    let lastEdit = 0;
    let pending: Promise<unknown> = Promise.resolve();
    for await (const delta of grok.streamChat(messages, { temperature, signal })) {
      text += delta;
      const now = Date.now();
      if (now - lastEdit >= EDIT_INTERVAL_MS && text.trim()) {
        lastEdit = now;
        await pending;
        pending = render(previewText(text)).catch(() => undefined);
      }
    }
    await pending;
    answered++;
    return text.trim() || "_(Grok had nothing to say.)_";
  }

  function friendlyError(err: unknown): string {
    if (err instanceof GrokError) {
      if (err.status === 401 || err.status === 403) return "🔑 My xAI API key was rejected. Ask the bot owner to check `XAI_API_KEY`.";
      if (err.status === 429) return "⏳ xAI is rate-limiting me right now. Try again in a minute.";
      if (err.status && err.status >= 500) return "🛰️ xAI is having a moment. Try again shortly.";
      return `⚠️ ${err.message}`;
    }
    if (err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError")) {
      return "⌛ That took too long, so I gave up. Try a shorter question.";
    }
    return "⚠️ Something went wrong on my end.";
  }

  function rateLimited(userId: string): string | null {
    const wait = limiter.take(userId);
    return wait ? `🐢 Slow down! Try again in ${Math.ceil(wait / 1000)}s.` : null;
  }

  async function finishInteraction(interaction: ChatInputCommandInteraction, text: string, ephemeral: boolean) {
    const [first, ...rest] = chunkMessage(text);
    await interaction.editReply({ content: first, allowedMentions: { parse: [] } });
    for (const part of rest) await interaction.followUp({ content: part, flags: ephemeral ? MessageFlags.Ephemeral : undefined, allowedMentions: { parse: [] } });
  }

  // ─── Slash commands ────────────────────────────────────────────────

  async function onAsk(i: ChatInputCommandInteraction) {
    const prompt = i.options.getString("prompt", true);
    const ephemeral = i.options.getBoolean("private") ?? false;
    const persona = personaFor(i.channelId, i.options.getString("persona") as PersonaId | null);
    await i.deferReply(ephemeral ? { flags: MessageFlags.Ephemeral } : {});
    const messages = buildMessages(persona, memory.history(i.channelId), prompt, i.user.displayName);
    const text = await stream(messages, PERSONAS[persona].temperature, (t) => i.editReply(t));
    if (!ephemeral) memory.append(i.channelId, `${i.user.displayName}: ${prompt}`, text);
    await finishInteraction(i, `> ${prompt.slice(0, 200)}${prompt.length > 200 ? "…" : ""}\n\n${text}`, ephemeral);
  }

  async function onImagine(i: ChatInputCommandInteraction) {
    const prompt = i.options.getString("prompt", true);
    await i.deferReply();
    const { image, revisedPrompt } = await grok.imagine(prompt, AbortSignal.timeout(REQUEST_TIMEOUT_MS));
    const file = new AttachmentBuilder(image, { name: "grok-imagine.png" });
    const embed = new EmbedBuilder()
      .setColor(BRAND_COLOR)
      .setTitle("🎨 Grok Imagine")
      .setDescription(prompt.slice(0, 4000))
      .setImage("attachment://grok-imagine.png")
      .setFooter({ text: `Requested by ${i.user.displayName} · ${config.imageModel}` });
    if (revisedPrompt && revisedPrompt !== prompt) {
      embed.addFields({ name: "Revised prompt", value: revisedPrompt.slice(0, 1024) });
    }
    answered++;
    await i.editReply({ embeds: [embed], files: [file] });
  }

  async function onRoast(i: ChatInputCommandInteraction) {
    const user = i.options.getUser("user");
    const topic = i.options.getString("topic");
    const target = topic ?? (user ? `the Discord user "${user.displayName}" (username ${user.username})` : null);
    if (!target) {
      await i.reply({ content: "Give me a `user` or a `topic` to roast. 🔥", flags: MessageFlags.Ephemeral });
      return;
    }
    await i.deferReply();
    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt("roast") },
      { role: "user", content: `Roast ${target}. Keep it under 120 words.` },
    ];
    const text = await stream(messages, PERSONAS.roast.temperature, (t) => i.editReply(t));
    await finishInteraction(i, `🔥 ${user ? `<@${user.id}>` : ""}\n${text}`.trim(), false);
  }

  async function onSummarize(i: ChatInputCommandInteraction) {
    if (!config.messageContentIntent) {
      await i.reply({
        flags: MessageFlags.Ephemeral,
        content:
          "Summaries need the **Message Content** intent. Enable it in the Discord developer portal, " +
          "set `MESSAGE_CONTENT_INTENT=true`, and restart the bot.",
      });
      return;
    }
    const channel = i.channel;
    if (!channel || !("messages" in channel)) {
      await i.reply({ content: "I can't read messages here.", flags: MessageFlags.Ephemeral });
      return;
    }
    await i.deferReply();
    const count = i.options.getInteger("messages") ?? 50;
    const fetched = await channel.messages.fetch({ limit: count });
    const transcript = [...fetched.values()]
      .reverse()
      .filter((m) => m.content.trim() && !m.author.bot)
      .map((m) => `${m.member?.displayName ?? m.author.username}: ${m.content}`)
      .join("\n")
      .slice(-30_000);
    if (!transcript) {
      await i.editReply("Nothing to summarize here yet.");
      return;
    }
    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt("grok") },
      {
        role: "user",
        content:
          "Summarize this Discord conversation. Give a one-line TL;DR, then bullet points for the main " +
          "threads, decisions, and open questions, naming who said what when it matters.\n\n" + transcript,
      },
    ];
    const text = await stream(messages, 0.3, (t) => i.editReply(t));
    await finishInteraction(i, `📜 **Summary of the last ${fetched.size} messages**\n\n${text}`, false);
  }

  async function onPersona(i: ChatInputCommandInteraction) {
    const persona = i.options.getString("style", true) as PersonaId;
    memory.setPersona(i.channelId, persona);
    memory.reset(i.channelId);
    const p = PERSONAS[persona];
    await i.reply(`${p.emoji} Persona set to **${p.label}** for this channel. Memory cleared for a fresh start.`);
  }

  async function onReset(i: ChatInputCommandInteraction) {
    memory.reset(i.channelId);
    await i.reply("🧹 Memory cleared for this channel.");
  }

  async function onAbout(i: ChatInputCommandInteraction) {
    const persona = PERSONAS[personaFor(i.channelId)];
    const uptimeMin = Math.floor((Date.now() - startedAt) / 60_000);
    const embed = new EmbedBuilder()
      .setColor(BRAND_COLOR)
      .setTitle("🛸 Grok Bot")
      .setDescription("A Discord assistant powered by xAI's Grok.")
      .addFields(
        {
          name: "Commands",
          value: [
            "`/ask` ask anything, with channel memory",
            "`/imagine` generate an image",
            "`/roast` a friendly roast",
            "`/summarize` catch up on the channel",
            "`/persona` change personality · `/reset` clear memory",
            "Or just **@mention** me.",
          ].join("\n"),
        },
        { name: "Persona here", value: `${persona.emoji} ${persona.label}`, inline: true },
        { name: "Model", value: config.chatModel, inline: true },
        { name: "Uptime", value: `${uptimeMin} min · ${answered} replies`, inline: true },
      );
    await i.reply({ embeds: [embed] });
  }

  const handlers: Record<string, (i: ChatInputCommandInteraction) => Promise<void>> = {
    ask: onAsk,
    imagine: onImagine,
    roast: onRoast,
    summarize: onSummarize,
    persona: onPersona,
    reset: onReset,
    about: onAbout,
  };
  const COSTLY = new Set(["ask", "imagine", "roast", "summarize"]);

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    const handler = handlers[interaction.commandName];
    if (!handler) return;
    if (COSTLY.has(interaction.commandName)) {
      const limited = rateLimited(interaction.user.id);
      if (limited) {
        await interaction.reply({ content: limited, flags: MessageFlags.Ephemeral }).catch(() => undefined);
        return;
      }
    }
    try {
      await handler(interaction);
    } catch (err) {
      console.error(`/${interaction.commandName} failed:`, err);
      const content = friendlyError(err);
      if (interaction.deferred || interaction.replied) await interaction.editReply({ content, embeds: [], files: [] }).catch(() => undefined);
      else await interaction.reply({ content, flags: MessageFlags.Ephemeral }).catch(() => undefined);
    }
  });

  // ─── @mentions and DMs ─────────────────────────────────────────────

  client.on(Events.MessageCreate, async (message: Message) => {
    if (message.author.bot || !client.user) return;
    const isDM = !message.guild;
    if (!isDM && !message.mentions.has(client.user, { ignoreEveryone: true, ignoreRoles: true })) return;

    const prompt = message.content.replace(new RegExp(`<@!?${client.user.id}>`, "g"), "").trim();
    if (!prompt) {
      await message.reply("👋 Ask me something, or try `/about`.");
      return;
    }
    const limited = rateLimited(message.author.id);
    if (limited) {
      await message.reply(limited);
      return;
    }

    const key = message.channelId;
    const persona = personaFor(key);
    const speaker = message.member?.displayName ?? message.author.displayName;
    const reply = await message.reply({ content: "🛸 Thinking…", allowedMentions: { repliedUser: false } });
    try {
      if ("sendTyping" in message.channel) await message.channel.sendTyping().catch(() => undefined);
      const messages = buildMessages(persona, memory.history(key), prompt, speaker);
      const text = await stream(messages, PERSONAS[persona].temperature, (t) => reply.edit(t));
      memory.append(key, `${speaker}: ${prompt}`, text);
      const [first, ...rest] = chunkMessage(text);
      await reply.edit({ content: first, allowedMentions: { parse: [] } });
      for (const part of rest) {
        if ("send" in message.channel) await message.channel.send({ content: part, allowedMentions: { parse: [] } });
      }
    } catch (err) {
      console.error("mention reply failed:", err);
      await reply.edit(friendlyError(err)).catch(() => undefined);
    }
  });

  client.once(Events.ClientReady, (c) => {
    console.log(`🛸 Logged in as ${c.user.tag} · model ${config.chatModel} · ${c.guilds.cache.size} guild(s)`);
    c.user.setActivity("/ask · @mention me");
  });

  // Drop idle channel memories every 10 minutes.
  const sweeper = setInterval(() => memory.sweep(), 10 * 60_000);
  sweeper.unref();

  return client;
}
