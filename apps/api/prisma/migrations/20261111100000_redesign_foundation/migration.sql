-- Redesign foundation (REDESIGN-PLAN.md phases 1b, 3, 5, 6).
--
-- Additive only: new enums and tables for admin-editable content (service
-- packages, partner offers, FAQs, testimonials, the SiteContent singleton,
-- donation offers), nullable location columns on Listing/User, the quoted-
-- package snapshot on ContactMessage, and one NotificationType value appended
-- at the end. No existing column changes meaning, so the mobile app and the
-- live money paths are unaffected.
--
-- DDL generated with `prisma migrate diff --from-migrations prisma/migrations
-- --to-schema-datamodel prisma/schema.prisma`; initial content appended below.

-- CreateEnum
CREATE TYPE "ServiceGroup" AS ENUM ('PRENATAL_YOGA', 'GARBHASANSKAR', 'COMBO', 'ONE_TO_ONE_YOGA', 'NUTRITION', 'STARTING_SOLIDS');

-- CreateEnum
CREATE TYPE "SessionFormat" AS ENUM ('LIVE_GROUP', 'ONE_TO_ONE', 'RECORDED');

-- CreateEnum
CREATE TYPE "FaqSection" AS ENUM ('GENERAL', 'SESSIONS', 'NUTRITION', 'MARKETPLACE', 'PAYMENTS', 'DONATIONS');

-- CreateEnum
CREATE TYPE "DonationStatus" AS ENUM ('NEW', 'CONTACTED', 'MATCHED', 'COMPLETED', 'DECLINED');

-- CreateEnum
CREATE TYPE "HandoverPreference" AS ENUM ('PICKUP', 'DROP_OFF', 'EITHER');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'DONATION_OFFERED';

-- AlterTable
ALTER TABLE "ContactMessage" ADD COLUMN     "packageId" TEXT,
ADD COLUMN     "packageName" TEXT,
ADD COLUMN     "quotedPricePaise" INTEGER;

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "locality" TEXT,
ADD COLUMN     "pincode" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "locality" TEXT,
ADD COLUMN     "pincode" TEXT;

-- CreateTable
CREATE TABLE "ServicePackage" (
    "id" TEXT NOT NULL,
    "group" "ServiceGroup" NOT NULL,
    "name" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "includes" TEXT[],
    "sessionCount" INTEGER,
    "sessionMinutes" INTEGER,
    "validityDays" INTEGER,
    "format" "SessionFormat" NOT NULL,
    "pricePaise" INTEGER NOT NULL,
    "priceSince" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "offerPricePaise" INTEGER,
    "offerLabel" TEXT,
    "offerEndsAt" TIMESTAMP(3),
    "isIntroductory" BOOLEAN NOT NULL DEFAULT false,
    "isBestValue" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServicePackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerOffer" (
    "id" TEXT NOT NULL,
    "brandName" TEXT NOT NULL,
    "logoUrl" TEXT,
    "description" TEXT NOT NULL,
    "benefit" TEXT NOT NULL,
    "couponCode" TEXT,
    "url" TEXT NOT NULL,
    "isAffiliate" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Faq" (
    "id" TEXT NOT NULL,
    "section" "FaqSection" NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Faq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "context" TEXT,
    "quote" TEXT NOT NULL,
    "photoUrl" TEXT,
    "consentConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteContent" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "heroHeadline" TEXT NOT NULL,
    "heroSubline" TEXT NOT NULL,
    "heroMessage" TEXT NOT NULL,
    "heroImageUrl" TEXT,
    "heroImageAlt" TEXT,
    "aboutMission" TEXT,
    "founders" JSONB NOT NULL DEFAULT '[]',
    "galleryImages" JSONB NOT NULL DEFAULT '[]',
    "instagramUrl" TEXT,
    "youtubeUrl" TEXT,
    "whatsappCommunityUrl" TEXT,
    "whatsappPrelovedUrl" TEXT,
    "sessionPolicy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DonationOffer" (
    "id" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "locality" TEXT,
    "pincode" TEXT NOT NULL,
    "categoryId" TEXT,
    "itemsDescription" TEXT NOT NULL,
    "condition" "Condition" NOT NULL,
    "images" TEXT[],
    "handover" "HandoverPreference" NOT NULL,
    "status" "DonationStatus" NOT NULL DEFAULT 'NEW',
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DonationOffer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServicePackage_group_isActive_sortOrder_idx" ON "ServicePackage"("group", "isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "PartnerOffer_isActive_sortOrder_idx" ON "PartnerOffer"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "Faq_section_isPublished_sortOrder_idx" ON "Faq"("section", "isPublished", "sortOrder");

-- CreateIndex
CREATE INDEX "Testimonial_isPublished_sortOrder_idx" ON "Testimonial"("isPublished", "sortOrder");

-- CreateIndex
CREATE INDEX "DonationOffer_status_createdAt_idx" ON "DonationOffer"("status", "createdAt");

-- CreateIndex
CREATE INDEX "DonationOffer_donorId_idx" ON "DonationOffer"("donorId");

-- CreateIndex
CREATE INDEX "Listing_status_city_idx" ON "Listing"("status", "city");

-- CreateIndex
CREATE INDEX "Listing_pincode_idx" ON "Listing"("pincode");

-- AddForeignKey
ALTER TABLE "DonationOffer" ADD CONSTRAINT "DonationOffer_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonationOffer" ADD CONSTRAINT "DonationOffer_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- ------------------------------------------------------------------
-- Initial content. Every insert is ON CONFLICT DO NOTHING so a re-run, or a
-- row an admin already created by hand, is never overwritten.
-- ------------------------------------------------------------------

-- The single SiteContent row. Hero copy is the founders' brief verbatim; the
-- social links are the constants previously hard-coded in
-- apps/web/src/lib/site-nav.ts (SOCIAL_LINKS, WHATSAPP_COMMUNITY_URL,
-- WHATSAPP_PRELOVED_URL), which become fallbacks. Everything else starts empty
-- on purpose — About, founders, gallery and the session policy stay hidden
-- until the client supplies real content.
INSERT INTO "SiteContent" (
  "id", "heroHeadline", "heroSubline", "heroMessage",
  "instagramUrl", "youtubeUrl", "whatsappCommunityUrl", "whatsappPrelovedUrl",
  "updatedAt"
) VALUES (
  'global',
  'From pregnancy to toddlerhood, you’re not alone.',
  'A nurturing space for every mother, every journey, and every stage.',
  'Move, nourish, connect and grow together. Find the support, guidance and community you need at every stage of motherhood.',
  'https://www.instagram.com/thenurturemoms',
  'https://www.youtube.com/@thenurturemoms',
  'https://chat.whatsapp.com/LYhXcQjWwvp09OY66kQXgS',
  'https://chat.whatsapp.com/DWErNklaubQ4WEQ3uCzkOD',
  now()
) ON CONFLICT ("id") DO NOTHING;

-- Launch prices from the brief (§8 A–D), plus the nutrition and starting-solids
-- prices previously hard-coded on /nutrition and /nutrition/starting-solids, so
-- those pages can move to this table without losing content. Fixed readable
-- ids so later migrations and the API tests can refer to them.
--
-- sessionMinutes is null wherever the client has not given a duration (every
-- yoga package); validityDays is set only where the brief says "monthly". The
-- nutrition prices were published as "from" prices — there is no column for
-- that, so the summary carries the "starting price" caveat instead.
INSERT INTO "ServicePackage" (
  "id", "group", "name", "summary", "includes",
  "sessionCount", "sessionMinutes", "validityDays", "format",
  "pricePaise", "isIntroductory", "isBestValue", "sortOrder", "updatedAt"
) VALUES
  -- A. Prenatal Yoga
  ('pkg_prenatal_trial', 'PRENATAL_YOGA', 'Trial Class',
   'Try one live prenatal yoga class before you commit.',
   ARRAY['1 live group class', 'Pregnancy-appropriate movement', 'Breathing practices', 'Relaxation']::TEXT[],
   1, NULL, NULL, 'LIVE_GROUP', 9900, true, false, 10, now()),
  ('pkg_prenatal_single', 'PRENATAL_YOGA', 'Single Group Class',
   'One live prenatal yoga group class.',
   ARRAY['1 live group class', 'Pregnancy-appropriate movement', 'Breathing practices', 'Relaxation']::TEXT[],
   1, NULL, NULL, 'LIVE_GROUP', 19900, false, false, 20, now()),
  ('pkg_prenatal_4', 'PRENATAL_YOGA', '4-Class Package',
   'Four live prenatal yoga group classes.',
   ARRAY['4 live group classes', 'Pregnancy-appropriate movement', 'Breathing practices', 'Relaxation']::TEXT[],
   4, NULL, NULL, 'LIVE_GROUP', 59900, false, false, 30, now()),
  ('pkg_prenatal_monthly', 'PRENATAL_YOGA', '8-Class Monthly Package',
   'Eight live prenatal yoga group classes across a month.',
   ARRAY['8 live group classes', 'Pregnancy-appropriate movement', 'Breathing practices', 'Relaxation']::TEXT[],
   8, NULL, 30, 'LIVE_GROUP', 99900, false, false, 40, now()),

  -- B. Garbhasanskar
  ('pkg_garbhasanskar_single', 'GARBHASANSKAR', 'Single Session',
   'One live Garbhasanskar group session.',
   ARRAY['Guided affirmations', 'Relaxation', 'Mindful pregnancy practices', 'Emotional bonding activities']::TEXT[],
   1, NULL, NULL, 'LIVE_GROUP', 29900, false, false, 10, now()),
  ('pkg_garbhasanskar_4', 'GARBHASANSKAR', '4-Session Package',
   'Four live Garbhasanskar group sessions.',
   ARRAY['Guided affirmations', 'Relaxation', 'Mindful pregnancy practices', 'Emotional bonding activities']::TEXT[],
   4, NULL, NULL, 'LIVE_GROUP', 99900, false, false, 20, now()),

  -- C. Monthly Combo — the Best Value card
  ('pkg_combo_monthly', 'COMBO', 'Monthly Combo',
   '8 Prenatal Yoga classes and 4 Garbhasanskar sessions in one month.',
   ARRAY['8 Prenatal Yoga group classes', '4 Garbhasanskar group sessions', 'Pregnancy-appropriate movement, breathing and relaxation', 'Guided affirmations and emotional bonding activities']::TEXT[],
   12, NULL, 30, 'LIVE_GROUP', 149900, false, true, 10, now()),

  -- D. Personalised 1:1 Yoga
  ('pkg_one_to_one_single', 'ONE_TO_ONE_YOGA', 'Single Session',
   'Personalised support adapted to your needs and comfort level.',
   ARRAY['1 one-to-one session', 'Adapted to your stage, needs and comfort level']::TEXT[],
   1, NULL, NULL, 'ONE_TO_ONE', 59900, false, false, 10, now()),
  ('pkg_one_to_one_4', 'ONE_TO_ONE_YOGA', '4-Session Package',
   'Personalised support adapted to your needs and comfort level.',
   ARRAY['4 one-to-one sessions', 'Adapted to your stage, needs and comfort level']::TEXT[],
   4, NULL, NULL, 'ONE_TO_ONE', 199900, false, false, 20, now()),

  -- Nutrition (/nutrition pricing table, all published as "from" prices)
  ('pkg_nutrition_quick', 'NUTRITION', 'Quick Guidance',
   'Quick, practical guidance on a specific nutrition question. Starting price — we confirm the final fee before you book.',
   ARRAY[]::TEXT[],
   NULL, NULL, NULL, 'ONE_TO_ONE', 29900, false, false, 10, now()),
  ('pkg_nutrition_consultation', 'NUTRITION', '1:1 Consultation',
   'Personalised support based on your family''s goals, routine and needs. Starting price — we confirm the final fee before you book.',
   ARRAY[]::TEXT[],
   NULL, NULL, NULL, 'ONE_TO_ONE', 69900, false, false, 20, now()),
  ('pkg_nutrition_mom_baby', 'NUTRITION', 'Mom + Baby Bundle',
   'Nutrition support for you and your baby together. Starting price — we confirm the final fee before you book.',
   ARRAY[]::TEXT[],
   NULL, NULL, NULL, 'ONE_TO_ONE', 129900, false, false, 30, now()),
  ('pkg_nutrition_monthly', 'NUTRITION', 'Monthly Support',
   'Ongoing nutrition support across a month. Starting price — we confirm the final fee before you book.',
   ARRAY[]::TEXT[],
   NULL, NULL, 30, 'ONE_TO_ONE', 149900, false, false, 40, now()),

  -- Starting Solids (/nutrition/starting-solids; also the ₹799 row on /nutrition)
  ('pkg_solids_session', 'STARTING_SOLIDS', 'Starting Solids Session',
   'A 60-minute 1:1 session personalised to your baby''s stage and your family''s routine.',
   ARRAY[
     'Readiness guidance and how to prepare for the transition',
     'First foods and simple combinations that work',
     'Texture progression and responsive feeding principles',
     'Age-appropriate meal ideas and routines',
     'Allergen-introduction guidance, and what to raise with your paediatrician',
     'Common feeding concerns and practical troubleshooting',
     'A personalised discussion based on your baby''s stage and your family''s routine'
   ]::TEXT[],
   1, 60, NULL, 'ONE_TO_ONE', 79900, false, false, 10, now())
ON CONFLICT ("id") DO NOTHING;

-- The static answers from /faq, as markdown. Two answers are deliberately NOT
-- seeded because they quote live values and must keep rendering from code:
-- "Can I cancel an order?" (CancellationPolicy cutoff + refund %) and
-- "What does it cost to sell?" (REGISTRATION_FEE_PAISE + MEMBERSHIP_PLANS).
INSERT INTO "Faq" ("id", "section", "question", "answer", "sortOrder", "updatedAt") VALUES
  ('faq_sessions_how_to_book', 'SESSIONS',
   'How do I book a yoga or nutrition session?',
   'Use the booking button on the [yoga](/yoga), [nutrition](/nutrition) or [starting solids](/nutrition/starting-solids) page. It opens a conversation with us so we can check your stage and what you need before anything is confirmed.',
   10, now()),
  ('faq_sessions_prices_final', 'SESSIONS',
   'Are the prices on the service pages final?',
   'They are starting prices. What you pay depends on the format, the session length and how much follow-up you want, and we confirm the figure with you before you book — never after.',
   20, now()),
  ('faq_sessions_medical_advice', 'SESSIONS',
   'Is this medical advice?',
   'No. Our yoga sessions are wellness and fitness support, and our nutrition guidance is practical food support. Anything involving a diagnosis, medication, a growth concern or a suspected allergy belongs with your doctor or paediatrician, and we will tell you when something is a question for them.',
   30, now()),
  ('faq_sessions_high_risk', 'SESSIONS',
   'I have a high-risk pregnancy. Can I still join a class?',
   'Please speak to your doctor first, and tell us anything we should work around. We would rather adapt a session than have you skip movement altogether, but that conversation starts with your doctor.',
   40, now()),
  ('faq_general_community_cost', 'GENERAL',
   'Does the mom community cost anything?',
   'No. The [community](/community) is free to join and free to share with a friend. There is nothing to unlock before you can ask your first question.',
   10, now()),
  ('faq_general_paid_membership', 'GENERAL',
   'Is there a paid membership?',
   'Not yet. We are working on an optional paid membership with exclusive workshops, a library of guides and member events. It is not open yet, and when it is you will hear about it inside the community first.',
   20, now()),
  ('faq_payments_how_to_pay', 'PAYMENTS',
   'How do I pay?',
   'You pay securely online — UPI, cards or netbanking, through Razorpay. There is no cash on delivery. Your order is confirmed as soon as your payment goes through, and that is when the seller starts packing it for you.',
   10, now()),
  ('faq_marketplace_who_sells', 'MARKETPLACE',
   'Who actually sells the item?',
   'Another mom. We are the marketplace, not the seller: each item is owned, described and photographed by an individual seller whose account we verify. Every listing is reviewed by us before it goes live.',
   10, now()),
  ('faq_marketplace_delivery', 'MARKETPLACE',
   'How does delivery work?',
   'The seller packs the item carefully and sends it to you with a printable address label we give them, so every parcel goes out the same way. When it reaches you, just tap "Confirm delivery" on your order page.',
   20, now()),
  ('faq_marketplace_when_paid', 'MARKETPLACE',
   'When do I get paid?',
   'After the buyer''s order is delivered. We hold the amount until then, take our commission, and transfer the rest to you with a reference you can check against your bank statement.',
   30, now()),
  ('faq_marketplace_listing_not_approved', 'MARKETPLACE',
   'Why was my listing not approved?',
   'Every listing is reviewed before it goes live, and we tell you the reason if one is turned down — usually photos that are not of the actual item, or a condition description that does not match them. Fix it and resubmit. The [marketplace policies](/policies) set out what we look for.',
   40, now())
ON CONFLICT ("id") DO NOTHING;
