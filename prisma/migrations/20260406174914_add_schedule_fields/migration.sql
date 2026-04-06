-- AlterTable
ALTER TABLE "DisplayItem" ADD COLUMN "showUntil" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Display" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'single',
    "interval" INTEGER NOT NULL DEFAULT 5,
    "scheduleMode" TEXT NOT NULL DEFAULT 'none',
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Display" ("createdAt", "id", "interval", "mode", "name", "updatedAt") SELECT "createdAt", "id", "interval", "mode", "name", "updatedAt" FROM "Display";
DROP TABLE "Display";
ALTER TABLE "new_Display" RENAME TO "Display";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
