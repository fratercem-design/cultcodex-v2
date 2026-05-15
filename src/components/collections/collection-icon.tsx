/**
 * CollectionIcon — Maps the ThemedCollection.iconKey string to one of
 * the codex-icons SVG components. Keeps the page component free of a
 * conditional chain and keeps icon choices auditable from one file.
 */
import {
  IconCrystalBall,
  IconTransmission,
  IconTarot,
  IconPerson,
  IconMicrophone,
  IconScroll,
} from "@/components/graphics/codex-icons";
import type { ThemedCollection } from "@/lib/collections/themed-collections";

type IconKey = ThemedCollection["iconKey"];

const ICON_MAP: Record<IconKey, React.ComponentType<{ size?: number; className?: string }>> = {
  crystal: IconCrystalBall,
  transmission: IconTransmission,
  tarot: IconTarot,
  person: IconPerson,
  mic: IconMicrophone,
  scroll: IconScroll,
};

interface CollectionIconProps {
  iconKey: IconKey;
  size?: number;
  className?: string;
}

export function CollectionIcon({ iconKey, size = 48, className }: CollectionIconProps) {
  const Icon = ICON_MAP[iconKey];
  return <Icon size={size} className={className} />;
}
