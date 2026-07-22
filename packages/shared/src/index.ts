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
  activePlan: MembershipPlan | null;
  membershipExpiresAt: string | null; // ISO, null if none/expired
  canList: boolean; // registrationPaid && active membership
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
  createdAt: string;
  shipmentStatus: ShipmentStatus;
  courier: string | null;
  trackingId: string | null;
  shipToCity: string;
  shipToState: string;
  items: { title: string; unitPriceInPaise: number; image: string | null }[];
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
} as const;
export type NotificationType =
  (typeof NotificationType)[keyof typeof NotificationType];

/* ------------------------------------------------------------------ */
/* Auth & profile                                                      */
/* ------------------------------------------------------------------ */

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(72),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const refreshSchema = z.object({ refreshToken: z.string().min(1) });
export type RefreshInput = z.infer<typeof refreshSchema>;

export const forgotPasswordSchema = z.object({ email: z.string().email() });
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(72),
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

export const profileUpdateSchema = z.object({
  name: z.string().min(2).max(80).optional(),
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
  name: z.string().min(2).max(60),
  slug: z
    .string()
    .min(2)
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
    title: z.string().min(3).max(140),
    description: z.string().min(10).max(4000),
    categoryId: z.string().min(1),
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
    city: z.string().min(2).max(80),
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
  title: z.string().min(3).max(140).optional(),
  description: z.string().min(10).max(4000).optional(),
  categoryId: z.string().min(1).optional(),
  condition: z
    .enum([Condition.NEW, Condition.LIKE_NEW, Condition.GOOD, Condition.FAIR])
    .optional(),
  originalPriceInPaise: z.number().int().positive().optional(),
  sellingPriceInPaise: z.number().int().positive().optional(),
  usageDuration: z.string().max(60).optional().or(z.literal("")),
  reasonForSelling: z.string().max(300).optional().or(z.literal("")),
  city: z.string().min(2).max(80).optional(),
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
  fullName: z.string().min(2).max(120),
  phone: phoneNumberSchema,
  line1: z.string().min(2).max(200),
  line2: z.string().max(200).optional().or(z.literal("")),
  city: z.string().min(1).max(80),
  state: z.string().min(1).max(80),
  postalCode: z.string().min(3).max(12),
  country: z.string().min(2).max(60).default("India"),
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
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  totalInPaise: number;
  shippingAddress: ShippingAddress;
  items: OrderItem[];
  razorpayOrderId: string | null;
  refundedAt: string | null;
  createdAt: string;
}

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    OrderStatus.PENDING,
    OrderStatus.PAID,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED,
  ]),
});
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

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
  read: boolean;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/* Admin                                                               */
/* ------------------------------------------------------------------ */

export const moderateListingSchema = z.object({
  status: z.enum([ListingStatus.APPROVED, ListingStatus.REJECTED]),
});
export type ModerateListingInput = z.infer<typeof moderateListingSchema>;

export const featureListingSchema = z.object({ isFeatured: z.boolean() });
export type FeatureListingInput = z.infer<typeof featureListingSchema>;

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
  listingCount: number;
  createdAt: string;
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
