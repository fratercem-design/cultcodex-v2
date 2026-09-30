-- Baseline: the production schema as of 2026-09-30 (every migration through
-- 20260925010000_rumble_embed_id). Generated with pg_dump --schema-only from
-- prisma/production-schema.sql plus the four migrations after it. See
-- prisma/migrations/README.md. Earlier migrations are in git history.

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;

--
-- PostgreSQL database dump
--



--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--


--
-- Name: CanonStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."CanonStatus" AS ENUM (
    'canonical',
    'speculative',
    'community_myth',
    'disputed',
    'humorous'
);


--
-- Name: CardType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."CardType" AS ENUM (
    'VOICE',
    'TRANSMISSION',
    'LORE',
    'SIGNAL',
    'ORACLE',
    'CIPHER',
    'RELIC',
    'ENTITY',
    'PROPHECY',
    'MEMBER',
    'GLITCH',
    'MAHAVIDYA',
    'AVATAR',
    'INCIDENT',
    'QUOTE',
    'EPISODE',
    'DEITY',
    'LOCATION',
    'RITUAL',
    'SYMBOL',
    'EVENT'
);


--
-- Name: ClaimNature; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ClaimNature" AS ENUM (
    'documented',
    'opinion',
    'satire',
    'rumor',
    'disputed'
);


--
-- Name: CodexUserRole; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."CodexUserRole" AS ENUM (
    'user',
    'moderator',
    'admin'
);


--
-- Name: ConfidenceLevel; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ConfidenceLevel" AS ENUM (
    'confirmed',
    'strong',
    'moderate',
    'weak',
    'rumor'
);


--
-- Name: ContentStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ContentStatus" AS ENUM (
    'draft',
    'published',
    'archived',
    'unavailable'
);


--
-- Name: ContentType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ContentType" AS ENUM (
    'livestream',
    'original',
    'short',
    'clip'
);


--
-- Name: EvidenceSourceType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EvidenceSourceType" AS ENUM (
    'youtube_video',
    'livestream_transcript',
    'chat_log',
    'video_description',
    'comment',
    'screenshot',
    'community_submission',
    'archived_social_media',
    'other'
);


--
-- Name: MediaType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."MediaType" AS ENUM (
    'video',
    'audio',
    'article'
);


--
-- Name: OracleChunkSource; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."OracleChunkSource" AS ENUM (
    'transcript',
    'episode_summary',
    'quote',
    'lore',
    'topic',
    'person',
    'psy_chapter',
    'psy_thread',
    'psy_entity'
);


--
-- Name: PersonType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PersonType" AS ENUM (
    'guest',
    'host',
    'mentioned',
    'recurring'
);


--
-- Name: Rarity; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Rarity" AS ENUM (
    'STATIC',
    'SIGNAL',
    'TRANSMISSION',
    'ANOMALY',
    'ORACLE',
    'LEGENDARY',
    'MYTHIC',
    'FORBIDDEN'
);


--
-- Name: ReactionType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ReactionType" AS ENUM (
    'fire',
    'eye',
    'moon',
    'skull',
    'wildcard'
);


--
-- Name: RelationType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."RelationType" AS ENUM (
    'friend',
    'former_friend',
    'ally',
    'frequent_collaborator',
    'debate_rival',
    'enemy',
    'occasional_guest',
    'moderator',
    'supporter',
    'critic',
    'student',
    'mentor',
    'community_member',
    'unknown'
);


--
-- Name: SearchKind; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."SearchKind" AS ENUM (
    'simple',
    'deep',
    'oracle'
);


--
-- Name: SeriesType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."SeriesType" AS ENUM (
    'music_video',
    'panel',
    'tarot',
    'story',
    'documentary',
    'other'
);


--
-- Name: Annotation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Annotation" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "targetType" text NOT NULL,
    "targetId" text NOT NULL,
    body text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    votes integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ArchetypeEvent; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ArchetypeEvent" (
    id text NOT NULL,
    "entityId" text NOT NULL,
    "chapterId" text,
    "chapterNumber" integer NOT NULL,
    "primaryArchetype" text NOT NULL,
    "secondaryArchetypes" text[] NOT NULL,
    "confidenceScore" double precision DEFAULT 1.0 NOT NULL,
    "triggerEvent" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: BookEdition; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."BookEdition" (
    id text NOT NULL,
    sku text NOT NULL,
    title text NOT NULL,
    "mimeType" text DEFAULT 'application/pdf'::text NOT NULL,
    data bytea NOT NULL,
    "pageCount" integer DEFAULT 0 NOT NULL,
    "chapterFrom" integer DEFAULT 0 NOT NULL,
    "chapterTo" integer DEFAULT 0 NOT NULL,
    "generatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: BookPurchase; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."BookPurchase" (
    id text NOT NULL,
    "userId" text NOT NULL,
    sku text NOT NULL,
    "stripeSessionId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Card; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Card" (
    id text NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    subtitle text,
    "cardType" public."CardType" NOT NULL,
    rarity public."Rarity" NOT NULL,
    "entitySlug" text,
    "entityType" text,
    "imageUrl" text,
    "foilImageUrl" text,
    "statA" integer DEFAULT 50 NOT NULL,
    "statB" integer DEFAULT 50 NOT NULL,
    "statC" integer DEFAULT 50 NOT NULL,
    "statLabelA" text,
    "statLabelB" text,
    "statLabelC" text,
    "flavorText" text,
    abilities text[] DEFAULT ARRAY[]::text[],
    "isActive" boolean DEFAULT true NOT NULL,
    "weightStatic" double precision DEFAULT 40 NOT NULL,
    "weightSignal" double precision DEFAULT 30 NOT NULL,
    "weightTransmission" double precision DEFAULT 20 NOT NULL,
    "weightAnomaly" double precision DEFAULT 8 NOT NULL,
    "weightOracle" double precision DEFAULT 2 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "artUrl" text,
    "flavourText" text,
    "totalMinted" integer DEFAULT 0 NOT NULL,
    "maxSupply" integer,
    personality text,
    advice text,
    archetype text,
    "divinationEligible" boolean DEFAULT false NOT NULL,
    "divinationKeywords" text[] DEFAULT ARRAY[]::text[],
    "divinationStrength" integer DEFAULT 50 NOT NULL,
    element text,
    "meaningVersion" integer DEFAULT 1 NOT NULL,
    mythology text,
    "oracleCategories" text[] DEFAULT ARRAY[]::text[],
    "oraclePrompt" text,
    planet text,
    "reversedMeaning" text,
    "shadowAspect" text,
    "sourceRefId" text,
    "sourceType" text,
    "uprightMeaning" text,
    season integer DEFAULT 0 NOT NULL,
    "collectorNo" integer,
    "obtainMethod" text DEFAULT 'pack'::text NOT NULL
);


--
-- Name: CardGift; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CardGift" (
    id text NOT NULL,
    token text NOT NULL,
    "cardId" text NOT NULL,
    serial integer NOT NULL,
    edition text DEFAULT 'founders'::text NOT NULL,
    note text,
    claimed boolean DEFAULT false NOT NULL,
    "claimedAt" timestamp(3) without time zone,
    "claimedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: CardInstance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CardInstance" (
    id text NOT NULL,
    "cardId" text NOT NULL,
    "ownerId" text NOT NULL,
    "firstOwnerId" text,
    "serialNumber" integer,
    "isFoil" boolean DEFAULT false NOT NULL,
    "evolutionStage" integer DEFAULT 0 NOT NULL,
    source text DEFAULT 'pack'::text NOT NULL,
    method text,
    "evolvedFromId" text,
    "obtainedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: CardPack; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CardPack" (
    id text NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    description text,
    "imageUrl" text,
    price integer DEFAULT 0 NOT NULL,
    "cardCount" integer DEFAULT 5 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "isAvailable" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    cost integer DEFAULT 100 NOT NULL,
    "weightStatic" double precision DEFAULT 50 NOT NULL,
    "weightSignal" double precision DEFAULT 30 NOT NULL,
    "weightTransmission" double precision DEFAULT 14 NOT NULL,
    "weightAnomaly" double precision DEFAULT 5 NOT NULL,
    "weightOracle" double precision DEFAULT 1 NOT NULL,
    "weightLegendary" double precision DEFAULT 0.5 NOT NULL,
    "weightMythic" double precision DEFAULT 0.1 NOT NULL,
    "weightForbidden" double precision DEFAULT 0.0 NOT NULL,
    "artTheme" text,
    season integer DEFAULT 0 NOT NULL,
    "guaranteeRarity" public."Rarity"
);


--
-- Name: CardSet; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CardSet" (
    id text NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    description text,
    "setType" text DEFAULT 'tarot'::text NOT NULL,
    mythology text,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "rewardCredits" integer DEFAULT 0 NOT NULL,
    "rewardTitle" text,
    "rewardFoilCardId" text,
    "unlocksSpread" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: CardSetMember; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CardSetMember" (
    id text NOT NULL,
    "setId" text NOT NULL,
    "cardId" text NOT NULL
);


--
-- Name: ChatMessage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ChatMessage" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "displayName" text NOT NULL,
    "avatarUrl" text,
    content text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    flagged boolean DEFAULT false NOT NULL,
    "moderationReason" text
);


--
-- Name: ClapHolder; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ClapHolder" (
    id text NOT NULL,
    nickname text NOT NULL,
    tokens integer DEFAULT 0 NOT NULL,
    hidden boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ClapToken; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ClapToken" (
    id text NOT NULL,
    "holderId" text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    source text NOT NULL,
    "amountCents" integer,
    "couponCode" text,
    "stripeSessionId" text,
    note text,
    "spotlightUntil" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: CodexAccount; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CodexAccount" (
    id text NOT NULL,
    "userId" text NOT NULL,
    type text NOT NULL,
    provider text NOT NULL,
    "providerAccountId" text NOT NULL,
    access_token text,
    refresh_token text,
    expires_at integer,
    token_type text,
    scope text,
    id_token text
);


--
-- Name: CodexComment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CodexComment" (
    id text NOT NULL,
    content text NOT NULL,
    "userId" text NOT NULL,
    "episodeId" text NOT NULL,
    "parentId" text,
    flagged boolean DEFAULT false NOT NULL,
    "flaggedReason" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: CodexSession; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CodexSession" (
    id text NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


--
-- Name: CodexUser; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CodexUser" (
    id text NOT NULL,
    email text NOT NULL,
    "displayName" text NOT NULL,
    "avatarUrl" text,
    provider text NOT NULL,
    role public."CodexUserRole" DEFAULT 'user'::public."CodexUserRole" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "currentPeriodEnd" timestamp(3) without time zone,
    "stripeCustomerId" text,
    "subscriptionId" text,
    "subscriptionStatus" text,
    "isPublicMember" boolean DEFAULT false NOT NULL,
    "memberTitle" text,
    "subscriptionTier" text,
    bio text,
    "codexSlug" text,
    "codexPagePublic" boolean DEFAULT true NOT NULL,
    handle text,
    "sigilGlyph" text,
    "onboardingCompleted" boolean DEFAULT false NOT NULL,
    "codexBanner" text,
    "codexLinks" jsonb,
    "codexShowCards" boolean DEFAULT false NOT NULL,
    "isLifetimeMember" boolean DEFAULT false NOT NULL,
    "userArchetype" text
);


--
-- Name: CommentReport; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CommentReport" (
    id text NOT NULL,
    "commentId" text NOT NULL,
    "userId" text NOT NULL,
    reason text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: CommunityPost; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CommunityPost" (
    id text NOT NULL,
    "youtubePostId" text NOT NULL,
    text text NOT NULL,
    "imageUrls" text[] NOT NULL,
    "likeCount" integer,
    "commentCount" integer,
    "publishedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: CreditTransaction; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CreditTransaction" (
    id text NOT NULL,
    "walletId" text,
    amount integer NOT NULL,
    reason text NOT NULL,
    "referenceId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "userId" text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL
);


--
-- Name: Deck; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Deck" (
    id text NOT NULL,
    "userId" text NOT NULL,
    name text NOT NULL,
    description text,
    "isPublic" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: DeckCard; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."DeckCard" (
    id text NOT NULL,
    "deckId" text NOT NULL,
    "cardId" text NOT NULL
);


--
-- Name: Episode; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Episode" (
    id text NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    "episodeNumber" integer,
    "airDate" timestamp(3) without time zone,
    duration text,
    "youtubeVideoId" text,
    "rumbleVideoId" text,
    "thumbnailUrl" text,
    "summaryShort" text,
    "summaryLong" text,
    "cutOfPsyche" text,
    "transcriptRaw" text,
    "transcriptHtml" text,
    "transcriptJson" jsonb,
    "searchText" text,
    status public."ContentStatus" DEFAULT 'draft'::public."ContentStatus" NOT NULL,
    "contentType" public."ContentType" DEFAULT 'original'::public."ContentType" NOT NULL,
    "seriesId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "decodeData" jsonb,
    "isHumanReviewed" boolean DEFAULT false NOT NULL,
    "humanReviewedAt" timestamp(3) without time zone,
    "summaryFacts" text,
    "summaryThemes" text,
    "enrichmentQueued" boolean DEFAULT false NOT NULL,
    "rumbleEmbedId" text
);


--
-- Name: EpisodeGuest; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."EpisodeGuest" (
    "episodeId" text NOT NULL,
    "personId" text NOT NULL
);


--
-- Name: EpisodeLore; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."EpisodeLore" (
    "episodeId" text NOT NULL,
    "loreEntryId" text NOT NULL
);


--
-- Name: EpisodeMentionedPerson; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."EpisodeMentionedPerson" (
    "episodeId" text NOT NULL,
    "personId" text NOT NULL
);


--
-- Name: EpisodeReaction; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."EpisodeReaction" (
    "userId" text NOT NULL,
    "episodeId" text NOT NULL,
    "reactionType" public."ReactionType" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: EpisodeTopic; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."EpisodeTopic" (
    "episodeId" text NOT NULL,
    "topicId" text NOT NULL
);


--
-- Name: Evidence; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Evidence" (
    id text NOT NULL,
    claim text NOT NULL,
    nature public."ClaimNature" DEFAULT 'documented'::public."ClaimNature" NOT NULL,
    confidence public."ConfidenceLevel" DEFAULT 'moderate'::public."ConfidenceLevel" NOT NULL,
    "sourceType" public."EvidenceSourceType" NOT NULL,
    "sourceUrl" text,
    "episodeId" text,
    "timestampSeconds" integer,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Favorite; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Favorite" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "episodeId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: GameScore; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."GameScore" (
    id text NOT NULL,
    handle text NOT NULL,
    "userId" text,
    score integer NOT NULL,
    correct integer NOT NULL,
    total integer NOT NULL,
    round text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: LiveStatus; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LiveStatus" (
    id text DEFAULT 'singleton'::text NOT NULL,
    "isLive" boolean DEFAULT false NOT NULL,
    "videoId" text,
    title text,
    "startedAt" timestamp(3) without time zone,
    "endedAt" timestamp(3) without time zone,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: LlmBudget; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LlmBudget" (
    bucket_day text NOT NULL,
    count integer DEFAULT 0 NOT NULL
);


--
-- Name: LoreEntry; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LoreEntry" (
    id text NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    category text,
    summary text,
    "fullEntry" text,
    "canonStatus" public."CanonStatus" DEFAULT 'speculative'::public."CanonStatus" NOT NULL,
    "searchText" text,
    "firstMentionEpisodeId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: LoreTopic; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LoreTopic" (
    "loreEntryId" text NOT NULL,
    "topicId" text NOT NULL
);


--
-- Name: MediaItem; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."MediaItem" (
    id text NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    type public."MediaType" DEFAULT 'video'::public."MediaType" NOT NULL,
    "youtubeVideoId" text,
    "transcriptRaw" text,
    summary text,
    "seriesId" text,
    "releaseDate" timestamp(3) without time zone,
    "durationSeconds" integer,
    status public."ContentStatus" DEFAULT 'draft'::public."ContentStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: NotificationPreference; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."NotificationPreference" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "emailNewEpisode" boolean DEFAULT false NOT NULL,
    "emailGoLive" boolean DEFAULT false NOT NULL,
    "pushGoLive" boolean DEFAULT false NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: OracleAffinity; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."OracleAffinity" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "dominantElement" text,
    "dominantPlanet" text,
    "dominantArchetype" text,
    "mostDrawnSuit" text,
    "shadowPattern" text,
    "recurringCards" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "readingsCount" integer DEFAULT 0 NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: OracleChunk; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."OracleChunk" (
    id text NOT NULL,
    "sourceType" public."OracleChunkSource" NOT NULL,
    "sourceId" text NOT NULL,
    content text NOT NULL,
    "searchText" text NOT NULL,
    embedding public.vector(1024) NOT NULL,
    metadata jsonb NOT NULL,
    "contentHash" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: OracleInvite; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."OracleInvite" (
    id text NOT NULL,
    token text NOT NULL,
    "recipientName" text NOT NULL,
    "recipientEmail" text,
    "personalNote" text,
    claimed boolean DEFAULT false NOT NULL,
    "claimedAt" timestamp(3) without time zone,
    "claimedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: OwnedCard; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."OwnedCard" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "cardId" text NOT NULL,
    "isFoil" boolean DEFAULT false NOT NULL,
    "isNew" boolean DEFAULT true NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    "obtainedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "obtainedVia" text DEFAULT 'pack'::text NOT NULL,
    "evolutionStage" integer DEFAULT 0 NOT NULL,
    "evolvedFromCardId" text,
    "firstOwnerId" text,
    method text,
    "serialNumber" integer,
    source text DEFAULT 'pack'::text NOT NULL
);


--
-- Name: PackCard; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PackCard" (
    id text NOT NULL,
    "packId" text NOT NULL,
    "cardId" text NOT NULL,
    weight double precision DEFAULT 1.0 NOT NULL
);


--
-- Name: PackPurchase; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PackPurchase" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "packId" text NOT NULL,
    "creditsSpent" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "cardsDrawn" text[] DEFAULT ARRAY[]::text[] NOT NULL,
    "creditsCost" integer DEFAULT 0 NOT NULL
);


--
-- Name: Person; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Person" (
    id text NOT NULL,
    "displayName" text NOT NULL,
    slug text NOT NULL,
    "altNames" text[],
    "shortBio" text,
    "loreSummary" text,
    "avatarUrl" text,
    "personType" public."PersonType" DEFAULT 'guest'::public."PersonType" NOT NULL,
    "searchText" text,
    "firstAppearanceEpisodeId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "youtubeChannelUrl" text
);


--
-- Name: PersonLore; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PersonLore" (
    "personId" text NOT NULL,
    "loreEntryId" text NOT NULL
);


--
-- Name: PersonMedia; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PersonMedia" (
    id text NOT NULL,
    "personSlug" text NOT NULL,
    source text NOT NULL,
    "sourceId" text,
    "sourceUrl" text NOT NULL,
    title text NOT NULL,
    description text,
    "thumbnailUrl" text,
    "publishedAt" timestamp(3) without time zone,
    "durationStr" text,
    "viewCount" integer,
    "rawContent" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "channelHandle" text
);


--
-- Name: PersonTopic; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PersonTopic" (
    "personId" text NOT NULL,
    "topicId" text NOT NULL
);


--
-- Name: PsychenomiconArtAsset; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PsychenomiconArtAsset" (
    id text NOT NULL,
    "chapterSlug" text NOT NULL,
    slot text NOT NULL,
    "mimeType" text DEFAULT 'image/jpeg'::text NOT NULL,
    data bytea NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: PsychenomiconChapter; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PsychenomiconChapter" (
    id text NOT NULL,
    "chapterNumber" integer NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    "episodeId" text,
    "canonText" text NOT NULL,
    "interpretationText" text NOT NULL,
    "mythicText" text NOT NULL,
    "emergingSignals" text[] NOT NULL,
    "archetypesData" jsonb,
    "threadRefs" jsonb,
    "isMajorEvent" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    status text DEFAULT 'stable'::text NOT NULL,
    "artImageUrls" jsonb,
    "artGeneratedAt" timestamp(3) without time zone
);


--
-- Name: PsychenomiconEntity; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PsychenomiconEntity" (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    "personSlug" text,
    "primaryArchetype" text,
    "archetypeHistory" jsonb,
    "radarData" jsonb,
    "behaviorPatterns" text[] NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "archetypeState" jsonb
);


--
-- Name: PsychenomiconEntityAppearance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PsychenomiconEntityAppearance" (
    id text NOT NULL,
    "chapterId" text NOT NULL,
    "entityId" text NOT NULL,
    "archetypeAt" text,
    significance text
);


--
-- Name: PsychenomiconThread; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PsychenomiconThread" (
    id text NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    description text,
    status text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: PsychenomiconThreadChapter; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PsychenomiconThreadChapter" (
    "chapterId" text NOT NULL,
    "threadId" text NOT NULL
);


--
-- Name: Quote; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Quote" (
    id text NOT NULL,
    text text NOT NULL,
    "speakerPersonId" text,
    "episodeId" text,
    "transcriptSegmentId" text,
    "timestampSeconds" integer,
    context text,
    significance text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: QuoteReaction; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."QuoteReaction" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "quoteId" text NOT NULL,
    "reactionType" public."ReactionType" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: RateLimitBucket; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."RateLimitBucket" (
    key text NOT NULL,
    count integer DEFAULT 0 NOT NULL,
    "resetAt" timestamp(3) without time zone NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Reading; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Reading" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "spreadId" text,
    question text,
    seed text NOT NULL,
    reflection text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ReadingCard; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ReadingCard" (
    id text NOT NULL,
    "readingId" text NOT NULL,
    "cardId" text NOT NULL,
    "position" integer NOT NULL,
    "positionName" text,
    orientation text NOT NULL,
    borrowed boolean DEFAULT false NOT NULL,
    "drawnMeaningVersion" integer NOT NULL,
    "titleSnapshot" text,
    "uprightMeaning" text,
    "reversedMeaning" text,
    advice text,
    "oraclePrompt" text,
    keywords text[] DEFAULT ARRAY[]::text[],
    element text,
    archetype text
);


--
-- Name: RelatedEpisode; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."RelatedEpisode" (
    "episodeAId" text NOT NULL,
    "episodeBId" text NOT NULL
);


--
-- Name: RelatedLore; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."RelatedLore" (
    "loreAId" text NOT NULL,
    "loreBId" text NOT NULL
);


--
-- Name: RelatedPerson; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."RelatedPerson" (
    "personAId" text NOT NULL,
    "personBId" text NOT NULL
);


--
-- Name: RelationshipEvent; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."RelationshipEvent" (
    id text NOT NULL,
    "personAId" text NOT NULL,
    "personBId" text NOT NULL,
    "relationType" public."RelationType" DEFAULT 'unknown'::public."RelationType" NOT NULL,
    headline text NOT NULL,
    details text,
    "episodeId" text,
    "occurredAt" timestamp(3) without time zone,
    "evidenceId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: SalonPost; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SalonPost" (
    id text NOT NULL,
    "threadId" text NOT NULL,
    "userId" text NOT NULL,
    content text NOT NULL,
    flagged boolean DEFAULT false NOT NULL,
    "flaggedReason" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: SalonThread; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SalonThread" (
    id text NOT NULL,
    title text NOT NULL,
    prompt text NOT NULL,
    pinned boolean DEFAULT false NOT NULL,
    closed boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: SavedQuote; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SavedQuote" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "quoteId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: SavedSearch; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SavedSearch" (
    id text NOT NULL,
    "userId" text NOT NULL,
    label text NOT NULL,
    kind public."SearchKind" NOT NULL,
    query text DEFAULT ''::text NOT NULL,
    concepts text[],
    thresholds double precision[],
    "eraId" text,
    "personSlug" text,
    archetype text,
    pinned boolean DEFAULT false NOT NULL,
    "lastRunAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: SavedTopic; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SavedTopic" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "topicId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: SeasonalEvent; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SeasonalEvent" (
    id text NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    description text,
    "startsAt" timestamp(3) without time zone NOT NULL,
    "endsAt" timestamp(3) without time zone NOT NULL,
    "rewardCardId" text,
    badge text,
    "collectGoal" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Series; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Series" (
    id text NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    description text,
    type public."SeriesType" DEFAULT 'other'::public."SeriesType" NOT NULL,
    "coverImageUrl" text,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    status public."ContentStatus" DEFAULT 'draft'::public."ContentStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: SignalProposal; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SignalProposal" (
    id text NOT NULL,
    "userId" text NOT NULL,
    question text NOT NULL,
    context text,
    status text DEFAULT 'open'::text NOT NULL,
    votes integer DEFAULT 1 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: SignalProposalVote; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SignalProposalVote" (
    "proposalId" text NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Spread; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Spread" (
    id text NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    description text,
    "cardCount" integer DEFAULT 1 NOT NULL,
    "signalCost" integer DEFAULT 1 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: SpreadPosition; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SpreadPosition" (
    id text NOT NULL,
    "spreadId" text NOT NULL,
    index integer NOT NULL,
    name text NOT NULL,
    meaning text
);


--
-- Name: StripeWebhookEvent; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."StripeWebhookEvent" (
    id text NOT NULL,
    type text NOT NULL,
    "processedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Subscriber; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Subscriber" (
    id text NOT NULL,
    email text,
    "pushSubscription" jsonb,
    verified boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    name text,
    source text,
    "giftStage" integer DEFAULT 0 NOT NULL,
    "lastEmailAt" timestamp(3) without time zone
);


--
-- Name: TimelineEvent; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TimelineEvent" (
    id text NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    category text,
    description text,
    "episodeId" text,
    "evidenceId" text,
    status public."ContentStatus" DEFAULT 'published'::public."ContentStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Topic; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Topic" (
    id text NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: TranscriptRequest; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TranscriptRequest" (
    id text NOT NULL,
    "episodeId" text NOT NULL,
    email text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "notifiedAt" timestamp(3) without time zone
);


--
-- Name: TranscriptSegment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TranscriptSegment" (
    id text NOT NULL,
    "episodeId" text NOT NULL,
    "startSeconds" integer NOT NULL,
    "endSeconds" integer NOT NULL,
    "speakerLabel" text,
    text text NOT NULL,
    "searchText" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: UserSetCompletion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."UserSetCompletion" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "setId" text NOT NULL,
    "completedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "rewardClaimed" boolean DEFAULT false NOT NULL
);


--
-- Name: UserWallet; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."UserWallet" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "signalCredits" integer DEFAULT 0 NOT NULL,
    balance integer DEFAULT 0 NOT NULL,
    "lastDailyClaimAt" timestamp(3) without time zone,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "totalEarned" integer DEFAULT 0 NOT NULL,
    "totalSpent" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "drawStreak" integer DEFAULT 0 NOT NULL,
    "lastDrawAt" timestamp(3) without time zone,
    level integer DEFAULT 1 NOT NULL,
    "longestStreak" integer DEFAULT 0 NOT NULL,
    signal integer DEFAULT 0 NOT NULL,
    "signalResetAt" timestamp(3) without time zone,
    xp integer DEFAULT 0 NOT NULL,
    "dailyStreak" integer DEFAULT 0 NOT NULL,
    "initiationClaimedAt" timestamp(3) without time zone
);


--
-- Name: VerificationToken; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."VerificationToken" (
    identifier text NOT NULL,
    token text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


--
-- Name: WeeklyDigest; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."WeeklyDigest" (
    id text NOT NULL,
    "weekOf" timestamp(3) without time zone NOT NULL,
    title text NOT NULL,
    blurb text,
    published boolean DEFAULT false NOT NULL,
    "quoteIds" text[] DEFAULT ARRAY[]::text[],
    "episodeIds" text[] DEFAULT ARRAY[]::text[],
    "personIds" text[] DEFAULT ARRAY[]::text[],
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Annotation Annotation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Annotation"
    ADD CONSTRAINT "Annotation_pkey" PRIMARY KEY (id);


--
-- Name: ArchetypeEvent ArchetypeEvent_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ArchetypeEvent"
    ADD CONSTRAINT "ArchetypeEvent_pkey" PRIMARY KEY (id);


--
-- Name: BookEdition BookEdition_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BookEdition"
    ADD CONSTRAINT "BookEdition_pkey" PRIMARY KEY (id);


--
-- Name: BookPurchase BookPurchase_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BookPurchase"
    ADD CONSTRAINT "BookPurchase_pkey" PRIMARY KEY (id);


--
-- Name: CardGift CardGift_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CardGift"
    ADD CONSTRAINT "CardGift_pkey" PRIMARY KEY (id);


--
-- Name: CardInstance CardInstance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CardInstance"
    ADD CONSTRAINT "CardInstance_pkey" PRIMARY KEY (id);


--
-- Name: CardPack CardPack_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CardPack"
    ADD CONSTRAINT "CardPack_pkey" PRIMARY KEY (id);


--
-- Name: CardSetMember CardSetMember_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CardSetMember"
    ADD CONSTRAINT "CardSetMember_pkey" PRIMARY KEY (id);


--
-- Name: CardSet CardSet_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CardSet"
    ADD CONSTRAINT "CardSet_pkey" PRIMARY KEY (id);


--
-- Name: Card Card_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Card"
    ADD CONSTRAINT "Card_pkey" PRIMARY KEY (id);


--
-- Name: ChatMessage ChatMessage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChatMessage"
    ADD CONSTRAINT "ChatMessage_pkey" PRIMARY KEY (id);


--
-- Name: ClapHolder ClapHolder_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ClapHolder"
    ADD CONSTRAINT "ClapHolder_pkey" PRIMARY KEY (id);


--
-- Name: ClapToken ClapToken_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ClapToken"
    ADD CONSTRAINT "ClapToken_pkey" PRIMARY KEY (id);


--
-- Name: CodexAccount CodexAccount_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CodexAccount"
    ADD CONSTRAINT "CodexAccount_pkey" PRIMARY KEY (id);


--
-- Name: CodexComment CodexComment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CodexComment"
    ADD CONSTRAINT "CodexComment_pkey" PRIMARY KEY (id);


--
-- Name: CodexSession CodexSession_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CodexSession"
    ADD CONSTRAINT "CodexSession_pkey" PRIMARY KEY (id);


--
-- Name: CodexUser CodexUser_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CodexUser"
    ADD CONSTRAINT "CodexUser_pkey" PRIMARY KEY (id);


--
-- Name: CommentReport CommentReport_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CommentReport"
    ADD CONSTRAINT "CommentReport_pkey" PRIMARY KEY (id);


--
-- Name: CommunityPost CommunityPost_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CommunityPost"
    ADD CONSTRAINT "CommunityPost_pkey" PRIMARY KEY (id);


--
-- Name: CreditTransaction CreditTransaction_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CreditTransaction"
    ADD CONSTRAINT "CreditTransaction_pkey" PRIMARY KEY (id);


--
-- Name: DeckCard DeckCard_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DeckCard"
    ADD CONSTRAINT "DeckCard_pkey" PRIMARY KEY (id);


--
-- Name: Deck Deck_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Deck"
    ADD CONSTRAINT "Deck_pkey" PRIMARY KEY (id);


--
-- Name: EpisodeGuest EpisodeGuest_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EpisodeGuest"
    ADD CONSTRAINT "EpisodeGuest_pkey" PRIMARY KEY ("episodeId", "personId");


--
-- Name: EpisodeLore EpisodeLore_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EpisodeLore"
    ADD CONSTRAINT "EpisodeLore_pkey" PRIMARY KEY ("episodeId", "loreEntryId");


--
-- Name: EpisodeMentionedPerson EpisodeMentionedPerson_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EpisodeMentionedPerson"
    ADD CONSTRAINT "EpisodeMentionedPerson_pkey" PRIMARY KEY ("episodeId", "personId");


--
-- Name: EpisodeReaction EpisodeReaction_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EpisodeReaction"
    ADD CONSTRAINT "EpisodeReaction_pkey" PRIMARY KEY ("userId", "episodeId", "reactionType");


--
-- Name: EpisodeTopic EpisodeTopic_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EpisodeTopic"
    ADD CONSTRAINT "EpisodeTopic_pkey" PRIMARY KEY ("episodeId", "topicId");


--
-- Name: Episode Episode_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Episode"
    ADD CONSTRAINT "Episode_pkey" PRIMARY KEY (id);


--
-- Name: Evidence Evidence_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Evidence"
    ADD CONSTRAINT "Evidence_pkey" PRIMARY KEY (id);


--
-- Name: Favorite Favorite_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Favorite"
    ADD CONSTRAINT "Favorite_pkey" PRIMARY KEY (id);


--
-- Name: GameScore GameScore_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GameScore"
    ADD CONSTRAINT "GameScore_pkey" PRIMARY KEY (id);


--
-- Name: LiveStatus LiveStatus_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LiveStatus"
    ADD CONSTRAINT "LiveStatus_pkey" PRIMARY KEY (id);


--
-- Name: LlmBudget LlmBudget_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LlmBudget"
    ADD CONSTRAINT "LlmBudget_pkey" PRIMARY KEY (bucket_day);


--
-- Name: LoreEntry LoreEntry_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LoreEntry"
    ADD CONSTRAINT "LoreEntry_pkey" PRIMARY KEY (id);


--
-- Name: LoreTopic LoreTopic_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LoreTopic"
    ADD CONSTRAINT "LoreTopic_pkey" PRIMARY KEY ("loreEntryId", "topicId");


--
-- Name: MediaItem MediaItem_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MediaItem"
    ADD CONSTRAINT "MediaItem_pkey" PRIMARY KEY (id);


--
-- Name: NotificationPreference NotificationPreference_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."NotificationPreference"
    ADD CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY (id);


--
-- Name: OracleAffinity OracleAffinity_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OracleAffinity"
    ADD CONSTRAINT "OracleAffinity_pkey" PRIMARY KEY (id);


--
-- Name: OracleChunk OracleChunk_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OracleChunk"
    ADD CONSTRAINT "OracleChunk_pkey" PRIMARY KEY (id);


--
-- Name: OracleInvite OracleInvite_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OracleInvite"
    ADD CONSTRAINT "OracleInvite_pkey" PRIMARY KEY (id);


--
-- Name: OwnedCard OwnedCard_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OwnedCard"
    ADD CONSTRAINT "OwnedCard_pkey" PRIMARY KEY (id);


--
-- Name: PackCard PackCard_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PackCard"
    ADD CONSTRAINT "PackCard_pkey" PRIMARY KEY (id);


--
-- Name: PackPurchase PackPurchase_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PackPurchase"
    ADD CONSTRAINT "PackPurchase_pkey" PRIMARY KEY (id);


--
-- Name: PersonLore PersonLore_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PersonLore"
    ADD CONSTRAINT "PersonLore_pkey" PRIMARY KEY ("personId", "loreEntryId");


--
-- Name: PersonMedia PersonMedia_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PersonMedia"
    ADD CONSTRAINT "PersonMedia_pkey" PRIMARY KEY (id);


--
-- Name: PersonTopic PersonTopic_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PersonTopic"
    ADD CONSTRAINT "PersonTopic_pkey" PRIMARY KEY ("personId", "topicId");


--
-- Name: Person Person_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Person"
    ADD CONSTRAINT "Person_pkey" PRIMARY KEY (id);


--
-- Name: PsychenomiconArtAsset PsychenomiconArtAsset_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PsychenomiconArtAsset"
    ADD CONSTRAINT "PsychenomiconArtAsset_pkey" PRIMARY KEY (id);


--
-- Name: PsychenomiconChapter PsychenomiconChapter_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PsychenomiconChapter"
    ADD CONSTRAINT "PsychenomiconChapter_pkey" PRIMARY KEY (id);


--
-- Name: PsychenomiconEntityAppearance PsychenomiconEntityAppearance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PsychenomiconEntityAppearance"
    ADD CONSTRAINT "PsychenomiconEntityAppearance_pkey" PRIMARY KEY (id);


--
-- Name: PsychenomiconEntity PsychenomiconEntity_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PsychenomiconEntity"
    ADD CONSTRAINT "PsychenomiconEntity_pkey" PRIMARY KEY (id);


--
-- Name: PsychenomiconThreadChapter PsychenomiconThreadChapter_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PsychenomiconThreadChapter"
    ADD CONSTRAINT "PsychenomiconThreadChapter_pkey" PRIMARY KEY ("chapterId", "threadId");


--
-- Name: PsychenomiconThread PsychenomiconThread_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PsychenomiconThread"
    ADD CONSTRAINT "PsychenomiconThread_pkey" PRIMARY KEY (id);


--
-- Name: QuoteReaction QuoteReaction_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QuoteReaction"
    ADD CONSTRAINT "QuoteReaction_pkey" PRIMARY KEY (id);


--
-- Name: Quote Quote_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Quote"
    ADD CONSTRAINT "Quote_pkey" PRIMARY KEY (id);


--
-- Name: RateLimitBucket RateLimitBucket_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RateLimitBucket"
    ADD CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY (key);


--
-- Name: ReadingCard ReadingCard_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ReadingCard"
    ADD CONSTRAINT "ReadingCard_pkey" PRIMARY KEY (id);


--
-- Name: Reading Reading_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Reading"
    ADD CONSTRAINT "Reading_pkey" PRIMARY KEY (id);


--
-- Name: RelatedEpisode RelatedEpisode_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RelatedEpisode"
    ADD CONSTRAINT "RelatedEpisode_pkey" PRIMARY KEY ("episodeAId", "episodeBId");


--
-- Name: RelatedLore RelatedLore_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RelatedLore"
    ADD CONSTRAINT "RelatedLore_pkey" PRIMARY KEY ("loreAId", "loreBId");


--
-- Name: RelatedPerson RelatedPerson_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RelatedPerson"
    ADD CONSTRAINT "RelatedPerson_pkey" PRIMARY KEY ("personAId", "personBId");


--
-- Name: RelationshipEvent RelationshipEvent_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RelationshipEvent"
    ADD CONSTRAINT "RelationshipEvent_pkey" PRIMARY KEY (id);


--
-- Name: SalonPost SalonPost_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SalonPost"
    ADD CONSTRAINT "SalonPost_pkey" PRIMARY KEY (id);


--
-- Name: SalonThread SalonThread_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SalonThread"
    ADD CONSTRAINT "SalonThread_pkey" PRIMARY KEY (id);


--
-- Name: SavedQuote SavedQuote_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SavedQuote"
    ADD CONSTRAINT "SavedQuote_pkey" PRIMARY KEY (id);


--
-- Name: SavedSearch SavedSearch_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SavedSearch"
    ADD CONSTRAINT "SavedSearch_pkey" PRIMARY KEY (id);


--
-- Name: SavedTopic SavedTopic_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SavedTopic"
    ADD CONSTRAINT "SavedTopic_pkey" PRIMARY KEY (id);


--
-- Name: SeasonalEvent SeasonalEvent_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SeasonalEvent"
    ADD CONSTRAINT "SeasonalEvent_pkey" PRIMARY KEY (id);


--
-- Name: Series Series_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Series"
    ADD CONSTRAINT "Series_pkey" PRIMARY KEY (id);


--
-- Name: SignalProposalVote SignalProposalVote_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SignalProposalVote"
    ADD CONSTRAINT "SignalProposalVote_pkey" PRIMARY KEY ("proposalId", "userId");


--
-- Name: SignalProposal SignalProposal_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SignalProposal"
    ADD CONSTRAINT "SignalProposal_pkey" PRIMARY KEY (id);


--
-- Name: SpreadPosition SpreadPosition_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SpreadPosition"
    ADD CONSTRAINT "SpreadPosition_pkey" PRIMARY KEY (id);


--
-- Name: Spread Spread_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Spread"
    ADD CONSTRAINT "Spread_pkey" PRIMARY KEY (id);


--
-- Name: StripeWebhookEvent StripeWebhookEvent_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StripeWebhookEvent"
    ADD CONSTRAINT "StripeWebhookEvent_pkey" PRIMARY KEY (id);


--
-- Name: Subscriber Subscriber_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Subscriber"
    ADD CONSTRAINT "Subscriber_pkey" PRIMARY KEY (id);


--
-- Name: TimelineEvent TimelineEvent_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TimelineEvent"
    ADD CONSTRAINT "TimelineEvent_pkey" PRIMARY KEY (id);


--
-- Name: Topic Topic_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Topic"
    ADD CONSTRAINT "Topic_pkey" PRIMARY KEY (id);


--
-- Name: TranscriptRequest TranscriptRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TranscriptRequest"
    ADD CONSTRAINT "TranscriptRequest_pkey" PRIMARY KEY (id);


--
-- Name: TranscriptSegment TranscriptSegment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TranscriptSegment"
    ADD CONSTRAINT "TranscriptSegment_pkey" PRIMARY KEY (id);


--
-- Name: UserSetCompletion UserSetCompletion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserSetCompletion"
    ADD CONSTRAINT "UserSetCompletion_pkey" PRIMARY KEY (id);


--
-- Name: UserWallet UserWallet_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserWallet"
    ADD CONSTRAINT "UserWallet_pkey" PRIMARY KEY (id);


--
-- Name: WeeklyDigest WeeklyDigest_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WeeklyDigest"
    ADD CONSTRAINT "WeeklyDigest_pkey" PRIMARY KEY (id);


--
-- Name: Annotation_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Annotation_status_idx" ON public."Annotation" USING btree (status);


--
-- Name: Annotation_targetType_targetId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Annotation_targetType_targetId_status_idx" ON public."Annotation" USING btree ("targetType", "targetId", status);


--
-- Name: Annotation_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Annotation_userId_idx" ON public."Annotation" USING btree ("userId");


--
-- Name: ArchetypeEvent_chapterNumber_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ArchetypeEvent_chapterNumber_idx" ON public."ArchetypeEvent" USING btree ("chapterNumber");


--
-- Name: ArchetypeEvent_entityId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ArchetypeEvent_entityId_idx" ON public."ArchetypeEvent" USING btree ("entityId");


--
-- Name: BookEdition_sku_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "BookEdition_sku_key" ON public."BookEdition" USING btree (sku);


--
-- Name: BookPurchase_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "BookPurchase_userId_idx" ON public."BookPurchase" USING btree ("userId");


--
-- Name: BookPurchase_userId_sku_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "BookPurchase_userId_sku_key" ON public."BookPurchase" USING btree ("userId", sku);


--
-- Name: CardGift_cardId_edition_serial_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "CardGift_cardId_edition_serial_key" ON public."CardGift" USING btree ("cardId", edition, serial);


--
-- Name: CardGift_cardId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CardGift_cardId_idx" ON public."CardGift" USING btree ("cardId");


--
-- Name: CardGift_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "CardGift_token_key" ON public."CardGift" USING btree (token);


--
-- Name: CardInstance_cardId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CardInstance_cardId_idx" ON public."CardInstance" USING btree ("cardId");


--
-- Name: CardInstance_ownerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CardInstance_ownerId_idx" ON public."CardInstance" USING btree ("ownerId");


--
-- Name: CardPack_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "CardPack_slug_key" ON public."CardPack" USING btree (slug);


--
-- Name: CardSetMember_cardId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CardSetMember_cardId_idx" ON public."CardSetMember" USING btree ("cardId");


--
-- Name: CardSetMember_setId_cardId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "CardSetMember_setId_cardId_key" ON public."CardSetMember" USING btree ("setId", "cardId");


--
-- Name: CardSetMember_setId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CardSetMember_setId_idx" ON public."CardSetMember" USING btree ("setId");


--
-- Name: CardSet_setType_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CardSet_setType_idx" ON public."CardSet" USING btree ("setType");


--
-- Name: CardSet_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "CardSet_slug_key" ON public."CardSet" USING btree (slug);


--
-- Name: Card_cardType_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Card_cardType_idx" ON public."Card" USING btree ("cardType");


--
-- Name: Card_divinationEligible_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Card_divinationEligible_idx" ON public."Card" USING btree ("divinationEligible");


--
-- Name: Card_entitySlug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Card_entitySlug_idx" ON public."Card" USING btree ("entitySlug");


--
-- Name: Card_isActive_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Card_isActive_idx" ON public."Card" USING btree ("isActive");


--
-- Name: Card_mythology_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Card_mythology_idx" ON public."Card" USING btree (mythology);


--
-- Name: Card_rarity_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Card_rarity_idx" ON public."Card" USING btree (rarity);


--
-- Name: Card_season_obtainMethod_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Card_season_obtainMethod_idx" ON public."Card" USING btree (season, "obtainMethod");


--
-- Name: Card_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Card_slug_key" ON public."Card" USING btree (slug);


--
-- Name: Card_sourceType_sourceRefId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Card_sourceType_sourceRefId_idx" ON public."Card" USING btree ("sourceType", "sourceRefId");


--
-- Name: ChatMessage_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ChatMessage_createdAt_idx" ON public."ChatMessage" USING btree ("createdAt");


--
-- Name: ClapHolder_hidden_tokens_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ClapHolder_hidden_tokens_idx" ON public."ClapHolder" USING btree (hidden, tokens);


--
-- Name: ClapHolder_nickname_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ClapHolder_nickname_key" ON public."ClapHolder" USING btree (nickname);


--
-- Name: ClapHolder_tokens_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ClapHolder_tokens_idx" ON public."ClapHolder" USING btree (tokens);


--
-- Name: ClapToken_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ClapToken_createdAt_idx" ON public."ClapToken" USING btree ("createdAt");


--
-- Name: ClapToken_holderId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ClapToken_holderId_idx" ON public."ClapToken" USING btree ("holderId");


--
-- Name: ClapToken_spotlightUntil_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ClapToken_spotlightUntil_idx" ON public."ClapToken" USING btree ("spotlightUntil");


--
-- Name: ClapToken_stripeSessionId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ClapToken_stripeSessionId_key" ON public."ClapToken" USING btree ("stripeSessionId");


--
-- Name: CodexAccount_provider_providerAccountId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "CodexAccount_provider_providerAccountId_key" ON public."CodexAccount" USING btree (provider, "providerAccountId");


--
-- Name: CodexComment_episodeId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CodexComment_episodeId_idx" ON public."CodexComment" USING btree ("episodeId");


--
-- Name: CodexComment_parentId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CodexComment_parentId_idx" ON public."CodexComment" USING btree ("parentId");


--
-- Name: CodexComment_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CodexComment_userId_idx" ON public."CodexComment" USING btree ("userId");


--
-- Name: CodexSession_sessionToken_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "CodexSession_sessionToken_key" ON public."CodexSession" USING btree ("sessionToken");


--
-- Name: CodexUser_codexSlug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "CodexUser_codexSlug_key" ON public."CodexUser" USING btree ("codexSlug");


--
-- Name: CodexUser_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "CodexUser_email_key" ON public."CodexUser" USING btree (email);


--
-- Name: CodexUser_handle_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "CodexUser_handle_key" ON public."CodexUser" USING btree (handle);


--
-- Name: CodexUser_stripeCustomerId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "CodexUser_stripeCustomerId_key" ON public."CodexUser" USING btree ("stripeCustomerId");


--
-- Name: CodexUser_subscriptionId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "CodexUser_subscriptionId_key" ON public."CodexUser" USING btree ("subscriptionId");


--
-- Name: CommentReport_commentId_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "CommentReport_commentId_userId_key" ON public."CommentReport" USING btree ("commentId", "userId");


--
-- Name: CommunityPost_publishedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CommunityPost_publishedAt_idx" ON public."CommunityPost" USING btree ("publishedAt");


--
-- Name: CommunityPost_youtubePostId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "CommunityPost_youtubePostId_key" ON public."CommunityPost" USING btree ("youtubePostId");


--
-- Name: CreditTransaction_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CreditTransaction_createdAt_idx" ON public."CreditTransaction" USING btree ("createdAt");


--
-- Name: CreditTransaction_purchase_referenceId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "CreditTransaction_purchase_referenceId_key" ON public."CreditTransaction" USING btree ("referenceId") WHERE (reason = 'purchase'::text);


--
-- Name: CreditTransaction_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CreditTransaction_userId_idx" ON public."CreditTransaction" USING btree ("userId");


--
-- Name: CreditTransaction_userId_reason_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CreditTransaction_userId_reason_createdAt_idx" ON public."CreditTransaction" USING btree ("userId", reason, "createdAt");


--
-- Name: CreditTransaction_walletId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CreditTransaction_walletId_idx" ON public."CreditTransaction" USING btree ("walletId");


--
-- Name: DeckCard_deckId_cardId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "DeckCard_deckId_cardId_key" ON public."DeckCard" USING btree ("deckId", "cardId");


--
-- Name: DeckCard_deckId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DeckCard_deckId_idx" ON public."DeckCard" USING btree ("deckId");


--
-- Name: Deck_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Deck_userId_idx" ON public."Deck" USING btree ("userId");


--
-- Name: EpisodeGuest_personId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "EpisodeGuest_personId_idx" ON public."EpisodeGuest" USING btree ("personId");


--
-- Name: EpisodeLore_loreEntryId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "EpisodeLore_loreEntryId_idx" ON public."EpisodeLore" USING btree ("loreEntryId");


--
-- Name: EpisodeMentionedPerson_personId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "EpisodeMentionedPerson_personId_idx" ON public."EpisodeMentionedPerson" USING btree ("personId");


--
-- Name: EpisodeReaction_episodeId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "EpisodeReaction_episodeId_idx" ON public."EpisodeReaction" USING btree ("episodeId");


--
-- Name: EpisodeTopic_topicId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "EpisodeTopic_topicId_idx" ON public."EpisodeTopic" USING btree ("topicId");


--
-- Name: Episode_airDate_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Episode_airDate_idx" ON public."Episode" USING btree ("airDate");


--
-- Name: Episode_airDate_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Episode_airDate_status_idx" ON public."Episode" USING btree ("airDate", status);


--
-- Name: Episode_episodeNumber_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Episode_episodeNumber_idx" ON public."Episode" USING btree ("episodeNumber");


--
-- Name: Episode_episodeNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Episode_episodeNumber_key" ON public."Episode" USING btree ("episodeNumber");


--
-- Name: Episode_seriesId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Episode_seriesId_idx" ON public."Episode" USING btree ("seriesId");


--
-- Name: Episode_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Episode_slug_key" ON public."Episode" USING btree (slug);


--
-- Name: Episode_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Episode_status_idx" ON public."Episode" USING btree (status);


--
-- Name: Evidence_confidence_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Evidence_confidence_idx" ON public."Evidence" USING btree (confidence);


--
-- Name: Evidence_episodeId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Evidence_episodeId_idx" ON public."Evidence" USING btree ("episodeId");


--
-- Name: Evidence_nature_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Evidence_nature_idx" ON public."Evidence" USING btree (nature);


--
-- Name: Favorite_userId_episodeId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Favorite_userId_episodeId_key" ON public."Favorite" USING btree ("userId", "episodeId");


--
-- Name: Favorite_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Favorite_userId_idx" ON public."Favorite" USING btree ("userId");


--
-- Name: GameScore_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "GameScore_createdAt_idx" ON public."GameScore" USING btree ("createdAt");


--
-- Name: GameScore_score_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "GameScore_score_idx" ON public."GameScore" USING btree (score);


--
-- Name: LoreEntry_canonStatus_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LoreEntry_canonStatus_idx" ON public."LoreEntry" USING btree ("canonStatus");


--
-- Name: LoreEntry_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "LoreEntry_slug_key" ON public."LoreEntry" USING btree (slug);


--
-- Name: LoreEntry_title_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LoreEntry_title_idx" ON public."LoreEntry" USING btree (title);


--
-- Name: LoreTopic_topicId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LoreTopic_topicId_idx" ON public."LoreTopic" USING btree ("topicId");


--
-- Name: MediaItem_seriesId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "MediaItem_seriesId_idx" ON public."MediaItem" USING btree ("seriesId");


--
-- Name: MediaItem_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "MediaItem_slug_key" ON public."MediaItem" USING btree (slug);


--
-- Name: NotificationPreference_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON public."NotificationPreference" USING btree ("userId");


--
-- Name: OracleAffinity_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "OracleAffinity_userId_key" ON public."OracleAffinity" USING btree ("userId");


--
-- Name: OracleChunk_contentHash_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OracleChunk_contentHash_idx" ON public."OracleChunk" USING btree ("contentHash");


--
-- Name: OracleChunk_sourceId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OracleChunk_sourceId_idx" ON public."OracleChunk" USING btree ("sourceId");


--
-- Name: OracleChunk_sourceType_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OracleChunk_sourceType_idx" ON public."OracleChunk" USING btree ("sourceType");


--
-- Name: OracleInvite_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "OracleInvite_token_key" ON public."OracleInvite" USING btree (token);


--
-- Name: OwnedCard_cardId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OwnedCard_cardId_idx" ON public."OwnedCard" USING btree ("cardId");


--
-- Name: OwnedCard_userId_cardId_isFoil_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "OwnedCard_userId_cardId_isFoil_key" ON public."OwnedCard" USING btree ("userId", "cardId", "isFoil");


--
-- Name: OwnedCard_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OwnedCard_userId_idx" ON public."OwnedCard" USING btree ("userId");


--
-- Name: PackCard_packId_cardId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "PackCard_packId_cardId_key" ON public."PackCard" USING btree ("packId", "cardId");


--
-- Name: PackCard_packId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PackCard_packId_idx" ON public."PackCard" USING btree ("packId");


--
-- Name: PackPurchase_packId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PackPurchase_packId_idx" ON public."PackPurchase" USING btree ("packId");


--
-- Name: PackPurchase_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PackPurchase_userId_idx" ON public."PackPurchase" USING btree ("userId");


--
-- Name: PersonLore_loreEntryId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PersonLore_loreEntryId_idx" ON public."PersonLore" USING btree ("loreEntryId");


--
-- Name: PersonMedia_personSlug_source_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PersonMedia_personSlug_source_idx" ON public."PersonMedia" USING btree ("personSlug", source);


--
-- Name: PersonMedia_publishedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PersonMedia_publishedAt_idx" ON public."PersonMedia" USING btree ("publishedAt");


--
-- Name: PersonMedia_source_sourceId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "PersonMedia_source_sourceId_key" ON public."PersonMedia" USING btree (source, "sourceId") WHERE ("sourceId" IS NOT NULL);


--
-- Name: PersonTopic_topicId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PersonTopic_topicId_idx" ON public."PersonTopic" USING btree ("topicId");


--
-- Name: Person_displayName_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Person_displayName_idx" ON public."Person" USING btree ("displayName");


--
-- Name: Person_personType_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Person_personType_idx" ON public."Person" USING btree ("personType");


--
-- Name: Person_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Person_slug_key" ON public."Person" USING btree (slug);


--
-- Name: PsychenomiconArtAsset_chapterSlug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PsychenomiconArtAsset_chapterSlug_idx" ON public."PsychenomiconArtAsset" USING btree ("chapterSlug");


--
-- Name: PsychenomiconArtAsset_chapterSlug_slot_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "PsychenomiconArtAsset_chapterSlug_slot_key" ON public."PsychenomiconArtAsset" USING btree ("chapterSlug", slot);


--
-- Name: PsychenomiconChapter_chapterNumber_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PsychenomiconChapter_chapterNumber_idx" ON public."PsychenomiconChapter" USING btree ("chapterNumber");


--
-- Name: PsychenomiconChapter_chapterNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "PsychenomiconChapter_chapterNumber_key" ON public."PsychenomiconChapter" USING btree ("chapterNumber");


--
-- Name: PsychenomiconChapter_episodeId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "PsychenomiconChapter_episodeId_key" ON public."PsychenomiconChapter" USING btree ("episodeId");


--
-- Name: PsychenomiconChapter_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "PsychenomiconChapter_slug_key" ON public."PsychenomiconChapter" USING btree (slug);


--
-- Name: PsychenomiconEntityAppearance_chapterId_entityId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "PsychenomiconEntityAppearance_chapterId_entityId_key" ON public."PsychenomiconEntityAppearance" USING btree ("chapterId", "entityId");


--
-- Name: PsychenomiconEntityAppearance_chapterId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PsychenomiconEntityAppearance_chapterId_idx" ON public."PsychenomiconEntityAppearance" USING btree ("chapterId");


--
-- Name: PsychenomiconEntityAppearance_entityId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PsychenomiconEntityAppearance_entityId_idx" ON public."PsychenomiconEntityAppearance" USING btree ("entityId");


--
-- Name: PsychenomiconEntity_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "PsychenomiconEntity_slug_key" ON public."PsychenomiconEntity" USING btree (slug);


--
-- Name: PsychenomiconEntity_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PsychenomiconEntity_status_idx" ON public."PsychenomiconEntity" USING btree (status);


--
-- Name: PsychenomiconThread_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "PsychenomiconThread_slug_key" ON public."PsychenomiconThread" USING btree (slug);


--
-- Name: PsychenomiconThread_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PsychenomiconThread_status_idx" ON public."PsychenomiconThread" USING btree (status);


--
-- Name: QuoteReaction_quoteId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "QuoteReaction_quoteId_idx" ON public."QuoteReaction" USING btree ("quoteId");


--
-- Name: QuoteReaction_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "QuoteReaction_userId_idx" ON public."QuoteReaction" USING btree ("userId");


--
-- Name: QuoteReaction_userId_quoteId_reactionType_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "QuoteReaction_userId_quoteId_reactionType_key" ON public."QuoteReaction" USING btree ("userId", "quoteId", "reactionType");


--
-- Name: Quote_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Quote_createdAt_idx" ON public."Quote" USING btree ("createdAt");


--
-- Name: Quote_episodeId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Quote_episodeId_idx" ON public."Quote" USING btree ("episodeId");


--
-- Name: Quote_speakerPersonId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Quote_speakerPersonId_idx" ON public."Quote" USING btree ("speakerPersonId");


--
-- Name: RateLimitBucket_resetAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "RateLimitBucket_resetAt_idx" ON public."RateLimitBucket" USING btree ("resetAt");


--
-- Name: ReadingCard_cardId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ReadingCard_cardId_idx" ON public."ReadingCard" USING btree ("cardId");


--
-- Name: ReadingCard_readingId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ReadingCard_readingId_idx" ON public."ReadingCard" USING btree ("readingId");


--
-- Name: Reading_userId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Reading_userId_createdAt_idx" ON public."Reading" USING btree ("userId", "createdAt");


--
-- Name: RelationshipEvent_episodeId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "RelationshipEvent_episodeId_idx" ON public."RelationshipEvent" USING btree ("episodeId");


--
-- Name: RelationshipEvent_personAId_personBId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "RelationshipEvent_personAId_personBId_idx" ON public."RelationshipEvent" USING btree ("personAId", "personBId");


--
-- Name: RelationshipEvent_relationType_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "RelationshipEvent_relationType_idx" ON public."RelationshipEvent" USING btree ("relationType");


--
-- Name: SalonPost_threadId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SalonPost_threadId_createdAt_idx" ON public."SalonPost" USING btree ("threadId", "createdAt");


--
-- Name: SalonPost_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SalonPost_userId_idx" ON public."SalonPost" USING btree ("userId");


--
-- Name: SalonThread_pinned_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SalonThread_pinned_createdAt_idx" ON public."SalonThread" USING btree (pinned, "createdAt");


--
-- Name: SavedQuote_quoteId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SavedQuote_quoteId_idx" ON public."SavedQuote" USING btree ("quoteId");


--
-- Name: SavedQuote_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SavedQuote_userId_idx" ON public."SavedQuote" USING btree ("userId");


--
-- Name: SavedQuote_userId_quoteId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "SavedQuote_userId_quoteId_key" ON public."SavedQuote" USING btree ("userId", "quoteId");


--
-- Name: SavedSearch_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SavedSearch_userId_idx" ON public."SavedSearch" USING btree ("userId");


--
-- Name: SavedTopic_topicId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SavedTopic_topicId_idx" ON public."SavedTopic" USING btree ("topicId");


--
-- Name: SavedTopic_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SavedTopic_userId_idx" ON public."SavedTopic" USING btree ("userId");


--
-- Name: SavedTopic_userId_topicId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "SavedTopic_userId_topicId_key" ON public."SavedTopic" USING btree ("userId", "topicId");


--
-- Name: SeasonalEvent_isActive_startsAt_endsAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SeasonalEvent_isActive_startsAt_endsAt_idx" ON public."SeasonalEvent" USING btree ("isActive", "startsAt", "endsAt");


--
-- Name: SeasonalEvent_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "SeasonalEvent_slug_key" ON public."SeasonalEvent" USING btree (slug);


--
-- Name: Series_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Series_slug_key" ON public."Series" USING btree (slug);


--
-- Name: SignalProposalVote_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SignalProposalVote_userId_idx" ON public."SignalProposalVote" USING btree ("userId");


--
-- Name: SignalProposal_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SignalProposal_createdAt_idx" ON public."SignalProposal" USING btree ("createdAt");


--
-- Name: SignalProposal_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SignalProposal_status_idx" ON public."SignalProposal" USING btree (status);


--
-- Name: SignalProposal_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SignalProposal_userId_idx" ON public."SignalProposal" USING btree ("userId");


--
-- Name: SpreadPosition_spreadId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SpreadPosition_spreadId_idx" ON public."SpreadPosition" USING btree ("spreadId");


--
-- Name: SpreadPosition_spreadId_index_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "SpreadPosition_spreadId_index_key" ON public."SpreadPosition" USING btree ("spreadId", index);


--
-- Name: Spread_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Spread_slug_key" ON public."Spread" USING btree (slug);


--
-- Name: StripeWebhookEvent_processedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "StripeWebhookEvent_processedAt_idx" ON public."StripeWebhookEvent" USING btree ("processedAt");


--
-- Name: Subscriber_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Subscriber_email_idx" ON public."Subscriber" USING btree (email);


--
-- Name: Subscriber_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Subscriber_email_key" ON public."Subscriber" USING btree (email);


--
-- Name: Subscriber_giftStage_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Subscriber_giftStage_idx" ON public."Subscriber" USING btree ("giftStage");


--
-- Name: TimelineEvent_category_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "TimelineEvent_category_idx" ON public."TimelineEvent" USING btree (category);


--
-- Name: TimelineEvent_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "TimelineEvent_date_idx" ON public."TimelineEvent" USING btree (date);


--
-- Name: TimelineEvent_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "TimelineEvent_slug_key" ON public."TimelineEvent" USING btree (slug);


--
-- Name: Topic_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Topic_slug_key" ON public."Topic" USING btree (slug);


--
-- Name: Topic_title_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Topic_title_idx" ON public."Topic" USING btree (title);


--
-- Name: TranscriptRequest_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "TranscriptRequest_email_idx" ON public."TranscriptRequest" USING btree (email);


--
-- Name: TranscriptRequest_episodeId_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "TranscriptRequest_episodeId_email_key" ON public."TranscriptRequest" USING btree ("episodeId", email);


--
-- Name: TranscriptRequest_episodeId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "TranscriptRequest_episodeId_idx" ON public."TranscriptRequest" USING btree ("episodeId");


--
-- Name: TranscriptSegment_episodeId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "TranscriptSegment_episodeId_idx" ON public."TranscriptSegment" USING btree ("episodeId");


--
-- Name: TranscriptSegment_episodeId_startSeconds_endSeconds_text_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "TranscriptSegment_episodeId_startSeconds_endSeconds_text_key" ON public."TranscriptSegment" USING btree ("episodeId", "startSeconds", "endSeconds", text);


--
-- Name: TranscriptSegment_startSeconds_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "TranscriptSegment_startSeconds_idx" ON public."TranscriptSegment" USING btree ("startSeconds");


--
-- Name: UserSetCompletion_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "UserSetCompletion_userId_idx" ON public."UserSetCompletion" USING btree ("userId");


--
-- Name: UserSetCompletion_userId_setId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "UserSetCompletion_userId_setId_key" ON public."UserSetCompletion" USING btree ("userId", "setId");


--
-- Name: UserWallet_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "UserWallet_userId_key" ON public."UserWallet" USING btree ("userId");


--
-- Name: VerificationToken_identifier_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON public."VerificationToken" USING btree (identifier, token);


--
-- Name: VerificationToken_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "VerificationToken_token_key" ON public."VerificationToken" USING btree (token);


--
-- Name: WeeklyDigest_weekOf_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "WeeklyDigest_weekOf_idx" ON public."WeeklyDigest" USING btree ("weekOf");


--
-- Name: WeeklyDigest_weekOf_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "WeeklyDigest_weekOf_key" ON public."WeeklyDigest" USING btree ("weekOf");


--
-- Name: Annotation Annotation_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Annotation"
    ADD CONSTRAINT "Annotation_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."CodexUser"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ArchetypeEvent ArchetypeEvent_chapterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ArchetypeEvent"
    ADD CONSTRAINT "ArchetypeEvent_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES public."PsychenomiconChapter"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ArchetypeEvent ArchetypeEvent_entityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ArchetypeEvent"
    ADD CONSTRAINT "ArchetypeEvent_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES public."PsychenomiconEntity"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CardGift CardGift_cardId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CardGift"
    ADD CONSTRAINT "CardGift_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES public."Card"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CardSetMember CardSetMember_setId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CardSetMember"
    ADD CONSTRAINT "CardSetMember_setId_fkey" FOREIGN KEY ("setId") REFERENCES public."CardSet"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ChatMessage ChatMessage_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChatMessage"
    ADD CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."CodexUser"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ClapToken ClapToken_holderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ClapToken"
    ADD CONSTRAINT "ClapToken_holderId_fkey" FOREIGN KEY ("holderId") REFERENCES public."ClapHolder"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CodexAccount CodexAccount_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CodexAccount"
    ADD CONSTRAINT "CodexAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."CodexUser"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CodexComment CodexComment_episodeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CodexComment"
    ADD CONSTRAINT "CodexComment_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES public."Episode"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CodexComment CodexComment_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CodexComment"
    ADD CONSTRAINT "CodexComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public."CodexComment"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CodexComment CodexComment_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CodexComment"
    ADD CONSTRAINT "CodexComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."CodexUser"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CodexSession CodexSession_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CodexSession"
    ADD CONSTRAINT "CodexSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."CodexUser"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CommentReport CommentReport_commentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CommentReport"
    ADD CONSTRAINT "CommentReport_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES public."CodexComment"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CommentReport CommentReport_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CommentReport"
    ADD CONSTRAINT "CommentReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."CodexUser"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CreditTransaction CreditTransaction_walletId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CreditTransaction"
    ADD CONSTRAINT "CreditTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES public."UserWallet"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DeckCard DeckCard_cardId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DeckCard"
    ADD CONSTRAINT "DeckCard_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES public."Card"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DeckCard DeckCard_deckId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DeckCard"
    ADD CONSTRAINT "DeckCard_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES public."Deck"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Deck Deck_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Deck"
    ADD CONSTRAINT "Deck_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."CodexUser"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EpisodeGuest EpisodeGuest_episodeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EpisodeGuest"
    ADD CONSTRAINT "EpisodeGuest_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES public."Episode"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EpisodeGuest EpisodeGuest_personId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EpisodeGuest"
    ADD CONSTRAINT "EpisodeGuest_personId_fkey" FOREIGN KEY ("personId") REFERENCES public."Person"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EpisodeLore EpisodeLore_episodeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EpisodeLore"
    ADD CONSTRAINT "EpisodeLore_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES public."Episode"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EpisodeLore EpisodeLore_loreEntryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EpisodeLore"
    ADD CONSTRAINT "EpisodeLore_loreEntryId_fkey" FOREIGN KEY ("loreEntryId") REFERENCES public."LoreEntry"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EpisodeMentionedPerson EpisodeMentionedPerson_episodeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EpisodeMentionedPerson"
    ADD CONSTRAINT "EpisodeMentionedPerson_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES public."Episode"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EpisodeMentionedPerson EpisodeMentionedPerson_personId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EpisodeMentionedPerson"
    ADD CONSTRAINT "EpisodeMentionedPerson_personId_fkey" FOREIGN KEY ("personId") REFERENCES public."Person"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EpisodeReaction EpisodeReaction_episodeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EpisodeReaction"
    ADD CONSTRAINT "EpisodeReaction_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES public."Episode"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EpisodeReaction EpisodeReaction_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EpisodeReaction"
    ADD CONSTRAINT "EpisodeReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."CodexUser"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EpisodeTopic EpisodeTopic_episodeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EpisodeTopic"
    ADD CONSTRAINT "EpisodeTopic_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES public."Episode"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EpisodeTopic EpisodeTopic_topicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EpisodeTopic"
    ADD CONSTRAINT "EpisodeTopic_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES public."Topic"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Episode Episode_seriesId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Episode"
    ADD CONSTRAINT "Episode_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES public."Series"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Evidence Evidence_episodeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Evidence"
    ADD CONSTRAINT "Evidence_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES public."Episode"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Favorite Favorite_episodeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Favorite"
    ADD CONSTRAINT "Favorite_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES public."Episode"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Favorite Favorite_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Favorite"
    ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."CodexUser"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LoreEntry LoreEntry_firstMentionEpisodeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LoreEntry"
    ADD CONSTRAINT "LoreEntry_firstMentionEpisodeId_fkey" FOREIGN KEY ("firstMentionEpisodeId") REFERENCES public."Episode"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: LoreTopic LoreTopic_loreEntryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LoreTopic"
    ADD CONSTRAINT "LoreTopic_loreEntryId_fkey" FOREIGN KEY ("loreEntryId") REFERENCES public."LoreEntry"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LoreTopic LoreTopic_topicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LoreTopic"
    ADD CONSTRAINT "LoreTopic_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES public."Topic"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MediaItem MediaItem_seriesId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MediaItem"
    ADD CONSTRAINT "MediaItem_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES public."Series"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: NotificationPreference NotificationPreference_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."NotificationPreference"
    ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."CodexUser"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OwnedCard OwnedCard_cardId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OwnedCard"
    ADD CONSTRAINT "OwnedCard_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES public."Card"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OwnedCard OwnedCard_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OwnedCard"
    ADD CONSTRAINT "OwnedCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."CodexUser"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PackCard PackCard_cardId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PackCard"
    ADD CONSTRAINT "PackCard_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES public."Card"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PackCard PackCard_packId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PackCard"
    ADD CONSTRAINT "PackCard_packId_fkey" FOREIGN KEY ("packId") REFERENCES public."CardPack"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PackPurchase PackPurchase_packId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PackPurchase"
    ADD CONSTRAINT "PackPurchase_packId_fkey" FOREIGN KEY ("packId") REFERENCES public."CardPack"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PackPurchase PackPurchase_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PackPurchase"
    ADD CONSTRAINT "PackPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."CodexUser"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PersonLore PersonLore_loreEntryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PersonLore"
    ADD CONSTRAINT "PersonLore_loreEntryId_fkey" FOREIGN KEY ("loreEntryId") REFERENCES public."LoreEntry"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PersonLore PersonLore_personId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PersonLore"
    ADD CONSTRAINT "PersonLore_personId_fkey" FOREIGN KEY ("personId") REFERENCES public."Person"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PersonTopic PersonTopic_personId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PersonTopic"
    ADD CONSTRAINT "PersonTopic_personId_fkey" FOREIGN KEY ("personId") REFERENCES public."Person"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PersonTopic PersonTopic_topicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PersonTopic"
    ADD CONSTRAINT "PersonTopic_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES public."Topic"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Person Person_firstAppearanceEpisodeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Person"
    ADD CONSTRAINT "Person_firstAppearanceEpisodeId_fkey" FOREIGN KEY ("firstAppearanceEpisodeId") REFERENCES public."Episode"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PsychenomiconChapter PsychenomiconChapter_episodeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PsychenomiconChapter"
    ADD CONSTRAINT "PsychenomiconChapter_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES public."Episode"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PsychenomiconEntityAppearance PsychenomiconEntityAppearance_chapterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PsychenomiconEntityAppearance"
    ADD CONSTRAINT "PsychenomiconEntityAppearance_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES public."PsychenomiconChapter"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PsychenomiconEntityAppearance PsychenomiconEntityAppearance_entityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PsychenomiconEntityAppearance"
    ADD CONSTRAINT "PsychenomiconEntityAppearance_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES public."PsychenomiconEntity"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PsychenomiconThreadChapter PsychenomiconThreadChapter_chapterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PsychenomiconThreadChapter"
    ADD CONSTRAINT "PsychenomiconThreadChapter_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES public."PsychenomiconChapter"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PsychenomiconThreadChapter PsychenomiconThreadChapter_threadId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PsychenomiconThreadChapter"
    ADD CONSTRAINT "PsychenomiconThreadChapter_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES public."PsychenomiconThread"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: QuoteReaction QuoteReaction_quoteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QuoteReaction"
    ADD CONSTRAINT "QuoteReaction_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES public."Quote"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: QuoteReaction QuoteReaction_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QuoteReaction"
    ADD CONSTRAINT "QuoteReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."CodexUser"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Quote Quote_episodeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Quote"
    ADD CONSTRAINT "Quote_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES public."Episode"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Quote Quote_speakerPersonId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Quote"
    ADD CONSTRAINT "Quote_speakerPersonId_fkey" FOREIGN KEY ("speakerPersonId") REFERENCES public."Person"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Quote Quote_transcriptSegmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Quote"
    ADD CONSTRAINT "Quote_transcriptSegmentId_fkey" FOREIGN KEY ("transcriptSegmentId") REFERENCES public."TranscriptSegment"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ReadingCard ReadingCard_readingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ReadingCard"
    ADD CONSTRAINT "ReadingCard_readingId_fkey" FOREIGN KEY ("readingId") REFERENCES public."Reading"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Reading Reading_spreadId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Reading"
    ADD CONSTRAINT "Reading_spreadId_fkey" FOREIGN KEY ("spreadId") REFERENCES public."Spread"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: RelatedEpisode RelatedEpisode_episodeAId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RelatedEpisode"
    ADD CONSTRAINT "RelatedEpisode_episodeAId_fkey" FOREIGN KEY ("episodeAId") REFERENCES public."Episode"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RelatedEpisode RelatedEpisode_episodeBId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RelatedEpisode"
    ADD CONSTRAINT "RelatedEpisode_episodeBId_fkey" FOREIGN KEY ("episodeBId") REFERENCES public."Episode"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RelatedLore RelatedLore_loreAId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RelatedLore"
    ADD CONSTRAINT "RelatedLore_loreAId_fkey" FOREIGN KEY ("loreAId") REFERENCES public."LoreEntry"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RelatedLore RelatedLore_loreBId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RelatedLore"
    ADD CONSTRAINT "RelatedLore_loreBId_fkey" FOREIGN KEY ("loreBId") REFERENCES public."LoreEntry"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RelatedPerson RelatedPerson_personAId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RelatedPerson"
    ADD CONSTRAINT "RelatedPerson_personAId_fkey" FOREIGN KEY ("personAId") REFERENCES public."Person"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RelatedPerson RelatedPerson_personBId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RelatedPerson"
    ADD CONSTRAINT "RelatedPerson_personBId_fkey" FOREIGN KEY ("personBId") REFERENCES public."Person"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RelationshipEvent RelationshipEvent_episodeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RelationshipEvent"
    ADD CONSTRAINT "RelationshipEvent_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES public."Episode"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: RelationshipEvent RelationshipEvent_evidenceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RelationshipEvent"
    ADD CONSTRAINT "RelationshipEvent_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES public."Evidence"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: RelationshipEvent RelationshipEvent_personAId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RelationshipEvent"
    ADD CONSTRAINT "RelationshipEvent_personAId_fkey" FOREIGN KEY ("personAId") REFERENCES public."Person"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RelationshipEvent RelationshipEvent_personBId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RelationshipEvent"
    ADD CONSTRAINT "RelationshipEvent_personBId_fkey" FOREIGN KEY ("personBId") REFERENCES public."Person"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SalonPost SalonPost_threadId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SalonPost"
    ADD CONSTRAINT "SalonPost_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES public."SalonThread"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SalonPost SalonPost_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SalonPost"
    ADD CONSTRAINT "SalonPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."CodexUser"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SavedQuote SavedQuote_quoteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SavedQuote"
    ADD CONSTRAINT "SavedQuote_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES public."Quote"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SavedQuote SavedQuote_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SavedQuote"
    ADD CONSTRAINT "SavedQuote_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."CodexUser"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SavedSearch SavedSearch_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SavedSearch"
    ADD CONSTRAINT "SavedSearch_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."CodexUser"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SavedTopic SavedTopic_topicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SavedTopic"
    ADD CONSTRAINT "SavedTopic_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES public."Topic"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SavedTopic SavedTopic_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SavedTopic"
    ADD CONSTRAINT "SavedTopic_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."CodexUser"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SignalProposalVote SignalProposalVote_proposalId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SignalProposalVote"
    ADD CONSTRAINT "SignalProposalVote_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES public."SignalProposal"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SignalProposalVote SignalProposalVote_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SignalProposalVote"
    ADD CONSTRAINT "SignalProposalVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."CodexUser"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SignalProposal SignalProposal_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SignalProposal"
    ADD CONSTRAINT "SignalProposal_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."CodexUser"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SpreadPosition SpreadPosition_spreadId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SpreadPosition"
    ADD CONSTRAINT "SpreadPosition_spreadId_fkey" FOREIGN KEY ("spreadId") REFERENCES public."Spread"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TimelineEvent TimelineEvent_episodeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TimelineEvent"
    ADD CONSTRAINT "TimelineEvent_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES public."Episode"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: TimelineEvent TimelineEvent_evidenceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TimelineEvent"
    ADD CONSTRAINT "TimelineEvent_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES public."Evidence"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: TranscriptRequest TranscriptRequest_episodeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TranscriptRequest"
    ADD CONSTRAINT "TranscriptRequest_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES public."Episode"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TranscriptSegment TranscriptSegment_episodeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TranscriptSegment"
    ADD CONSTRAINT "TranscriptSegment_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES public."Episode"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserSetCompletion UserSetCompletion_setId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserSetCompletion"
    ADD CONSTRAINT "UserSetCompletion_setId_fkey" FOREIGN KEY ("setId") REFERENCES public."CardSet"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserWallet UserWallet_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserWallet"
    ADD CONSTRAINT "UserWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."CodexUser"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--


