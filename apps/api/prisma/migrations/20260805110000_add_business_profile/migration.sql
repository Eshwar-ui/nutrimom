-- The operator's real business identity, surfaced on the legal pages. Until
-- every required field is filled in, those pages stay noindex + draft-bannered
-- (see BusinessProfile.isComplete in shared). Deliberately seeded blank —
-- a plausible-looking placeholder company name published as real legal copy
-- is worse than an obvious gap.

CREATE TABLE "BusinessProfile" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "legalEntityName" TEXT NOT NULL DEFAULT '',
    "tradeName" TEXT NOT NULL DEFAULT '',
    "registeredAddress" TEXT NOT NULL DEFAULT '',
    "supportEmail" TEXT NOT NULL DEFAULT '',
    "supportPhone" TEXT NOT NULL DEFAULT '',
    "grievanceOfficerName" TEXT NOT NULL DEFAULT '',
    "grievanceOfficerEmail" TEXT NOT NULL DEFAULT '',
    "gstin" TEXT,
    "cin" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessProfile_pkey" PRIMARY KEY ("id")
);

INSERT INTO "BusinessProfile" ("id", "updatedAt") VALUES ('global', now());
