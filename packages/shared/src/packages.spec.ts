import {
  DEFAULT_OFFER_LABEL,
  OFFER_MIN_REGULAR_PRICE_DAYS,
  offerSavingsWarning,
  packageBookingMessage,
  resolvePackagePrice,
  servicePackageInputSchema,
  type PackagePriceFields,
} from "./index";

/**
 * resolvePackagePrice is the one place a session price is decided — the price
 * card, the WhatsApp booking message and the enquiry snapshot all call it. A
 * slip here shows a mother one price and records another, so each branch is
 * pinned explicitly.
 */

const NOW = new Date("2026-11-11T12:00:00.000Z");
const DAY = 86_400_000;

describe("resolvePackagePrice", () => {
  it("returns the regular price with no label when there is no offer", () => {
    expect(resolvePackagePrice({ pricePaise: 149900 }, NOW)).toEqual({
      pricePaise: 149900,
      label: null,
    });
  });

  it("applies a live offer with the regular price as compare-at", () => {
    const resolved = resolvePackagePrice(
      {
        pricePaise: 199900,
        offerPricePaise: 149900,
        offerLabel: "Diwali Offer",
        offerEndsAt: new Date(NOW.getTime() + 3 * DAY).toISOString(),
      },
      NOW,
    );
    expect(resolved).toEqual({
      pricePaise: 149900,
      compareAtPaise: 199900,
      label: "SPECIAL_OFFER",
      offerLabel: "Diwali Offer",
      offerEndsAt: "2026-11-14T12:00:00.000Z",
      savingsPaise: 50000,
      savingsPct: 25,
    });
  });

  it("drops an expired offer by itself", () => {
    const pkg: PackagePriceFields = {
      pricePaise: 199900,
      offerPricePaise: 149900,
      offerEndsAt: new Date(NOW.getTime() - 1).toISOString(),
    };
    expect(resolvePackagePrice(pkg, NOW)).toEqual({
      pricePaise: 199900,
      label: null,
    });
  });

  it("treats an offer ending exactly now as expired", () => {
    const resolved = resolvePackagePrice(
      { pricePaise: 1000, offerPricePaise: 800, offerEndsAt: NOW },
      NOW,
    );
    expect(resolved.label).toBeNull();
    expect(resolved.pricePaise).toBe(1000);
  });

  it("keeps an open-ended offer live and omits offerEndsAt", () => {
    const resolved = resolvePackagePrice(
      { pricePaise: 59900, offerPricePaise: 49900, offerEndsAt: null },
      NOW,
    );
    expect(resolved.label).toBe("SPECIAL_OFFER");
    expect(resolved.pricePaise).toBe(49900);
    expect(resolved).not.toHaveProperty("offerEndsAt");
  });

  it("accepts a Date offerEndsAt (a Prisma row) as well as an ISO string", () => {
    const resolved = resolvePackagePrice(
      {
        pricePaise: 59900,
        offerPricePaise: 49900,
        offerEndsAt: new Date(NOW.getTime() + DAY),
      },
      NOW,
    );
    expect(resolved.offerEndsAt).toBe("2026-11-12T12:00:00.000Z");
  });

  it("falls back to the default label when the offer has none or a blank one", () => {
    for (const offerLabel of [null, undefined, "", "   "]) {
      const resolved = resolvePackagePrice(
        { pricePaise: 1000, offerPricePaise: 900, offerLabel },
        NOW,
      );
      expect(resolved.offerLabel).toBe(DEFAULT_OFFER_LABEL);
    }
  });

  it("labels an introductory price without a strikethrough", () => {
    expect(
      resolvePackagePrice({ pricePaise: 9900, isIntroductory: true }, NOW),
    ).toEqual({ pricePaise: 9900, label: "INTRODUCTORY" });
  });

  describe("defensive against data the input schema would have refused", () => {
    it("ignores an offer on an introductory package", () => {
      expect(
        resolvePackagePrice(
          { pricePaise: 9900, offerPricePaise: 4900, isIntroductory: true },
          NOW,
        ),
      ).toEqual({ pricePaise: 9900, label: "INTRODUCTORY" });
    });

    it.each([
      ["equal to", 1000],
      ["above", 1200],
      ["zero", 0],
    ])("ignores an offer %s the regular price", (_, offerPricePaise) => {
      expect(
        resolvePackagePrice({ pricePaise: 1000, offerPricePaise }, NOW),
      ).toEqual({ pricePaise: 1000, label: null });
    });

    it("treats an unparseable end date as expired", () => {
      expect(
        resolvePackagePrice(
          { pricePaise: 1000, offerPricePaise: 800, offerEndsAt: "not a date" },
          NOW,
        ).label,
      ).toBeNull();
    });
  });

  describe("savings maths", () => {
    it("rounds the percentage down, never up", () => {
      // 500 / 1999 = 25.01% → 25; 1 / 3 = 33.3% → 33; 2 / 3 = 66.6% → 66.
      expect(
        resolvePackagePrice({ pricePaise: 199900, offerPricePaise: 149900 }, NOW)
          .savingsPct,
      ).toBe(25);
      expect(
        resolvePackagePrice({ pricePaise: 300, offerPricePaise: 200 }, NOW)
          .savingsPct,
      ).toBe(33);
      expect(
        resolvePackagePrice({ pricePaise: 300, offerPricePaise: 100 }, NOW)
          .savingsPct,
      ).toBe(66);
    });

    it("always satisfies compareAt = price + savings with whole numbers", () => {
      for (const regular of [100, 999, 9900, 59900, 149900, 199900, 1_00_00_000]) {
        for (const offer of [1, 99, Math.floor(regular / 2), regular - 1]) {
          if (offer <= 0 || offer >= regular) continue;
          const r = resolvePackagePrice(
            { pricePaise: regular, offerPricePaise: offer },
            NOW,
          );
          expect(r.compareAtPaise).toBe(r.pricePaise + (r.savingsPaise ?? NaN));
          expect(Number.isInteger(r.savingsPct)).toBe(true);
          expect(r.savingsPct).toBeGreaterThanOrEqual(0);
          expect(r.savingsPct).toBeLessThan(100);
        }
      }
    });
  });
});

describe("packageBookingMessage", () => {
  it("names the package, its price and its service", () => {
    expect(
      packageBookingMessage(
        { name: "Monthly Combo", group: "COMBO", pricePaise: 149900 },
        NOW,
      ),
    ).toBe(
      "Hi! I'd like to book Monthly Combo (₹1,499) — Prenatal Yoga + Garbhasanskar.",
    );
  });

  it("quotes the live offer price, not the regular one, and names the offer", () => {
    expect(
      packageBookingMessage(
        {
          name: "4-Session Package",
          group: "ONE_TO_ONE_YOGA",
          pricePaise: 199900,
          offerPricePaise: 179900,
        },
        NOW,
      ),
    ).toBe(
      "Hi! I'd like to book 4-Session Package (₹1,799, Special Offer) — Personalised 1:1 Yoga.",
    );
  });

  it("quotes the regular price once the offer has expired", () => {
    expect(
      packageBookingMessage(
        {
          name: "4-Session Package",
          group: "ONE_TO_ONE_YOGA",
          pricePaise: 199900,
          offerPricePaise: 179900,
          offerEndsAt: "2026-11-01T00:00:00.000Z",
        },
        NOW,
      ),
    ).toBe(
      "Hi! I'd like to book 4-Session Package (₹1,999) — Personalised 1:1 Yoga.",
    );
  });

  it("marks an introductory price", () => {
    expect(
      packageBookingMessage(
        {
          name: "Trial Class",
          group: "PRENATAL_YOGA",
          pricePaise: 9900,
          isIntroductory: true,
        },
        NOW,
      ),
    ).toBe("Hi! I'd like to book Trial Class (₹99, introductory price) — Prenatal Yoga.");
  });
});

describe("offerSavingsWarning", () => {
  const withOffer = { pricePaise: 199900, offerPricePaise: 149900 };

  it("warns when the regular price is newer than the threshold", () => {
    const warning = offerSavingsWarning(
      { ...withOffer, priceSince: new Date(NOW.getTime() - 10 * DAY) },
      NOW,
    );
    expect(warning).toContain("10 days ago");
    expect(warning).toContain("₹1,999");
  });

  it("says 'today' when the regular price changes in the same save", () => {
    expect(offerSavingsWarning({ ...withOffer, priceSince: NOW }, NOW)).toContain(
      "today",
    );
  });

  it(`is silent once the price is ${OFFER_MIN_REGULAR_PRICE_DAYS} days old`, () => {
    expect(
      offerSavingsWarning(
        {
          ...withOffer,
          priceSince: new Date(NOW.getTime() - OFFER_MIN_REGULAR_PRICE_DAYS * DAY),
        },
        NOW,
      ),
    ).toBeNull();
  });

  it("is silent without a live offer — nothing is struck through", () => {
    expect(
      offerSavingsWarning({ pricePaise: 199900, priceSince: NOW }, NOW),
    ).toBeNull();
    expect(
      offerSavingsWarning(
        { ...withOffer, offerEndsAt: "2026-01-01T00:00:00.000Z", priceSince: NOW },
        NOW,
      ),
    ).toBeNull();
  });
});

describe("servicePackageInputSchema", () => {
  const valid = {
    group: "COMBO",
    name: "Monthly Combo",
    summary: "8 Prenatal Yoga classes and 4 Garbhasanskar sessions in one month.",
    includes: ["8 Prenatal Yoga group classes", "4 Garbhasanskar group sessions"],
    sessionCount: 12,
    validityDays: 30,
    format: "LIVE_GROUP",
    pricePaise: 149900,
    isBestValue: true,
  };

  it("accepts a well-formed package and applies defaults", () => {
    const parsed = servicePackageInputSchema.parse(valid);
    expect(parsed.isActive).toBe(true);
    expect(parsed.isIntroductory).toBe(false);
    expect(parsed.sortOrder).toBe(0);
  });

  it("accepts a live offer below the regular price", () => {
    expect(
      servicePackageInputSchema.safeParse({
        ...valid,
        offerPricePaise: 129900,
        offerLabel: "Launch Offer",
        offerEndsAt: "2026-12-31T23:59:59+05:30",
      }).success,
    ).toBe(true);
  });

  it.each([149900, 159900])(
    "rejects an offer of %i paise that is not below the regular price",
    (offerPricePaise) => {
      const result = servicePackageInputSchema.safeParse({
        ...valid,
        offerPricePaise,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(["offerPricePaise"]);
      }
    },
  );

  it("rejects an introductory package that also has an offer", () => {
    const result = servicePackageInputSchema.safeParse({
      ...valid,
      isIntroductory: true,
      offerPricePaise: 99900,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["isIntroductory"]);
    }
  });

  it("allows a free (₹0) regular price but never a ₹0 offer", () => {
    expect(
      servicePackageInputSchema.safeParse({ ...valid, pricePaise: 0 }).success,
    ).toBe(true);
    expect(
      servicePackageInputSchema.safeParse({ ...valid, offerPricePaise: 0 })
        .success,
    ).toBe(false);
  });

  it.each([-1, 99.5])("rejects a price of %p", (pricePaise) => {
    expect(
      servicePackageInputSchema.safeParse({ ...valid, pricePaise }).success,
    ).toBe(false);
  });

  it("accepts null and blank strings for cleared optional fields", () => {
    expect(
      servicePackageInputSchema.safeParse({
        ...valid,
        sessionMinutes: null,
        offerPricePaise: null,
        offerLabel: "",
        offerEndsAt: "",
      }).success,
    ).toBe(true);
  });

  it("rejects an unknown group with a friendly message", () => {
    const result = servicePackageInputSchema.safeParse({
      ...valid,
      group: "PILATES",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Choose which service this package belongs to",
      );
    }
  });
});
