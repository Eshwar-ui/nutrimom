"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Heart,
  ImageIcon,
  ImagePlus,
  Link2,
  Loader2,
  Plus,
  ScrollText,
  Trash2,
  Users,
} from "lucide-react";
import {
  siteContentInputSchema,
  type SiteContent,
  type SiteContentInput,
} from "@nutrimom/shared";
import { authedRequest } from "@/lib/api";
import { revalidatePublicPages } from "@/lib/revalidate";
import { apiIssues, errorMessage, zodIssues, type FormIssues } from "@/lib/admin-content";
import { toast } from "@/lib/toast-store";
import { Card, Input, Textarea } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { PageSkeleton, StatePanel } from "@/components/ui/states";
import {
  AdminPageHeader,
  Field,
  FormAlert,
  SectionHeading,
  StringListEditor,
} from "@/components/admin-form";
import { AdminImageField, uploadSiteImage } from "@/components/admin-image-field";
import { MarkdownContent } from "@/components/markdown-content";

const QUERY_KEY = ["site-content"];
const MAX_FOUNDERS = 6;
const MAX_GALLERY = 40;

export default function AdminSiteContentPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => authedRequest<SiteContent>("/site-content", { cache: "no-store" }),
  });

  return (
    <div>
      <AdminPageHeader
        eyebrow="Content"
        title="Site content"
        description="The home hero, About page, community gallery, social links and session policy. Anything left empty stays hidden on the site — nothing placeholder goes live."
      />
      {isLoading ? (
        <PageSkeleton rows={5} />
      ) : isError || !data ? (
        <StatePanel
          tone="error"
          title="Couldn't load the site content"
          description="Check your connection and try again."
          action={<Button variant="outline" onClick={() => void refetch()}>Try again</Button>}
        />
      ) : (
        // Keyed on updatedAt: the form seeds from props once, and again after
        // a save — no effect syncing state to the query (as admin/settings).
        <SiteContentForm key={data.updatedAt} content={data} />
      )}
    </div>
  );
}

// Founders and gallery photos are reordered in place, so each row carries a
// local key that survives the move (an index key would hand one row's
// half-typed input to its neighbour).
let nextKey = 0;
const withKey = <T,>(value: T) => ({ ...value, key: `row-${++nextKey}` });

type FounderRow = FounderDraft & { key: string };
type GalleryRow = GalleryDraft & { key: string };
interface FounderDraft {
  name: string;
  role: string;
  photoUrl: string;
  bio: string;
  qualifications: string[];
}
interface GalleryDraft {
  url: string;
  alt: string;
  caption: string;
}

function move<T>(list: T[], index: number, delta: -1 | 1): T[] {
  const target = index + delta;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function SiteContentForm({ content }: { content: SiteContent }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    heroHeadline: content.heroHeadline,
    heroSubline: content.heroSubline,
    heroMessage: content.heroMessage,
    heroImageUrl: content.heroImageUrl ?? "",
    heroImageAlt: content.heroImageAlt ?? "",
    aboutMission: content.aboutMission ?? "",
    instagramUrl: content.instagramUrl ?? "",
    youtubeUrl: content.youtubeUrl ?? "",
    whatsappCommunityUrl: content.whatsappCommunityUrl ?? "",
    whatsappPrelovedUrl: content.whatsappPrelovedUrl ?? "",
    sessionPolicy: content.sessionPolicy ?? "",
  });
  const [founders, setFounders] = useState<FounderRow[]>(() =>
    content.founders.map((f) =>
      withKey({
        name: f.name,
        role: f.role,
        photoUrl: f.photoUrl ?? "",
        bio: f.bio,
        qualifications: f.qualifications,
      }),
    ),
  );
  const [gallery, setGallery] = useState<GalleryRow[]>(() =>
    content.galleryImages.map((g) => withKey({ url: g.url, alt: g.alt, caption: g.caption ?? "" })),
  );
  const [policyPreview, setPolicyPreview] = useState(false);
  const [issues, setIssues] = useState<FormIssues>({});
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));
  const updateFounder = (key: string, patch: Partial<FounderDraft>) =>
    setFounders((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const updatePhoto = (key: string, patch: Partial<GalleryDraft>) =>
    setGallery((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const save = useMutation({
    mutationFn: (input: SiteContentInput) =>
      authedRequest<SiteContent>("/admin/site-content", { method: "PUT", body: input }),
    onSuccess: (updated) => {
      qc.setQueryData(QUERY_KEY, updated);
      // The footer's social links are on every page, so this purges the root
      // layout as well as the pages that render the hero, About and gallery.
      void revalidatePublicPages("content");
      toast.success("Site content saved");
    },
    onError: (err) => {
      setIssues(apiIssues(err));
      setError(errorMessage(err, "Couldn't save the site content"));
    },
  });

  const submit = () => {
    setError(null);
    const payload = {
      ...form,
      founders: founders.map((f) => ({
        name: f.name,
        role: f.role,
        photoUrl: f.photoUrl,
        bio: f.bio,
        qualifications: f.qualifications,
      })),
      galleryImages: gallery.map((g) => ({ url: g.url, alt: g.alt, caption: g.caption })),
    };
    const parsed = siteContentInputSchema.safeParse(payload);
    if (!parsed.success) {
      setIssues(zodIssues(parsed.error));
      setError("Check the highlighted details before saving.");
      return;
    }
    setIssues({});
    save.mutate(parsed.data);
  };

  return (
    <Card className="max-w-4xl overflow-hidden">
      {/* ---- Hero ---- */}
      <fieldset className="grid gap-5 border-b border-border p-6 sm:p-8">
        <legend className="sr-only">Home page hero</legend>
        <SectionHeading icon={Heart} title="Home page hero" description="The first thing every visitor reads." />
        <Field label="Headline" id="hero-headline" error={issues.heroHeadline}>
          <Input id="hero-headline" value={form.heroHeadline} maxLength={120} aria-invalid={!!issues.heroHeadline} onChange={(e) => set("heroHeadline")(e.target.value)} />
        </Field>
        <Field label="Subline" id="hero-subline" error={issues.heroSubline}>
          <Input id="hero-subline" value={form.heroSubline} maxLength={200} aria-invalid={!!issues.heroSubline} onChange={(e) => set("heroSubline")(e.target.value)} />
        </Field>
        <Field label="Message" id="hero-message" error={issues.heroMessage}>
          <Textarea id="hero-message" rows={3} maxLength={400} value={form.heroMessage} aria-invalid={!!issues.heroMessage} onChange={(e) => set("heroMessage")(e.target.value)} />
        </Field>
        <Field label="Hero photo" id="hero-image" error={issues.heroImageUrl} helper="Optional — a genuine photo. Without one the current illustration stays.">
          <AdminImageField id="hero-image" value={form.heroImageUrl} onChange={set("heroImageUrl")} />
        </Field>
        {form.heroImageUrl && (
          <Field label="Describe the photo" id="hero-alt" error={issues.heroImageAlt} helper="Read aloud by screen readers — required with a photo.">
            <Input id="hero-alt" value={form.heroImageAlt} maxLength={200} aria-invalid={!!issues.heroImageAlt} onChange={(e) => set("heroImageAlt")(e.target.value)} placeholder="A mother holding her smiling baby at home" />
          </Field>
        )}
      </fieldset>

      {/* ---- About ---- */}
      <fieldset className="grid gap-5 border-b border-border p-6 sm:p-8">
        <legend className="sr-only">About and founders</legend>
        <SectionHeading icon={Users} title="About & founders" description="Shown on the About page. Qualifications are printed as fact — list only verified ones." />
        <Field label="Our mission" id="about-mission" error={issues.aboutMission} helper="Optional — hidden until filled.">
          <Textarea id="about-mission" rows={4} maxLength={2000} value={form.aboutMission} aria-invalid={!!issues.aboutMission} onChange={(e) => set("aboutMission")(e.target.value)} />
        </Field>

        <div className="space-y-4">
          {founders.map((founder, index) => {
            const p = `founders.${index}`;
            return (
              <div key={founder.key} className="rounded-card border border-border bg-background/60 p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground">Founder {index + 1}</p>
                  <div className="flex gap-1">
                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9" aria-label={`Move founder ${index + 1} up`} disabled={index === 0} onClick={() => setFounders((rows) => move(rows, index, -1))}>
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9" aria-label={`Move founder ${index + 1} down`} disabled={index === founders.length - 1} onClick={() => setFounders((rows) => move(rows, index, 1))}>
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 hover:text-danger" aria-label={`Remove founder ${index + 1}`} onClick={() => setFounders((rows) => rows.filter((r) => r.key !== founder.key))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Name" id={`${founder.key}-name`} error={issues[`${p}.name`]}>
                    <Input id={`${founder.key}-name`} value={founder.name} maxLength={80} aria-invalid={!!issues[`${p}.name`]} onChange={(e) => updateFounder(founder.key, { name: e.target.value })} />
                  </Field>
                  <Field label="Role" id={`${founder.key}-role`} error={issues[`${p}.role`]}>
                    <Input id={`${founder.key}-role`} value={founder.role} maxLength={80} aria-invalid={!!issues[`${p}.role`]} onChange={(e) => updateFounder(founder.key, { role: e.target.value })} placeholder="Co-founder · Prenatal yoga" />
                  </Field>
                  <Field label="Photo" id={`${founder.key}-photo`} error={issues[`${p}.photoUrl`]} className="sm:col-span-2">
                    <AdminImageField id={`${founder.key}-photo`} value={founder.photoUrl} onChange={(url) => updateFounder(founder.key, { photoUrl: url })} aspect="square" />
                  </Field>
                  <Field label="Introduction" id={`${founder.key}-bio`} error={issues[`${p}.bio`]} className="sm:col-span-2">
                    <Textarea id={`${founder.key}-bio`} rows={4} maxLength={1500} value={founder.bio} aria-invalid={!!issues[`${p}.bio`]} onChange={(e) => updateFounder(founder.key, { bio: e.target.value })} />
                  </Field>
                  <Field label="Verified qualifications" id={`${founder.key}-quals`} error={issues[`${p}.qualifications`]} className="sm:col-span-2">
                    <StringListEditor
                      id={`${founder.key}-quals`}
                      values={founder.qualifications}
                      onChange={(v) => updateFounder(founder.key, { qualifications: v })}
                      placeholder="RYT-200 Prenatal Yoga, Yoga Alliance"
                      addLabel="Add"
                      max={12}
                      maxLength={160}
                      issues={issues}
                      issuePrefix={`${p}.qualifications`}
                    />
                  </Field>
                </div>
              </div>
            );
          })}
          {founders.length < MAX_FOUNDERS && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setFounders((rows) => [...rows, withKey({ name: "", role: "", photoUrl: "", bio: "", qualifications: [] })])}
            >
              <Plus className="h-4 w-4" /> Add founder
            </Button>
          )}
          {issues.founders && <p className="text-xs text-danger">{issues.founders}</p>}
        </div>
      </fieldset>

      {/* ---- Gallery ---- */}
      <GalleryEditor
        rows={gallery}
        setRows={setGallery}
        update={updatePhoto}
        issues={issues}
      />

      {/* ---- Links ---- */}
      <fieldset className="grid gap-5 border-b border-border p-6 sm:grid-cols-2 sm:p-8">
        <legend className="sr-only">Social and community links</legend>
        <div className="sm:col-span-2">
          <SectionHeading icon={Link2} title="Social & community links" description="Used in the footer and on the community pages. Blank falls back to the built-in link." />
        </div>
        <Field label="Instagram" id="link-instagram" error={issues.instagramUrl}>
          <Input id="link-instagram" type="url" value={form.instagramUrl} aria-invalid={!!issues.instagramUrl} onChange={(e) => set("instagramUrl")(e.target.value)} placeholder="https://www.instagram.com/…" />
        </Field>
        <Field label="YouTube" id="link-youtube" error={issues.youtubeUrl}>
          <Input id="link-youtube" type="url" value={form.youtubeUrl} aria-invalid={!!issues.youtubeUrl} onChange={(e) => set("youtubeUrl")(e.target.value)} placeholder="https://www.youtube.com/@…" />
        </Field>
        <Field label="WhatsApp community" id="link-wa-community" error={issues.whatsappCommunityUrl}>
          <Input id="link-wa-community" type="url" value={form.whatsappCommunityUrl} aria-invalid={!!issues.whatsappCommunityUrl} onChange={(e) => set("whatsappCommunityUrl")(e.target.value)} placeholder="https://chat.whatsapp.com/…" />
        </Field>
        <Field label="WhatsApp preloved group" id="link-wa-preloved" error={issues.whatsappPrelovedUrl}>
          <Input id="link-wa-preloved" type="url" value={form.whatsappPrelovedUrl} aria-invalid={!!issues.whatsappPrelovedUrl} onChange={(e) => set("whatsappPrelovedUrl")(e.target.value)} placeholder="https://chat.whatsapp.com/…" />
        </Field>
      </fieldset>

      {/* ---- Session policy ---- */}
      <fieldset className="grid gap-4 p-6 sm:p-8">
        <legend className="sr-only">Session policy</legend>
        <div className="flex items-start justify-between gap-3">
          <SectionHeading icon={ScrollText} title="Session policy" description="Cancellation, rescheduling and refunds for yoga and nutrition sessions. Shown under the prices; hidden until filled. Markdown supported." />
          <Button type="button" variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={() => setPolicyPreview((p) => !p)}>
            {policyPreview ? <><EyeOff className="h-4 w-4" /> Edit</> : <><Eye className="h-4 w-4" /> Preview</>}
          </Button>
        </div>
        {policyPreview ? (
          <div className="min-h-[12rem] rounded-xl border border-border p-4">
            <MarkdownContent markdown={form.sessionPolicy || "*Nothing to preview yet.*"} />
          </div>
        ) : (
          <Textarea
            id="session-policy"
            aria-label="Session policy"
            rows={10}
            maxLength={6000}
            value={form.sessionPolicy}
            aria-invalid={!!issues.sessionPolicy}
            onChange={(e) => set("sessionPolicy")(e.target.value)}
            className="font-mono text-sm"
            placeholder={"**Rescheduling** — let us know 24 hours before…\n\n**Refunds** — …"}
          />
        )}
        {issues.sessionPolicy && <p className="text-xs text-danger">{issues.sessionPolicy}</p>}
      </fieldset>

      {error && (
        <div className="px-6 pb-6 sm:px-8">
          <FormAlert message={error} />
        </div>
      )}
      <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-border bg-surface/95 p-5 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <p className="text-xs text-muted-foreground">
          Last saved {new Date(content.updatedAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
        </p>
        <Button size="lg" onClick={submit} disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save site content"}
        </Button>
      </div>
    </Card>
  );
}

/**
 * Community/event photos for the About page. "Add photos" takes several files
 * at once and uploads them one by one; each lands as a row that still needs
 * its description, which the schema requires before the gallery can be saved.
 */
function GalleryEditor({
  rows,
  setRows,
  update,
  issues,
}: {
  rows: GalleryRow[];
  setRows: React.Dispatch<React.SetStateAction<GalleryRow[]>>;
  update: (key: string, patch: Partial<GalleryDraft>) => void;
  issues: FormIssues;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const addFiles = async (files: FileList | null) => {
    if (!files) return;
    setUploadError(null);
    const picked = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, Math.max(0, MAX_GALLERY - rows.length));
    setUploading((n) => n + picked.length);
    // Sequential, so a burst of 20 photos doesn't hit the upload rate limit
    // all at once — and each one appears as soon as it's ready.
    for (const file of picked) {
      try {
        const url = await uploadSiteImage(file);
        setRows((current) => [...current, withKey({ url, alt: "", caption: "" })]);
      } catch (err) {
        setUploadError(`${file.name}: ${err instanceof Error ? err.message : "upload failed"}`);
      } finally {
        setUploading((n) => n - 1);
      }
    }
  };

  return (
    <fieldset className="grid gap-5 border-b border-border p-6 sm:p-8">
      <legend className="sr-only">Community gallery</legend>
      <SectionHeading icon={ImageIcon} title="Community gallery" description="Photos from meetups and events, on the About page. Every photo needs a short description." />
      {rows.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {rows.map((photo, index) => {
            const p = `galleryImages.${index}`;
            return (
              <div key={photo.key} className="flex gap-3 rounded-card border border-border bg-background/60 p-3">
                <div className="flex shrink-0 flex-col items-center gap-1">
                  {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of an uploaded URL */}
                  <img src={photo.url} alt="" className="h-24 w-24 rounded-xl border border-border object-cover" />
                  <div className="flex">
                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9" aria-label={`Move photo ${index + 1} earlier`} disabled={index === 0} onClick={() => setRows((r) => move(r, index, -1))}>
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9" aria-label={`Move photo ${index + 1} later`} disabled={index === rows.length - 1} onClick={() => setRows((r) => move(r, index, 1))}>
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <Field label="Description" id={`${photo.key}-alt`} error={issues[`${p}.alt`] ?? issues[`${p}.url`]}>
                    <Input id={`${photo.key}-alt`} value={photo.alt} maxLength={200} aria-invalid={!!issues[`${p}.alt`]} onChange={(e) => update(photo.key, { alt: e.target.value })} placeholder="Mothers at the March yoga meetup" />
                  </Field>
                  <Field label="Caption (optional)" id={`${photo.key}-caption`} error={issues[`${p}.caption`]}>
                    <Input id={`${photo.key}-caption`} value={photo.caption} maxLength={160} onChange={(e) => update(photo.key, { caption: e.target.value })} />
                  </Field>
                  <Button type="button" variant="ghost" size="sm" className="gap-1.5 hover:text-danger" onClick={() => setRows((r) => r.filter((x) => x.key !== photo.key))}>
                    <Trash2 className="h-4 w-4" /> Remove
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        {rows.length < MAX_GALLERY && (
          <Button type="button" variant="outline" size="sm" className="gap-1.5" disabled={uploading > 0} onClick={() => inputRef.current?.click()}>
            {uploading > 0 ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            {uploading > 0 ? `Uploading ${uploading}…` : "Add photos"}
          </Button>
        )}
        <span className="text-xs text-muted-foreground">{rows.length}/{MAX_GALLERY} photos · JPG, PNG or WebP</span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-label="Add gallery photos"
        onChange={(e) => {
          void addFiles(e.target.files);
          e.target.value = "";
        }}
      />
      {uploadError && <p className="text-xs text-danger">{uploadError}</p>}
      {issues.galleryImages && <p className="text-xs text-danger">{issues.galleryImages}</p>}
    </fieldset>
  );
}
