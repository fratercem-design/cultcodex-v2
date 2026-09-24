-- CreateTable
CREATE TABLE "PsychenomiconArtAsset" (
    "id" TEXT NOT NULL,
    "chapterSlug" TEXT NOT NULL,
    "slot" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'image/jpeg',
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PsychenomiconArtAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PsychenomiconArtAsset_chapterSlug_slot_key" ON "PsychenomiconArtAsset"("chapterSlug", "slot");

-- CreateIndex
CREATE INDEX "PsychenomiconArtAsset_chapterSlug_idx" ON "PsychenomiconArtAsset"("chapterSlug");
