-- Refresh-token revocation. Until now a leaked refresh token was valid for
-- its full 7-day life with no way to kill it, and a password reset did not
-- sign out sessions opened with the old password.
ALTER TABLE "User" ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 0;
