/// The four pillars and their service content.
///
/// Mirrored from the shipped web pages (`apps/web/src/app/{yoga,nutrition,
/// community,preloved}/page.tsx`) and `apps/web/src/lib/site-nav.ts`, which in
/// turn implement the founders' brief. The web is the source of truth: when a
/// line changes there, change it here.
///
/// **This file is the swap point for backend item B4.** Prices in particular
/// are provisional planning figures (brief §10: "confirm final pricing before
/// publishing"), and on the web a price change is a deploy while here it is a
/// store review. When `GET /services` exists, the screens should read from it
/// and this file should shrink to fallbacks — nothing else needs to move.
library;

import '../booking/data/booking.dart';

/// The brand line, used as the brief asks: homepage, share copy, footers.
const String kBrandLine = 'Move. Nourish. Connect. Pass it on.';
const String kBrandPromise = 'For every stage of motherhood.';
const String kTrustLine =
    'Mom-led · Practical · Affordable · Community-focused';

enum PillarKey { move, nourish, connect, passItOn }

class Pillar {
  const Pillar({
    required this.key,
    required this.eyebrow,
    required this.title,
    required this.route,
    required this.blurb,
    required this.cta,
    required this.art,
  });

  final PillarKey key;

  /// The one-word pillar name: Move, Nourish, Connect, Pass it on.
  final String eyebrow;

  /// What it actually is, in the visitor's words.
  final String title;
  final String route;
  final String blurb;
  final String cta;

  /// Corner art: the same `public/images/pillars/pillar-*.png` the web card
  /// uses, so a pillar looks the same on both surfaces.
  final String art;
}

const List<Pillar> kPillars = [
  Pillar(
    key: PillarKey.move,
    eyebrow: 'Move',
    title: 'Yoga & Garbhasanskar',
    route: '/yoga',
    blurb: 'Prenatal, postnatal, Garbhasanskar and personalised sessions for every stage of pregnancy and recovery.',
    cta: 'Explore Yoga',
    art: 'assets/images/pillar-move.png',
  ),
  Pillar(
    key: PillarKey.nourish,
    eyebrow: 'Nourish',
    title: 'Maternal & Child Nutrition',
    route: '/nutrition',
    blurb: 'Pregnancy, postpartum, starting solids, baby and toddler nutrition. Practical and judgment-free.',
    cta: 'Explore Nutrition',
    art: 'assets/images/pillar-nourish.png',
  ),
  Pillar(
    key: PillarKey.connect,
    eyebrow: 'Connect',
    title: 'Mom Support Community',
    route: '/community',
    blurb: 'A supportive space for pregnancy, postpartum, babies, toddlers and everything else mom life brings.',
    cta: 'Join the Community',
    art: 'assets/images/pillar-connect.png',
  ),
  Pillar(
    key: PillarKey.passItOn,
    eyebrow: 'Pass it on',
    title: 'Preloved Marketplace',
    route: '/preloved',
    blurb: 'Buy, sell or donate gently used baby and maternity essentials. Loved before, loved again.',
    cta: 'Shop Preloved',
    art: 'assets/images/pillar-pass-it-on.png',
  ),
];

/// The homepage's "choose your stage" entry points (brief §3).
///
/// Phrased in the visitor's words rather than ours: someone arriving from a
/// reel knows they are six weeks postpartum, not that they want "Nourish".
class Stage {
  const Stage({required this.label, required this.covers, required this.route});

  final String label;
  final String covers;
  final String route;
}

const List<Stage> kStages = [
  Stage(
    label: "I'm pregnant",
    covers: 'Yoga · Garbhasanskar · Nutrition',
    route: '/yoga',
  ),
  Stage(
    label: "I'm postpartum",
    covers: 'Recovery · Yoga · Nutrition · Support',
    route: '/nutrition',
  ),
  Stage(
    label: 'My baby is starting solids',
    covers: 'Solids session · Baby nutrition · Meal ideas',
    route: '/nutrition/starting-solids',
  ),
  Stage(
    label: "I'm navigating toddlerhood",
    covers: 'Nutrition · Activities · Resources',
    route: '/nutrition',
  ),
  Stage(
    label: 'I need mom support',
    covers: 'Community · Events · Expert sessions',
    route: '/community',
  ),
  Stage(
    label: 'I want preloved',
    covers: 'Buy · Sell · Donate',
    route: '/preloved',
  ),
];

class Offering {
  const Offering({required this.title, required this.body, this.route});

  final String title;
  final String body;

  /// Set when the offering has its own screen (Starting Solids does).
  final String? route;
}

class PriceRow {
  const PriceRow(this.label, this.price, {this.from = false, this.unit});

  final String label;

  /// The figure alone, "₹799". Mirrors the web's `PriceRow`.
  final String price;

  /// Marks a starting price, so the qualifier is set in type rather than
  /// buried at the same size as the number it changes the meaning of. The
  /// brief (§10) flags every figure as a planning range; PRD decision D8.
  final bool from;

  /// What the figure buys, "per class" or "per month". Without it a ₹199 class
  /// rate sits beside a ₹799 monthly batch as though they were comparable.
  final String? unit;
}

/// A pillar page's content, in the order the web page renders it.
class ServicePage {
  const ServicePage({
    required this.eyebrow,
    required this.title,
    required this.subtitle,
    required this.intent,
    required this.primaryCta,
    this.heroImage,
    this.credentials = const [],
    this.offeringsHeading,
    this.offerings = const [],
    this.includesHeading,
    this.includes = const [],
    this.pricingHeading = 'Pricing',
    this.pricing = const [],
    this.pricingNote,
    this.safety,
    required this.closingTitle,
    required this.closingBody,
    required this.closingCta,
  });

  final String eyebrow;
  final String title;
  final String subtitle;
  final BookingIntent intent;
  final String primaryCta;
  final String? heroImage;
  final List<String> credentials;
  final String? offeringsHeading;
  final List<Offering> offerings;
  final String? includesHeading;
  final List<String> includes;
  final String pricingHeading;
  final List<PriceRow> pricing;
  final String? pricingNote;

  /// Brief §4: yoga is wellness support and does not replace medical care.
  /// This is also what keeps a pregnancy-adjacent app clean at store review.
  final String? safety;

  final String closingTitle;
  final String closingBody;
  final String closingCta;
}

const ServicePage kYoga = ServicePage(
  eyebrow: 'Move',
  title: 'Yoga for every stage of motherhood',
  subtitle: 'Move, breathe and reconnect with yourself through pregnancy, postpartum recovery and beyond.',
  intent: BookingIntent.yoga,
  primaryCta: 'Book a session',
  heroImage: 'assets/images/yoga-mobile.png',
  // Listed in the brief and flagged there as needing confirmation before
  // publication (PRD Q1). Nothing beyond this list without a source.
  credentials: [
    '200-Hour Yoga Certification',
    'Prenatal & Postnatal Training',
    'Garbhasanskar',
  ],
  offeringsHeading: 'What we offer',
  offerings: [
    Offering(
      title: 'Prenatal Yoga',
      body: 'Trimester-aware movement, breathwork, relaxation and mobility for pregnancy.',
    ),
    Offering(
      title: 'Postnatal Yoga',
      body: 'Gentle recovery, mobility, strength and core-focused movement as appropriate.',
    ),
    Offering(
      title: 'Garbhasanskar',
      body: 'Breathwork, affirmations, relaxation and mindful pregnancy practices.',
    ),
    Offering(
      title: 'Live Group Batches',
      body:
          'Small-group sessions with live guidance and structured sequencing.',
    ),
    Offering(
      title: 'Recorded Sessions',
      body: 'Practise at a time that suits you, with pregnancy and postpartum resources.',
    ),
    Offering(
      title: '1:1 Sessions',
      body: 'Personalised sessions for individual goals and needs, with medical clearance where appropriate.',
    ),
  ],
  pricing: [
    PriceRow('Trial / intro session', '₹299', from: true),
    PriceRow('Group class', '₹199', from: true, unit: 'per class'),
    PriceRow('Monthly batch', '₹799', from: true, unit: 'per month'),
    PriceRow('Garbhasanskar', '₹499', from: true),
    PriceRow('1:1 session', '₹699', from: true),
  ],
  pricingNote: "Starting prices. Final fees vary by batch, session length and format. We'll confirm before you book.",
  safety:
      'Our yoga sessions are wellness and fitness support. They do not replace medical care. '
      'If you have a high-risk pregnancy or any specific medical condition, please speak to '
      'your doctor before joining a class, and let us know anything we should work around.',
  closingTitle: 'Not sure which session fits?',
  closingBody: "Tell us your stage and what you're hoping for, and we'll point you to the right class.",
  closingCta: 'Talk to us',
);

const ServicePage kNutrition = ServicePage(
  eyebrow: 'Nourish',
  title: 'Nutrition for Mom & Baby',
  subtitle: 'Practical, judgment-free nutrition support for pregnancy, postpartum, babies and toddlers.',
  intent: BookingIntent.nutrition,
  primaryCta: 'Book a consultation',
  heroImage: 'assets/images/nutrition-mobile.png',
  offeringsHeading: 'How we can help',
  offerings: [
    Offering(
      title: 'Pregnancy Nutrition',
      body: 'Practical guidance for everyday nourishment through pregnancy.',
    ),
    Offering(
      title: 'Postpartum Nutrition',
      body: 'Recovery-focused, realistic food guidance for new moms.',
    ),
    Offering(
      title: 'Starting Solids',
      body: 'Readiness, first foods, textures, meal ideas, allergens and the questions everyone has.',
      route: '/nutrition/starting-solids',
    ),
    Offering(
      title: 'Baby & Toddler Nutrition',
      body: 'Practical, age-appropriate feeding support as your child grows.',
    ),
    Offering(
      title: '1:1 Consultations',
      body: "Personalised support based on your family's goals, routine and needs.",
    ),
  ],
  pricing: [
    PriceRow('Quick guidance', '₹299', from: true),
    PriceRow('1:1 consultation', '₹699', from: true),
    PriceRow('Starting Solids session', '₹799'),
    PriceRow('Mom + Baby bundle', '₹1,299', from: true),
    PriceRow('Monthly support', '₹1,499', from: true, unit: 'per month'),
  ],
  pricingNote: "Starting prices. Final fees depend on the format and how much follow-up you'd like. We'll confirm before you book.",
  closingTitle: 'Tell us where you are',
  closingBody: "Pregnancy, the fourth trimester, first spoons or a fussy toddler. We'll start from wherever you actually are.",
  closingCta: 'Book a consultation',
);

const ServicePage kStartingSolids = ServicePage(
  eyebrow: 'Nourish · Starting Solids',
  title: "Starting solids doesn't have to feel confusing",
  subtitle: 'Practical guidance on readiness, first foods, textures, meal ideas and all the questions that come with the first spoon.',
  intent: BookingIntent.solids,
  primaryCta: 'Book a Starting Solids session',
  includesHeading: 'What the session includes',
  includes: [
    'Readiness guidance and how to prepare for the transition.',
    'First foods and simple combinations that work.',
    'Texture progression and responsive feeding principles.',
    'Age-appropriate meal ideas and routines.',
    'Allergen-introduction guidance, and what to raise with your paediatrician.',
    'Common feeding concerns and practical troubleshooting.',
    "A personalised discussion based on your baby's stage and your family's routine.",
  ],
  pricingHeading: 'What it costs',
  pricing: [PriceRow('60-minute 1:1 session', '₹799')],
  pricingNote: "A lower-cost group workshop is planned once there's enough demand. Ask us if you'd prefer that.",
  closingTitle: 'First spoons, sorted',
  closingBody: "One session, your baby's stage, and a plan you can actually cook from this week.",
  closingCta: 'Book a Starting Solids session',
);

const ServicePage kCommunity = ServicePage(
  eyebrow: 'Connect',
  title: 'Find your village',
  subtitle: "Motherhood can be beautiful, overwhelming, confusing and everything in between. You don't have to figure it all out alone.",
  intent: BookingIntent.community,
  primaryCta: 'Join the community',
  includesHeading: 'What we talk about',
  includes: [
    'Pregnancy support and conversations.',
    'Postpartum support and everyday motherhood.',
    'Baby and toddler discussions.',
    'Food, nutrition and practical resources.',
    'Mom wellness and self-care.',
    'Mompreneur conversations and networking.',
    'Expert sessions, workshops and live events.',
  ],
  closingTitle: "You're not meant to do motherhood alone",
  closingBody: "Come in, say hello, and ask the question you've been searching the internet for.",
  closingCta: 'Join the community',
);

/// Community membership copy (brief §7). The paid tier is named as coming, not
/// sold: the brief says not to launch it until benefits and schedule are clear.
const String kCommunityFreeTitle = 'Free to join';
const String kCommunityFreeBody =
    "The community is free, and we'd like it to stay easy to join and easy to share with a friend "
    "who needs it. There's no membership to buy and nothing to unlock before you can ask your first question.";
const String kCommunityPlusBody =
    "We're working on an optional paid layer with exclusive workshops, a resource library and member "
    "events. It isn't open yet. When it is, you'll hear about it inside the community first.";

/// "Affordable support for real motherhood" (brief §14): three proof points,
/// each linking to what it prices. Mirrors `AffordableSupport` on the web.
class ProofPoint {
  const ProofPoint(this.figure, this.label, this.route);

  final String figure;
  final String label;
  final String route;
}

const String kAffordableTitle = 'Affordable support for real motherhood';
const String kAffordableBody =
    'Professional guidance, practical resources and thoughtful choices designed with moms in '
    'mind. Priced so that asking for help is never the expensive option.';

/// The selling figure is passed in rather than written: it is the monthly plan
/// from the shared contract, so it cannot drift from what sellers are charged.
List<ProofPoint> affordableProof(String monthlyPlan) => [
  const ProofPoint('from ₹299', 'A first yoga session', '/yoga'),
  const ProofPoint('Free', 'The mom community', '/community'),
  ProofPoint('from $monthlyPlan', 'To sell on the marketplace', '/sell'),
];

/// The closing band (brief §14). The web merges the brief's "Find your village"
/// and final-CTA blocks, which repeat one sentence, and points the button at
/// the community, which is what "find your village" actually asks for.
const String kVillageTitle = 'Motherhood was never meant to be done alone';
const String kVillageBody =
    "Come in, say hello, and ask the question you've been searching the internet for.";
