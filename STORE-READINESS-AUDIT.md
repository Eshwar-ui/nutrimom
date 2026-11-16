# Store-readiness audit

Audit date: 23 September 2026

Scope: `apps/mobile` Flutter app, the NestJS API it calls, and the web surfaces used for
seller billing, legal pages, support, and account deletion.

## Current verdict

**Not ready to submit yet.** The product code is in a much better state, but the release is
blocked by signing/distribution credentials and a few production-operations items. The most
important functional store requirement — account deletion — is now implemented in the app and
API, with a public web fallback at `/account-deletion`.

## Fixed in this audit

- Release builds now default to the production API and web origins when no Dart defines are
  supplied. Debug builds retain local-device defaults.
- Android release networking is explicit (`INTERNET` permission in the main manifest); cleartext
  traffic is restricted to debug/profile manifests.
- Android and iOS launcher icons use the Nutrimom/Nurture Moms branding.
- Android and iOS launch assets are no longer the Flutter placeholder assets.
- Android release signing no longer uses the debug certificate. A release build requires
  `apps/mobile/android/key.properties`; a safe template is committed as
  `apps/mobile/android/key.properties.example`.
- `DELETE /users/me` anonymizes customer data, revokes refresh tokens, and preserves order,
  payment, listing, and tax-related records where retention is required.
- The mobile Account screen has a confirmation flow for account deletion.
- A public `/account-deletion` web page explains deletion and provides a support request path,
  satisfying the web-resource part of Google Play's account-deletion policy.

## Verification completed

- `flutter analyze`: passed with no issues.
- `flutter test`: 52 tests passed.
- API typecheck and API Jest suite: passed (153 tests).
- iOS `flutter build ipa --release --no-codesign`: archive created successfully; App Settings
  Validation passed for bundle `com.thenurturemoms.nurtureMoms`, display name `Nurture Moms`,
  version `1.0.0 (1)`, deployment target iOS 15.0.
- Production API health endpoint: HTTP 200 with database healthy.
- A release Android artifact produced before the signing guard was confirmed to be signed with
  the Android debug certificate. It must not be uploaded.

## Blocking actions before submission

### Android / Google Play

1. Create or select the organization's Play upload keystore, keep it in a secure password manager,
   and create `apps/mobile/android/key.properties` locally. Do not commit either file.
2. Register the upload certificate in Play Console and enable Play App Signing.
3. Build and inspect the signed AAB, then upload it to an internal testing track before production.
4. Complete Play Console Data Safety and account-deletion declarations. The app handles email,
   name, WhatsApp/phone, city, bio, shipping addresses, order/payment metadata, listing photos,
   and support messages. Razorpay and Supabase are third-party processors/storage providers.
5. Publish the final privacy-policy URL and the public deletion URL:
   `https://www.thenurturemoms.com/privacy` and
   `https://www.thenurturemoms.com/account-deletion`.

### iOS / App Store

1. Configure the Apple Team, distribution certificate, App Store provisioning profile, and
   App Store Connect app record. The local archive was intentionally built with `--no-codesign`.
2. Upload a TestFlight build and test on a clean device. The previously installed physical-device
   build was a development install, not an App Store distribution build.
3. Complete App Store privacy answers for account data, contact data, user content/photos,
   purchase/payment-related data, diagnostics, and third-party SDK processing.
4. Verify the account deletion flow from a real signed build and link the same privacy/deletion
   URLs in App Store Connect metadata.

### Production operations

1. Run the account-deletion Prisma migration during the API deployment:
   `apps/api/prisma/migrations/20260923110000_account_deletion`.
2. Replace Razorpay test credentials with live credentials and set a real
   `RAZORPAY_WEBHOOK_SECRET`. Run a real low-value payment, verify, webhook, cancellation, and
   refund test before enabling public checkout.
3. Fill the admin Business Profile completely (legal entity, registered address, support and
   grievance contacts, and applicable GSTIN/CIN). Legal pages intentionally remain draft/noindex
   until this is complete.
4. Remove or replace remaining placeholder product/content data, including `example.com` listing
   images and “coming soon” social links, before store screenshots and public launch.

## High-priority product gaps

These are not automatic store rejection conditions, but they make a public launch risky:

- Seller mobile listing creation is still a web handoff; the screen explicitly says the camera
  composer is planned for a later build.
- Push notifications, FCM, analytics, and Crashlytics are not wired in the mobile app.
- There is no remote minimum-supported-version/app-config check, so an incompatible old binary
  cannot be force-updated after an API change.
- Service/pillar pricing and some community/social destinations are still hardcoded or absent;
  changing them requires an app release.
- Live Shiprocket fulfilment is code-complete but not verified against a real Shiprocket account.
- The app is still version `1.0.0+1`; increment build/version values for every TestFlight/Play
  upload after the first submission.

## Recommended pre-submit test matrix

Run on at least one recent iPhone, one older supported iPhone, one Android 13/14 phone, and one
Android 15/16 phone: fresh install, registration, login/logout, password reset, browse/search,
wishlist, checkout success/failure/cancel, network loss during payment, order cancellation/refund,
delivery confirmation, seller verification/membership handoff, account deletion, deep links to web
legal/support pages, offline launch, and app upgrade from the prior build.

## External policy references

- [Google Play account deletion requirements](https://support.google.com/googleplay/android-developer/answer/13327111?hl=en)
- [Google Play target API requirements](https://developer.android.com/google/play/requirements/target-sdk?authuser=2)
- [Apple account deletion requirement](https://developer.apple.com/support/offering-account-deletion-in-your-app)
- [Apple App Store privacy details](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy)
