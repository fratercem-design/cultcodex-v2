# 🛸 Grok Bot

A Discord bot powered by [xAI's Grok](https://docs.x.ai). It streams answers
live into the channel, remembers the conversation, switches personalities,
catches you up on long threads, and generates images.

Self-contained: it has its own `package.json` and deploys on its own. It
shares nothing with the CultCodex app in the parent folder.

## Features

| | |
|---|---|
| `/ask prompt [persona] [private]` | Ask anything. The reply streams in as Grok writes it. The bot keeps per-channel memory. |
| `@Grok …` or a DM | The same thing without the slash command. |
| `/imagine prompt` | Makes an image with Grok Imagine and posts it in an embed. |
| `/roast [user] [topic]` | A friendly PG-13 roast of someone or something. |
| `/summarize [messages]` | TL;DR plus bullet points for the last 5–100 messages. |
| `/persona style` | Sets the channel's personality: 🛸 Grok, 🔥 Roast Master, 🔮 Sage, 🧸 ELI5, 💻 Senior Engineer. |
| `/reset` | Clears the channel's memory. |
| `/about` | Lists commands and shows the current persona, model, and uptime. |

Under the hood:

- **Streaming replies.** The bot edits its message at most every 1.2s, so it stays under Discord's rate limits.
- **Long answers get split cleanly.** Replies over 2000 characters break on paragraph or line boundaries, and ``` code fences are closed and reopened across messages so highlighting survives.
- **Memory has limits.** It keeps the last N turns per channel under a character budget, and drops a channel's history after it's been idle for a while.
- **Per-user rate limiting.** A token bucket stops one person from spending your whole xAI budget.
- **Readable errors.** A bad key, xAI rate limits, outages, and timeouts each get a clear message in Discord instead of a stack trace.
- **No surprise pings.** Replies never trigger @everyone or role mentions.

## Setup

1. **Create the Discord app.** In the [developer portal](https://discord.com/developers/applications), create an application, then add a Bot and copy its token. Under *OAuth2 → URL Generator*, pick the `bot` and `applications.commands` scopes. Give it the *Send Messages*, *Embed Links*, *Attach Files* and *Read Message History* permissions, then open the URL to invite the bot.
2. **Get an xAI key** from [console.x.ai](https://console.x.ai).
3. **Configure:**
   ```bash
   cd grok-bot
   cp .env.example .env   # fill in DISCORD_TOKEN, DISCORD_CLIENT_ID, XAI_API_KEY
   npm install
   ```
4. **Register the slash commands.** With `DISCORD_GUILD_ID` set, they show up in that server right away. Without it, they register globally, which can take up to an hour.
   ```bash
   node --env-file=.env --import tsx scripts/register-commands.ts
   ```
5. **Run:**
   ```bash
   node --env-file=.env --import tsx src/index.ts     # dev
   npm run build && node --env-file=.env dist/index.js  # prod
   ```

`/summarize` needs the privileged **Message Content** intent. Turn it on under
*Bot → Privileged Gateway Intents* and set `MESSAGE_CONTENT_INTENT=true`.
@mentions and DMs work without it.

## Configuration

| Variable | Default | |
|---|---|---|
| `GROK_MODEL` | `grok-4.7` | Chat model. |
| `GROK_IMAGE_MODEL` | `grok-imagine-image-2.0` | Image model. |
| `XAI_BASE_URL` | `https://api.x.ai/v1` | Any OpenAI-compatible endpoint works. |
| `DEFAULT_PERSONA` | `grok` | `grok`, `roast`, `sage`, `eli5`, `coder` |
| `MEMORY_TURNS` | `12` | Turns kept per channel. |
| `MEMORY_TTL_MINUTES` | `60` | How long a channel can sit idle before its history is dropped. |
| `RATE_LIMIT_PER_MINUTE` | `6` | Costly commands allowed per user per minute. |
| `MESSAGE_CONTENT_INTENT` | `false` | Needed for `/summarize`. |

Memory lives in the process, so a restart clears it.

## Deploy (Fly.io)

```bash
cd grok-bot
fly launch --no-deploy --copy-config   # pick a unique app name
fly secrets set DISCORD_TOKEN=… DISCORD_CLIENT_ID=… XAI_API_KEY=…
fly deploy
fly scale count 1   # run exactly one instance, or every message gets answered twice
```

Any host that runs a long-lived Docker container works: Railway, Render
background workers, or a VPS with `docker run --env-file .env`.

## Development

```bash
npm test          # vitest: SSE parser, xAI client, memory, rate limiter, chunking
npm run typecheck
```

Adding a persona means adding an entry to `src/lib/personas.ts`. The slash
command choices pick it up automatically; re-run the register step after.
