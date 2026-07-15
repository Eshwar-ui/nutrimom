import {
  PrismaClient,
  Role,
  Condition,
  DeliveryOption,
  ListingStatus,
} from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const categoryImages: Record<string, string[]> = {
  "baby-clothes": ["category-baby-clothes.png", "category-baby-clothes-source.png"],
  toys: ["category-toys.png", "category-toys-source.png"],
  books: ["category-toys-source.png", "category-toys.png"],
  "feeding-essentials": ["category-baby-nutrition.png", "category-baby-nutrition-source.png"],
  strollers: ["category-strollers.png", "category-strollers-source.png"],
  walkers: ["category-toys.png", "category-toys-source.png"],
  "car-seats": ["category-car-seats.png", "category-car-seats-source.png"],
  cradles: ["nutrimom-hero-products.png", "bg-element-sage-pram.png"],
  cots: ["nutrimom-hero-products.png", "marketplace-benefits-banner.png"],
  "high-chairs": ["category-high-chairs.png", "category-high-chairs-source.png"],
  "baby-carriers": ["category-postnatal.png", "category-postnatal-source.png"],
  "breast-pumps": ["category-lactation.png", "category-lactation-source.png"],
  "nursing-pillows": ["category-postnatal.png", "category-postnatal-source.png"],
  "maternity-wear": ["category-prenatal.png", "category-prenatal-source.png"],
  "pregnancy-pillows": ["category-wellness.png", "category-wellness-source.png"],
  "nursery-furniture": ["nutrimom-hero-products.png", "marketplace-benefits-banner.png"],
};

const img = (categorySlug: string, n = 3) => {
  const choices = categoryImages[categorySlug] ?? ["category-bg.png"];
  return Array.from({ length: n }, (_, index) => `/images/${choices[index % choices.length]}`);
};

const categories = [
  { name: "Baby Clothes", slug: "baby-clothes" },
  { name: "Toys", slug: "toys" },
  { name: "Books", slug: "books" },
  { name: "Feeding Essentials", slug: "feeding-essentials" },
  { name: "Strollers", slug: "strollers" },
  { name: "Walkers", slug: "walkers" },
  { name: "Car Seats", slug: "car-seats" },
  { name: "Cradles", slug: "cradles" },
  { name: "Cots", slug: "cots" },
  { name: "High Chairs", slug: "high-chairs" },
  { name: "Baby Carriers", slug: "baby-carriers" },
  { name: "Breast Pumps", slug: "breast-pumps" },
  { name: "Nursing Pillows", slug: "nursing-pillows" },
  { name: "Maternity Wear", slug: "maternity-wear" },
  { name: "Pregnancy Pillows", slug: "pregnancy-pillows" },
  { name: "Nursery Furniture", slug: "nursery-furniture" },
  { name: "Other Baby Essentials", slug: "other-baby-essentials" },
];

const sellers = [
  {
    email: "ananya@nurture.local",
    name: "Ananya Menon",
    city: "Bengaluru",
    whatsappNumber: "+91 98450 21837",
    isSellerVerified: true,
    bio: "Mum of two. Selling gently used pieces my little ones have outgrown.",
  },
  {
    email: "ritika@nurture.local",
    name: "Ritika Bansal",
    city: "Pune",
    whatsappNumber: "+91 90280 44712",
    isSellerVerified: true,
    bio: "Everything here is smoke-free home, cleaned and sanitised.",
  },
  {
    email: "fatima@nurture.local",
    name: "Fatima Sheikh",
    city: "Hyderabad",
    whatsappNumber: "+91 99590 13366",
    isSellerVerified: false,
    bio: "First-time seller, happy to share more photos on request.",
  },
  {
    email: "meera@nurture.local",
    name: "Meera Iyer",
    city: "Chennai",
    whatsappNumber: "+91 94440 27158",
    isSellerVerified: true,
    bio: "Careful with my little one's things — everything is clean and complete.",
  },
  {
    email: "aisha@nurture.local",
    name: "Aisha Qureshi",
    city: "Mumbai",
    whatsappNumber: "+91 98200 61294",
    isSellerVerified: true,
    bio: "Decluttering after baby number two. Pickup easy in the western suburbs.",
  },
  {
    email: "nisha@nurture.local",
    name: "Nisha Verma",
    city: "Delhi",
    whatsappNumber: "+91 98110 43827",
    isSellerVerified: false,
    bio: "Happy to share extra photos or a video call before you buy.",
  },
];

type SeedListing = {
  title: string;
  categorySlug: string;
  sellerEmail: string;
  condition: Condition;
  originalRupees?: number;
  sellingRupees: number;
  city: string;
  delivery: DeliveryOption;
  usageDuration?: string;
  reason?: string;
  status?: ListingStatus;
  featured?: boolean;
  desc: string;
};

const listings: SeedListing[] = [
  {
    title: "Chicco Bravo Stroller — Navy",
    categorySlug: "strollers",
    sellerEmail: "ananya@nurture.local",
    condition: Condition.LIKE_NEW,
    originalRupees: 18999,
    sellingRupees: 8500,
    city: "Bengaluru",
    delivery: DeliveryOption.BOTH,
    usageDuration: "8 months",
    reason: "Baby prefers the carrier now",
    status: ListingStatus.APPROVED,
    featured: true,
    desc: "Smooth one-hand fold, reclining seat, and rain cover included. Wheels and brakes in perfect working order.",
  },
  {
    title: "Medela Swing Electric Breast Pump",
    categorySlug: "breast-pumps",
    sellerEmail: "ritika@nurture.local",
    condition: Condition.GOOD,
    originalRupees: 11500,
    sellingRupees: 4200,
    city: "Pune",
    delivery: DeliveryOption.DELIVERY,
    usageDuration: "5 months",
    reason: "Done nursing",
    status: ListingStatus.APPROVED,
    featured: true,
    desc: "Single electric pump. All parts sanitised; new tubing and shields recommended for hygiene (easily available).",
  },
  {
    title: "Set of 12 Cotton Onesies (0–6m)",
    categorySlug: "baby-clothes",
    sellerEmail: "ananya@nurture.local",
    condition: Condition.GOOD,
    originalRupees: 3600,
    sellingRupees: 1200,
    city: "Bengaluru",
    delivery: DeliveryOption.PICKUP,
    usageDuration: "4 months",
    reason: "Outgrown",
    status: ListingStatus.APPROVED,
    desc: "Soft, breathable cotton onesies in pastel shades. Minor fading, no stains or tears.",
  },
  {
    title: "Graco Convertible Car Seat",
    categorySlug: "car-seats",
    sellerEmail: "ritika@nurture.local",
    condition: Condition.LIKE_NEW,
    originalRupees: 14999,
    sellingRupees: 6800,
    city: "Pune",
    delivery: DeliveryOption.BOTH,
    usageDuration: "1 year",
    reason: "Upgraded to booster",
    status: ListingStatus.APPROVED,
    featured: true,
    desc: "Rear and forward facing, 5-point harness. Never in an accident. Covers machine-washed.",
  },
  {
    title: "Wooden High Chair — Beech",
    categorySlug: "high-chairs",
    sellerEmail: "fatima@nurture.local",
    condition: Condition.GOOD,
    originalRupees: 6500,
    sellingRupees: 2500,
    city: "Hyderabad",
    delivery: DeliveryOption.PICKUP,
    usageDuration: "10 months",
    reason: "Space constraints",
    status: ListingStatus.APPROVED,
    desc: "Sturdy adjustable-height wooden high chair with removable tray. Some light scuffs on legs.",
  },
  {
    title: "Ergobaby Omni 360 Carrier",
    categorySlug: "baby-carriers",
    sellerEmail: "ananya@nurture.local",
    condition: Condition.LIKE_NEW,
    originalRupees: 12999,
    sellingRupees: 5500,
    city: "Bengaluru",
    delivery: DeliveryOption.DELIVERY,
    usageDuration: "6 months",
    reason: "Received a second one",
    status: ListingStatus.APPROVED,
    desc: "All-position carrier with lumbar support. Freshly washed, buckles and straps like new.",
  },
  {
    title: "Boppy Nursing Pillow with Cover",
    categorySlug: "nursing-pillows",
    sellerEmail: "ritika@nurture.local",
    condition: Condition.GOOD,
    originalRupees: 2800,
    sellingRupees: 900,
    city: "Pune",
    delivery: DeliveryOption.PICKUP,
    usageDuration: "7 months",
    reason: "No longer needed",
    status: ListingStatus.APPROVED,
    desc: "Comfortable nursing and propping pillow. Removable cover, freshly laundered.",
  },
  {
    title: "Maternity Dress Bundle (M) — 4 pieces",
    categorySlug: "maternity-wear",
    sellerEmail: "fatima@nurture.local",
    condition: Condition.LIKE_NEW,
    originalRupees: 5200,
    sellingRupees: 1800,
    city: "Hyderabad",
    delivery: DeliveryOption.BOTH,
    usageDuration: "One pregnancy",
    reason: "Family complete",
    status: ListingStatus.APPROVED,
    desc: "Four comfortable maternity dresses, size M. Worn a handful of times each. Smoke-free home.",
  },
  {
    title: "Pregnancy Wedge & Full-Body Pillow",
    categorySlug: "pregnancy-pillows",
    sellerEmail: "ananya@nurture.local",
    condition: Condition.GOOD,
    originalRupees: 3200,
    sellingRupees: 1100,
    city: "Bengaluru",
    delivery: DeliveryOption.PICKUP,
    usageDuration: "One pregnancy",
    reason: "No longer needed",
    status: ListingStatus.APPROVED,
    desc: "U-shaped full body pillow plus wedge. Washed cover included. Great back and belly support.",
  },
  {
    title: "Fisher-Price Baby Walker",
    categorySlug: "walkers",
    sellerEmail: "ritika@nurture.local",
    condition: Condition.GOOD,
    originalRupees: 4200,
    sellingRupees: 1500,
    city: "Pune",
    delivery: DeliveryOption.PICKUP,
    usageDuration: "5 months",
    reason: "Baby walking now",
    status: ListingStatus.APPROVED,
    desc: "Height-adjustable walker with activity tray. All toys and sounds working.",
  },
  {
    title: "Wooden Cradle with Mosquito Net",
    categorySlug: "cradles",
    sellerEmail: "fatima@nurture.local",
    condition: Condition.GOOD,
    originalRupees: 7800,
    sellingRupees: 3000,
    city: "Hyderabad",
    delivery: DeliveryOption.PICKUP,
    usageDuration: "9 months",
    reason: "Moved to a cot",
    status: ListingStatus.APPROVED,
    desc: "Traditional swinging cradle in solid wood, with net and hanging hooks. Gentle wear.",
  },
  {
    title: "Board Books Bundle — 15 titles",
    categorySlug: "books",
    sellerEmail: "ananya@nurture.local",
    condition: Condition.GOOD,
    originalRupees: 4500,
    sellingRupees: 1400,
    city: "Bengaluru",
    delivery: DeliveryOption.DELIVERY,
    usageDuration: "1.5 years",
    reason: "Outgrown",
    status: ListingStatus.APPROVED,
    desc: "Fifteen sturdy board books including touch-and-feel favourites. A couple have loved-but-intact corners.",
  },
  {
    title: "Avent Bottle Feeding Set",
    categorySlug: "feeding-essentials",
    sellerEmail: "ritika@nurture.local",
    condition: Condition.LIKE_NEW,
    originalRupees: 3800,
    sellingRupees: 1300,
    city: "Pune",
    delivery: DeliveryOption.BOTH,
    usageDuration: "3 months",
    reason: "Switched to nursing",
    status: ListingStatus.APPROVED,
    desc: "Set of bottles, steriliser-safe, plus warmer. Teats are new/unused; sold sanitised.",
  },
  // Pending — for the admin approval queue demo
  {
    title: "IKEA Sniglar Cot with Mattress",
    categorySlug: "cots",
    sellerEmail: "fatima@nurture.local",
    condition: Condition.GOOD,
    originalRupees: 9500,
    sellingRupees: 3800,
    city: "Hyderabad",
    delivery: DeliveryOption.PICKUP,
    usageDuration: "1 year",
    reason: "Toddler bed now",
    status: ListingStatus.PENDING,
    desc: "Solid cot with adjustable base height and a clean mattress. Assembles easily. Minor marks.",
  },
  {
    title: "Convertible Nursery Dresser",
    categorySlug: "nursery-furniture",
    sellerEmail: "ananya@nurture.local",
    condition: Condition.GOOD,
    originalRupees: 15000,
    sellingRupees: 6000,
    city: "Bengaluru",
    delivery: DeliveryOption.PICKUP,
    usageDuration: "2 years",
    reason: "Redecorating",
    status: ListingStatus.PENDING,
    desc: "Six-drawer dresser that doubles as a changing station. Solid and roomy; some surface wear on top.",
  },

  // ---- Extra stock so each popular category has siblings (related products) ----

  // Feeding essentials
  { title: "Dr. Brown's Anti-Colic Bottle Set (6)", categorySlug: "feeding-essentials", sellerEmail: "meera@nurture.local", condition: Condition.LIKE_NEW, originalRupees: 2800, sellingRupees: 1100, city: "Chennai", delivery: DeliveryOption.BOTH, usageDuration: "4 months", reason: "Baby moved to sippy cups", desc: "Full anti-colic set with wide-neck bottles. Sanitised; new teats included in original packing." },
  { title: "Munchkin Bottle Steriliser & Dryer", categorySlug: "feeding-essentials", sellerEmail: "aisha@nurture.local", condition: Condition.GOOD, originalRupees: 4500, sellingRupees: 1900, city: "Mumbai", delivery: DeliveryOption.PICKUP, usageDuration: "8 months", reason: "Done with bottles", desc: "Electric steriliser and dryer combo. Descaled and cleaned; works perfectly." },
  { title: "Silicone Weaning Bowls & Spoons (8pc)", categorySlug: "feeding-essentials", sellerEmail: "nisha@nurture.local", condition: Condition.NEW, originalRupees: 1600, sellingRupees: 950, city: "Delhi", delivery: DeliveryOption.DELIVERY, reason: "Duplicate gift", status: ListingStatus.APPROVED, featured: true, desc: "Brand-new suction bowls with soft-tip spoons. Never used, still boxed." },
  { title: "Philips Avent Fast Bottle Warmer", categorySlug: "feeding-essentials", sellerEmail: "ananya@nurture.local", condition: Condition.LIKE_NEW, originalRupees: 3200, sellingRupees: 1500, city: "Bengaluru", delivery: DeliveryOption.BOTH, usageDuration: "6 months", reason: "Switched to room-temp feeds", desc: "Warms milk evenly in minutes. Barely used, all parts intact." },

  // Strollers
  { title: "Babyhug Symphony Stroller Pram", categorySlug: "strollers", sellerEmail: "meera@nurture.local", condition: Condition.GOOD, originalRupees: 9500, sellingRupees: 3800, city: "Chennai", delivery: DeliveryOption.PICKUP, usageDuration: "1 year", reason: "Baby prefers walking", desc: "Reversible handle, reclining seat and canopy. Wheels smooth; light fabric wear." },
  { title: "Luvlap Sunshine Stroller — Red", categorySlug: "strollers", sellerEmail: "nisha@nurture.local", condition: Condition.LIKE_NEW, originalRupees: 6000, sellingRupees: 2600, city: "Delhi", delivery: DeliveryOption.BOTH, usageDuration: "5 months", reason: "Gifted a travel system", status: ListingStatus.APPROVED, featured: true, desc: "Lightweight three-position recline stroller with 5-point harness. Like new." },
  { title: "R for Rabbit Pocket Stroller (Cabin)", categorySlug: "strollers", sellerEmail: "aisha@nurture.local", condition: Condition.LIKE_NEW, originalRupees: 8000, sellingRupees: 3900, city: "Mumbai", delivery: DeliveryOption.DELIVERY, usageDuration: "7 months", reason: "Bought a jogger", desc: "Ultra-compact cabin-friendly fold. Aeroplane approved. Minimal use." },
  { title: "Joie Nitro Lightweight Stroller", categorySlug: "strollers", sellerEmail: "ananya@nurture.local", condition: Condition.GOOD, originalRupees: 11000, sellingRupees: 4700, city: "Bengaluru", delivery: DeliveryOption.PICKUP, usageDuration: "1.5 years", reason: "Toddler outgrew it", desc: "One-hand fold, large canopy and basket. Well maintained with minor scuffs." },

  // Baby clothes
  { title: "Winter Fleece Rompers Bundle (6–12m)", categorySlug: "baby-clothes", sellerEmail: "nisha@nurture.local", condition: Condition.GOOD, originalRupees: 2800, sellingRupees: 950, city: "Delhi", delivery: DeliveryOption.DELIVERY, usageDuration: "One winter", reason: "Outgrown", desc: "Six warm fleece rompers with fold-over mittens. Cosy and clean, gentle wash wear." },
  { title: "Carter's Baby Girl Dresses (5)", categorySlug: "baby-clothes", sellerEmail: "meera@nurture.local", condition: Condition.LIKE_NEW, originalRupees: 3500, sellingRupees: 1400, city: "Chennai", delivery: DeliveryOption.BOTH, usageDuration: "3 months", reason: "Grew too fast", desc: "Five party-ready dresses, sizes 9–12m. Barely worn, no stains." },
  { title: "Newborn Mittens, Caps & Socks Set", categorySlug: "baby-clothes", sellerEmail: "aisha@nurture.local", condition: Condition.NEW, originalRupees: 1200, sellingRupees: 700, city: "Mumbai", delivery: DeliveryOption.DELIVERY, reason: "Extra shower gift", desc: "Unused newborn accessory set in soft cotton. Tags still on." },
  { title: "Ethnic Wear Set for Toddler (1–2y)", categorySlug: "baby-clothes", sellerEmail: "fatima@nurture.local", condition: Condition.LIKE_NEW, originalRupees: 2600, sellingRupees: 1100, city: "Hyderabad", delivery: DeliveryOption.PICKUP, usageDuration: "Festive season", reason: "Outgrown", featured: true, desc: "Two festive kurta sets worn once each for functions. Immaculate." },

  // Toys
  { title: "Fisher-Price Rock-a-Stack & Cups", categorySlug: "toys", sellerEmail: "ananya@nurture.local", condition: Condition.GOOD, originalRupees: 1500, sellingRupees: 500, city: "Bengaluru", delivery: DeliveryOption.PICKUP, usageDuration: "10 months", reason: "Outgrown", desc: "Classic stacking ring and nesting cups. All pieces present, cleaned." },
  { title: "Wooden Activity Cube — 5-in-1", categorySlug: "toys", sellerEmail: "meera@nurture.local", condition: Condition.LIKE_NEW, originalRupees: 3800, sellingRupees: 1600, city: "Chennai", delivery: DeliveryOption.BOTH, usageDuration: "6 months", reason: "Baby lost interest", featured: true, desc: "Bead maze, shapes, gears and clock in solid wood. Sturdy and spotless." },
  { title: "Soft Plush Toy Bundle (6 pieces)", categorySlug: "toys", sellerEmail: "aisha@nurture.local", condition: Condition.GOOD, originalRupees: 2200, sellingRupees: 700, city: "Mumbai", delivery: DeliveryOption.DELIVERY, usageDuration: "1 year", reason: "Too many toys", desc: "Six cuddly plush toys, freshly machine-washed. Great cot companions." },
  { title: "Musical Baby Gym & Play Mat", categorySlug: "toys", sellerEmail: "nisha@nurture.local", condition: Condition.LIKE_NEW, originalRupees: 4200, sellingRupees: 1900, city: "Delhi", delivery: DeliveryOption.PICKUP, usageDuration: "5 months", reason: "Baby crawling now", desc: "Padded play mat with hanging toys and lights-and-sounds arch. Like new." },
  { title: "Mega Bloks First Builders Bag (80pc)", categorySlug: "toys", sellerEmail: "ritika@nurture.local", condition: Condition.GOOD, originalRupees: 2600, sellingRupees: 900, city: "Pune", delivery: DeliveryOption.BOTH, usageDuration: "1.5 years", reason: "Moved to smaller bricks", desc: "Eighty chunky building blocks in the storage bag. Full count, wiped clean." },

  // Car seats
  { title: "Infant Car Seat with Base — Grey", categorySlug: "car-seats", sellerEmail: "meera@nurture.local", condition: Condition.LIKE_NEW, originalRupees: 9000, sellingRupees: 4200, city: "Chennai", delivery: DeliveryOption.BOTH, usageDuration: "8 months", reason: "Baby outgrew infant seat", featured: true, desc: "Rear-facing infant seat with click-in base. Never in an accident, covers washed." },
  { title: "Chicco KeyFit 30 Car Seat", categorySlug: "car-seats", sellerEmail: "aisha@nurture.local", condition: Condition.GOOD, originalRupees: 13000, sellingRupees: 5500, city: "Mumbai", delivery: DeliveryOption.PICKUP, usageDuration: "1 year", reason: "Upgraded to convertible", desc: "Trusted infant seat with easy-install base. Some wear on fabric, fully functional." },
  { title: "Booster Car Seat (Group 2/3)", categorySlug: "car-seats", sellerEmail: "nisha@nurture.local", condition: Condition.GOOD, originalRupees: 5500, sellingRupees: 2100, city: "Delhi", delivery: DeliveryOption.DELIVERY, usageDuration: "1.5 years", reason: "Child grew taller", desc: "High-back booster with adjustable headrest. Clean and sturdy." },
  { title: "Britax Convertible Car Seat", categorySlug: "car-seats", sellerEmail: "ananya@nurture.local", condition: Condition.LIKE_NEW, originalRupees: 17000, sellingRupees: 7800, city: "Bengaluru", delivery: DeliveryOption.BOTH, usageDuration: "1 year", reason: "Second car seat spare", desc: "Rear and forward facing with steel frame. Excellent condition, no accidents." },

  // High chairs
  { title: "Chicco Polly Highchair — Grey", categorySlug: "high-chairs", sellerEmail: "meera@nurture.local", condition: Condition.LIKE_NEW, originalRupees: 8500, sellingRupees: 3600, city: "Chennai", delivery: DeliveryOption.PICKUP, usageDuration: "9 months", reason: "Baby moved to booster", featured: true, desc: "Multi-recline, height-adjustable chair with dishwasher-safe tray. Great shape." },
  { title: "Foldable Portable Feeding Chair", categorySlug: "high-chairs", sellerEmail: "aisha@nurture.local", condition: Condition.GOOD, originalRupees: 3200, sellingRupees: 1200, city: "Mumbai", delivery: DeliveryOption.BOTH, usageDuration: "1 year", reason: "Space saving", desc: "Compact fold-flat high chair, ideal for travel. Wipes clean, minor scuffs." },
  { title: "Booster Seat with Tray (Clip-on)", categorySlug: "high-chairs", sellerEmail: "nisha@nurture.local", condition: Condition.GOOD, originalRupees: 2400, sellingRupees: 850, city: "Delhi", delivery: DeliveryOption.DELIVERY, usageDuration: "10 months", reason: "Outgrown", desc: "Straps to a dining chair with removable tray. Sturdy and cleaned." },
  { title: "IKEA Antilop High Chair + Tray", categorySlug: "high-chairs", sellerEmail: "ritika@nurture.local", condition: Condition.GOOD, originalRupees: 1800, sellingRupees: 700, city: "Pune", delivery: DeliveryOption.PICKUP, usageDuration: "1 year", reason: "Decluttering", desc: "The famously easy-to-clean high chair with tray. Legs wipe off in seconds." },

  // Baby carriers
  { title: "Ring Sling Carrier — Organic Cotton", categorySlug: "baby-carriers", sellerEmail: "meera@nurture.local", condition: Condition.LIKE_NEW, originalRupees: 3500, sellingRupees: 1400, city: "Chennai", delivery: DeliveryOption.DELIVERY, usageDuration: "4 months", reason: "Prefer structured carrier", desc: "Breathable handwoven ring sling. Freshly washed, no snags." },
  { title: "Luvlap 4-in-1 Baby Carrier", categorySlug: "baby-carriers", sellerEmail: "nisha@nurture.local", condition: Condition.GOOD, originalRupees: 2600, sellingRupees: 900, city: "Delhi", delivery: DeliveryOption.BOTH, usageDuration: "8 months", reason: "No longer needed", featured: true, desc: "Four carry positions with padded straps. Buckles solid, light wear." },
  { title: "Structured Hip Seat Carrier", categorySlug: "baby-carriers", sellerEmail: "aisha@nurture.local", condition: Condition.LIKE_NEW, originalRupees: 4200, sellingRupees: 1800, city: "Mumbai", delivery: DeliveryOption.PICKUP, usageDuration: "6 months", reason: "Baby walking", desc: "Ergonomic hip seat with lumbar support and storage pocket. Barely used." },
  { title: "Stretchy Wrap Carrier — Grey", categorySlug: "baby-carriers", sellerEmail: "ananya@nurture.local", condition: Condition.GOOD, originalRupees: 2800, sellingRupees: 1000, city: "Bengaluru", delivery: DeliveryOption.DELIVERY, usageDuration: "5 months", reason: "Moved to buckle carrier", desc: "Soft newborn wrap, machine washed. Ideal for the first few months." },

  // Books
  { title: "Usborne That's Not My... Series (6)", categorySlug: "books", sellerEmail: "meera@nurture.local", condition: Condition.GOOD, originalRupees: 3000, sellingRupees: 1200, city: "Chennai", delivery: DeliveryOption.DELIVERY, usageDuration: "1 year", reason: "Read and outgrown", featured: true, desc: "Six touchy-feely board books, a bedtime favourite. Corners loved but intact." },
  { title: "Cloth Books for Infants (Set of 4)", categorySlug: "books", sellerEmail: "aisha@nurture.local", condition: Condition.LIKE_NEW, originalRupees: 1400, sellingRupees: 650, city: "Mumbai", delivery: DeliveryOption.BOTH, usageDuration: "6 months", reason: "Outgrown", desc: "Crinkly soft cloth books, machine washable. Great for tummy time." },
  { title: "Bedtime Story Collection (10 books)", categorySlug: "books", sellerEmail: "nisha@nurture.local", condition: Condition.GOOD, originalRupees: 3500, sellingRupees: 1300, city: "Delhi", delivery: DeliveryOption.DELIVERY, usageDuration: "2 years", reason: "Making shelf space", desc: "Ten illustrated hardcover stories. A couple of gently dog-eared pages." },
  { title: "Peek-a-Boo Flap Books Bundle", categorySlug: "books", sellerEmail: "ritika@nurture.local", condition: Condition.GOOD, originalRupees: 2000, sellingRupees: 800, city: "Pune", delivery: DeliveryOption.PICKUP, usageDuration: "1 year", reason: "Outgrown", desc: "Sturdy lift-the-flap books, all flaps present and working." },
];

async function main() {
  const categoryBySlug = new Map<string, string>();
  for (const c of categories) {
    const row = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name },
      create: c,
    });
    categoryBySlug.set(c.slug, row.id);
  }

  const password = await bcrypt.hash("password123", 10);
  const sellerByEmail = new Map<string, string>();
  for (const s of sellers) {
    const row = await prisma.user.upsert({
      where: { email: s.email },
      update: {
        city: s.city,
        whatsappNumber: s.whatsappNumber,
        isSellerVerified: s.isSellerVerified,
        bio: s.bio,
        // Seeded sellers are treated as registered so the demo isn't gated.
        registrationPaidAt: new Date(),
      },
      create: {
        email: s.email,
        name: s.name,
        passwordHash: password,
        city: s.city,
        whatsappNumber: s.whatsappNumber,
        isSellerVerified: s.isSellerVerified,
        bio: s.bio,
        registrationPaidAt: new Date(),
      },
    });
    sellerByEmail.set(s.email, row.id);

    // Grant an active YEARLY membership if they don't already have a live one,
    // so seeded sellers can list without paying (idempotent across re-seeds).
    const active = await prisma.sellerMembership.findFirst({
      where: { userId: row.id, expiresAt: { gt: new Date() } },
    });
    if (!active) {
      await prisma.sellerMembership.create({
        data: {
          userId: row.id,
          plan: "YEARLY",
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  // Admin
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@nurture.local";
  const adminPassword = await bcrypt.hash(
    process.env.ADMIN_PASSWORD ?? "admin12345",
    10,
  );
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: Role.ADMIN },
    create: {
      email: adminEmail,
      name: "Nurture Admin",
      passwordHash: adminPassword,
      role: Role.ADMIN,
    },
  });

  // Additive & idempotent: create each listing only if its title isn't
  // already present, so re-seeding tops up new items without duplicating.
  let created = 0;
  for (const l of listings) {
    const exists = await prisma.listing.findFirst({
      where: { title: l.title },
      select: { id: true },
    });
    if (exists) continue;
    await prisma.listing.create({
      data: {
        title: l.title,
        description: l.desc,
        categoryId: categoryBySlug.get(l.categorySlug)!,
        sellerId: sellerByEmail.get(l.sellerEmail)!,
        condition: l.condition,
        originalPriceInPaise: l.originalRupees
          ? l.originalRupees * 100
          : null,
        sellingPriceInPaise: l.sellingRupees * 100,
        usageDuration: l.usageDuration,
        reasonForSelling: l.reason,
        city: l.city,
        deliveryOption: l.delivery,
        images: img(l.categorySlug, 3),
        status: l.status ?? ListingStatus.APPROVED,
        isFeatured: l.featured ?? false,
      },
    });
    created++;
  }

  // Keep sample imagery relevant when the design assets evolve.
  for (const listing of listings) {
    await prisma.listing.updateMany({
      where: { title: listing.title },
      data: { images: img(listing.categorySlug, 3) },
    });
  }

  console.log(
    `Seeded ${categories.length} categories, ${sellers.length} sellers, ${created} new listing(s) added (${listings.length} defined), admin=${adminEmail}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
