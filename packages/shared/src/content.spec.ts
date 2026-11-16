import {
  contactMessageInputSchema,
  donationOfferInputSchema,
  donationStatusUpdateSchema,
  faqInputSchema,
  partnerOfferInputSchema,
  siteContentInputSchema,
  testimonialInputSchema,
} from "./index";

/**
 * The admin content schemas guard rules the brief states outright: no
 * testimonial without permission, no plain-http partner links, no hero photo
 * without alt text. Each is asserted directly.
 */

describe("testimonialInputSchema", () => {
  const base = {
    name: "Asha",
    context: "Prenatal yoga · Hyderabad",
    quote: "The classes kept me moving all through my third trimester.",
  };

  it("saves an unpublished testimonial without consent (a draft)", () => {
    const parsed = testimonialInputSchema.parse(base);
    expect(parsed.isPublished).toBe(false);
    expect(parsed.consentConfirmed).toBe(false);
  });

  it("refuses to publish without confirmed consent", () => {
    const result = testimonialInputSchema.safeParse({
      ...base,
      isPublished: true,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["consentConfirmed"]);
    }
  });

  it("publishes once consent is confirmed", () => {
    expect(
      testimonialInputSchema.safeParse({
        ...base,
        isPublished: true,
        consentConfirmed: true,
      }).success,
    ).toBe(true);
  });
});

describe("partnerOfferInputSchema", () => {
  const base = {
    brandName: "Little Sprouts",
    description: "Organic baby food delivered weekly.",
    benefit: "15% off your first order",
    couponCode: "NURTURE15",
    url: "https://littlesprouts.example/shop",
  };

  it("accepts an https offer and applies defaults", () => {
    const parsed = partnerOfferInputSchema.parse(base);
    expect(parsed.isAffiliate).toBe(false);
    expect(parsed.isActive).toBe(true);
  });

  it("rejects a plain-http shop link", () => {
    const result = partnerOfferInputSchema.safeParse({
      ...base,
      url: "http://littlesprouts.example/shop",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/https:\/\//);
    }
  });

  it("rejects a coupon code with spaces", () => {
    expect(
      partnerOfferInputSchema.safeParse({ ...base, couponCode: "NURTURE 15" })
        .success,
    ).toBe(false);
  });

  it("accepts a cleared coupon and expiry", () => {
    expect(
      partnerOfferInputSchema.safeParse({
        ...base,
        couponCode: "",
        expiresAt: null,
      }).success,
    ).toBe(true);
  });
});

describe("faqInputSchema", () => {
  it("accepts a markdown answer and defaults to published", () => {
    const parsed = faqInputSchema.parse({
      section: "SESSIONS",
      question: "How do I book a session?",
      answer: "Use the booking button on the [yoga](/yoga) page.",
    });
    expect(parsed.isPublished).toBe(true);
  });

  it("rejects an unknown section", () => {
    expect(
      faqInputSchema.safeParse({
        section: "SHIPPING",
        question: "Where is my parcel?",
        answer: "On its way.",
      }).success,
    ).toBe(false);
  });
});

describe("siteContentInputSchema", () => {
  const base = {
    heroHeadline: "From pregnancy to toddlerhood, you’re not alone.",
    heroSubline: "A nurturing space for every mother, every journey, and every stage.",
    heroMessage: "Move, nourish, connect and grow together.",
  };

  it("accepts the minimum and defaults the arrays", () => {
    const parsed = siteContentInputSchema.parse(base);
    expect(parsed.founders).toEqual([]);
    expect(parsed.galleryImages).toEqual([]);
  });

  it("requires alt text when a hero photo is set", () => {
    const result = siteContentInputSchema.safeParse({
      ...base,
      heroImageUrl: "https://cdn.example/hero.jpg",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["heroImageAlt"]);
    }
  });

  it("validates founders and gallery entries", () => {
    expect(
      siteContentInputSchema.safeParse({
        ...base,
        founders: [
          {
            name: "Priya",
            role: "Co-founder, prenatal yoga teacher",
            bio: "Teaching prenatal yoga since 2018.",
            qualifications: ["RYT-200"],
          },
        ],
        galleryImages: [{ url: "https://cdn.example/1.jpg", alt: "Moms at a meetup" }],
      }).success,
    ).toBe(true);
    expect(
      siteContentInputSchema.safeParse({
        ...base,
        galleryImages: [{ url: "https://cdn.example/1.jpg", alt: "" }],
      }).success,
    ).toBe(false);
  });

  it("requires https social links but allows clearing them", () => {
    expect(
      siteContentInputSchema.safeParse({
        ...base,
        instagramUrl: "http://instagram.com/x",
      }).success,
    ).toBe(false);
    expect(
      siteContentInputSchema.safeParse({ ...base, instagramUrl: "" }).success,
    ).toBe(true);
  });
});

describe("donationOfferInputSchema", () => {
  const base = {
    contactName: "Meera",
    contactEmail: "meera@example.com",
    contactPhone: "+91 98765 43210",
    city: "bangalore",
    pincode: "560034",
    itemsDescription: "A cot and two bags of newborn clothes.",
    condition: "GOOD",
    handover: "EITHER",
  };

  it("accepts a donation, normalising the city", () => {
    const parsed = donationOfferInputSchema.parse(base);
    expect(parsed.city).toBe("Bengaluru");
    expect(parsed.images).toEqual([]);
  });

  it("requires a valid PIN", () => {
    const { pincode, ...withoutPin } = base;
    void pincode;
    expect(donationOfferInputSchema.safeParse(withoutPin).success).toBe(false);
    expect(
      donationOfferInputSchema.safeParse({ ...base, pincode: "000000" }).success,
    ).toBe(false);
  });

  it("rejects an unknown handover preference", () => {
    expect(
      donationOfferInputSchema.safeParse({ ...base, handover: "COURIER" })
        .success,
    ).toBe(false);
  });
});

describe("donationStatusUpdateSchema", () => {
  it("accepts a status with an optional note", () => {
    expect(
      donationStatusUpdateSchema.safeParse({ status: "CONTACTED" }).success,
    ).toBe(true);
    expect(
      donationStatusUpdateSchema.safeParse({
        status: "MATCHED",
        adminNote: "Matched with a mom in Whitefield.",
      }).success,
    ).toBe(true);
  });

  it("rejects an unknown status", () => {
    expect(
      donationStatusUpdateSchema.safeParse({ status: "SHIPPED" }).success,
    ).toBe(false);
  });
});

describe("contactMessageInputSchema packageId", () => {
  const base = {
    name: "Asha",
    email: "asha@example.com",
    subject: "Monthly Combo",
    message: "I'd like to know about the next batch.",
  };

  it("accepts a package id but never a price", () => {
    const parsed = contactMessageInputSchema.parse({
      ...base,
      packageId: "pkg_combo_monthly",
      quotedPricePaise: 1,
    });
    expect(parsed.packageId).toBe("pkg_combo_monthly");
    // Unknown keys are stripped: a client can't smuggle in a quoted price.
    expect(parsed).not.toHaveProperty("quotedPricePaise");
  });

  it("keeps the package optional", () => {
    expect(contactMessageInputSchema.safeParse(base).success).toBe(true);
  });
});
