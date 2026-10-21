"use client";

import { createContext, useContext, useEffect, useState, type ComponentProps, type ReactNode } from "react";
import { useSession } from "next-auth/react";
import { ReactionBar } from "@/components/episodes/reaction-bar";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { WhatYouMissed } from "@/components/episodes/what-you-missed";
import { DecodeModePanel } from "@/components/episodes/decode-mode-panel";
import { CommentSection } from "@/components/episodes/comment-section";
import { TranscriptViewer } from "@/components/media/transcript-viewer";
import { YouTubeEmbed } from "@/components/media/youtube-embed";
import { rumbleEmbedUrl } from "@/lib/format/moment";
import { EpisodeTabLayout } from "@/components/episodes/episode-tab-layout";

/**
 * The per-viewer layer of the episode page.
 *
 * The page is cached (ISR) and always rendered as a signed-out visitor with
 * no query string, so it holds no member-only data and reads no cookies.
 * Everything that depends on who is looking, or on ?t=, is filled in here
 * after load: signed-in viewers make one GET to /api/episodes/[slug]/viewer.
 *
 * Wrapped components seed their state from props once, so they are keyed on
 * the viewer and remount when its data arrives.
 */

type ReactionCounts = ComponentProps<typeof ReactionBar>["initialCounts"];
type DecodeData = NonNullable<ComponentProps<typeof DecodeModePanel>["decodeData"]>;
type SignalMap = NonNullable<ComponentProps<typeof TranscriptViewer>["signalMap"]>;

interface ViewerData {
  userId: string;
  isMember: boolean;
  favorited: boolean;
  favoriteCount: number;
  reactions: ReactionCounts | null;
  decodeData: DecodeData | null;
  signalMap: SignalMap | null;
}

interface ViewerState {
  /** True as soon as the session says so, before /viewer returns. */
  isAuthenticated: boolean;
  viewer: ViewerData | null;
  /** ?t= from the URL, read after mount. */
  timestamp: number | undefined;
}

const ViewerContext = createContext<ViewerState>({
  isAuthenticated: false,
  viewer: null,
  timestamp: undefined,
});

export function EpisodeViewerProvider({ slug, children }: { slug: string; children: ReactNode }) {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const [viewer, setViewer] = useState<ViewerData | null>(null);
  const [timestamp, setTimestamp] = useState<number | undefined>(undefined);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("t");
    const n = t ? parseInt(t, 10) : NaN;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (Number.isFinite(n)) setTimestamp(n);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    fetch(`/api/episodes/${slug}/viewer`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.authenticated) setViewer(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, slug]);

  return (
    <ViewerContext.Provider value={{ isAuthenticated, viewer, timestamp }}>
      {children}
    </ViewerContext.Provider>
  );
}

const useViewer = () => useContext(ViewerContext);
const viewerKey = (viewer: ViewerData | null) => (viewer ? `u:${viewer.userId}` : "anon");

export function ViewerReactionBar({ slug, initialCounts }: { slug: string; initialCounts: ReactionCounts }) {
  const { isAuthenticated, viewer } = useViewer();
  return (
    <ReactionBar
      key={viewerKey(viewer)}
      slug={slug}
      initialCounts={viewer?.reactions ?? initialCounts}
      isAuthenticated={isAuthenticated}
    />
  );
}

export function ViewerFavoriteButton({ slug, initialCount }: { slug: string; initialCount: number }) {
  const { isAuthenticated, viewer } = useViewer();
  return (
    <FavoriteButton
      key={viewerKey(viewer)}
      slug={slug}
      initialFavorited={viewer?.favorited ?? false}
      initialCount={viewer?.favoriteCount ?? initialCount}
      isAuthenticated={isAuthenticated}
    />
  );
}

/**
 * `teaser` carries only the item counts (empty strings in place of content),
 * which is all the locked view shows. Members get the real data from /viewer.
 */
export function ViewerWhatYouMissed({
  slug,
  teaser,
}: {
  slug: string;
  teaser: ComponentProps<typeof WhatYouMissed>["decodeData"];
}) {
  const { isAuthenticated, viewer } = useViewer();
  const unlocked = !!viewer?.isMember && !!viewer.decodeData;
  return (
    <WhatYouMissed
      key={viewerKey(viewer)}
      decodeData={unlocked ? viewer!.decodeData : teaser}
      isUnlocked={unlocked}
      isAuthenticated={isAuthenticated}
      episodeSlug={slug}
    />
  );
}

export function ViewerDecodePanel() {
  const { isAuthenticated, viewer } = useViewer();
  return (
    <DecodeModePanel
      decodeData={viewer?.decodeData ?? null}
      isUnlocked={!!viewer?.isMember}
      isAuthenticated={isAuthenticated}
    />
  );
}

export function ViewerTranscript(
  props: Omit<ComponentProps<typeof TranscriptViewer>, "signalMap" | "initialTimestamp">
) {
  const { viewer, timestamp } = useViewer();
  return (
    <TranscriptViewer
      {...props}
      signalMap={viewer?.signalMap ?? undefined}
      initialTimestamp={timestamp}
    />
  );
}

export function ViewerComments(
  props: Omit<ComponentProps<typeof CommentSection>, "isAuthenticated" | "currentUserId">
) {
  const { isAuthenticated, viewer } = useViewer();
  return (
    <CommentSection
      key={`${isAuthenticated}:${viewerKey(viewer)}`}
      {...props}
      isAuthenticated={isAuthenticated}
      currentUserId={viewer?.userId}
    />
  );
}

export function ViewerYouTubeEmbed(props: Omit<ComponentProps<typeof YouTubeEmbed>, "startSeconds">) {
  const { timestamp } = useViewer();
  return <YouTubeEmbed {...props} startSeconds={timestamp} />;
}

export function ViewerRumbleEmbed({ embedId, title }: { embedId: string; title: string }) {
  const { timestamp } = useViewer();
  return (
    <iframe
      src={rumbleEmbedUrl(embedId, timestamp)}
      title={title}
      allowFullScreen
      className="absolute inset-0 h-full w-full"
    />
  );
}

/** Upgrade prompts: hidden once the viewer is known to be a member. */
export function HideForMembers({ children }: { children: ReactNode }) {
  const { viewer } = useViewer();
  return viewer?.isMember ? null : <>{children}</>;
}

/** Tab bar whose lock badges drop away for members. */
export function ViewerTabLayout(props: ComponentProps<typeof EpisodeTabLayout>) {
  const { viewer } = useViewer();
  const tabs = viewer?.isMember ? props.tabs.map((t) => ({ ...t, locked: false })) : props.tabs;
  return <EpisodeTabLayout {...props} tabs={tabs} />;
}
