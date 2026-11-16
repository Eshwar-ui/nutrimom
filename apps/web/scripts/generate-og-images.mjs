#!/usr/bin/env node
/**
 * Regenerates the committed social cards in public/:
 *
 *   og-default.png       the site-wide card (every page without its own)
 *   og/yoga.png          /yoga
 *   og/nutrition.png     /nutrition (and /nutrition/starting-solids)
 *   og/community.png     /community
 *   og/preloved.png      /preloved (and /preloved/donate)
 *
 * Run from apps/web:  node scripts/generate-og-images.mjs
 *
 * Why static files rather than an `opengraph-image.tsx` route: crawlers
 * (WhatsApp especially) cache the first copy they see, and a committed PNG
 * cannot fail to render at request time. Every card is kept under 300 KB,
 * because WhatsApp drops previews above roughly that.
 *
 * Uses only what is already installed: Next's bundled @vercel/og (satori +
 * resvg) to lay out text in the brand fonts, and sharp (Next's own image
 * dependency) to read the WebP artwork and compress the result. The fonts are
 * the TTFs the mobile app already ships, so the cards use the same Fraunces /
 * Outfit pair as the site.
 */
import { createRequire } from "node:module";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const sharp = require(require.resolve("sharp", { paths: [require.resolve("next/package.json")] }));
const { ImageResponse } = await import("next/dist/compiled/@vercel/og/index.node.js");

const WEB = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = join(WEB, "public");
const FONTS = join(WEB, "..", "mobile", "assets", "fonts");

const W = 1200;
const H = 630;
const MAX_BYTES = 300 * 1024;

// Brand tokens (globals.css :root).
const C = {
  cream: "#F7F3EA",
  olive: "#333D29",
  primary: "#55704D",
  sage: "#A8BFA0",
  sageWash: "#E4EBDF",
  terracotta: "#D08A6C",
  terracottaWash: "#F4E2D8",
  terracottaText: "#A0512E",
};

const BRAND_LINE = "From pregnancy to toddlerhood, you’re not alone.";
const DOMAIN = "thenurturemoms.com";

/** Minimal createElement: satori takes React-shaped plain objects. */
const h = (type, style = {}, ...children) => ({
  type,
  props: { style, children: children.length <= 1 ? children[0] : children },
});
const img = (src, width, height, style = {}) => ({
  type: "img",
  props: { src, width, height, style: { width, height, ...style } },
});

async function dataUri(file, transform = (s) => s) {
  const png = await transform(sharp(join(PUBLIC, file))).png().toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
}

const blob = (style) =>
  h("div", { position: "absolute", display: "flex", borderRadius: 9999, ...style });

/** The shared left column: logo, eyebrow, headline, supporting line, domain. */
function textColumn({ logo, eyebrow, title, titleSize, body, width }) {
  return h(
    "div",
    {
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      width,
      height: H,
      padding: "64px 0 56px 72px",
    },
    img(logo, 340, Math.round((340 * 349) / 1404)),
    h(
      "div",
      { display: "flex", flexDirection: "column" },
      ...(eyebrow
        ? [
            h(
              "div",
              {
                display: "flex",
                fontFamily: "Outfit",
                fontWeight: 700,
                fontSize: 22,
                letterSpacing: 4,
                color: C.terracottaText,
                marginBottom: 14,
              },
              eyebrow.toUpperCase(),
            ),
          ]
        : []),
      h(
        "div",
        {
          display: "flex",
          fontFamily: "Fraunces",
          fontWeight: 600,
          fontSize: titleSize,
          lineHeight: 1.08,
          letterSpacing: -0.5,
          color: C.olive,
        },
        title,
      ),
      h("div", {
        display: "flex",
        width: 64,
        height: 4,
        borderRadius: 4,
        backgroundColor: C.terracotta,
        margin: "26px 0 20px",
      }),
      // `body` may be an array of lines, to break a "·" list where it reads
      // best instead of wherever the wrap falls.
      h(
        "div",
        {
          display: "flex",
          flexDirection: "column",
          fontFamily: "Outfit",
          fontWeight: 500,
          fontSize: 26,
          lineHeight: 1.35,
          color: C.primary,
        },
        ...(Array.isArray(body) ? body : [body]).map((line) => h("div", { display: "flex" }, line)),
      ),
    ),
    h(
      "div",
      {
        display: "flex",
        fontFamily: "Outfit",
        fontWeight: 600,
        fontSize: 22,
        color: C.terracottaText,
      },
      DOMAIN,
    ),
  );
}

function frame(...children) {
  return h(
    "div",
    {
      display: "flex",
      position: "relative",
      width: W,
      height: H,
      backgroundColor: C.cream,
      overflow: "hidden",
    },
    blob({ width: 520, height: 520, right: -170, top: -230, backgroundColor: C.sage, opacity: 0.3 }),
    blob({ width: 360, height: 360, left: -150, bottom: -220, backgroundColor: C.terracotta, opacity: 0.2 }),
    ...children,
  );
}

async function render(element, fonts) {
  const res = new ImageResponse(element, { width: W, height: H, fonts });
  const raw = Buffer.from(await res.arrayBuffer());
  // Full-colour first; fall back to a 256-colour palette only if that is
  // what it takes to get under WhatsApp's limit.
  let out = await sharp(raw).png({ compressionLevel: 9, effort: 10 }).toBuffer();
  if (out.length > MAX_BYTES) {
    out = await sharp(raw).png({ palette: true, quality: 92, effort: 10, dither: 0.6 }).toBuffer();
  }
  if (out.length > MAX_BYTES) throw new Error(`card is ${out.length} bytes, over ${MAX_BYTES}`);
  return out;
}

async function main() {
  const font = (file) => readFile(join(FONTS, file));
  const fonts = [
    { name: "Fraunces", data: await font("Fraunces-SemiBold.ttf"), weight: 600, style: "normal" },
    { name: "Outfit", data: await font("Outfit-Medium.ttf"), weight: 500, style: "normal" },
    { name: "Outfit", data: await font("Outfit-SemiBold.ttf"), weight: 600, style: "normal" },
    { name: "Outfit", data: await font("Outfit-Bold.ttf"), weight: 700, style: "normal" },
  ];
  const logoSvg = await readFile(join(PUBLIC, "logo-horizontal.svg"));
  const logo = `data:image/svg+xml;base64,${logoSvg.toString("base64")}`;

  const pillar = (name, size) =>
    dataUri(`images/pillars/pillar-${name}.webp`, (s) => s.resize(size, size));

  const cards = [];

  // ---- Site-wide card: brand line + the four pillars --------------------
  {
    const tile = 196;
    const art = 168;
    const arts = await Promise.all(["move", "nourish", "connect", "pass-it-on"].map((n) => pillar(n, art * 2)));
    const washes = [C.sageWash, C.terracottaWash, C.terracottaWash, C.sageWash];
    const tiles = arts.map((src, i) =>
      h(
        "div",
        {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: tile,
          height: tile,
          borderRadius: 36,
          backgroundColor: washes[i],
        },
        img(src, art, art),
      ),
    );
    const grid = h(
      "div",
      {
        display: "flex",
        flexWrap: "wrap",
        gap: 20,
        width: tile * 2 + 20,
        position: "absolute",
        right: 76,
        top: (H - (tile * 2 + 20)) / 2,
      },
      ...tiles,
    );
    cards.push({
      out: "og-default.png",
      el: frame(
        textColumn({
          logo,
          title: BRAND_LINE,
          titleSize: 54,
          body: ["Yoga & Garbhasanskar · Nutrition", "Mom community · Preloved marketplace"],
          width: 690,
        }),
        grid,
      ),
    });
  }

  // ---- Service cards ----------------------------------------------------
  // Heroes: crop the side of the wide hero where the figure sits, then fade
  // its left edge into the cream so the text column stays clean.
  const heroPanel = async (file, left, top, width, height) => {
    const panelW = 560;
    const src = await dataUri(file, (s) =>
      s.extract({ left, top, width, height }).resize(panelW * 2, H * 2, { fit: "cover" }),
    );
    return h(
      "div",
      { display: "flex", position: "absolute", right: 0, top: 0, width: panelW, height: H },
      img(src, panelW, H),
      h("div", {
        display: "flex",
        position: "absolute",
        left: 0,
        top: 0,
        width: 200,
        height: H,
        backgroundImage: `linear-gradient(to right, ${C.cream}, rgba(247,243,234,0))`,
      }),
    );
  };
  // Illustrations: the pillar art on a soft wash circle.
  const artPanel = async (name, wash) =>
    h(
      "div",
      {
        display: "flex",
        position: "absolute",
        right: 64,
        top: (H - 460) / 2,
        width: 460,
        height: 460,
        borderRadius: 9999,
        backgroundColor: wash,
        alignItems: "center",
        justifyContent: "center",
      },
      img(await pillar(name, 760), 380, 380),
    );

  const services = [
    {
      out: "og/yoga.png",
      eyebrow: "Move",
      title: "Yoga & Garbhasanskar",
      body: "Prenatal and postnatal yoga, breathing and mindful pregnancy practices.",
      panel: () => heroPanel("hero-images/yoga-desktop.webp", 960, 0, 560, 600),
    },
    {
      out: "og/nutrition.png",
      eyebrow: "Nourish",
      title: "Nutrition for Mom & Baby",
      body: "Pregnancy, postpartum, starting solids and toddler meals — practical guidance.",
      panel: () => heroPanel("hero-images/nutrition-desktop.webp", 880, 0, 600, 653),
    },
    {
      out: "og/community.png",
      eyebrow: "Connect",
      title: "Mom Community",
      body: "A free, supportive space to connect, learn and share with other moms.",
      panel: () => artPanel("connect", C.sageWash),
    },
    {
      out: "og/preloved.png",
      eyebrow: "Pass it on",
      title: "Preloved Marketplace",
      body: "Buy, sell and donate gently used baby, kids and maternity items.",
      panel: () => artPanel("pass-it-on", C.terracottaWash),
    },
  ];
  for (const s of services) {
    cards.push({
      out: s.out,
      el: frame(
        await s.panel(),
        textColumn({ logo, eyebrow: s.eyebrow, title: s.title, titleSize: 60, body: s.body, width: 640 }),
      ),
    });
  }

  await mkdir(join(PUBLIC, "og"), { recursive: true });
  for (const card of cards) {
    const png = await render(card.el, fonts);
    await writeFile(join(PUBLIC, card.out), png);
    const meta = await sharp(png).metadata();
    console.log(`${card.out}\t${meta.width}x${meta.height}\t${(png.length / 1024).toFixed(0)} KB`);
  }
}

await main();
