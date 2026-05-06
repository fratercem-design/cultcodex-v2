-- AlterTable: add channelHandle to PersonMedia
ALTER TABLE "PersonMedia" ADD COLUMN IF NOT EXISTS "channelHandle" TEXT;
