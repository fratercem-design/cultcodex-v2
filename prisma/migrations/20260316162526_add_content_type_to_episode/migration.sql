-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('livestream', 'original', 'short', 'clip');

-- AlterTable
ALTER TABLE "Episode" ADD COLUMN     "contentType" "ContentType" NOT NULL DEFAULT 'original';
