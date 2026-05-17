-- Add isLifetimeMember to CodexUser
ALTER TABLE "CodexUser" ADD COLUMN "isLifetimeMember" BOOLEAN NOT NULL DEFAULT false;

-- Create OracleInvite table
CREATE TABLE "OracleInvite" (
    "id"             TEXT NOT NULL,
    "token"          TEXT NOT NULL,
    "recipientName"  TEXT NOT NULL,
    "recipientEmail" TEXT,
    "personalNote"   TEXT,
    "claimed"        BOOLEAN NOT NULL DEFAULT false,
    "claimedAt"      TIMESTAMP(3),
    "claimedBy"      TEXT,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OracleInvite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OracleInvite_token_key" ON "OracleInvite"("token");
