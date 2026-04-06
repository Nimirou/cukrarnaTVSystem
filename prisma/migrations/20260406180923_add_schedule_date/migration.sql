-- DropIndex
DROP INDEX "DisplayItem_displayId_mediaId_key";

-- AlterTable
ALTER TABLE "DisplayItem" ADD COLUMN "scheduleDate" TEXT;
