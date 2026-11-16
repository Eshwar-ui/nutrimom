import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  Leaf,
  ShieldCheck,
  Users,
  ArrowRight,
  Sparkles,
  MessageCircle,
  Utensils,
  Flower2,
  Apple,
  Baby,
  Recycle,
  BookOpen,
  HeartHandshake,
  Briefcase,
  MessagesSquare,
  Quote,
  Mail,
  Phone,
  Instagram,
  Youtube,
  CalendarHeart,
  GraduationCap,
} from "lucide-react";
import type { Founder, GalleryImage } from "@nutrimom/shared";
import { Container } from "@/components/ui/primitives";
import { buttonVariants } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";
import { Playful } from "@/components/ui/playful";
import { DecorativeElement } from "@/components/decorative-element";
import { pageMetadata } from "@/lib/seo";
import { BOOK_SESSION_HREF, BRAND_LINE, resolveSocialLinks } from "@/lib/site-nav";
import { getSiteContent, getTestimonials } from "@/lib/content";
import { getBusinessProfile } from "@/lib/business-profile";
import { isOptimizableImage } from "@/lib/content-image";
import { PillarCards } from "@/components/pillar-cards";
import { TestimonialsSection } from "@/components/testimonials";

export const metadata = pageMetadata({
  title: "About us — Meet Sudha & Nandini",
  description:
    "Founded by Sudha and Nandini, The Nurture Moms grew from a small preloved group into a mom-led space for yoga, nutrition, community and preloved essentials.",
  path: "/about",
});

/**
 * What the business stands for, across all four pillars. The section heading
 * is the founders' own line — "No perfection. No competition. No pressure."
 */
const values = [
  {
    icon: Heart,
    title: "Mom-led, start to finish",
    body: "Built by mothers who have been through it, for mothers going through it now.",
    paper: "bg-blush/45",
    sticker: "bg-blush text-blush-ink",
    rotate: "-rotate-2",
    tape: "left-8 -rotate-6",
    lift: "sm:mt-6",
  },
  {
    icon: ShieldCheck,
    title: "Practical over perfect",
    body: "Guidance you can act on this week — not an ideal routine nobody has time for.",
    paper: "bg-sky/50",
    sticker: "bg-sky text-sky-ink",
    rotate: "rotate-1",
    tape: "right-10 rotate-3",
    lift: "",
  },
  {
    icon: Users,
    title: "When moms support moms, everyone grows",
    body: "Pregnancy, postpartum and the toddler years are easier with people who understand them.",
    paper: "bg-lavender/50",
    sticker: "bg-lavender text-lavender-ink",
    rotate: "rotate-1",
    tape: "left-10 -rotate-3",
    lift: "sm:mt-6",
  },
  {
    icon: Leaf,
    title: "Affordable, and kinder to the planet",
    body: "Sessions priced for real families, and baby gear that circulates instead of becoming waste.",
    paper: "bg-sage/45",
    sticker: "bg-sage text-sage-ink",
    rotate: "-rotate-1",
    tape: "right-8 rotate-6",
    lift: "",
  },
];

/**
 * The founders, in their own words (supplied by the founders, September 2026).
 * Sudha's credentials are exactly as she stated them — keep them verbatim
 * rather than paraphrasing a qualification into something it isn't.
 *
 * Shown only while SiteContent.founders is empty. Once the admin enters the
 * founders at /admin/content (photo, introduction, verified qualifications),
 * those replace these.
 */
const founders = [
  {
    name: "Sudha",
    role: "Co-founder · Yoga & Nutrition",
    credentials:
      "Certified Prenatal & Postnatal Yoga Instructor, trained in Maternal & Child Nutrition and Lactation Support.",
    bio: [
      <>Yoga has been part of Sudha&apos;s life since childhood. Motherhood showed her how much a new mom needs support — not just physically, but emotionally and mentally too.</>,
      <>
        Today she helps mothers feel more nourished, confident and connected through pregnancy, postpartum and the early years, with{" "}
        <InlineLink href="/yoga">prenatal &amp; postnatal yoga</InlineLink>,{" "}
        <InlineLink href="/nutrition">nutrition education</InlineLink> and{" "}
        <InlineLink href="/community">the community</InlineLink>.
      </>,
    ],
    quote: "You don't have to do motherhood perfectly. You don't have to do it alone.",
    paper: "bg-blush/45",
    rotate: "-rotate-1",
    tape: "left-10 -rotate-6",
  },
  {
    name: "Nandini",
    role: "Co-founder · Books & Play",
    credentials: "Our resident bookworm and activity wizard.",
    bio: [
      <>
        Nandini brings a love of books, creativity and screen-free childhood to{" "}
        <InlineLink href="/community">the community</InlineLink> — book-based play, simple activities and ideas that build curiosity, imagination and early reading habits.
      </>,
      <>Her home is full of stories, crafts and the joyful mess that comes with childhood.</>,
    ],
    quote:
      "Children don't need endless screens. Sometimes all they need is a story, a little creativity and a mom willing to join the fun.",
    paper: "bg-sage/45",
    rotate: "rotate-1",
    tape: "right-10 rotate-3",
  },
];

/**
 * What happens inside the community. Each topic links to the page that covers
 * it; the ones with no page of their own (screen-free play, gentle parenting,
 * mom-led businesses) happen in the community itself, so they link there.
 */
const communityTopics = [
  { icon: Utensils, label: "Baby-led weaning & simple no-sugar recipes", href: "/resources" },
  { icon: Flower2, label: "Prenatal & postnatal yoga", href: "/yoga" },
  { icon: Apple, label: "Maternal & child nutrition", href: "/nutrition" },
  { icon: Baby, label: "Starting solids & toddler food ideas", href: "/nutrition/starting-solids" },
  { icon: Recycle, label: "Preloved finds that save money and reduce waste", href: "/preloved" },
  { icon: BookOpen, label: "Screen-free, book-based activities", href: "/community" },
  { icon: HeartHandshake, label: "Gentle parenting & postpartum support", href: "/community" },
  { icon: Briefcase, label: "Mom-led businesses to discover and support", href: "/community" },
  { icon: MessagesSquare, label: "A safe space for emotional and practical connection", href: "/community" },
];

const TOPIC_TINTS = [
  "bg-blush text-blush-ink",
  "bg-sky text-sky-ink",
  "bg-sage text-sage-ink",
  "bg-lavender text-lavender-ink",
  "bg-gold text-gold-ink",
];

/** A link inside running copy — reads as text first, link second. */
function InlineLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="font-semibold text-primary underline decoration-primary/30 underline-offset-4 transition-colors hover:decoration-primary"
    >
      {children}
    </Link>
  );
}

const belongs: { label: string; href?: string }[] = [
  { label: "Selling handmade baby outfits" },
  { label: "Looking for preloved baby essentials", href: "/listings" },
  { label: "Sharing a recipe" },
  { label: "Searching for pregnancy support", href: "/yoga" },
  { label: "Looking for toddler activities" },
  { label: "Building a mom-led business" },
  { label: "Simply having a hard day and needing someone who understands" },
];

/** Admin-entered text is plain; a blank line starts a new paragraph. */
function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export default async function AboutPage() {
  const [content, testimonials, profile] = await Promise.all([
    getSiteContent(),
    getTestimonials(),
    getBusinessProfile(),
  ]);
  const mission = content?.aboutMission?.trim();
  const managedFounders = content?.founders ?? [];
  const gallery = content?.galleryImages ?? [];
  const social = resolveSocialLinks(content);
  const supportEmail = profile?.supportEmail?.trim();
  const supportPhone = profile?.supportPhone?.trim();

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <DecorativeElement src="/images/bg-element-sun-doodle.webp" className="left-6 top-10 hidden w-20 opacity-80 sm:block" />
        <DecorativeElement src="/images/bg-element-leaf-sprig.webp" className="-left-16 bottom-0 hidden w-48 -rotate-12 opacity-35 lg:block" />
        <DecorativeElement src="/images/bg-element-doodle-cluster.webp" className="right-6 top-16 hidden w-28 rotate-6 opacity-60 md:block" />
        <Container className="relative py-14 text-center sm:py-20">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border-2 border-border bg-surface px-4 py-1.5 text-xs font-bold text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Our story
            </span>
            <h1 className="mx-auto mt-6 max-w-3xl font-display text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
              Motherhood is a journey.{" "}
              <span className="ink-underline lg:whitespace-nowrap">You don&apos;t have to do it alone</span>.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              The Nurture Moms is a mom-led community for the whole journey — from pregnancy and postpartum to babyhood and the toddler years.{" "}
              <InlineLink href="/yoga">Yoga</InlineLink>, <InlineLink href="/nutrition">nutrition</InlineLink>,{" "}
              <InlineLink href="/community">real support</InlineLink> and{" "}
              <InlineLink href="/preloved">preloved essentials</InlineLink>, all in one place.
            </p>
            <p className="mx-auto mt-5 text-sm font-bold uppercase tracking-widest text-accent-text">
              {BRAND_LINE}
            </p>
          </Reveal>
        </Container>
      </section>

      {/* Mission — the admin's own words once entered at /admin/content;
          until then, the founders' origin story. A taped scrapbook card. */}
      <Container className="relative pb-4">
        <Reveal>
          <div className="relative mx-auto max-w-3xl rotate-[-0.6deg] rounded-panel border-2 border-border bg-cream p-8 card-shadow sm:p-10">
            <span aria-hidden className="absolute -top-3 left-1/2 h-6 w-28 -translate-x-1/2 -rotate-3 rounded-[4px] border border-white/50 bg-surface/70 shadow-sm backdrop-blur-sm" />
            {mission ? (
              <>
                <h2 className="text-center text-xs font-bold uppercase tracking-widest text-accent-text">
                  Our mission
                </h2>
                {paragraphs(mission).map((para, i) => (
                  <p
                    key={i}
                    className={
                      i === 0
                        ? "mt-4 whitespace-pre-line text-center font-display text-xl leading-relaxed text-foreground sm:text-2xl"
                        : "mx-auto mt-5 max-w-2xl whitespace-pre-line text-center leading-relaxed text-muted-foreground"
                    }
                  >
                    {para}
                  </p>
                ))}
              </>
            ) : (
              <>
            <h2 className="text-center text-xs font-bold uppercase tracking-widest text-accent-text">
              How it started
            </h2>
            <p className="mt-4 text-center font-display text-xl leading-relaxed text-foreground sm:text-2xl">
              It began with a simple wish — to make motherhood feel a little less overwhelming and a lot more supported — and a small group for passing on{" "}
              <InlineLink href="/preloved">preloved baby items</InlineLink>.
            </p>
            <p className="mx-auto mt-5 max-w-2xl text-center leading-relaxed text-muted-foreground">
              That group grew into a{" "}
              <InlineLink href="/community">community</InlineLink> where moms learn, share, support one another and grow together. Today it covers pregnancy and postpartum wellness,{" "}
              <InlineLink href="/nutrition/starting-solids">baby food and baby-led weaning</InlineLink>,{" "}
              <InlineLink href="/yoga">yoga</InlineLink>, gentle parenting, screen-free play,{" "}
              <InlineLink href="/listings">preloved essentials</InlineLink> and mom-led businesses.
            </p>
              </>
            )}
          </div>
        </Reveal>
      </Container>

      {/* Founders */}
      <section className="relative overflow-hidden">
        <DecorativeElement src="/images/bg-element-dotted-trail.webp" className="-right-24 top-6 hidden w-[26rem] opacity-25 xl:block" />
        <Container className="relative py-14">
          <div className="mb-10 text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-accent-text">Who we are</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-foreground sm:text-4xl">Meet the hearts behind it</h2>
          </div>
          {managedFounders.length > 0 ? (
            <div
              className={
                managedFounders.length === 1
                  ? "mx-auto max-w-xl"
                  : "mx-auto grid max-w-5xl gap-8 md:grid-cols-2"
              }
            >
              {managedFounders.map((f, i) => (
                <Reveal key={`${f.name}-${i}`} delay={i * 0.08}>
                  <FounderCard founder={f} />
                </Reveal>
              ))}
            </div>
          ) : (
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2">
            {founders.map((f, i) => (
              <Reveal key={f.name} delay={i * 0.08}>
                <article
                  className={`relative flex h-full flex-col rounded-card border-2 border-border ${f.paper} p-7 card-shadow transition-transform duration-500 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] ${f.rotate} hover:-translate-y-1.5 hover:rotate-0 sm:p-8`}
                >
                  <span aria-hidden className={`absolute -top-3 h-6 w-20 rounded-[4px] border border-white/50 bg-surface/60 shadow-sm backdrop-blur-sm ${f.tape}`} />
                  <div className="flex items-center gap-4">
                    <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full border-2 border-surface bg-surface/70 font-display text-2xl font-semibold text-foreground">
                      {f.name.charAt(0)}
                    </span>
                    <div>
                      <h3 className="font-display text-2xl font-semibold text-foreground">{f.name}</h3>
                      <p className="mt-0.5 text-xs font-bold uppercase tracking-widest text-accent-text">{f.role}</p>
                    </div>
                  </div>
                  <p className="mt-5 text-sm font-semibold leading-relaxed text-foreground">{f.credentials}</p>
                  {f.bio.map((para, j) => (
                    <p key={j} className="mt-3 leading-relaxed text-muted-foreground">{para}</p>
                  ))}
                  <blockquote className="mt-auto pt-6">
                    <div className="flex gap-3 rounded-2xl bg-surface/70 p-4">
                      <Quote aria-hidden className="h-5 w-5 shrink-0 text-accent-text" strokeWidth={1.8} />
                      <p className="font-display text-lg leading-snug text-foreground">{f.quote}</p>
                    </div>
                  </blockquote>
                </article>
              </Reveal>
            ))}
          </div>
          )}
        </Container>
      </section>

      <TestimonialsSection
        testimonials={testimonials}
        eyebrow="Kind words"
        heading="What mothers say about us"
        className="bg-surface-2"
      />

      {gallery.length > 0 && <CommunityGallery images={gallery} />}

      {/* Inside the community */}
      <section className="relative overflow-hidden bg-surface-2">
        <DecorativeElement src="/images/bg-element-toy-accent.webp" className="right-4 top-8 hidden w-24 rotate-6 opacity-40 md:block" />
        <Container className="relative py-16">
          <div className="mb-10 text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-accent-text">Inside the community</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-foreground sm:text-4xl">What you&apos;ll find here</h2>
          </div>
          <ul className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {communityTopics.map((t, i) => (
              <li key={t.label}>
                <Link
                  href={t.href}
                  className="group flex h-full items-center gap-4 rounded-2xl border border-border bg-surface p-4 transition-[transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-primary/45"
                >
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${TOPIC_TINTS[i % TOPIC_TINTS.length]}`}>
                    <t.icon className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <span className="flex-1 text-sm font-semibold leading-snug text-foreground">{t.label}</span>
                  <ArrowRight aria-hidden className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </Link>
              </li>
            ))}
          </ul>

          <div className="mx-auto mt-14 max-w-3xl rounded-card border-2 border-border bg-cream p-7 card-shadow sm:p-9">
            <h3 className="text-center font-display text-2xl font-semibold text-foreground sm:text-3xl">
              This community belongs to you
            </h3>
            <p className="mt-3 text-center leading-relaxed text-muted-foreground">Whether you&apos;re…</p>
            <ul className="mt-5 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
              {belongs.map((b) => (
                <li key={b.label} className="flex gap-2.5 text-sm leading-snug text-foreground">
                  <Sparkles aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-accent-text" strokeWidth={1.8} />
                  {b.href ? <InlineLink href={b.href}>{b.label}</InlineLink> : b.label}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-center font-display text-lg text-foreground">
              …there is a place for you here.
            </p>
          </div>
        </Container>
      </section>

      {/* Values — scrapbook wall */}
      <section className="relative overflow-hidden">
        <DecorativeElement src="/images/bg-element-dotted-trail.webp" className="-left-24 top-10 hidden w-[28rem] opacity-30 xl:block" />
        <Container className="relative py-14">
          <div className="mb-10 text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-accent-text">What we stand for</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-foreground sm:text-4xl">
              No perfection. No competition. No pressure.
            </h2>
            <p className="mx-auto mt-3 max-w-xl leading-relaxed text-muted-foreground">
              Just care, connection, learning and community.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {values.map((v, i) => (
              <Reveal key={v.title} delay={i * 0.08} className={v.lift}>
                <div
                  className={`group relative flex h-full gap-5 rounded-card border-2 border-border ${v.paper} p-6 card-shadow transition-transform duration-500 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] ${v.rotate} hover:-translate-y-1.5 hover:rotate-0 sm:p-7`}
                >
                  <span aria-hidden className={`absolute -top-3 h-6 w-20 rounded-[4px] border border-white/50 bg-surface/60 shadow-sm backdrop-blur-sm ${v.tape}`} />
                  <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl border-2 border-surface transition-transform duration-500 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-0.5 group-hover:scale-110 ${v.sticker}`}>
                    <v.icon className="h-6 w-6" strokeWidth={1.7} />
                  </span>
                  <div>
                    <h3 className="font-display text-xl font-semibold text-foreground">{v.title}</h3>
                    <p className="mt-1.5 leading-relaxed text-muted-foreground">{v.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* The four pillars */}
      <section className="relative overflow-hidden bg-surface-2">
        <DecorativeElement src="/images/bg-element-sage-pram.webp" className="-left-6 bottom-6 hidden w-40 -rotate-3 opacity-25 lg:block" />
        <DecorativeElement src="/images/bg-element-folded-clothes.webp" className="right-6 top-10 hidden w-28 rotate-3 opacity-30 lg:block" />
        <Container className="relative py-16">
          <div className="mb-10 text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-accent-text">{BRAND_LINE}</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-foreground sm:text-4xl">Growing beyond a community</h2>
            <p className="mx-auto mt-3 max-w-2xl leading-relaxed text-muted-foreground">
              We&apos;re building a space where moms can move, nourish, connect and pass it on — from pregnancy through postpartum, babyhood and toddlerhood.
            </p>
          </div>
          {/* The same component the home page's "One place for your motherhood
              journey" section renders — /about answers the same question, and
              two hand-built versions of one answer drift the moment a pillar's
              wording changes. */}
          <PillarCards source="about" />
        </Container>
      </section>

      {/* Contact + CTA band. Contact details come from the BusinessProfile
          (the same ones the legal pages publish) and the social links from
          SiteContent, so this can't drift from the rest of the site. */}
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <DecorativeElement src="/images/bg-element-gift-box.webp" className="bottom-3 right-[18%] hidden w-28 rotate-6 opacity-25 lg:block" />
        <DecorativeElement src="/images/bg-element-toy-accent.webp" className="right-8 top-6 hidden w-24 opacity-60 sm:block" />
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-accent/30 blur-3xl" />
        <Container className="relative flex flex-col items-center gap-6 py-16 text-center">
          <h2 className="max-w-2xl font-display text-3xl font-semibold leading-tight text-primary-foreground sm:text-4xl">
            When moms support moms, everyone grows.
          </h2>
          <p className="max-w-xl leading-relaxed text-primary-foreground/85">
            Come say hello. And if this community has helped you, share it with another mom who might need it too.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Playful>
              <a
                href={social.whatsappCommunity}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: "gold", size: "lg" })}
              >
                <MessageCircle className="h-4 w-4" aria-hidden /> Join Our Community
              </a>
            </Playful>
            <Playful>
              <Link href={BOOK_SESSION_HREF} className={buttonVariants({ variant: "outline", size: "lg" })}>
                <CalendarHeart className="h-4 w-4" aria-hidden /> Book a Session
              </Link>
            </Playful>
            <Playful>
              <Link href="/contact" className="inline-flex h-14 items-center gap-1.5 rounded-full border border-primary-foreground/40 px-8 text-base font-medium text-primary-foreground transition-colors hover:bg-primary-foreground/10">
                Contact Us
              </Link>
            </Playful>
          </div>

          <ul className="mt-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm font-semibold">
            {supportEmail && (
              <li>
                <a href={`mailto:${supportEmail}`} className="inline-flex min-h-11 items-center gap-2 underline-offset-4 hover:underline">
                  <Mail className="h-4 w-4" aria-hidden /> {supportEmail}
                </a>
              </li>
            )}
            {supportPhone && (
              <li>
                <a href={`tel:${supportPhone.replace(/[^\d+]/g, "")}`} className="inline-flex min-h-11 items-center gap-2 underline-offset-4 hover:underline">
                  <Phone className="h-4 w-4" aria-hidden /> {supportPhone}
                </a>
              </li>
            )}
            <li>
              <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 underline-offset-4 hover:underline">
                <Instagram className="h-4 w-4" aria-hidden /> Instagram
              </a>
            </li>
            <li>
              <a href={social.youtube} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 underline-offset-4 hover:underline">
                <Youtube className="h-4 w-4" aria-hidden /> YouTube
              </a>
            </li>
          </ul>

          <p className="text-sm text-primary-foreground/80">
            New here? Start with our{" "}
            <Link href="/resources" className="font-semibold underline underline-offset-4 hover:text-primary-foreground">
              free guides
            </Link>
            , read the{" "}
            <Link href="/journal" className="font-semibold underline underline-offset-4 hover:text-primary-foreground">
              blog
            </Link>{" "}
            or browse the{" "}
            <Link href="/faq" className="font-semibold underline underline-offset-4 hover:text-primary-foreground">
              FAQs
            </Link>
            .
          </p>
        </Container>
      </section>
    </>
  );
}

/** A founder as entered at /admin/content — photo, introduction, verified qualifications. */
function FounderCard({ founder: f }: { founder: Founder }) {
  return (
    <article className="relative flex h-full flex-col rounded-card border-2 border-border bg-surface p-7 card-shadow sm:p-8">
      <div className="flex items-center gap-4">
        {f.photoUrl ? (
          <Image
            src={f.photoUrl}
            alt={`Photo of ${f.name}`}
            width={160}
            height={160}
            unoptimized={!isOptimizableImage(f.photoUrl)}
            className="h-20 w-20 shrink-0 rounded-full border-2 border-surface object-cover shadow-sm"
          />
        ) : (
          <span aria-hidden className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-sage/45 font-display text-3xl font-semibold text-sage-ink">
            {f.name.charAt(0)}
          </span>
        )}
        <div>
          <h3 className="font-display text-2xl font-semibold text-foreground">{f.name}</h3>
          <p className="mt-0.5 text-xs font-bold uppercase tracking-widest text-accent-text">{f.role}</p>
        </div>
      </div>
      {f.qualifications.length > 0 && (
        <div className="mt-5 rounded-2xl bg-surface-2 p-4">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <GraduationCap className="h-4 w-4 text-primary" aria-hidden /> Qualifications
          </h4>
          <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-foreground">
            {f.qualifications.map((q) => (
              <li key={q} className="flex gap-2">
                <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {q}
              </li>
            ))}
          </ul>
        </div>
      )}
      {paragraphs(f.bio).map((para, j) => (
        <p key={j} className="mt-4 whitespace-pre-line leading-relaxed text-muted-foreground">
          {para}
        </p>
      ))}
    </article>
  );
}

/** Genuine community and event photos from /admin/content. Hidden when empty. */
function CommunityGallery({ images }: { images: GalleryImage[] }) {
  return (
    <section aria-labelledby="gallery-heading" className="relative">
      <Container className="py-16">
        <div className="mb-10 text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-accent-text">Moments together</p>
          <h2 id="gallery-heading" className="mt-2 font-display text-3xl font-semibold text-foreground sm:text-4xl">
            Our community &amp; events
          </h2>
        </div>
        {/* Centred rows, so a gallery of two or three photos sits under the
            heading instead of hugging the left edge. */}
        <ul className="flex flex-wrap justify-center gap-4">
          {images.map((img, i) => (
            <li
              key={`${img.url}-${i}`}
              className="w-[calc(50%-0.5rem)] sm:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-3rem)/4)]"
            >
              <figure className="h-full overflow-hidden rounded-card border border-border bg-surface card-shadow">
                <div className="relative aspect-square">
                  <Image
                    src={img.url}
                    alt={img.alt}
                    fill
                    unoptimized={!isOptimizableImage(img.url)}
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                    className="object-cover"
                  />
                </div>
                {img.caption && (
                  <figcaption className="px-4 py-3 text-sm leading-snug text-muted-foreground">
                    {img.caption}
                  </figcaption>
                )}
              </figure>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
