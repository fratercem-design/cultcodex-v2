-- CreateTable
CREATE TABLE "BookEdition" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'application/pdf',
    "data" BYTEA NOT NULL,
    "pageCount" INTEGER NOT NULL DEFAULT 0,
    "chapterFrom" INTEGER NOT NULL DEFAULT 0,
    "chapterTo" INTEGER NOT NULL DEFAULT 0,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookEdition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookPurchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "stripeSessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookEdition_sku_key" ON "BookEdition"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "BookPurchase_userId_sku_key" ON "BookPurchase"("userId", "sku");

-- CreateIndex
CREATE INDEX "BookPurchase_userId_idx" ON "BookPurchase"("userId");
