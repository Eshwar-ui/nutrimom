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

export const NotificationType = {
  LISTING_APPROVED: "LISTING_APPROVED",
  LISTING_REJECTED: "LISTING_REJECTED",
  ITEM_SOLD: "ITEM_SOLD",
  ORDER_PLACED: "ORDER_PLACED",
  ORDER_CANCELLED: "ORDER_CANCELLED",
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

export const profileUpdateSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  whatsappNumber: z
    .string()
    .regex(/^[0-9+\-\s]{8,20}$/, "Enter a valid phone number")
    .optional()
    .or(z.literal("")),
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
    whatsappNumber: z
      .string()
      .regex(/^[0-9+\-\s]{8,20}$/)
      .optional()
      .or(z.literal("")),
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
  whatsappNumber: string | null;
  isSellerVerified: boolean;
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
  phone: z.string().min(6).max(20),
  line1: z.string().min(2).max(200),
  line2: z.string().max(200).optional().or(z.literal("")),
  city: z.string().min(1).max(80),
  state: z.string().min(1).max(80),
  postalCode: z.string().min(3).max(12),
  country: z.string().min(2).max(60).default("India"),
});
export type ShippingAddress = z.infer<typeof shippingAddressSchema>;

// The client sends only listing ids (each item is a single unit).
// The server re-prices and re-checks availability.
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
  totalInPaise: number;
  shippingAddress: ShippingAddress;
  items: OrderItem[];
  razorpayOrderId: string | null;
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
