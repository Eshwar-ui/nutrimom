import {
  MEMBERSHIP_PLANS,
  MEMBERSHIP_PLAN_ORDER,
  REGISTRATION_FEE_PAISE,
  formatBps,
  splitPayout,
} from "./index";

/**
 * `splitPayout` is the single definition of how a sale divides between the
 * marketplace and the seller, and it is snapshotted onto every payout row at
 * sale time. A rounding slip here is money, silently, on every order — so the
 * invariant is checked exhaustively rather than at a few sample points.
 */
describe("splitPayout", () => {
  const GROSSES = [
    0, 1, 2, 3, 7, 99, 100, 101, 333, 999, 1000, 9999, 12345, 50000, 99900,
    100000, 123457, 999999, 1_00_00_000,
  ];
  const RATES = [0, 1, 33, 100, 250, 550, 999, 1000, 3333, 5000, 9999, 10000];

  it("always splits gross exactly — commission + net === gross", () => {
    for (const gross of GROSSES) {
      for (const bps of RATES) {
        const { commissionInPaise, netInPaise } = splitPayout(gross, bps);
        expect(commissionInPaise + netInPaise).toBe(gross);
      }
    }
  });

  it("never produces a fractional paise", () => {
    for (const gross of GROSSES) {
      for (const bps of RATES) {
        const { commissionInPaise, netInPaise } = splitPayout(gross, bps);
        expect(Number.isInteger(commissionInPaise)).toBe(true);
        expect(Number.isInteger(netInPaise)).toBe(true);
      }
    }
  });

  it("never pays the seller more than the sale, or less than nothing", () => {
    for (const gross of GROSSES) {
      for (const bps of RATES) {
        const { commissionInPaise, netInPaise } = splitPayout(gross, bps);
        expect(netInPaise).toBeGreaterThanOrEqual(0);
        expect(netInPaise).toBeLessThanOrEqual(gross);
        expect(commissionInPaise).toBeGreaterThanOrEqual(0);
        expect(commissionInPaise).toBeLessThanOrEqual(gross);
      }
    }
  });

  it("takes nothing at 0 bps and everything at 10000 bps", () => {
    expect(splitPayout(100000, 0)).toEqual({
      commissionInPaise: 0,
      netInPaise: 100000,
    });
    expect(splitPayout(100000, 10000)).toEqual({
      commissionInPaise: 100000,
      netInPaise: 0,
    });
  });

  it("computes the documented default: 10% of ₹1000", () => {
    // The worked example shown to the admin on /admin/settings.
    expect(splitPayout(100000, 1000)).toEqual({
      commissionInPaise: 10000,
      netInPaise: 90000,
    });
  });

  it("rounds a half-paise commission to the nearest paise", () => {
    // 1 paise at 50% is exactly 0.5 — Math.round takes it up, and the seller
    // gets the remainder, so the total is still exact.
    expect(splitPayout(1, 5000)).toEqual({
      commissionInPaise: 1,
      netInPaise: 0,
    });
    expect(splitPayout(3, 5000)).toEqual({
      commissionInPaise: 2,
      netInPaise: 1,
    });
  });

  it("is monotonic — a higher rate never pays the seller more", () => {
    const gross = 123457;
    let previousNet = Infinity;
    for (const bps of [...RATES].sort((a, b) => a - b)) {
      const { netInPaise } = splitPayout(gross, bps);
      expect(netInPaise).toBeLessThanOrEqual(previousNet);
      previousNet = netInPaise;
    }
  });
});

describe("formatBps", () => {
  it.each([
    [0, "0%"],
    [1, "0.01%"],
    [550, "5.5%"],
    [1000, "10%"],
    [1050, "10.5%"],
    [10000, "100%"],
  ])("renders %i bps as %s", (bps, expected) => {
    expect(formatBps(bps)).toBe(expected);
  });
});

/**
 * Prices are server-authoritative: the client only ever sends a plan key. If
 * one of these drifts, a seller is charged an amount the published plan table
 * does not name.
 */
describe("seller billing catalogue", () => {
  it("charges ₹100 to register", () => {
    expect(REGISTRATION_FEE_PAISE).toBe(10000);
  });

  it("matches the published plan table exactly", () => {
    expect(MEMBERSHIP_PLANS.MONTHLY).toMatchObject({
      priceInPaise: 9900,
      durationDays: 30,
    });
    expect(MEMBERSHIP_PLANS.QUARTERLY).toMatchObject({
      priceInPaise: 19900,
      durationDays: 90,
    });
    expect(MEMBERSHIP_PLANS.HALF_YEARLY).toMatchObject({
      priceInPaise: 49900,
      durationDays: 180,
    });
    expect(MEMBERSHIP_PLANS.YEARLY).toMatchObject({
      priceInPaise: 99900,
      durationDays: 365,
      bestValue: true,
    });
  });

  it("keys every plan to itself, so a lookup can't return another plan's price", () => {
    for (const [key, info] of Object.entries(MEMBERSHIP_PLANS)) {
      expect(info.plan).toBe(key);
    }
  });

  it("charges more in absolute terms for a longer term", () => {
    const prices = MEMBERSHIP_PLAN_ORDER.map(
      (p) => MEMBERSHIP_PLANS[p].priceInPaise,
    );
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThan(prices[i - 1]);
    }
  });

  /**
   * Pins the per-day rate rather than asserting it falls with term length,
   * because it does not: QUARTERLY is the cheapest plan per day, and both
   * HALF_YEARLY and YEARLY cost more per day than it.
   *
   * That matters here and not only in a pricing spreadsheet, because
   * memberships *stack* onto the current expiry — so a seller can buy
   * 4 × QUARTERLY for ₹796 and hold 360 days, against ₹999 for the YEARLY
   * plan the UI labels "Best Value". This test exists to make that visible;
   * it is the operator's pricing decision, not a defect, and it is asserted
   * rather than corrected. Update these numbers deliberately if the
   * catalogue changes.
   */
  it("prices QUARTERLY cheapest per day, below both longer plans", () => {
    const perDay = (plan: keyof typeof MEMBERSHIP_PLANS) =>
      MEMBERSHIP_PLANS[plan].priceInPaise / MEMBERSHIP_PLANS[plan].durationDays;

    expect(perDay("MONTHLY")).toBeCloseTo(330.0, 1);
    expect(perDay("QUARTERLY")).toBeCloseTo(221.1, 1);
    expect(perDay("HALF_YEARLY")).toBeCloseTo(277.2, 1);
    expect(perDay("YEARLY")).toBeCloseTo(273.7, 1);

    expect(perDay("QUARTERLY")).toBeLessThan(perDay("HALF_YEARLY"));
    expect(perDay("QUARTERLY")).toBeLessThan(perDay("YEARLY"));
  });

  it("lets stacked QUARTERLY buys undercut the longer plans", () => {
    // 180 days: 2 × ₹199 = ₹398 against ₹499 for HALF_YEARLY.
    expect(2 * MEMBERSHIP_PLANS.QUARTERLY.priceInPaise).toBeLessThan(
      MEMBERSHIP_PLANS.HALF_YEARLY.priceInPaise,
    );
    // 360 days: 4 × ₹199 = ₹796 against ₹999 for YEARLY's 365.
    expect(4 * MEMBERSHIP_PLANS.QUARTERLY.priceInPaise).toBeLessThan(
      MEMBERSHIP_PLANS.YEARLY.priceInPaise,
    );
    // Monthly is the one plan YEARLY genuinely beats: 12 × ₹99 = ₹1188.
    expect(12 * MEMBERSHIP_PLANS.MONTHLY.priceInPaise).toBeGreaterThan(
      MEMBERSHIP_PLANS.YEARLY.priceInPaise,
    );
  });

  it("orders every plan exactly once for display", () => {
    expect([...MEMBERSHIP_PLAN_ORDER].sort()).toEqual(
      Object.keys(MEMBERSHIP_PLANS).sort(),
    );
  });

  it("marks exactly one plan best value", () => {
    const flagged = Object.values(MEMBERSHIP_PLANS).filter((p) => p.bestValue);
    expect(flagged).toHaveLength(1);
    expect(flagged[0].plan).toBe("YEARLY");
  });
});
