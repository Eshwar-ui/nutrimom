-- Marks the built-in "Marketplace" account that admin-created listings are attributed to.
ALTER TABLE "User" ADD COLUMN "isSystemSeller" BOOLEAN NOT NULL DEFAULT false;
