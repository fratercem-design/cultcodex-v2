-- Rumble embeds take the player id, not the page id already stored in
-- "rumbleVideoId" (an embed built from the page id returns 410 Gone).
ALTER TABLE "Episode" ADD COLUMN "rumbleEmbedId" TEXT;
