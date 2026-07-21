-- CreateTable
CREATE TABLE "LiveStatus" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "isLive" BOOLEAN NOT NULL DEFAULT false,
    "videoId" TEXT,
    "title" TEXT,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiveStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "pushSubscription" JSONB,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subscriber_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subscriber_email_key" ON "Subscriber"("email");

-- CreateIndex
CREATE INDEX "Subscriber_email_idx" ON "Subscriber"("email");
