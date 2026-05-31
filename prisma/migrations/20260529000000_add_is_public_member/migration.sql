-- Add isPublicMember opt-in flag to CodexUser
ALTER TABLE "CodexUser" ADD COLUMN IF NOT EXISTS "isPublicMember" BOOLEAN NOT NULL DEFAULT false;
