import { prisma } from "@/lib/db";

export interface LiveChannels {
  cultOfPsyche: boolean;
  psychesNightmares: boolean;
  nightmareFrequencies: boolean;
}

export async function getLiveChannels(): Promise<LiveChannels> {
  const [cop, pn, nf] = await Promise.all([
    prisma.liveStatus.findUnique({ where: { id: "singleton" } }),
    prisma.liveStatus.findUnique({ where: { id: "psyches-nightmares" } }),
    prisma.liveStatus.findUnique({ where: { id: "nightmare-frequencies" } }),
  ]);
  return {
    cultOfPsyche: cop?.isLive ?? false,
    psychesNightmares: pn?.isLive ?? false,
    nightmareFrequencies: nf?.isLive ?? false,
  };
}
