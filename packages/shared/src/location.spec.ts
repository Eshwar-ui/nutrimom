import {
  INDIAN_CITIES,
  INDIAN_CITY_ALIASES,
  PINCODE_REGEX,
  listingFormSchema,
  listingInputSchema,
  listingQuerySchema,
  listingUpdateSchema,
  normaliseCity,
} from "./index";

/**
 * City names are compared exactly once they reach the browse filter, so
 * normaliseCity is what decides whether "bangalore" and "Bengaluru" are one
 * market or two. The PIN regex is the only check a PIN gets (there is no
 * PIN-to-city lookup), so its edges are pinned too.
 */

describe("INDIAN_CITIES", () => {
  const names = INDIAN_CITIES.map((c) => c.name);

  it("is a substantial list", () => {
    expect(INDIAN_CITIES.length).toBeGreaterThanOrEqual(250);
    expect(INDIAN_CITIES.length).toBeLessThanOrEqual(350);
  });

  it("has no duplicate names, case-insensitively", () => {
    const lower = names.map((n) => n.toLowerCase());
    expect(new Set(lower).size).toBe(lower.length);
  });

  it("is sorted by name", () => {
    const sorted = [...names].sort((a, b) => a.localeCompare(b, "en"));
    expect(names).toEqual(sorted);
  });

  it("gives every city a state", () => {
    for (const city of INDIAN_CITIES) expect(city.state.length).toBeGreaterThan(0);
  });

  it("uses the canonical modern spellings", () => {
    for (const name of [
      "Bengaluru", "Mumbai", "Chennai", "Kolkata", "Gurugram", "Vadodara",
      "Thiruvananthapuram", "Mysuru", "Pune", "Kochi", "Prayagraj",
    ]) {
      expect(names).toContain(name);
    }
    for (const old of ["Bangalore", "Bombay", "Madras", "Calcutta", "Gurgaon"]) {
      expect(names).not.toContain(old);
    }
  });

  it("includes the state and UT capitals", () => {
    for (const capital of [
      "Amaravati", "Itanagar", "Dispur", "Patna", "Raipur", "Panaji",
      "Gandhinagar", "Chandigarh", "Shimla", "Ranchi", "Bengaluru",
      "Thiruvananthapuram", "Bhopal", "Mumbai", "Imphal", "Shillong", "Aizawl",
      "Kohima", "Bhubaneswar", "Jaipur", "Gangtok", "Chennai", "Hyderabad",
      "Agartala", "Lucknow", "Dehradun", "Kolkata", "New Delhi", "Srinagar",
      "Jammu", "Leh", "Kavaratti", "Puducherry", "Daman", "Sri Vijaya Puram",
    ]) {
      expect(names).toContain(capital);
    }
  });

  it("only aliases to cities that are in the list", () => {
    for (const canonical of Object.values(INDIAN_CITY_ALIASES)) {
      expect(names).toContain(canonical);
    }
  });
});

describe("normaliseCity", () => {
  it.each([
    ["Bangalore", "Bengaluru"],
    ["Bombay", "Mumbai"],
    ["Madras", "Chennai"],
    ["Calcutta", "Kolkata"],
    ["Gurgaon", "Gurugram"],
    ["Baroda", "Vadodara"],
    ["Trivandrum", "Thiruvananthapuram"],
    ["Mysore", "Mysuru"],
    ["Poona", "Pune"],
    ["Cochin", "Kochi"],
  ])("maps the alias %s to %s", (alias, canonical) => {
    expect(normaliseCity(alias)).toBe(canonical);
  });

  it("matches known cities and aliases case-insensitively", () => {
    expect(normaliseCity("BENGALURU")).toBe("Bengaluru");
    expect(normaliseCity("bangalore")).toBe("Bengaluru");
    expect(normaliseCity("new delhi")).toBe("New Delhi");
  });

  it("trims and collapses whitespace before matching", () => {
    expect(normaliseCity("   navi    mumbai  ")).toBe("Navi Mumbai");
  });

  it("treats hyphens and spaces as the same separator", () => {
    expect(normaliseCity("pimpri chinchwad")).toBe("Pimpri-Chinchwad");
    expect(normaliseCity("Mira Bhayandar")).toBe("Mira-Bhayandar");
  });

  it("title-cases a city that isn't in the list", () => {
    expect(normaliseCity("kodaikanal")).toBe("Kodaikanal");
    expect(normaliseCity("  mcLEOD   ganj ")).toBe("Mcleod Ganj");
  });

  it("returns an empty string for blank input", () => {
    expect(normaliseCity("   ")).toBe("");
  });
});

describe("PINCODE_REGEX", () => {
  it.each(["560001", "110001", "682001", "999999"])("accepts %s", (pin) => {
    expect(PINCODE_REGEX.test(pin)).toBe(true);
  });

  it.each(["", "012345", "56000", "5600011", "56000a", "560 001", " 560001"])(
    "rejects %p",
    (pin) => {
      expect(PINCODE_REGEX.test(pin)).toBe(false);
    },
  );
});

describe("listing location fields", () => {
  const base = {
    title: "Stroller",
    description: "Lightly used stroller, all parts present.",
    categoryId: "cat_1",
    condition: "GOOD",
    sellingPriceInPaise: 250000,
    city: "Bengaluru",
    deliveryOption: "PICKUP",
    images: ["https://example.com/a.jpg"],
  };

  it("keeps the PIN optional on the API schema, for mobile builds without it", () => {
    expect(listingInputSchema.safeParse(base).success).toBe(true);
    expect(listingInputSchema.safeParse({ ...base, pincode: "" }).success).toBe(
      true,
    );
  });

  it("validates a PIN when one is sent", () => {
    expect(
      listingInputSchema.safeParse({ ...base, pincode: "560034" }).success,
    ).toBe(true);
    expect(
      listingInputSchema.safeParse({ ...base, pincode: "56003" }).success,
    ).toBe(false);
  });

  it("requires the PIN on the web form schema", () => {
    expect(listingFormSchema.safeParse(base).success).toBe(false);
    expect(
      listingFormSchema.safeParse({ ...base, pincode: "560034" }).success,
    ).toBe(true);
  });

  it("keeps the original-price rule on both schemas", () => {
    const cheaperNew = { ...base, pincode: "560034", originalPriceInPaise: 100 };
    expect(listingInputSchema.safeParse(cheaperNew).success).toBe(false);
    expect(listingFormSchema.safeParse(cheaperNew).success).toBe(false);
  });

  it("caps locality at 60 characters with a no-house-address message", () => {
    const result = listingInputSchema.safeParse({
      ...base,
      locality: "x".repeat(61),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/never your house address/);
    }
  });

  it("normalises the city on create and update", () => {
    expect(listingInputSchema.parse({ ...base, city: " bangalore " }).city).toBe(
      "Bengaluru",
    );
    expect(listingUpdateSchema.parse({ city: "bombay" }).city).toBe("Mumbai");
  });

  it("accepts locality and PIN filters on browse, ignoring an empty PIN", () => {
    const parsed = listingQuerySchema.parse({
      locality: "Koramangala",
      pincode: "560034",
    });
    expect(parsed.locality).toBe("Koramangala");
    expect(parsed.pincode).toBe("560034");
    expect(listingQuerySchema.parse({ pincode: "" }).pincode).toBeUndefined();
    expect(listingQuerySchema.safeParse({ pincode: "12345" }).success).toBe(false);
  });
});
