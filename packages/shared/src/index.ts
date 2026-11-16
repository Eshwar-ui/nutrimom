import { z } from "zod";

/* ------------------------------------------------------------------ */
/* Enums                                                               */
/* ------------------------------------------------------------------ */

export const Role = { CUSTOMER: "CUSTOMER", ADMIN: "ADMIN" } as const;
export type Role = (typeof Role)[keyof typeof Role];

export const Condition = {
  NEW: "NEW",
  LIKE_NEW: "LIKE_NEW",
  GOOD: "GOOD",
  FAIR: "FAIR",
} as const;
export type Condition = (typeof Condition)[keyof typeof Condition];

// Plain words a buyer understands at a glance (REDESIGN-PLAN.md phase 5).
// Labels only — the enum values are the wire contract and do not change.
export const conditionLabels: Record<Condition, string> = {
  NEW: "New",
  LIKE_NEW: "Like new",
  GOOD: "Gently used",
  FAIR: "Well used",
};

export const DeliveryOption = {
  PICKUP: "PICKUP",
  DELIVERY: "DELIVERY",
  BOTH: "BOTH",
} as const;
export type DeliveryOption =
  (typeof DeliveryOption)[keyof typeof DeliveryOption];

export const deliveryLabels: Record<DeliveryOption, string> = {
  PICKUP: "Pickup only",
  DELIVERY: "Delivery available",
  BOTH: "Pickup or delivery",
};

export const ListingStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  RESERVED: "RESERVED",
  SOLD: "SOLD",
} as const;
export type ListingStatus =
  (typeof ListingStatus)[keyof typeof ListingStatus];

export const OrderStatus = {
  PENDING: "PENDING",
  PAID: "PAID",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const PaymentMethod = {
  // Retired. Kept only so the enum value stays valid for any historical row;
  // nothing in the app can select it — OrdersService.create hard-codes ONLINE.
  COD: "COD",
  // The only method. Every purchase goes through the payment gateway and an
  // order is processed only after payment is confirmed.
  ONLINE: "ONLINE",
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  COD: "Cash on Delivery",
  ONLINE: "Online payment",
};

/* ------------------------------------------------------------------ */
/* Seller monetization — registration fee + membership plans           */
/* ------------------------------------------------------------------ */

// One-time seller registration fee (paise). Server-authoritative.
export const REGISTRATION_FEE_PAISE = 10000; // ₹100

export const MembershipPlan = {
  MONTHLY: "MONTHLY",
  QUARTERLY: "QUARTERLY",
  HALF_YEARLY: "HALF_YEARLY",
  YEARLY: "YEARLY",
} as const;
export type MembershipPlan =
  (typeof MembershipPlan)[keyof typeof MembershipPlan];

// Server-authoritative plan catalogue — price + duration + label. The client
// only ever sends a plan key; amounts are never trusted from the client.
export interface MembershipPlanInfo {
  plan: MembershipPlan;
  label: string;
  priceInPaise: number;
  durationDays: number;
  bestValue?: boolean;
}

export const MEMBERSHIP_PLANS: Record<MembershipPlan, MembershipPlanInfo> = {
  MONTHLY: { plan: "MONTHLY", label: "Monthly", priceInPaise: 9900, durationDays: 30 },
  QUARTERLY: { plan: "QUARTERLY", label: "Quarterly", priceInPaise: 19900, durationDays: 90 },
  HALF_YEARLY: { plan: "HALF_YEARLY", label: "Half-Yearly", priceInPaise: 49900, durationDays: 180 },
  YEARLY: { plan: "YEARLY", label: "Yearly", priceInPaise: 99900, durationDays: 365, bestValue: true },
};

// Stable display order for the plans UI.
export const MEMBERSHIP_PLAN_ORDER: MembershipPlan[] = [
  "MONTHLY",
  "QUARTERLY",
  "HALF_YEARLY",
  "YEARLY",
];

export const membershipCheckoutSchema = z.object({
  plan: z.enum([
    MembershipPlan.MONTHLY,
    MembershipPlan.QUARTERLY,
    MembershipPlan.HALF_YEARLY,
    MembershipPlan.YEARLY,
  ]),
});
export type MembershipCheckoutInput = z.infer<typeof membershipCheckoutSchema>;

// Response for any seller-billing checkout (registration or membership). The
// gateway ids are provider-neutral; keyId is the public key the browser needs.
export interface SellerCheckoutResponse {
  sellerPaymentId: string;
  razorpayOrderId: string;
  amountInPaise: number;
  currency: string;
  keyId: string;
}

export const verifySellerPaymentSchema = z.object({
  sellerPaymentId: z.string().min(1),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});
export type VerifySellerPaymentInput = z.infer<
  typeof verifySellerPaymentSchema
>;

// Seller's current billing state — drives the Sell-page gate and account UI.
export interface SellerBillingStatus {
  registrationPaid: boolean;
  registrationFeePaise: number;
  // The single "verified seller" status: paid registration AND admin
  // approval (isSellerVerified). Both are required — paying alone or being
  // approved alone isn't enough. Can be true even while canList is false
  // (verified but no active membership).
  sellerVerified: boolean;
  activePlan: MembershipPlan | null;
  membershipExpiresAt: string | null; // ISO, null if none/expired
  // The most recent membership's end date, when it's the reason canList is
  // false (a lapsed plan) rather than "never subscribed" — lets the UI show
  // "expired on X — renew" instead of just silently hiding the status card.
  lastMembershipExpiredAt: string | null;
  canList: boolean; // sellerVerified && active membership
}

/* ------------------------------------------------------------------ */
/* Shipping / fulfilment                                               */
/* ------------------------------------------------------------------ */

export const ShipmentStatus = {
  PENDING: "PENDING",
  LABEL_GENERATED: "LABEL_GENERATED",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
} as const;
export type ShipmentStatus =
  (typeof ShipmentStatus)[keyof typeof ShipmentStatus];

export const shipmentStatusLabels: Record<ShipmentStatus, string> = {
  PENDING: "Awaiting label",
  LABEL_GENERATED: "Label ready",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
};

// Response of generating a label. labelHtml (manual provider) or labelUrl
// (courier provider) — the client opens whichever is present.
export interface GenerateLabelResponse {
  shipmentId: string;
  status: ShipmentStatus;
  courier: string;
  trackingId: string | null;
  labelUrl: string | null;
  labelHtml: string | null;
}

// One row in a seller's "sales to fulfil" list.
export interface SellerSale {
  orderId: string;
  orderNumber: string;
  createdAt: string;
  shipmentStatus: ShipmentStatus;
  courier: string | null;
  trackingId: string | null;
  shipToCity: string;
  shipToState: string;
  items: { title: string; unitPriceInPaise: number; image: string | null }[];
  // What this sale actually pays the seller, after commission. Null only for
  // legacy orders that predate the payout ledger.
  payout: {
    status: PayoutStatus;
    grossInPaise: number;
    commissionInPaise: number;
    netInPaise: number;
    paidAt: string | null;
  } | null;
}

/**
 * A COD order is confirmed the moment it's placed (no payment gate), so a
 * PENDING COD order reads as "placed" rather than "awaiting payment".
 */
export function orderStatusLabel(
  status: OrderStatus,
  paymentMethod?: PaymentMethod,
): string {
  if (status === OrderStatus.PENDING && paymentMethod === PaymentMethod.COD) {
    return "Order placed";
  }
  switch (status) {
    case OrderStatus.PENDING:
      return "Awaiting payment";
    case OrderStatus.PAID:
      return "Paid";
    case OrderStatus.SHIPPED:
      return "Shipped";
    case OrderStatus.DELIVERED:
      return "Delivered";
    case OrderStatus.CANCELLED:
      return "Cancelled";
  }
}

/** COD orders are considered confirmed once placed; online orders once paid. */
export function isOrderConfirmed(
  status: OrderStatus,
  paymentMethod?: PaymentMethod,
): boolean {
  if (status === OrderStatus.CANCELLED) return false;
  if (paymentMethod === PaymentMethod.COD) return true;
  return status !== OrderStatus.PENDING;
}

export const NotificationType = {
  LISTING_APPROVED: "LISTING_APPROVED",
  LISTING_REJECTED: "LISTING_REJECTED",
  ITEM_SOLD: "ITEM_SOLD",
  ORDER_PLACED: "ORDER_PLACED",
  ORDER_CANCELLED: "ORDER_CANCELLED",
  PAYMENT_REFUNDED: "PAYMENT_REFUNDED",
  SELLER_REGISTERED: "SELLER_REGISTERED",
  MEMBERSHIP_EXPIRING: "MEMBERSHIP_EXPIRING",
  MEMBERSHIP_EXPIRED: "MEMBERSHIP_EXPIRED",
  // To the admin, when a mother submits a DonationOffer.
  DONATION_OFFERED: "DONATION_OFFERED",
} as const;
export type NotificationType =
  (typeof NotificationType)[keyof typeof NotificationType];

/* ------------------------------------------------------------------ */
/* Auth & profile                                                      */
/* ------------------------------------------------------------------ */

export const registerSchema = z.object({
  name: z.string().min(2, "Enter your full name").max(80),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Use at least 8 characters").max(72),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const refreshSchema = z.object({ refreshToken: z.string().min(1) });
export type RefreshInput = z.infer<typeof refreshSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Use at least 8 characters").max(72),
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// Phone/WhatsApp number: accept an optional country code and common separators
// (spaces, hyphens, parens), then require 10–15 digits once normalised. Blocks
// junk like "++++----" that the old loose char-class regex let through.
export const phoneNumberSchema = z
  .string()
  .trim()
  .refine(
    (value) => /^\d{10,15}$/.test(value.replace(/[\s\-()]/g, "").replace(/^\+/, "")),
    "Enter a valid phone number, e.g. +91 98765 43210",
  );

// Delivery is currently limited to India. Accept a ten-digit Indian mobile
// number, with an optional +91 country code and common visual separators.
export const indianMobileNumberSchema = z
  .string()
  .trim()
  .refine(
    (value) => {
      const normalized = value.replace(/[\s\-()]/g, "");
      return /^(?:\+91)?[6-9]\d{9}$/.test(normalized);
    },
    "Enter a valid 10-digit Indian mobile number",
  );

export const profileUpdateSchema = z.object({
  name: z.string().min(2, "Enter your full name").max(80).optional(),
  whatsappNumber: phoneNumberSchema.optional().or(z.literal("")),
  city: z.string().max(80).optional().or(z.literal("")),
  bio: z.string().max(400).optional().or(z.literal("")),
  // Seller location defaults (prefill the listing form). Optional, and left
  // untouched when absent, so older clients that PATCH without them don't
  // wipe them. Spelled out inline rather than reusing localitySchema /
  // PINCODE_REGEX, which are declared further down this module.
  locality: z
    .string()
    .trim()
    .max(60, "Keep it to the area or neighbourhood (60 characters) — never your house address")
    .optional()
    .or(z.literal("")),
  pincode: z
    .string()
    .trim()
    .regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit PIN code")
    .optional()
    .or(z.literal("")),
});
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  whatsappNumber: string | null;
  city: string | null;
  bio: string | null;
  isSellerVerified: boolean;
  sellerVerificationRequestedAt: string | null;
  // ISO, null until the ₹100 registration fee is paid. Drives whether the
  // Sales/My-listings nav tabs show at all — see account-shell.tsx.
  registrationPaidAt: string | null;
  // The seller's last-used listing location, used to prefill the listing
  // form. Optional so an AuthUser built by an older API still type-checks.
  locality?: string | null;
  pincode?: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export const categoryInputSchema = z.object({
  name: z.string().min(2, "Enter a category name").max(60),
  slug: z
    .string()
    .min(2, "Enter a slug")
    .max(60)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only"),
});
export type CategoryInput = z.infer<typeof categoryInputSchema>;

/* ------------------------------------------------------------------ */
/* Location (cities, PIN codes)                                        */
/* ------------------------------------------------------------------ */

export interface IndianCity {
  name: string;
  state: string;
}

/**
 * Source for INDIAN_CITIES, grouped by state/UT so it can be audited: every
 * state and UT capital, plus cities of roughly 2 lakh people and up. Canonical
 * modern spellings only — the old names live in INDIAN_CITY_ALIASES. Kept
 * private: consumers get the flat, name-sorted list below.
 */
const CITIES_BY_STATE: Readonly<Record<string, readonly string[]>> = {
  "Andaman and Nicobar Islands": ["Sri Vijaya Puram"],
  "Andhra Pradesh": [
    "Adoni", "Amaravati", "Anantapur", "Bhimavaram", "Chittoor", "Eluru",
    "Guntur", "Hindupur", "Kadapa", "Kakinada", "Kurnool", "Machilipatnam",
    "Nandyal", "Nellore", "Ongole", "Proddatur", "Rajamahendravaram",
    "Srikakulam", "Tenali", "Tirupati", "Vijayawada", "Visakhapatnam",
    "Vizianagaram",
  ],
  "Arunachal Pradesh": ["Itanagar"],
  Assam: ["Dibrugarh", "Dispur", "Guwahati", "Jorhat", "Silchar"],
  Bihar: [
    "Arrah", "Begusarai", "Bhagalpur", "Bihar Sharif", "Chapra", "Darbhanga",
    "Gaya", "Hajipur", "Katihar", "Munger", "Muzaffarpur", "Patna", "Purnia",
    "Sasaram",
  ],
  Chandigarh: ["Chandigarh"],
  Chhattisgarh: [
    "Bhilai", "Bilaspur", "Durg", "Jagdalpur", "Korba", "Raigarh", "Raipur",
    "Rajnandgaon",
  ],
  "Dadra and Nagar Haveli and Daman and Diu": ["Daman", "Silvassa"],
  Delhi: ["Delhi", "New Delhi"],
  Goa: ["Margao", "Panaji", "Vasco da Gama"],
  Gujarat: [
    "Ahmedabad", "Anand", "Bharuch", "Bhavnagar", "Bhuj", "Gandhidham",
    "Gandhinagar", "Jamnagar", "Junagadh", "Mehsana", "Morbi", "Nadiad",
    "Navsari", "Porbandar", "Rajkot", "Surat", "Surendranagar", "Vadodara",
    "Valsad", "Vapi",
  ],
  Haryana: [
    "Ambala", "Bahadurgarh", "Bhiwani", "Faridabad", "Gurugram", "Hisar",
    "Jind", "Karnal", "Kurukshetra", "Panchkula", "Panipat", "Rewari", "Rohtak",
    "Sirsa", "Sonipat", "Yamunanagar",
  ],
  "Himachal Pradesh": ["Dharamshala", "Shimla"],
  "Jammu and Kashmir": ["Jammu", "Srinagar"],
  Jharkhand: [
    "Bokaro", "Deoghar", "Dhanbad", "Giridih", "Hazaribagh", "Jamshedpur",
    "Ranchi",
  ],
  Karnataka: [
    "Ballari", "Belagavi", "Bengaluru", "Bidar", "Chitradurga", "Davanagere",
    "Dharwad", "Gadag", "Hassan", "Hosapete", "Hubballi", "Kalaburagi",
    "Mandya", "Mangaluru", "Mysuru", "Raichur", "Shivamogga", "Tumakuru",
    "Udupi", "Vijayapura",
  ],
  Kerala: [
    "Alappuzha", "Kannur", "Kochi", "Kollam", "Kottayam", "Kozhikode",
    "Malappuram", "Palakkad", "Thiruvananthapuram", "Thrissur",
  ],
  Ladakh: ["Leh"],
  Lakshadweep: ["Kavaratti"],
  "Madhya Pradesh": [
    "Bhind", "Bhopal", "Burhanpur", "Chhindwara", "Dewas", "Guna", "Gwalior",
    "Indore", "Jabalpur", "Katni", "Khandwa", "Morena", "Ratlam", "Rewa",
    "Sagar", "Satna", "Shivpuri", "Singrauli", "Ujjain", "Vidisha",
  ],
  Maharashtra: [
    "Ahilyanagar", "Akola", "Ambernath", "Amravati", "Badlapur", "Beed",
    "Bhiwandi", "Bhusawal", "Chandrapur", "Chhatrapati Sambhajinagar", "Dhule",
    "Dombivli", "Gondia", "Ichalkaranji", "Jalgaon", "Jalna", "Kalyan",
    "Kolhapur", "Latur", "Malegaon", "Mira-Bhayandar", "Mumbai", "Nagpur",
    "Nanded", "Nashik", "Navi Mumbai", "Panvel", "Parbhani",
    "Pimpri-Chinchwad", "Pune", "Sangli", "Satara", "Solapur", "Thane",
    "Ulhasnagar", "Vasai-Virar", "Wardha", "Yavatmal",
  ],
  Manipur: ["Imphal"],
  Meghalaya: ["Shillong"],
  Mizoram: ["Aizawl"],
  Nagaland: ["Dimapur", "Kohima"],
  Odisha: [
    "Balasore", "Bhubaneswar", "Brahmapur", "Cuttack", "Puri", "Rourkela",
    "Sambalpur",
  ],
  Puducherry: ["Puducherry"],
  Punjab: [
    "Abohar", "Amritsar", "Batala", "Bathinda", "Hoshiarpur", "Jalandhar",
    "Ludhiana", "Moga", "Mohali", "Pathankot", "Patiala",
  ],
  Rajasthan: [
    "Ajmer", "Alwar", "Beawar", "Bharatpur", "Bhilwara", "Bikaner",
    "Hanumangarh", "Jaipur", "Jodhpur", "Kishangarh", "Kota", "Pali", "Sikar",
    "Sri Ganganagar", "Tonk", "Udaipur",
  ],
  Sikkim: ["Gangtok"],
  "Tamil Nadu": [
    "Avadi", "Chennai", "Coimbatore", "Cuddalore", "Dindigul", "Erode",
    "Hosur", "Kanchipuram", "Karur", "Kumbakonam", "Madurai", "Nagercoil",
    "Pudukkottai", "Rajapalayam", "Salem", "Sivakasi", "Tambaram", "Thanjavur",
    "Thoothukudi", "Tiruchirappalli", "Tirunelveli", "Tiruppur",
    "Tiruvannamalai", "Vellore",
  ],
  Telangana: [
    "Adilabad", "Hyderabad", "Karimnagar", "Khammam", "Mahbubnagar",
    "Nalgonda", "Nizamabad", "Ramagundam", "Secunderabad", "Siddipet",
    "Suryapet", "Warangal",
  ],
  Tripura: ["Agartala"],
  "Uttar Pradesh": [
    "Agra", "Aligarh", "Amroha", "Ayodhya", "Azamgarh", "Bahraich", "Bareilly",
    "Bijnor", "Bulandshahr", "Etawah", "Farrukhabad", "Fatehpur", "Firozabad",
    "Ghaziabad", "Gorakhpur", "Greater Noida", "Hapur", "Hardoi", "Jaunpur",
    "Jhansi", "Kanpur", "Loni", "Lucknow", "Mathura", "Mau", "Meerut",
    "Mirzapur", "Moradabad", "Muzaffarnagar", "Noida", "Orai", "Prayagraj",
    "Raebareli", "Rampur", "Saharanpur", "Sambhal", "Shahjahanpur", "Sitapur",
    "Unnao", "Varanasi",
  ],
  Uttarakhand: [
    "Dehradun", "Haldwani", "Haridwar", "Kashipur", "Rishikesh", "Roorkee",
    "Rudrapur",
  ],
  "West Bengal": [
    "Asansol", "Baharampur", "Bankura", "Barasat", "Bardhaman", "Bhatpara",
    "Durgapur", "Habra", "Haldia", "Howrah", "Jalpaiguri", "Kalyani",
    "Kamarhati", "Kharagpur", "Kolkata", "Krishnanagar", "Malda", "Medinipur",
    "Panihati", "Raiganj", "Siliguri",
  ],
};

/**
 * Indian cities for the listing location picker, sorted by name. A city that
 * isn't here can still be typed under "Other" — normaliseCity() tidies it —
 * so this list only has to cover the common case, not every town.
 */
export const INDIAN_CITIES: readonly IndianCity[] = Object.freeze(
  Object.entries(CITIES_BY_STATE)
    .flatMap(([state, names]) => names.map((name) => ({ name, state })))
    .sort((a, b) => a.name.localeCompare(b.name, "en")),
);

/**
 * Old or colloquial names → the canonical INDIAN_CITIES name. Keys are matched
 * case-insensitively. "Aurangabad" maps to the Maharashtra city (renamed
 * Chhatrapati Sambhajinagar); the much smaller Aurangabad in Bihar is not in
 * the list, so a seller there would need to correct it — an accepted trade-off.
 */
export const INDIAN_CITY_ALIASES: Readonly<Record<string, string>> = {
  Bangalore: "Bengaluru",
  Bombay: "Mumbai",
  Madras: "Chennai",
  Calcutta: "Kolkata",
  Gurgaon: "Gurugram",
  Baroda: "Vadodara",
  Trivandrum: "Thiruvananthapuram",
  Mysore: "Mysuru",
  Poona: "Pune",
  Cochin: "Kochi",
  Mangalore: "Mangaluru",
  Belgaum: "Belagavi",
  Gulbarga: "Kalaburagi",
  Bellary: "Ballari",
  Bijapur: "Vijayapura",
  Shimoga: "Shivamogga",
  Tumkur: "Tumakuru",
  Hubli: "Hubballi",
  Hospet: "Hosapete",
  Calicut: "Kozhikode",
  Trichur: "Thrissur",
  Quilon: "Kollam",
  Alleppey: "Alappuzha",
  Palghat: "Palakkad",
  Cannanore: "Kannur",
  Allahabad: "Prayagraj",
  Faizabad: "Ayodhya",
  Benares: "Varanasi",
  Banaras: "Varanasi",
  Aurangabad: "Chhatrapati Sambhajinagar",
  Ahmednagar: "Ahilyanagar",
  Rajahmundry: "Rajamahendravaram",
  Vizag: "Visakhapatnam",
  Berhampur: "Brahmapur",
  Berhampore: "Baharampur",
  Burdwan: "Bardhaman",
  Pondicherry: "Puducherry",
  "Port Blair": "Sri Vijaya Puram",
  Trichy: "Tiruchirappalli",
  Tuticorin: "Thoothukudi",
  Tanjore: "Thanjavur",
  Simla: "Shimla",
  Dharamsala: "Dharamshala",
  Bhubaneshwar: "Bhubaneswar",
  Panjim: "Panaji",
  Madgaon: "Margao",
  Vasco: "Vasco da Gama",
  "Bokaro Steel City": "Bokaro",
};

// Comparison key: case, hyphens, dots and repeated spaces are all noise —
// "pimpri chinchwad", "Pimpri-Chinchwad" and "PIMPRI  CHINCHWAD" are one city.
function cityKey(value: string): string {
  return value.toLowerCase().replace(/[.\-]/g, " ").replace(/\s+/g, " ").trim();
}

const CITY_LOOKUP: ReadonlyMap<string, string> = new Map([
  ...INDIAN_CITIES.map((c) => [cityKey(c.name), c.name] as const),
  ...Object.entries(INDIAN_CITY_ALIASES).map(
    ([alias, canonical]) => [cityKey(alias), canonical] as const,
  ),
]);

/**
 * Canonical spelling for a city typed by a person. Known cities and aliases
 * come back exactly as INDIAN_CITIES spells them ("bangalore" → "Bengaluru"),
 * so filtering by city is an exact match rather than a guess; anything else is
 * trimmed, space-collapsed and title-cased ("navi  MUMBAI" is known, "kodaikanal"
 * becomes "Kodaikanal").
 */
export function normaliseCity(input: string): string {
  const collapsed = input.trim().replace(/\s+/g, " ");
  if (!collapsed) return "";
  const known = CITY_LOOKUP.get(cityKey(collapsed));
  if (known) return known;
  return collapsed
    .toLowerCase()
    .replace(/(^|[\s\-(])(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toUpperCase());
}

/**
 * A 6-digit Indian PIN code. The first digit is never 0. Format only — there
 * is no PIN-to-city lookup, so a valid-looking PIN in the wrong city passes.
 */
export const PINCODE_REGEX = /^[1-9][0-9]{5}$/;

const pincodeSchema = z
  .string()
  .trim()
  .regex(PINCODE_REGEX, "Enter a valid 6-digit PIN code");

const localitySchema = z
  .string()
  .trim()
  .max(60, "Keep it to the area or neighbourhood (60 characters) — never your house address");

/* ------------------------------------------------------------------ */
/* Listings                                                            */
/* ------------------------------------------------------------------ */

// Prices are integer paise everywhere.
const listingFields = z
  .object({
    title: z.string().min(3, "Title needs at least 3 characters").max(140),
    description: z.string().min(10, "Description needs at least 10 characters").max(4000),
    categoryId: z.string().min(1, "Choose a category"),
    condition: z.enum([
      Condition.NEW,
      Condition.LIKE_NEW,
      Condition.GOOD,
      Condition.FAIR,
    ]),
    // The web form turns an empty or non-numeric box into NaN, which Zod's
    // default reports as "Expected number, received nan" — so both the type
    // error and the bounds carry the seller-facing wording.
    originalPriceInPaise: z
      .number({
        invalid_type_error: "Enter the original price in rupees, or leave it blank",
      })
      .int("Enter the original price in rupees, or leave it blank")
      .positive("Enter an original price above ₹0, or leave it blank")
      .optional(),
    sellingPriceInPaise: z
      .number({
        required_error: "Enter a price in rupees",
        invalid_type_error: "Enter a price in rupees",
      })
      .int("Enter a price in rupees")
      .positive("Enter a price above ₹0"),
    purchaseDate: z.string().datetime().optional().or(z.literal("")),
    usageDuration: z.string().max(60).optional().or(z.literal("")),
    reasonForSelling: z.string().max(300).optional().or(z.literal("")),
    // Normalised to the canonical spelling so "bangalore" and "Bengaluru"
    // are one city to the browse filter.
    city: z
      .string()
      .trim()
      .min(2, "Enter your city")
      .max(80, "City name is too long")
      .transform(normaliseCity),
    locality: localitySchema.optional().or(z.literal("")),
    // Optional here because the mobile app posts listings without it; the web
    // form uses listingFormSchema, which requires it. Never returned in the
    // public Listing DTO.
    pincode: pincodeSchema.optional().or(z.literal("")),
    deliveryOption: z.enum([
      DeliveryOption.PICKUP,
      DeliveryOption.DELIVERY,
      DeliveryOption.BOTH,
    ]),
    images: z
      .array(z.string().url())
      .min(1, "Add at least one photo")
      .max(10, "You can add up to 10 photos"),
    // Optional: updates the seller's profile contact if provided.
    whatsappNumber: phoneNumberSchema.optional().or(z.literal("")),
  });

function originalPriceAtLeastSelling(v: {
  originalPriceInPaise?: number;
  sellingPriceInPaise: number;
}): boolean {
  return (
    v.originalPriceInPaise === undefined ||
    v.originalPriceInPaise >= v.sellingPriceInPaise
  );
}
const originalPriceIssue = {
  message: "Original price should be ≥ selling price",
  path: ["originalPriceInPaise"],
};

/** What the API accepts on POST /listings (web and mobile). */
export const listingInputSchema = listingFields.refine(
  originalPriceAtLeastSelling,
  originalPriceIssue,
);
export type ListingInput = z.infer<typeof listingInputSchema>;

/**
 * The web seller form: the same shape, but the PIN is required. Kept separate
 * from listingInputSchema because the API must keep accepting listings from
 * mobile builds that have never heard of a PIN.
 */
export const listingFormSchema = listingFields
  .extend({ pincode: pincodeSchema })
  .refine(originalPriceAtLeastSelling, originalPriceIssue);
export type ListingFormInput = z.infer<typeof listingFormSchema>;

export const listingUpdateSchema = z.object({
  title: z.string().min(3, "Title needs at least 3 characters").max(140).optional(),
  description: z
    .string()
    .min(10, "Description needs at least 10 characters")
    .max(4000)
    .optional(),
  categoryId: z.string().min(1, "Choose a category").optional(),
  condition: z
    .enum([Condition.NEW, Condition.LIKE_NEW, Condition.GOOD, Condition.FAIR])
    .optional(),
  originalPriceInPaise: z.number().int().positive().optional(),
  sellingPriceInPaise: z.number().int().positive().optional(),
  usageDuration: z.string().max(60).optional().or(z.literal("")),
  reasonForSelling: z.string().max(300).optional().or(z.literal("")),
  city: z
    .string()
    .trim()
    .min(2, "Enter your city")
    .max(80, "City name is too long")
    .transform(normaliseCity)
    .optional(),
  locality: localitySchema.optional().or(z.literal("")),
  pincode: pincodeSchema.optional().or(z.literal("")),
  deliveryOption: z
    .enum([DeliveryOption.PICKUP, DeliveryOption.DELIVERY, DeliveryOption.BOTH])
    .optional(),
  images: z
    .array(z.string().url())
    .min(1, "Add at least one photo")
    .max(10, "You can add up to 10 photos")
    .optional(),
});
export type ListingUpdateInput = z.infer<typeof listingUpdateSchema>;

export interface SellerInfo {
  id: string;
  name: string;
  city: string | null;
  // The number itself isn't in the public listing payload — it's PII and
  // this type is returned from unauthenticated endpoints. Fetch it from
  // GET /listings/:id/contact (requires auth) when this is true.
  hasWhatsapp: boolean;
  isSellerVerified: boolean;
}

export interface SellerContact {
  whatsappNumber: string | null;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  condition: Condition;
  originalPriceInPaise: number | null;
  sellingPriceInPaise: number;
  purchaseDate: string | null;
  usageDuration: string | null;
  reasonForSelling: string | null;
  city: string;
  // Area/neighbourhood, shown as "City · Locality". Optional so a DTO built by
  // an older API (or the mobile app's own fixtures) still type-checks. The
  // listing's PIN code is deliberately absent: this type is returned from
  // unauthenticated endpoints and the PIN is never shown publicly.
  locality?: string | null;
  deliveryOption: DeliveryOption;
  images: string[];
  status: ListingStatus;
  rejectionReason: string | null;
  isFeatured: boolean;
  category: Category;
  seller: SellerInfo;
  createdAt: string;
}

/**
 * A listing as its own seller sees it (GET /seller/listings and the seller's
 * create/update responses): the public Listing plus the PIN code, which the
 * edit form needs to prefill. Never returned from a public endpoint.
 */
export interface OwnerListing extends Listing {
  pincode: string | null;
}

export const listingQuerySchema = z.object({
  category: z.string().optional(), // category slug
  condition: z
    .enum([Condition.NEW, Condition.LIKE_NEW, Condition.GOOD, Condition.FAIR])
    .optional(),
  city: z.string().optional(),
  // Contains-match on the listing's locality.
  locality: z.string().trim().max(60, "Locality is too long").optional(),
  // Exact match. An empty `?pincode=` (a cleared filter input) is treated as
  // no filter rather than a 400.
  pincode: z
    .string()
    .trim()
    .regex(PINCODE_REGEX, "Enter a valid 6-digit PIN code")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  delivery: z
    .enum([DeliveryOption.PICKUP, DeliveryOption.DELIVERY, DeliveryOption.BOTH])
    .optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  search: z.string().optional(),
  featured: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(12),
  sort: z.enum(["newest", "price-asc", "price-desc"]).default("newest"),
});
export type ListingQuery = z.infer<typeof listingQuerySchema>;

/**
 * GET /listings/locations — where live listings actually are, to feed the
 * city combobox ("cities with listings first") and locality suggestions.
 * `localities` is for the city requested (empty when none is given).
 */
export interface ListingLocations {
  cities: { name: string; count: number }[];
  localities: { name: string; count: number }[];
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface SellerProfile {
  id: string;
  name: string;
  city: string | null;
  bio: string | null;
  isSellerVerified: boolean;
  memberSince: string;
  listings: Listing[];
  averageRating: number | null;
  reviewCount: number;
}

/* ------------------------------------------------------------------ */
/* Wishlist                                                            */
/* ------------------------------------------------------------------ */

export const wishlistToggleSchema = z.object({ listingId: z.string().min(1) });
export type WishlistToggleInput = z.infer<typeof wishlistToggleSchema>;

/* ------------------------------------------------------------------ */
/* Reviews                                                             */
/* ------------------------------------------------------------------ */

export const createReviewSchema = z.object({
  listingId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional().or(z.literal("")),
});
export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export interface Review {
  id: string;
  orderId: string;
  listingId: string;
  listingTitle: string;
  reviewerName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/* Orders                                                              */
/* ------------------------------------------------------------------ */

export const shippingAddressSchema = z.object({
  fullName: z.string().min(2, "Enter the recipient's full name").max(120),
  phone: indianMobileNumberSchema,
  line1: z.string().min(2, "Enter your street address").max(200),
  line2: z.string().max(200).optional().or(z.literal("")),
  city: z.string().min(1, "Enter your city").max(80),
  state: z.string().min(1, "Enter your state").max(80),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter a valid 6-digit postal code"),
  country: z.string().min(2, "Enter your country").max(60).default("India"),
});
export type ShippingAddress = z.infer<typeof shippingAddressSchema>;

// The client sends only listing ids (each item is a single unit).
// The server re-prices and re-checks availability. Payment is ONLINE-only —
// the method is not client-selectable (COD is retired).
export const createOrderSchema = z.object({
  listingIds: z.array(z.string().min(1)).min(1).max(20),
  shippingAddress: shippingAddressSchema,
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export interface OrderItem {
  id: string;
  listingId: string;
  listingTitle: string;
  image: string | null;
  unitPriceInPaise: number;
  sellerId: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  totalInPaise: number;
  shippingAddress: ShippingAddress;
  items: OrderItem[];
  razorpayOrderId: string | null;
  refundedAt: string | null;
  createdAt: string;
}

// Everything an admin needs to see about one order — the buyer's contact
// info, gateway/refund ids, and per-seller shipment status — none of which
// belongs in the plain `Order` DTO returned to a buyer about their own order.
export interface AdminOrderDetail extends Order {
  buyer: { id: string; name: string; email: string; whatsappNumber: string | null };
  // Every distinct seller with an item on this order — items/shipments only
  // carry the id, so the detail view has names to show alongside them.
  sellers: { id: string; name: string }[];
  razorpayPaymentId: string | null;
  refundId: string | null;
  cancellationReason: string | null;
  updatedAt: string;
  shipments: {
    sellerId: string;
    status: ShipmentStatus;
    courier: string | null;
    trackingId: string | null;
    shippedAt: string | null;
  }[];
}

// `reason` is only required when moving to CANCELLED — the admin manual
// status override otherwise has no use for it. Which strings actually count
// as a valid reason is admin-configurable (CancellationPolicy.reasonCodes),
// so that part can only be checked server-side, not by this shape alone.
export const updateOrderStatusSchema = z
  .object({
    status: z.enum([
      OrderStatus.PENDING,
      OrderStatus.PAID,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
      OrderStatus.CANCELLED,
    ]),
    reason: z.string().min(1).max(80).optional(),
  })
  .refine((v) => v.status !== OrderStatus.CANCELLED || !!v.reason, {
    message: 'A cancellation reason is required',
    path: ['reason'],
  });
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

export const cancelOrderSchema = z.object({
  reason: z.string().min(1).max(80),
});
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;

/* ------------------------------------------------------------------ */
/* Cancellation policy                                                 */
/* ------------------------------------------------------------------ */

export interface CancellationPolicy {
  cutoffHours: number;
  reasonCodes: string[];
  refundPercentage: number;
  /**
   * How long after delivery a buyer may raise a "not as described" dispute.
   * Published on the refunds page; unlike the other fields it is not enforced
   * server-side, because there is no dispute-raising endpoint yet.
   */
  conditionDisputeHours: number;
  updatedAt: string;
}

export const cancellationPolicyInputSchema = z.object({
  cutoffHours: z.number().int().min(1).max(24 * 90),
  reasonCodes: z.array(z.string().min(1).max(80)).min(1).max(20),
  refundPercentage: z.number().int().min(0).max(100),
  conditionDisputeHours: z
    .number()
    .int("Enter a whole number of hours")
    .min(1, "The dispute window must be at least an hour")
    .max(24 * 90, "That's over 90 days — enter a shorter window"),
});
export type CancellationPolicyInput = z.infer<
  typeof cancellationPolicyInputSchema
>;

/* ------------------------------------------------------------------ */
/* Business profile (legal pages)                                      */
/* ------------------------------------------------------------------ */

/**
 * The operator's real business identity. Indian e-commerce rules (and
 * Razorpay's KYC) require a named legal entity, a registered address, working
 * support contacts, and a grievance officer on the policy pages — so the
 * legal pages read these rather than hardcoding anything.
 */
export interface BusinessProfile {
  legalEntityName: string;
  tradeName: string;
  registeredAddress: string;
  supportEmail: string;
  supportPhone: string;
  grievanceOfficerName: string;
  grievanceOfficerEmail: string;
  gstin: string | null;
  cin: string | null;
  updatedAt: string;
}

export const businessProfileInputSchema = z.object({
  legalEntityName: z
    .string()
    .max(120, "Legal entity name is too long")
    .trim(),
  tradeName: z.string().max(120, "Trade name is too long").trim(),
  registeredAddress: z
    .string()
    .max(400, "Registered address is too long")
    .trim(),
  supportEmail: z
    .string()
    .max(160, "Email is too long")
    .trim()
    .refine((v) => v === "" || z.string().email().safeParse(v).success, {
      message: "Enter a valid email address",
    }),
  supportPhone: z.string().max(20, "Phone number is too long").trim(),
  grievanceOfficerName: z.string().max(120, "Name is too long").trim(),
  grievanceOfficerEmail: z
    .string()
    .max(160, "Email is too long")
    .trim()
    .refine((v) => v === "" || z.string().email().safeParse(v).success, {
      message: "Enter a valid email address",
    }),
  gstin: z.string().max(20, "GSTIN is too long").trim().nullable(),
  cin: z.string().max(30, "CIN is too long").trim().nullable(),
});
export type BusinessProfileInput = z.infer<typeof businessProfileInputSchema>;

// Every field a legal page has to name. GSTIN/CIN are excluded: not every
// operator is GST-registered or incorporated.
export const REQUIRED_BUSINESS_FIELDS = [
  "legalEntityName",
  "tradeName",
  "registeredAddress",
  "supportEmail",
  "supportPhone",
  "grievanceOfficerName",
  "grievanceOfficerEmail",
] as const satisfies readonly (keyof BusinessProfile)[];

/**
 * Whether the legal pages may be published. The gate is deliberately all-or-
 * nothing: a policy page naming a grievance officer but no address is not a
 * compliant page, so partial completion must not flip it live.
 */
export function isBusinessProfileComplete(
  profile: BusinessProfile | null | undefined,
): boolean {
  if (!profile) return false;
  return REQUIRED_BUSINESS_FIELDS.every(
    (field) => String(profile[field] ?? "").trim().length > 0,
  );
}

export function missingBusinessFields(
  profile: BusinessProfile | null | undefined,
): string[] {
  if (!profile) return [...REQUIRED_BUSINESS_FIELDS];
  return REQUIRED_BUSINESS_FIELDS.filter(
    (field) => String(profile[field] ?? "").trim().length === 0,
  );
}

export const businessFieldLabels: Record<
  (typeof REQUIRED_BUSINESS_FIELDS)[number],
  string
> = {
  legalEntityName: "Registered legal entity name",
  tradeName: "Trading name",
  registeredAddress: "Registered address",
  supportEmail: "Support email",
  supportPhone: "Support phone",
  grievanceOfficerName: "Grievance officer name",
  grievanceOfficerEmail: "Grievance officer email",
};

/* ------------------------------------------------------------------ */
/* Seller payouts                                                      */
/* ------------------------------------------------------------------ */

/**
 * What the marketplace owes one seller for one order. Buyers pay the
 * marketplace, not the seller, so every paid order creates a payout row per
 * seller — that ledger is the only record of the debt.
 */
export const PayoutStatus = {
  PENDING: "PENDING", // order paid, still cancellable — not yet owed
  PAYABLE: "PAYABLE", // order delivered — the marketplace owes this
  PAID: "PAID", // transferred to the seller, reference recorded
  CANCELLED: "CANCELLED", // order cancelled; the item went back unsold
} as const;
export type PayoutStatus = (typeof PayoutStatus)[keyof typeof PayoutStatus];

export const payoutStatusLabels: Record<PayoutStatus, string> = {
  PENDING: "On hold",
  PAYABLE: "Ready to pay",
  PAID: "Paid out",
  CANCELLED: "Cancelled",
};

export interface SellerPayout {
  id: string;
  orderId: string;
  orderNumber: string;
  status: PayoutStatus;
  grossInPaise: number;
  // Commission rate snapshotted at sale time — the policy can change later,
  // and an already-earned payout must not move when it does.
  commissionBps: number;
  commissionInPaise: number;
  netInPaise: number;
  reference: string | null;
  paidAt: string | null;
  createdAt: string;
}

// Admin queue row — same ledger entry, plus who it's owed to.
export interface AdminPayout extends SellerPayout {
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  sellerWhatsapp: string | null;
  itemCount: number;
}

export interface PayoutPolicy {
  commissionBps: number;
  updatedAt: string;
}

// Basis points, so a rate like 5.5% (550) is expressible without floats.
export const payoutPolicyInputSchema = z.object({
  commissionBps: z
    .number()
    .int("Commission must be a whole number of basis points")
    .min(0, "Commission cannot be negative")
    .max(10000, "Commission cannot exceed 100%"),
});
export type PayoutPolicyInput = z.infer<typeof payoutPolicyInputSchema>;

export const markPayoutPaidSchema = z.object({
  reference: z
    .string()
    .min(1, "Enter the transfer reference (UTR / bank ref)")
    .max(80, "Reference is too long"),
});
export type MarkPayoutPaidInput = z.infer<typeof markPayoutPaidSchema>;

/**
 * The single definition of how a sale splits. Commission is rounded to the
 * nearest paise and the seller's net is the remainder, so gross always equals
 * commission + net exactly — no drift, whatever the rate.
 */
export function splitPayout(
  grossInPaise: number,
  commissionBps: number,
): { commissionInPaise: number; netInPaise: number } {
  const commissionInPaise = Math.round((grossInPaise * commissionBps) / 10000);
  return { commissionInPaise, netInPaise: grossInPaise - commissionInPaise };
}

/** 550 → "5.5%", 1000 → "10%". */
export function formatBps(bps: number): string {
  return `${Number((bps / 100).toFixed(2))}%`;
}

/* ------------------------------------------------------------------ */
/* Payments (Razorpay)                                                 */
/* ------------------------------------------------------------------ */

export interface RazorpayOrderResponse {
  orderId: string;
  razorpayOrderId: string;
  amountInPaise: number;
  currency: string;
  keyId: string;
}

export const verifyPaymentSchema = z.object({
  orderId: z.string().min(1),
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  listingId: string | null;
  orderId: string | null;
  // Who this notification is about (not the recipient) — currently only set
  // for an admin's SELLER_REGISTERED alert, to link to that seller's profile.
  relatedUserId: string | null;
  read: boolean;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/* Admin                                                               */
/* ------------------------------------------------------------------ */

export const moderateListingSchema = z
  .object({
    status: z.enum([ListingStatus.APPROVED, ListingStatus.REJECTED]),
    reason: z.string().trim().max(500).optional(),
  })
  .refine(
    (v) => v.status !== ListingStatus.REJECTED || !!v.reason,
    { message: "A reason is required to reject a listing", path: ["reason"] },
  );
export type ModerateListingInput = z.infer<typeof moderateListingSchema>;

export const featureListingSchema = z.object({ isFeatured: z.boolean() });
export type FeatureListingInput = z.infer<typeof featureListingSchema>;

export const reassignListingCategorySchema = z.object({
  categoryId: z.string().min(1),
});
export type ReassignListingCategoryInput = z.infer<
  typeof reassignListingCategorySchema
>;

export const verifySellerSchema = z.object({ isSellerVerified: z.boolean() });
export type VerifySellerInput = z.infer<typeof verifySellerSchema>;

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  city: string | null;
  isSellerVerified: boolean;
  // The marketplace's own seller account, which owns admin-created listings.
  // It is the platform rather than a seller under review: it bypasses the
  // listing gate and its verification cannot be toggled.
  isSystemSeller: boolean;
  sellerVerificationRequestedAt: string | null;
  // ISO, null until the ₹100 registration fee is paid. Approving
  // (isSellerVerified) a user before this is set has no gating effect —
  // both are required to list, per the merged verification pipeline.
  registrationPaidAt: string | null;
  // The most recent SellerMembership (by expiresAt), if the user has ever
  // bought a plan — null for a user who registered but never subscribed.
  membership: {
    plan: MembershipPlan;
    startsAt: string;
    expiresAt: string;
    active: boolean;
  } | null;
  listingCount: number;
  createdAt: string;
}

// Everything an admin needs when drilling into one user — contact details not
// shown in the list row, plus recent marketplace activity on both sides
// (what they've bought, sold as listings, and sold via orders as a seller).
export interface AdminUserDetail extends AdminUser {
  whatsappNumber: string | null;
  bio: string | null;
  recentListings: {
    id: string;
    title: string;
    status: ListingStatus;
    sellingPriceInPaise: number;
    createdAt: string;
  }[];
  recentOrders: {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    totalInPaise: number;
    createdAt: string;
  }[];
  recentSales: {
    orderId: string;
    orderNumber: string;
    orderStatus: OrderStatus;
    listingTitle: string;
    unitPriceInPaise: number;
    createdAt: string;
  }[];
}

/* ------------------------------------------------------------------ */
/* Blog                                                                */
/* ------------------------------------------------------------------ */

/**
 * The Nurture Journal's taxonomy, fixed by the founders' brief (section 11).
 *
 * The slug is what appears in `/journal?category=`, so it is part of the URL
 * contract and must not be derived from the label — renaming "Starting Solids"
 * for readability would otherwise silently break every link to it.
 */
export const BLOG_CATEGORIES = [
  { value: "PREGNANCY", slug: "pregnancy", label: "Pregnancy" },
  { value: "YOGA", slug: "yoga", label: "Yoga" },
  { value: "POSTPARTUM", slug: "postpartum", label: "Postpartum" },
  { value: "NUTRITION", slug: "nutrition", label: "Nutrition" },
  { value: "STARTING_SOLIDS", slug: "starting-solids", label: "Starting Solids" },
  { value: "BABY", slug: "baby", label: "Baby" },
  { value: "TODDLER", slug: "toddler", label: "Toddler" },
  { value: "MOTHERHOOD", slug: "motherhood", label: "Motherhood" },
  { value: "MOMPRENEUR", slug: "mompreneur", label: "Mompreneur" },
  { value: "PRELOVED", slug: "preloved", label: "Preloved" },
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number]["value"];
export type BlogCategorySlug = (typeof BLOG_CATEGORIES)[number]["slug"];

const BLOG_CATEGORY_VALUES = BLOG_CATEGORIES.map((c) => c.value) as [
  BlogCategory,
  ...BlogCategory[],
];

export function blogCategoryBySlug(slug: string) {
  return BLOG_CATEGORIES.find((c) => c.slug === slug) ?? null;
}

export function blogCategoryByValue(value: string | null | undefined) {
  if (!value) return null;
  return BLOG_CATEGORIES.find((c) => c.value === value) ?? null;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  bodyMarkdown: string;
  coverImageUrl: string | null;
  published: boolean;
  publishedAt: string | null;
  authorName: string;
  category: BlogCategory | null;
  createdAt: string;
  updatedAt: string;
}

export const blogPostInputSchema = z.object({
  title: z
    .string()
    .min(3, "Title needs at least 3 characters")
    .max(160, "Keep the title to 160 characters or fewer"),
  slug: z
    .string()
    .min(2, "Enter a slug")
    .max(160, "Keep the slug to 160 characters or fewer")
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only"),
  excerpt: z
    .string()
    .max(300, "Keep the excerpt to 300 characters or fewer")
    .optional()
    .or(z.literal("")),
  bodyMarkdown: z.string().min(10, "Write at least 10 characters"),
  coverImageUrl: z
    .string()
    .url("Enter a valid image URL")
    .optional()
    .or(z.literal("")),
  authorName: z
    .string()
    .min(2, "Enter an author name")
    .max(80, "Keep the author name to 80 characters or fewer"),
  category: z.enum(BLOG_CATEGORY_VALUES).nullish(),
});
export type BlogPostInput = z.infer<typeof blogPostInputSchema>;

export const setBlogPostPublishedSchema = z.object({ published: z.boolean() });
export type SetBlogPostPublishedInput = z.infer<
  typeof setBlogPostPublishedSchema
>;

export const blogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(12),
  category: z.enum(BLOG_CATEGORY_VALUES).optional(),
});
export type BlogQuery = z.infer<typeof blogQuerySchema>;

/* ------------------------------------------------------------------ */
/* Contact                                                             */
/* ------------------------------------------------------------------ */

/**
 * Which part of the ecosystem an enquiry came from.
 *
 * The slug is what a service page puts in `/contact?service=`, so — like
 * `BLOG_CATEGORIES` above — it is a URL contract and must not be derived from
 * the label. The value is what the column stores.
 *
 * Null is a real and common state, not a gap: the contact page reached from
 * the footer belongs to no service, and every message sent before this column
 * existed has none. Inferring one from the subject line would be guessing.
 */
export const ENQUIRY_SERVICES = [
  { value: "YOGA", slug: "yoga", label: "Yoga" },
  { value: "NUTRITION", slug: "nutrition", label: "Nutrition" },
  { value: "STARTING_SOLIDS", slug: "starting-solids", label: "Starting Solids" },
  { value: "COMMUNITY", slug: "community", label: "Community" },
  { value: "PRELOVED", slug: "preloved", label: "Preloved" },
] as const;

export type EnquiryService = (typeof ENQUIRY_SERVICES)[number]["value"];

const ENQUIRY_SERVICE_VALUES = ENQUIRY_SERVICES.map((s) => s.value) as [
  EnquiryService,
  ...EnquiryService[],
];

export function enquiryServiceBySlug(slug: string | null | undefined) {
  if (!slug) return null;
  return ENQUIRY_SERVICES.find((s) => s.slug === slug) ?? null;
}

export function enquiryServiceByValue(value: string | null | undefined) {
  if (!value) return null;
  return ENQUIRY_SERVICES.find((s) => s.value === value) ?? null;
}

export const ContactMessageStatus = {
  NEW: "NEW",
  READ: "READ",
  RESPONDED: "RESPONDED",
} as const;
export type ContactMessageStatus =
  (typeof ContactMessageStatus)[keyof typeof ContactMessageStatus];

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: ContactMessageStatus;
  /** The service page this enquiry came from, or null for a general one. */
  service: EnquiryService | null;
  /**
   * The package and price the mother was shown, snapshotted server-side at
   * submit time (resolvePackagePrice). All three are null for an enquiry that
   * named no package. packageId may point at a package since deleted — the
   * name and price are the record, not the id.
   */
  packageId: string | null;
  packageName: string | null;
  quotedPricePaise: number | null;
  createdAt: string;
}

export const contactMessageInputSchema = z.object({
  name: z.string().min(2, "Enter your name").max(120),
  email: z.string().email("Enter a valid email address"),
  phone: phoneNumberSchema.optional().or(z.literal("")),
  subject: z.string().min(3, "Enter a subject").max(160),
  message: z.string().min(10, "A little more detail helps us help you").max(4000),
  // Optional because the footer's own contact link carries no service, and a
  // stale or hand-edited `?service=` must not fail a real enquiry — the form
  // drops an unrecognised value rather than rejecting the message behind it.
  service: z.enum(ENQUIRY_SERVICE_VALUES).optional(),
  // The ServicePackage the enquiry is about (`/contact?package=<id>`). Only the
  // id is accepted: the server looks the package up and snapshots its name and
  // current price itself, so a client can never set the quoted price. An
  // unknown id is the server's to ignore, not a reason to reject the message.
  packageId: z.string().trim().min(1).max(64, "That package link looks wrong").optional(),
});
export type ContactMessageInput = z.infer<typeof contactMessageInputSchema>;

export const setContactMessageStatusSchema = z.object({
  status: z.enum([
    ContactMessageStatus.NEW,
    ContactMessageStatus.READ,
    ContactMessageStatus.RESPONDED,
  ]),
});
export type SetContactMessageStatusInput = z.infer<
  typeof setContactMessageStatusSchema
>;

/* ------------------------------------------------------------------ */
/* Shared input helpers for the content models below                   */
/* ------------------------------------------------------------------ */

// Admin forms send "" for a cleared optional field; the services store null.
const blankable = <T extends z.ZodTypeAny>(schema: T) =>
  schema.nullish().or(z.literal(""));

const httpsUrl = (label: string) =>
  z
    .string()
    .trim()
    .url(`Enter a valid ${label}`)
    .refine((v) => v.startsWith("https://"), {
      message: `Use a secure link — the ${label} must start with https://`,
    });

const imageUrl = z.string().trim().url("Enter a valid image URL");

const isoDateTime = (message: string) => z.string().datetime({ offset: true, message });

/* ------------------------------------------------------------------ */
/* Service packages & pricing (yoga, Garbhasanskar, nutrition)         */
/* ------------------------------------------------------------------ */

export const ServiceGroup = {
  PRENATAL_YOGA: "PRENATAL_YOGA",
  GARBHASANSKAR: "GARBHASANSKAR",
  COMBO: "COMBO", // Prenatal Yoga + Garbhasanskar bundled
  ONE_TO_ONE_YOGA: "ONE_TO_ONE_YOGA",
  NUTRITION: "NUTRITION",
  STARTING_SOLIDS: "STARTING_SOLIDS",
} as const;
export type ServiceGroup = (typeof ServiceGroup)[keyof typeof ServiceGroup];

export const SERVICE_GROUP_LABELS: Record<ServiceGroup, string> = {
  PRENATAL_YOGA: "Prenatal Yoga",
  GARBHASANSKAR: "Garbhasanskar",
  COMBO: "Prenatal Yoga + Garbhasanskar",
  ONE_TO_ONE_YOGA: "Personalised 1:1 Yoga",
  NUTRITION: "Nutrition",
  STARTING_SOLIDS: "Starting Solids",
};

export const SessionFormat = {
  LIVE_GROUP: "LIVE_GROUP",
  ONE_TO_ONE: "ONE_TO_ONE",
  RECORDED: "RECORDED",
} as const;
export type SessionFormat = (typeof SessionFormat)[keyof typeof SessionFormat];

export const SESSION_FORMAT_LABELS: Record<SessionFormat, string> = {
  LIVE_GROUP: "Live group",
  ONE_TO_ONE: "1:1",
  RECORDED: "Recorded",
};

const SERVICE_GROUP_VALUES = Object.values(ServiceGroup) as [
  ServiceGroup,
  ...ServiceGroup[],
];
const SESSION_FORMAT_VALUES = Object.values(SessionFormat) as [
  SessionFormat,
  ...SessionFormat[],
];

export interface ServicePackage {
  id: string;
  group: ServiceGroup;
  name: string;
  summary: string;
  includes: string[];
  sessionCount: number | null;
  sessionMinutes: number | null;
  validityDays: number | null;
  format: SessionFormat;
  /** The regular price. Never display this directly — use resolvePackagePrice. */
  pricePaise: number;
  /** ISO. When pricePaise last changed; drives offerSavingsWarning. */
  priceSince: string;
  offerPricePaise: number | null;
  offerLabel: string | null;
  offerEndsAt: string | null;
  isIntroductory: boolean;
  isBestValue: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Admin create/replace of a package (full-replace semantics: send every
 * field). priceSince is not accepted — the service bumps it whenever
 * pricePaise changes, so the admin can't backdate a "regular" price.
 */
export const servicePackageInputSchema = z
  .object({
    group: z.enum(SERVICE_GROUP_VALUES, {
      errorMap: () => ({ message: "Choose which service this package belongs to" }),
    }),
    name: z
      .string()
      .trim()
      .min(2, "Enter a package name")
      .max(80, "Keep the name to 80 characters or fewer"),
    summary: z
      .string()
      .trim()
      .min(2, "Add a one-line summary")
      .max(300, "Keep the summary to 300 characters or fewer"),
    includes: z
      .array(
        z
          .string()
          .trim()
          .min(1, "Remove the empty bullet point")
          .max(120, "Keep each bullet point to 120 characters or fewer"),
      )
      .max(12, "Keep it to 12 bullet points or fewer")
      .default([]),
    sessionCount: z
      .number()
      .int("Enter a whole number of sessions")
      .min(1, "A package needs at least one session")
      .max(365, "That's more than a session a day for a year — check the count")
      .nullish(),
    sessionMinutes: z
      .number()
      .int("Enter the duration in whole minutes")
      .min(5, "A session should be at least 5 minutes")
      .max(600, "That's over 10 hours — check the duration")
      .nullish(),
    validityDays: z
      .number()
      .int("Enter validity as a whole number of days")
      .min(1, "Validity must be at least a day")
      .max(730, "Validity can't be more than two years")
      .nullish(),
    format: z.enum(SESSION_FORMAT_VALUES, {
      errorMap: () => ({ message: "Choose how the sessions are delivered" }),
    }),
    pricePaise: z
      .number()
      .int("Prices are whole paise")
      .min(0, "The price can't be negative")
      .max(1_00_00_000, "That's over ₹1,00,000 — check the price"),
    offerPricePaise: z
      .number()
      .int("Prices are whole paise")
      .min(1, "An offer price must be more than ₹0")
      .nullish(),
    offerLabel: blankable(
      z.string().trim().max(40, "Keep the offer label to 40 characters or fewer"),
    ),
    offerEndsAt: blankable(isoDateTime("Enter a valid offer end date")),
    isIntroductory: z.boolean().default(false),
    isBestValue: z.boolean().default(false),
    isActive: z.boolean().default(true),
    sortOrder: z
      .number()
      .int("Sort order is a whole number")
      .min(0, "Sort order can't be negative")
      .max(10000, "Sort order is too large")
      .default(0),
  })
  .refine(
    (v) => v.offerPricePaise == null || v.offerPricePaise < v.pricePaise,
    {
      message: "The offer price must be lower than the regular price",
      path: ["offerPricePaise"],
    },
  )
  .refine((v) => !(v.isIntroductory && v.offerPricePaise != null), {
    message:
      "An introductory price can't also have a special offer — remove one of them",
    path: ["isIntroductory"],
  });
export type ServicePackageInput = z.infer<typeof servicePackageInputSchema>;

/** Shown when an offer has no label of its own. */
export const DEFAULT_OFFER_LABEL = "Special Offer";

/** The fields resolvePackagePrice reads — satisfied by the DTO and by a Prisma row. */
export interface PackagePriceFields {
  pricePaise: number;
  offerPricePaise?: number | null;
  offerLabel?: string | null;
  offerEndsAt?: string | Date | null;
  isIntroductory?: boolean;
}

export interface ResolvedPackagePrice {
  /** What to quote and charge right now. */
  pricePaise: number;
  /** The struck-through regular price — present only during a live offer. */
  compareAtPaise?: number;
  label: "SPECIAL_OFFER" | "INTRODUCTORY" | null;
  /** The offer's own label, or DEFAULT_OFFER_LABEL. Only during a live offer. */
  offerLabel?: string;
  /** ISO. Only during a live offer that has an end date. */
  offerEndsAt?: string;
  savingsPaise?: number;
  /** Whole percent, rounded down — computed, never typed in (brief §9). */
  savingsPct?: number;
}

/**
 * The single definition of what a package costs right now — used by the price
 * cards, the WhatsApp booking message and the enquiry snapshot, so the three
 * can never disagree (same idea as splitPayout).
 *
 * An offer is live when offerPricePaise is set and offerEndsAt is null (open-
 * ended) or still in the future; an expired offer disappears by itself. The
 * stored data should never violate the input schema's rules, but this is
 * defensive about it anyway, because what it returns is shown as a price:
 * an "offer" that isn't below the regular price is ignored, and an offer on an
 * introductory package is ignored (an introductory price is never shown with
 * a strikethrough). An unparseable end date counts as expired.
 */
export function resolvePackagePrice(
  pkg: PackagePriceFields,
  now: Date = new Date(),
): ResolvedPackagePrice {
  const regular = pkg.pricePaise;
  const offer = pkg.offerPricePaise;
  const endsAt = pkg.offerEndsAt == null ? null : new Date(pkg.offerEndsAt);
  const offerLive =
    offer != null &&
    offer > 0 &&
    offer < regular &&
    !pkg.isIntroductory &&
    (endsAt === null || endsAt.getTime() > now.getTime());

  if (offerLive) {
    const savingsPaise = regular - offer;
    return {
      pricePaise: offer,
      compareAtPaise: regular,
      label: "SPECIAL_OFFER",
      offerLabel: pkg.offerLabel?.trim() || DEFAULT_OFFER_LABEL,
      ...(endsAt ? { offerEndsAt: endsAt.toISOString() } : {}),
      savingsPaise,
      savingsPct: Math.floor((savingsPaise * 100) / regular),
    };
  }
  return {
    pricePaise: regular,
    label: pkg.isIntroductory ? "INTRODUCTORY" : null,
  };
}

/**
 * The WhatsApp prefill for "Book Now", e.g.
 * "Hi! I'd like to book Monthly Combo (₹1,499) — Prenatal Yoga + Garbhasanskar."
 * The price is resolvePackagePrice's, so it always matches the card the mother
 * just tapped; a live offer or introductory price is named so the admin knows
 * which price she was quoted.
 */
export function packageBookingMessage(
  pkg: PackagePriceFields & { name: string; group: ServiceGroup },
  now: Date = new Date(),
): string {
  const price = resolvePackagePrice(pkg, now);
  const qualifier =
    price.label === "SPECIAL_OFFER"
      ? `, ${price.offerLabel}`
      : price.label === "INTRODUCTORY"
        ? ", introductory price"
        : "";
  return `Hi! I'd like to book ${pkg.name} (${formatPaise(price.pricePaise)}${qualifier}) — ${SERVICE_GROUP_LABELS[pkg.group]}.`;
}

/** How long a regular price should have been charged before it is struck through. */
export const OFFER_MIN_REGULAR_PRICE_DAYS = 30;

/**
 * Soft guard for brief §9 ("never advertise a regular price that was never
 * genuinely charged"). Software can't prove what was charged, so this only
 * warns: it returns a message for the admin form when a live offer would strike
 * through a regular price set less than 30 days ago, else null. Pass the
 * priceSince the package will have after the save — i.e. `now` if this save
 * changes pricePaise.
 */
export function offerSavingsWarning(
  pkg: PackagePriceFields & { priceSince: string | Date },
  now: Date = new Date(),
): string | null {
  if (resolvePackagePrice(pkg, now).label !== "SPECIAL_OFFER") return null;
  const since = new Date(pkg.priceSince).getTime();
  if (Number.isNaN(since)) return null;
  const days = Math.floor((now.getTime() - since) / 86_400_000);
  if (days >= OFFER_MIN_REGULAR_PRICE_DAYS) return null;
  const when = days <= 0 ? "today" : days === 1 ? "1 day ago" : `${days} days ago`;
  return (
    `The regular price ${formatPaise(pkg.pricePaise)} was set ${when}. ` +
    `Only show it struck through if customers have genuinely paid it — ` +
    `ideally for at least ${OFFER_MIN_REGULAR_PRICE_DAYS} days before an offer.`
  );
}

/* ------------------------------------------------------------------ */
/* Partner offers (/offers)                                            */
/* ------------------------------------------------------------------ */

export interface PartnerOffer {
  id: string;
  brandName: string;
  logoUrl: string | null;
  description: string;
  /** The verified discount, e.g. "15% off your first order". */
  benefit: string;
  couponCode: string | null;
  url: string;
  /** Affiliate links render rel="sponsored" with an "Affiliate link" chip. */
  isAffiliate: boolean;
  expiresAt: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export const partnerOfferInputSchema = z.object({
  brandName: z
    .string()
    .trim()
    .min(2, "Enter the brand name")
    .max(80, "Keep the brand name to 80 characters or fewer"),
  logoUrl: blankable(imageUrl),
  description: z
    .string()
    .trim()
    .min(10, "Describe the offer in a sentence or two")
    .max(500, "Keep the description to 500 characters or fewer"),
  benefit: z
    .string()
    .trim()
    .min(2, "Enter the verified benefit, e.g. 15% off")
    .max(120, "Keep the benefit to 120 characters or fewer"),
  couponCode: blankable(
    z
      .string()
      .trim()
      .max(40, "Keep the coupon code to 40 characters or fewer")
      .regex(/^\S*$/, "Coupon codes can't contain spaces"),
  ),
  url: httpsUrl("shop link"),
  isAffiliate: z.boolean().default(false),
  expiresAt: blankable(isoDateTime("Enter a valid expiry date")),
  isActive: z.boolean().default(true),
  sortOrder: z
    .number()
    .int("Sort order is a whole number")
    .min(0, "Sort order can't be negative")
    .max(10000, "Sort order is too large")
    .default(0),
});
export type PartnerOfferInput = z.infer<typeof partnerOfferInputSchema>;

/* ------------------------------------------------------------------ */
/* FAQs                                                                */
/* ------------------------------------------------------------------ */

export const FaqSection = {
  GENERAL: "GENERAL",
  SESSIONS: "SESSIONS",
  NUTRITION: "NUTRITION",
  MARKETPLACE: "MARKETPLACE",
  PAYMENTS: "PAYMENTS",
  DONATIONS: "DONATIONS",
} as const;
export type FaqSection = (typeof FaqSection)[keyof typeof FaqSection];

export const FAQ_SECTION_LABELS: Record<FaqSection, string> = {
  GENERAL: "General",
  SESSIONS: "Sessions & booking",
  NUTRITION: "Nutrition",
  MARKETPLACE: "Buying & selling preloved",
  PAYMENTS: "Payments",
  DONATIONS: "Donations",
};

const FAQ_SECTION_VALUES = Object.values(FaqSection) as [FaqSection, ...FaqSection[]];

export interface Faq {
  id: string;
  section: FaqSection;
  question: string;
  /** Markdown. */
  answer: string;
  sortOrder: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export const faqInputSchema = z.object({
  section: z.enum(FAQ_SECTION_VALUES, {
    errorMap: () => ({ message: "Choose a section" }),
  }),
  question: z
    .string()
    .trim()
    .min(5, "Enter the question")
    .max(200, "Keep the question to 200 characters or fewer"),
  answer: z
    .string()
    .trim()
    .min(2, "Write an answer")
    .max(4000, "Keep the answer to 4,000 characters or fewer"),
  sortOrder: z
    .number()
    .int("Sort order is a whole number")
    .min(0, "Sort order can't be negative")
    .max(10000, "Sort order is too large")
    .default(0),
  isPublished: z.boolean().default(true),
});
export type FaqInput = z.infer<typeof faqInputSchema>;

/* ------------------------------------------------------------------ */
/* Testimonials                                                        */
/* ------------------------------------------------------------------ */

export interface Testimonial {
  id: string;
  name: string;
  /** e.g. "Prenatal yoga · Hyderabad". */
  context: string | null;
  quote: string;
  photoUrl: string | null;
  consentConfirmed: boolean;
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * The brief forbids testimonials without the mother's permission, so
 * publishing requires consentConfirmed. The public read must also filter on
 * both flags — this schema only stops an admin saving a published,
 * unconsented row.
 */
export const testimonialInputSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Enter the mother's name")
      .max(80, "Keep the name to 80 characters or fewer"),
    context: blankable(
      z.string().trim().max(80, "Keep the context to 80 characters or fewer"),
    ),
    quote: z
      .string()
      .trim()
      .min(10, "Enter the testimonial")
      .max(1000, "Keep the testimonial to 1,000 characters or fewer"),
    photoUrl: blankable(imageUrl),
    consentConfirmed: z.boolean().default(false),
    isPublished: z.boolean().default(false),
    sortOrder: z
      .number()
      .int("Sort order is a whole number")
      .min(0, "Sort order can't be negative")
      .max(10000, "Sort order is too large")
      .default(0),
  })
  .refine((v) => !v.isPublished || v.consentConfirmed, {
    message:
      "Confirm you have her written permission before publishing this testimonial",
    path: ["consentConfirmed"],
  });
export type TestimonialInput = z.infer<typeof testimonialInputSchema>;

/* ------------------------------------------------------------------ */
/* Site content (singleton: hero, About, gallery, socials, policy)     */
/* ------------------------------------------------------------------ */

export interface Founder {
  name: string;
  role: string;
  photoUrl?: string | null;
  bio: string;
  /** Verified qualifications only — the About page prints them as fact. */
  qualifications: string[];
}

export interface GalleryImage {
  url: string;
  alt: string;
  caption?: string | null;
}

/**
 * Admin-editable copy and links. A section whose field is null or empty stays
 * hidden on the site, so a placeholder never goes live. The social URLs fall
 * back to the constants in apps/web/src/lib/site-nav.ts when null.
 */
export interface SiteContent {
  heroHeadline: string;
  heroSubline: string;
  heroMessage: string;
  heroImageUrl: string | null;
  heroImageAlt: string | null;
  aboutMission: string | null;
  founders: Founder[];
  galleryImages: GalleryImage[];
  instagramUrl: string | null;
  youtubeUrl: string | null;
  whatsappCommunityUrl: string | null;
  whatsappPrelovedUrl: string | null;
  /** Markdown: session cancellation, rescheduling and refunds (§10). */
  sessionPolicy: string | null;
  updatedAt: string;
}

/** One entry of SiteContent.founders — also usable to parse the stored JSON. */
export const founderSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter the founder's name")
    .max(80, "Keep the name to 80 characters or fewer"),
  role: z
    .string()
    .trim()
    .min(2, "Enter the founder's role")
    .max(80, "Keep the role to 80 characters or fewer"),
  photoUrl: blankable(imageUrl),
  bio: z
    .string()
    .trim()
    .min(10, "Write a short introduction")
    .max(1500, "Keep the introduction to 1,500 characters or fewer"),
  qualifications: z
    .array(
      z
        .string()
        .trim()
        .min(2, "Remove the empty qualification")
        .max(160, "Keep each qualification to 160 characters or fewer"),
    )
    .max(12, "List 12 qualifications or fewer")
    .default([]),
});

/** One entry of SiteContent.galleryImages — also usable to parse the stored JSON. */
export const galleryImageSchema = z.object({
  url: imageUrl,
  alt: z
    .string()
    .trim()
    .min(3, "Describe the photo for people using screen readers")
    .max(200, "Keep the description to 200 characters or fewer"),
  caption: blankable(
    z.string().trim().max(160, "Keep the caption to 160 characters or fewer"),
  ),
});

export const siteContentInputSchema = z
  .object({
    heroHeadline: z
      .string()
      .trim()
      .min(5, "Enter the hero headline")
      .max(120, "Keep the headline to 120 characters or fewer"),
    heroSubline: z
      .string()
      .trim()
      .min(5, "Enter the hero subline")
      .max(200, "Keep the subline to 200 characters or fewer"),
    heroMessage: z
      .string()
      .trim()
      .min(5, "Enter the hero message")
      .max(400, "Keep the message to 400 characters or fewer"),
    heroImageUrl: blankable(imageUrl),
    heroImageAlt: blankable(
      z.string().trim().max(200, "Keep the description to 200 characters or fewer"),
    ),
    aboutMission: blankable(
      z.string().trim().max(2000, "Keep the mission to 2,000 characters or fewer"),
    ),
    founders: z.array(founderSchema).max(6, "Add 6 founders or fewer").default([]),
    galleryImages: z
      .array(galleryImageSchema)
      .max(40, "Keep the gallery to 40 photos or fewer")
      .default([]),
    instagramUrl: blankable(httpsUrl("Instagram link")),
    youtubeUrl: blankable(httpsUrl("YouTube link")),
    whatsappCommunityUrl: blankable(httpsUrl("WhatsApp community link")),
    whatsappPrelovedUrl: blankable(httpsUrl("WhatsApp preloved group link")),
    sessionPolicy: blankable(
      z.string().trim().max(6000, "Keep the session policy to 6,000 characters or fewer"),
    ),
  })
  .refine((v) => !v.heroImageUrl || !!v.heroImageAlt, {
    message: "Describe the hero photo for people using screen readers",
    path: ["heroImageAlt"],
  });
export type SiteContentInput = z.infer<typeof siteContentInputSchema>;

/* ------------------------------------------------------------------ */
/* Donations (admin-matched)                                           */
/* ------------------------------------------------------------------ */

export const DonationStatus = {
  NEW: "NEW",
  CONTACTED: "CONTACTED",
  MATCHED: "MATCHED",
  COMPLETED: "COMPLETED",
  DECLINED: "DECLINED",
} as const;
export type DonationStatus = (typeof DonationStatus)[keyof typeof DonationStatus];

export const DONATION_STATUS_LABELS: Record<DonationStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  MATCHED: "Matched",
  COMPLETED: "Completed",
  DECLINED: "Declined",
};

export const HandoverPreference = {
  PICKUP: "PICKUP",
  DROP_OFF: "DROP_OFF",
  EITHER: "EITHER",
} as const;
export type HandoverPreference =
  (typeof HandoverPreference)[keyof typeof HandoverPreference];

export const HANDOVER_PREFERENCE_LABELS: Record<HandoverPreference, string> = {
  PICKUP: "Pick up from me",
  DROP_OFF: "I'll drop it off",
  EITHER: "Either works",
};

const DONATION_STATUS_VALUES = Object.values(DonationStatus) as [
  DonationStatus,
  ...DonationStatus[],
];
const HANDOVER_PREFERENCE_VALUES = Object.values(HandoverPreference) as [
  HandoverPreference,
  ...HandoverPreference[],
];

/**
 * An item a mother offers to donate. Matched by hand by the admin; never
 * public, so the PIN is included here (for the donor and the admin only).
 */
export interface DonationOffer {
  id: string;
  donorId: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  city: string;
  locality: string | null;
  pincode: string;
  categoryId: string | null;
  category: Category | null;
  itemsDescription: string;
  condition: Condition;
  images: string[];
  handover: HandoverPreference;
  status: DonationStatus;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export const donationOfferInputSchema = z.object({
  contactName: z
    .string()
    .trim()
    .min(2, "Enter your name")
    .max(120, "Keep your name to 120 characters or fewer"),
  contactEmail: z.string().trim().email("Enter a valid email address"),
  contactPhone: indianMobileNumberSchema,
  city: z
    .string()
    .trim()
    .min(2, "Enter your city")
    .max(80, "City name is too long")
    .transform(normaliseCity),
  locality: localitySchema.optional().or(z.literal("")),
  pincode: pincodeSchema,
  categoryId: blankable(z.string().trim().min(1)),
  itemsDescription: z
    .string()
    .trim()
    .min(10, "Tell us a little about what you'd like to donate")
    .max(2000, "Keep the description to 2,000 characters or fewer"),
  condition: z.enum([Condition.NEW, Condition.LIKE_NEW, Condition.GOOD, Condition.FAIR], {
    errorMap: () => ({ message: "Choose the condition" }),
  }),
  images: z
    .array(z.string().url())
    .max(10, "You can add up to 10 photos")
    .default([]),
  handover: z.enum(HANDOVER_PREFERENCE_VALUES, {
    errorMap: () => ({ message: "Choose how you'd like to hand it over" }),
  }),
});
export type DonationOfferInput = z.infer<typeof donationOfferInputSchema>;

/** Admin queue: move a donation along and/or leave a note. */
export const donationStatusUpdateSchema = z.object({
  status: z.enum(DONATION_STATUS_VALUES, {
    errorMap: () => ({ message: "Choose a status" }),
  }),
  adminNote: blankable(
    z.string().trim().max(1000, "Keep the note to 1,000 characters or fewer"),
  ),
});
export type DonationStatusUpdateInput = z.infer<typeof donationStatusUpdateSchema>;

/**
 * Where a donation may move next. COMPLETED and DECLINED are final. The API
 * enforces this; the admin screen uses it to offer only the legal moves.
 * Re-saving the current status is not a transition — it's how a note alone
 * is updated.
 */
export const DONATION_STATUS_TRANSITIONS: Readonly<
  Record<DonationStatus, readonly DonationStatus[]>
> = {
  NEW: ["CONTACTED", "DECLINED"],
  CONTACTED: ["MATCHED", "DECLINED"],
  MATCHED: ["COMPLETED", "DECLINED"],
  COMPLETED: [],
  DECLINED: [],
};

export function canMoveDonation(from: DonationStatus, to: DonationStatus): boolean {
  return from === to || DONATION_STATUS_TRANSITIONS[from].includes(to);
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

export function formatPaise(paise: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

/** Build a wa.me deep link with a prefilled enquiry message. */
export function whatsappLink(number: string, message: string): string {
  const digits = number.replace(/[^0-9]/g, "");
  const normalized = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
