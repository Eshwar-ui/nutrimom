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

export const conditionLabels: Record<Condition, string> = {
  NEW: "New with tags",
  LIKE_NEW: "Like new",
  GOOD: "Good",
  FAIR: "Fair",
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
  COD: "COD", // Cash on Delivery — the active method
  ONLINE: "ONLINE", // Razorpay — kept for a future rollout
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
/* Listings                                                            */
/* ------------------------------------------------------------------ */

// Prices are integer paise everywhere.
export const listingInputSchema = z
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
    originalPriceInPaise: z.number().int().positive().optional(),
    sellingPriceInPaise: z.number().int().positive(),
    purchaseDate: z.string().datetime().optional().or(z.literal("")),
    usageDuration: z.string().max(60).optional().or(z.literal("")),
    reasonForSelling: z.string().max(300).optional().or(z.literal("")),
    city: z.string().min(2, "Enter your city").max(80),
    deliveryOption: z.enum([
      DeliveryOption.PICKUP,
      DeliveryOption.DELIVERY,
      DeliveryOption.BOTH,
    ]),
    images: z.array(z.string().url()).min(1).max(10),
    // Optional: updates the seller's profile contact if provided.
    whatsappNumber: phoneNumberSchema.optional().or(z.literal("")),
  })
  .refine(
    (v) =>
      v.originalPriceInPaise === undefined ||
      v.originalPriceInPaise >= v.sellingPriceInPaise,
    { message: "Original price should be ≥ selling price", path: ["originalPriceInPaise"] },
  );
export type ListingInput = z.infer<typeof listingInputSchema>;

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
  city: z.string().min(2, "Enter your city").max(80).optional(),
  deliveryOption: z
    .enum([DeliveryOption.PICKUP, DeliveryOption.DELIVERY, DeliveryOption.BOTH])
    .optional(),
  images: z.array(z.string().url()).min(1).max(10).optional(),
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
  deliveryOption: DeliveryOption;
  images: string[];
  status: ListingStatus;
  rejectionReason: string | null;
  isFeatured: boolean;
  category: Category;
  seller: SellerInfo;
  createdAt: string;
}

export const listingQuerySchema = z.object({
  category: z.string().optional(), // category slug
  condition: z
    .enum([Condition.NEW, Condition.LIKE_NEW, Condition.GOOD, Condition.FAIR])
    .optional(),
  city: z.string().optional(),
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
});
export type BlogPostInput = z.infer<typeof blogPostInputSchema>;

export const setBlogPostPublishedSchema = z.object({ published: z.boolean() });
export type SetBlogPostPublishedInput = z.infer<
  typeof setBlogPostPublishedSchema
>;

export const blogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(12),
});
export type BlogQuery = z.infer<typeof blogQuerySchema>;

/* ------------------------------------------------------------------ */
/* Contact                                                             */
/* ------------------------------------------------------------------ */

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
  createdAt: string;
}

export const contactMessageInputSchema = z.object({
  name: z.string().min(2, "Enter your name").max(120),
  email: z.string().email("Enter a valid email address"),
  phone: phoneNumberSchema.optional().or(z.literal("")),
  subject: z.string().min(3, "Enter a subject").max(160),
  message: z.string().min(10, "A little more detail helps us help you").max(4000),
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
