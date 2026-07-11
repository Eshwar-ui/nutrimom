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
      },
      create: {
        email: s.email,
        name: s.name,
        passwordHash: password,
        city: s.city,
        whatsappNumber: s.whatsappNumber,
        isSellerVerified: s.isSellerVerified,
        bio: s.bio,
      },
    });
    sellerByEmail.set(s.email, row.id);
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

  // Only create listings on a fresh database to stay idempotent.
  if ((await prisma.listing.count()) === 0) {
    for (const l of listings) {
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
    }
  }

  // Keep sample imagery relevant when the design assets evolve.
  for (const listing of listings) {
    await prisma.listing.updateMany({
      where: { title: listing.title },
      data: { images: img(listing.categorySlug, 3) },
    });
  }

  console.log(
    `Seeded ${categories.length} categories, ${sellers.length} sellers, ${listings.length} listings, admin=${adminEmail}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
