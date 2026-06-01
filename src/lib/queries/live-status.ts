import { prisma } from "@/lib/db";

export interface LiveChannels {
  cultOfPsyche: boolean;
  alexandraMayers: boolean;
  nightmareFrequencies: boolean;
}

export async function getLiveChannels(): Promise<LiveChannels> {
  const [cop, am, nf] = await Promise.all([
    prisma.liveStatus.findUnique({ where: { id: "singleton" } }),
    prisma.liveStatus.findUnique({ where: { id: "alexandra-mayers" } }),
    prisma.liveStatus.findUnique({ where: { id: "nightmare-frequencies" } }),
  ]);
  return {
    cultOfPsyche: cop?.isLive ?? false,
    alexandraMayers: am?.isLive ?? false,
    nightmareFrequencies: nf?.isLive ?? false,
  };
}
