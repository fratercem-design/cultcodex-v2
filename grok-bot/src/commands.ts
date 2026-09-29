import { SlashCommandBuilder } from "discord.js";
import { PERSONAS, PERSONA_IDS } from "./lib/personas.js";

const personaChoices = PERSONA_IDS.map((id) => ({
  name: `${PERSONAS[id].emoji} ${PERSONAS[id].label}`,
  value: id,
}));

export const commands = [
  new SlashCommandBuilder()
    .setName("ask")
    .setDescription("Ask Grok anything (remembers this channel's conversation)")
    .addStringOption((o) => o.setName("prompt").setDescription("Your question").setRequired(true).setMaxLength(4000))
    .addStringOption((o) =>
      o.setName("persona").setDescription("Answer in a specific persona, just this once").addChoices(...personaChoices),
    )
    .addBooleanOption((o) => o.setName("private").setDescription("Only you see the answer")),

  new SlashCommandBuilder()
    .setName("imagine")
    .setDescription("Generate an image with Grok Imagine")
    .addStringOption((o) => o.setName("prompt").setDescription("Describe the image").setRequired(true).setMaxLength(1000)),

  new SlashCommandBuilder()
    .setName("roast")
    .setDescription("Have Grok lovingly roast someone (or something)")
    .addUserOption((o) => o.setName("user").setDescription("Who to roast"))
    .addStringOption((o) => o.setName("topic").setDescription("Or roast a thing/idea instead").setMaxLength(500)),

  new SlashCommandBuilder()
    .setName("summarize")
    .setDescription("Summarize recent messages in this channel")
    .addIntegerOption((o) =>
      o.setName("messages").setDescription("How many recent messages (default 50)").setMinValue(5).setMaxValue(100),
    ),

  new SlashCommandBuilder()
    .setName("persona")
    .setDescription("Set Grok's personality for this channel")
    .addStringOption((o) =>
      o.setName("style").setDescription("Persona").setRequired(true).addChoices(...personaChoices),
    ),

  new SlashCommandBuilder().setName("reset").setDescription("Clear Grok's memory for this channel"),

  new SlashCommandBuilder().setName("about").setDescription("What this bot is and how to use it"),
];
