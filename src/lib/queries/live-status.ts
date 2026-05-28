import { prisma } from "@/lib/db";

export interface LiveChannels {
  cultOfPsyche: boolean;
  alexandraMayers: boolean;
}

export async function getLiveChannels(): Promise<LiveChannels> {
  const [cop, am] = await Promise.all([
    prisma.liveStatus.findUnique({ where: { id: "singleton" } }),
    prisma.liveStatus.findUnique({ where: { id: "alexandra-mayers" } }),
  ]);
  return {
    cultOfPsyche: cop?.isLive ?? false,
    alexandraMayers: am?.isLive ?? false,
  };
}
