import {
  cancelOrderSchema,
  createOrderSchema,
  indianMobileNumberSchema,
  isBusinessProfileComplete,
  listingInputSchema,
  listingQuerySchema,
  markPayoutPaidSchema,
  missingBusinessFields,
  payoutPolicyInputSchema,
  phoneNumberSchema,
  registerSchema,
  shippingAddressSchema,
  type BusinessProfile,
} from "./index";

/**
 * These schemas are the API's only input validation — every controller runs
 * them through ZodValidationPipe and no service re-checks the shape. A hole
 * here is a hole in the API, so the boundary cases are asserted directly
 * rather than inferred from the happy path.
 */

const validAddress = {
  fullName: "Asha Menon",
  phone: "+91 98765 43210",
  line1: "12 Nandi Durga Road",
  city: "Bengaluru",
  state: "Karnataka",
  postalCode: "560046",
  country: "India",
};

describe("shippingAddressSchema", () => {
  it("accepts a well-formed Indian address", () => {
    expect(shippingAddressSchema.safeParse(validAddress).success).toBe(true);
  });

  it("defaults country to India when omitted", () => {
    const { country, ...withoutCountry } = validAddress;
    void country;
    const parsed = shippingAddressSchema.parse(withoutCountry);
    expect(parsed.country).toBe("India");
  });

  describe("postalCode", () => {
    it.each(["560046", "110001", "682001"])("accepts %s", (code) => {
      expect(
        shippingAddressSchema.safeParse({ ...validAddress, postalCode: code })
          .success,
      ).toBe(true);
    });

    // The loose min(3).max(12) this replaced accepted every one of these, and
    // a bad pincode means the parcel goes to the wrong place.
    it.each(["", "56004", "5600461", "abcdef", "560 046", "56-0046", "!!!!!!"])(
      "rejects %p",
      (code) => {
        expect(
          shippingAddressSchema.safeParse({ ...validAddress, postalCode: code })
            .success,
        ).toBe(false);
      },
    );

    it("trims surrounding whitespace before checking", () => {
      const parsed = shippingAddressSchema.safeParse({
        ...validAddress,
        postalCode: "  560046  ",
      });
      expect(parsed.success).toBe(true);
      if (parsed.success) expect(parsed.data.postalCode).toBe("560046");
    });
  });

  it("requires a recipient name of at least two characters", () => {
    expect(
      shippingAddressSchema.safeParse({ ...validAddress, fullName: "A" })
        .success,
    ).toBe(false);
  });

  it("carries a friendly message, never raw Zod text", () => {
    const result = shippingAddressSchema.safeParse({
      ...validAddress,
      line1: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const message = result.error.issues[0].message;
      expect(message).toBe("Enter your street address");
      expect(message).not.toMatch(/String must contain/);
    }
  });

  it("allows line2 to be absent or empty, but not overlong", () => {
    expect(
      shippingAddressSchema.safeParse({ ...validAddress, line2: "" }).success,
    ).toBe(true);
    expect(
      shippingAddressSchema.safeParse({
        ...validAddress,
        line2: "x".repeat(201),
      }).success,
    ).toBe(false);
  });
});

describe("indianMobileNumberSchema", () => {
  it.each([
    "9876543210",
    "+919876543210",
    "+91 98765 43210",
    "98765-43210",
    "(98765) 43210",
    "  9876543210  ",
  ])("accepts %p", (value) => {
    expect(indianMobileNumberSchema.safeParse(value).success).toBe(true);
  });

  it.each([
    "", // empty
    "1234567890", // Indian mobiles start 6-9
    "5876543210",
    "987654321", // nine digits
    "98765432109", // eleven digits
    "+1 415 555 0100", // not India
    "not a number",
    "++++----",
  ])("rejects %p", (value) => {
    expect(indianMobileNumberSchema.safeParse(value).success).toBe(false);
  });
});

describe("phoneNumberSchema", () => {
  it("accepts an international number with separators", () => {
    expect(phoneNumberSchema.safeParse("+1 (415) 555-0100").success).toBe(true);
  });

  it("rejects punctuation with no digits behind it", () => {
    expect(phoneNumberSchema.safeParse("++++----").success).toBe(false);
  });

  it("rejects fewer than ten digits", () => {
    expect(phoneNumberSchema.safeParse("12345").success).toBe(false);
  });
});

describe("registerSchema", () => {
  const valid = {
    name: "Asha Menon",
    email: "asha@example.com",
    password: "correct horse battery",
  };

  it("accepts a valid registration", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("requires at least eight characters of password", () => {
    const result = registerSchema.safeParse({ ...valid, password: "short" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Use at least 8 characters");
    }
  });

  it("caps the password at bcrypt's 72-byte limit", () => {
    // Beyond 72 bytes bcrypt silently ignores the tail, so two different
    // long passwords would authenticate the same account.
    expect(
      registerSchema.safeParse({ ...valid, password: "x".repeat(72) }).success,
    ).toBe(true);
    expect(
      registerSchema.safeParse({ ...valid, password: "x".repeat(73) }).success,
    ).toBe(false);
  });

  it.each(["", "not-an-email", "a@b", "a@@b.com", "asha@"])(
    "rejects the email %p",
    (email) => {
      expect(registerSchema.safeParse({ ...valid, email }).success).toBe(false);
    },
  );
});

describe("listingInputSchema", () => {
  const valid = {
    title: "Stretchy wrap carrier",
    description: "Barely used, washed once, no marks.",
    categoryId: "cat_1",
    condition: "LIKE_NEW" as const,
    sellingPriceInPaise: 120000,
    city: "Bengaluru",
    deliveryOption: "BOTH" as const,
    images: ["https://cdn.example.com/a.jpg"],
  };

  it("accepts a minimal valid listing", () => {
    expect(listingInputSchema.safeParse(valid).success).toBe(true);
  });

  it("requires at least one photo, with a friendly message", () => {
    const result = listingInputSchema.safeParse({ ...valid, images: [] });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Add at least one photo");
    }
  });

  it("caps photos at ten", () => {
    const images = Array.from(
      { length: 11 },
      (_, i) => `https://cdn.example.com/${i}.jpg`,
    );
    expect(listingInputSchema.safeParse({ ...valid, images }).success).toBe(
      false,
    );
  });

  it("rejects a non-URL image", () => {
    expect(
      listingInputSchema.safeParse({ ...valid, images: ["not-a-url"] }).success,
    ).toBe(false);
  });

  it("rejects a free or negative price", () => {
    for (const sellingPriceInPaise of [0, -1, -100000]) {
      expect(
        listingInputSchema.safeParse({ ...valid, sellingPriceInPaise }).success,
      ).toBe(false);
    }
  });

  it("rejects a fractional paise price", () => {
    expect(
      listingInputSchema.safeParse({ ...valid, sellingPriceInPaise: 120000.5 })
        .success,
    ).toBe(false);
  });

  it("refuses an original price below the asking price", () => {
    // Otherwise the listing renders a "discount" that is really a markup.
    const result = listingInputSchema.safeParse({
      ...valid,
      originalPriceInPaise: 100000,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["originalPriceInPaise"]);
    }
  });

  it("allows an original price equal to the asking price", () => {
    expect(
      listingInputSchema.safeParse({ ...valid, originalPriceInPaise: 120000 })
        .success,
    ).toBe(true);
  });

  it("rejects an unknown condition", () => {
    expect(
      listingInputSchema.safeParse({ ...valid, condition: "MINT" }).success,
    ).toBe(false);
  });
});

describe("listingQuerySchema", () => {
  it("applies the documented defaults to an empty query", () => {
    expect(listingQuerySchema.parse({})).toMatchObject({
      page: 1,
      pageSize: 12,
      sort: "newest",
    });
  });

  it("coerces the numeric params that arrive as query strings", () => {
    const parsed = listingQuerySchema.parse({
      page: "3",
      pageSize: "24",
      minPrice: "1000",
    });
    expect(parsed).toMatchObject({ page: 3, pageSize: 24, minPrice: 1000 });
  });

  it("caps pageSize at 60", () => {
    // The sitemap builders paginate against this cap; an oversized page 400s
    // and would silently produce no URLs.
    expect(listingQuerySchema.safeParse({ pageSize: 60 }).success).toBe(true);
    expect(listingQuerySchema.safeParse({ pageSize: 61 }).success).toBe(false);
  });

  it("rejects page zero and negative pages", () => {
    expect(listingQuerySchema.safeParse({ page: 0 }).success).toBe(false);
    expect(listingQuerySchema.safeParse({ page: -1 }).success).toBe(false);
  });

  it("rejects an unknown sort", () => {
    expect(listingQuerySchema.safeParse({ sort: "cheapest" }).success).toBe(
      false,
    );
  });
});

describe("createOrderSchema", () => {
  it("requires at least one listing", () => {
    expect(
      createOrderSchema.safeParse({
        listingIds: [],
        shippingAddress: validAddress,
      }).success,
    ).toBe(false);
  });

  it("caps a basket at twenty items", () => {
    const ids = (n: number) => Array.from({ length: n }, (_, i) => `l${i}`);
    expect(
      createOrderSchema.safeParse({
        listingIds: ids(20),
        shippingAddress: validAddress,
      }).success,
    ).toBe(true);
    expect(
      createOrderSchema.safeParse({
        listingIds: ids(21),
        shippingAddress: validAddress,
      }).success,
    ).toBe(false);
  });

  it("rejects an order whose address is invalid", () => {
    expect(
      createOrderSchema.safeParse({
        listingIds: ["l1"],
        shippingAddress: { ...validAddress, postalCode: "nope" },
      }).success,
    ).toBe(false);
  });

  it("does not accept a client-chosen payment method", () => {
    // Payment is online-only and server-decided; anything the client sends
    // here must be dropped rather than honoured.
    const parsed = createOrderSchema.parse({
      listingIds: ["l1"],
      shippingAddress: validAddress,
      paymentMethod: "COD",
    });
    expect(parsed).not.toHaveProperty("paymentMethod");
  });
});

describe("payoutPolicyInputSchema", () => {
  it.each([0, 1, 550, 1000, 10000])("accepts %i bps", (commissionBps) => {
    expect(payoutPolicyInputSchema.safeParse({ commissionBps }).success).toBe(
      true,
    );
  });

  it("rejects a commission over 100%", () => {
    const result = payoutPolicyInputSchema.safeParse({ commissionBps: 10001 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Commission cannot exceed 100%",
      );
    }
  });

  it("rejects a negative commission", () => {
    expect(
      payoutPolicyInputSchema.safeParse({ commissionBps: -1 }).success,
    ).toBe(false);
  });

  it("rejects fractional basis points", () => {
    expect(
      payoutPolicyInputSchema.safeParse({ commissionBps: 550.5 }).success,
    ).toBe(false);
  });
});

describe("markPayoutPaidSchema", () => {
  it("requires a transfer reference", () => {
    // A payout marked paid with no reference is unauditable.
    expect(markPayoutPaidSchema.safeParse({ reference: "" }).success).toBe(
      false,
    );
    expect(markPayoutPaidSchema.safeParse({}).success).toBe(false);
  });

  it("accepts a UTR", () => {
    expect(
      markPayoutPaidSchema.safeParse({ reference: "UTR123456789" }).success,
    ).toBe(true);
  });

  it("caps the reference at 80 characters", () => {
    expect(
      markPayoutPaidSchema.safeParse({ reference: "x".repeat(81) }).success,
    ).toBe(false);
  });
});

describe("cancelOrderSchema", () => {
  it("parses a reason code", () => {
    const result = cancelOrderSchema.safeParse({ reason: "CHANGED_MIND" });
    expect(result.success).toBe(true);
  });
});

describe("business profile completeness gate", () => {
  const complete: BusinessProfile = {
    legalEntityName: "Nurture Moms Retail Pvt Ltd",
    tradeName: "Preloved by The Nurture Moms",
    registeredAddress: "12 Nandi Durga Road, Bengaluru 560046",
    supportEmail: "support@example.com",
    supportPhone: "+91 98765 43210",
    grievanceOfficerName: "Asha Menon",
    grievanceOfficerEmail: "grievance@example.com",
    gstin: null,
    cin: null,
    updatedAt: new Date().toISOString(),
  };

  it("publishes only when every required field is filled", () => {
    expect(isBusinessProfileComplete(complete)).toBe(true);
    expect(missingBusinessFields(complete)).toEqual([]);
  });

  it("stays unpublished when a single field is blank", () => {
    // All-or-nothing on purpose: a policy page naming a grievance officer but
    // no registered address is not a compliant page.
    for (const field of [
      "legalEntityName",
      "tradeName",
      "registeredAddress",
      "supportEmail",
      "supportPhone",
      "grievanceOfficerName",
      "grievanceOfficerEmail",
    ] as const) {
      const partial = { ...complete, [field]: "" };
      expect(isBusinessProfileComplete(partial)).toBe(false);
      expect(missingBusinessFields(partial)).toEqual([field]);
    }
  });

  it("treats whitespace as blank", () => {
    expect(
      isBusinessProfileComplete({ ...complete, supportEmail: "   " }),
    ).toBe(false);
  });

  it("does not require the optional GSTIN or CIN", () => {
    expect(
      isBusinessProfileComplete({ ...complete, gstin: null, cin: null }),
    ).toBe(true);
  });

  it("treats a missing profile as incomplete, listing every field", () => {
    expect(isBusinessProfileComplete(null)).toBe(false);
    expect(isBusinessProfileComplete(undefined)).toBe(false);
    expect(missingBusinessFields(null)).toHaveLength(7);
  });
});
