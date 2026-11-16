"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { authedUpload } from "@/lib/api";
import { compressImage } from "@/lib/compress-image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Uploads one image to the admin site folder and returns its public URL.
 * Same pipeline as the seller uploader (client-side downscale, then the API
 * sniffs the bytes and stores to Supabase) but through `/admin/uploads`, which
 * files the image under `site/` instead of a seller's own folder.
 */
export async function uploadSiteImage(file: File): Promise<string> {
  const compressed = await compressImage(file);
  const { url } = await authedUpload<{ url: string }>("/admin/uploads", compressed);
  return url;
}

/**
 * A single image slot (hero, founder photo, partner logo, testimonial photo):
 * shows the current image, and lets the admin upload, replace or remove it.
 * Controlled — `value` is the stored URL, "" for none.
 */
export function AdminImageField({
  id,
  value,
  onChange,
  aspect = "landscape",
  fit = "cover",
  error,
  disabled,
}: {
  id: string;
  value: string;
  onChange: (url: string) => void;
  /** Preview frame: wide for hero/gallery, square for faces and logos. */
  aspect?: "landscape" | "square";
  /** "contain" for logos, which must not be cropped. */
  fit?: "cover" | "contain";
  error?: string;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setUploadError(null);
    setBusy(true);
    try {
      onChange(await uploadSiteImage(file));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const shown = uploadError ?? error;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4">
        <div
          className={cn(
            "relative grid shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-muted",
            aspect === "square" ? "h-24 w-24" : "h-24 w-40",
            shown && "border-danger/50",
          )}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin preview of an arbitrary uploaded URL; next/image throws on hosts outside the remote allowlist
            <img src={value} alt="" className={cn("h-full w-full", fit === "contain" ? "object-contain p-2" : "object-cover")} />
          ) : (
            <ImagePlus className="h-6 w-6 text-muted-foreground" aria-hidden />
          )}
          {busy && (
            <span className="absolute inset-0 grid place-items-center bg-foreground/30">
              <Loader2 className="h-6 w-6 animate-spin text-background" aria-label="Uploading" />
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={busy || disabled}
            onClick={() => inputRef.current?.click()}
          >
            {value ? <RefreshCw className="h-4 w-4" /> : <ImagePlus className="h-4 w-4" />}
            {busy ? "Uploading…" : value ? "Replace" : "Upload image"}
          </Button>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5 hover:text-danger"
              disabled={busy || disabled}
              onClick={() => onChange("")}
            >
              <Trash2 className="h-4 w-4" /> Remove
            </Button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          void pick(e.target.files?.[0]);
          e.target.value = ""; // allow re-selecting the same file
        }}
      />
      <p className="mt-1.5 text-xs text-muted-foreground">JPG, PNG or WebP · up to 8 MB</p>
      {shown && <p className="mt-1 text-xs text-danger">{shown}</p>}
    </div>
  );
}
