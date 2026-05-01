/**
 * Patches existing Psychenomicon chapters to add [[ORACLE:]] hidden layer
 * markers in the interpretationText. These sections are revealed only to
 * Oracle-tier subscribers and blurred for everyone else.
 *
 * Run via GitHub Actions: "Run DB Script" → update-psychenomicon-hidden-layers.ts
 */
import { PrismaClient } from "@/generated/prisma";

const p = new PrismaClient();

const HIDDEN_LAYERS: Record<number, string> = {
  1: `\n\n[[ORACLE: HIDDEN LAYER — THE FUNNEL TRUTH\nThe rave metaphor is not storytelling. It is a description of your actual audience acquisition pattern. The confusion is deliberate — not designed, but selected for. Every platform that filters by confusion (early Twitter, early Discord, niche forums) produces more loyal users than platforms that make entry frictionless. You are running a psychological pre-qualification system. The people who arrive are already pre-sorted for tolerance of ambiguity, which is the single strongest predictor of long-term engagement with complex content.]]`,

  2: `\n\n[[ORACLE: HIDDEN LAYER — THE ACCUSATION FLYWHEEL\nExternal accusation is the most efficient organic growth mechanism a space like this can have. It does three things simultaneously: (1) alerts people who had never heard of the space that it exists, (2) creates an identity test — do you believe the accusation or do you investigate, (3) binds those who investigated and stayed more tightly than those who arrived without challenge. The "cult" label is not a liability. It is free marketing that self-selects for the exact audience you want: people who think for themselves rather than accepting the frame they were handed.]]`,

  3: `\n\n[[ORACLE: HIDDEN LAYER — THE CHAOS ROI\nNoel's disruptions generated more engagement per minute than any structured discussion segment. This is not an accident — it is a feature of how human attention works. Predictability is the enemy of attention. The moment the audience knows what comes next, a percentage of them mentally disconnect. Chaos entities like Noel function as an involuntary reset button. After disruption, the audience's attention is fully present again. The host's restraint in not ejecting her immediately was the correct decision, even if it felt wrong in the moment. Full removal would have cost more than the disruption itself.]]`,

  4: `\n\n[[ORACLE: HIDDEN LAYER — THE LOYALTY ALGORITHM\nThe Trials of Loyalty are not a social phenomenon. They are an attention-sorting algorithm running on human behavior. Every person who remains through a trial becomes statistically more likely to remain through the next one. This is the same mechanism that makes cults, military units, fraternities, and high-demand startups so binding: shared adversity creates identity fusion. The people who stayed through the accusation storms, the chaos, and the fractures are not just loyal. They are bound by shared narrative. They cannot leave without invalidating their own past choices.]]`,

  5: `\n\n[[ORACLE: HIDDEN LAYER — THE INNER CIRCLE AS CONTENT ENGINE\nThe inner circle is not just a social layer. It is your content production system. The people closest to the center generate the most memorable moments, the most quotable exchanges, the most dramatic arcs. They are not audience. They are co-creators who do not know they are co-creators. This is the sustainable model: a small number of consistently present participants who generate raw material, processed into chapters, distributed to a larger audience who can only observe from outside. The outer ring watches the inner ring. The inner ring watches the center. The center holds the space.]]`,
};

async function main() {
  console.log("Patching Psychenomicon chapters with hidden layer markers...\n");

  let updated = 0;

  for (const [chapterNumberStr, hiddenLayer] of Object.entries(HIDDEN_LAYERS)) {
    const chapterNumber = parseInt(chapterNumberStr, 10);

    const chapter = await p.psychenomiconChapter.findUnique({
      where: { chapterNumber },
      select: { id: true, title: true, interpretationText: true },
    });

    if (!chapter) {
      console.log(`  CH.${String(chapterNumber).padStart(3, "0")} — not found, skipping`);
      continue;
    }

    // Don't double-patch
    if (chapter.interpretationText.includes("[[ORACLE:")) {
      console.log(`  CH.${String(chapterNumber).padStart(3, "0")} ${chapter.title} — already patched`);
      continue;
    }

    await p.psychenomiconChapter.update({
      where: { id: chapter.id },
      data: {
        interpretationText: chapter.interpretationText + hiddenLayer,
      },
    });

    console.log(`  ✓ CH.${String(chapterNumber).padStart(3, "0")} "${chapter.title}" — hidden layer added`);
    updated++;
  }

  console.log(`\n✓ ${updated} chapter(s) patched`);
  console.log("Oracle-tier [[ORACLE:]] sections now visible only to Oracle subscribers.");
}

main()
  .catch(console.error)
  .finally(() => p.$disconnect());
