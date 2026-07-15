"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, ImageUp, Loader2, Star, X } from "lucide-react";
import { authedUpload } from "@/lib/api";
import { compressImage } from "@/lib/compress-image";

const MAX = 10;

type Tile = {
  key: string;
  status: "uploading" | "done" | "error";
  url?: string;
  preview?: string;
  error?: string;
};

export function ImageUploader({
  initialImages = [],
  onChange,
  error,
}: {
  initialImages?: string[];
  onChange: (urls: string[]) => void;
  error?: string;
}) {
  const [tiles, setTiles] = useState<Tile[]>(() =>
    initialImages.map((url) => ({ key: url, status: "done", url })),
  );
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // The committed value is the ordered list of successfully uploaded URLs.
  useEffect(() => {
    onChange(
      tiles.filter((t) => t.status === "done" && t.url).map((t) => t.url!),
    );
  }, [tiles, onChange]);

  const uploadOne = useCallback(
    async (key: string, file: File, preview: string) => {
      try {
        const compressed = await compressImage(file);
        const { url } = await authedUpload<{ url: string }>(
          "/seller/uploads",
          compressed,
        );
        setTiles((t) =>
          t.map((tile) =>
            tile.key === key ? { ...tile, status: "done", url } : tile,
          ),
        );
        URL.revokeObjectURL(preview);
      } catch (err) {
        setTiles((t) =>
          t.map((tile) =>
            tile.key === key
              ? {
                  ...tile,
                  status: "error",
                  error: err instanceof Error ? err.message : "Upload failed",
                }
              : tile,
          ),
        );
      }
    },
    [],
  );

  const addFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      setTiles((current) => {
        const room = MAX - current.length;
        if (room <= 0) return current;
        const picked = Array.from(files)
          .filter((f) => f.type.startsWith("image/"))
          .slice(0, room);
        const next = picked.map((file) => {
          const key =
            typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : `${Date.now()}-${file.name}`;
          const preview = URL.createObjectURL(file);
          void uploadOne(key, file, preview);
          return { key, status: "uploading", preview } as Tile;
        });
        return [...current, ...next];
      });
    },
    [uploadOne],
  );

  const remove = (key: string) =>
    setTiles((t) => {
      const tile = t.find((x) => x.key === key);
      if (tile?.preview) URL.revokeObjectURL(tile.preview);
      return t.filter((x) => x.key !== key);
    });

  const makeCover = (key: string) =>
    setTiles((t) => {
      const idx = t.findIndex((x) => x.key === key);
      if (idx <= 0) return t;
      const copy = [...t];
      const [tile] = copy.splice(idx, 1);
      copy.unshift(tile);
      return copy;
    });

  const full = tiles.length >= MAX;

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={`grid grid-cols-3 gap-3 rounded-2xl border-2 border-dashed p-3 transition-colors sm:grid-cols-4 ${
          dragging ? "border-primary bg-primary/5" : "border-border"
        }`}
      >
        {tiles.map((tile, i) => (
          <div
            key={tile.key}
            className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={tile.url ?? tile.preview}
              alt=""
              className={`h-full w-full object-cover ${
                tile.status !== "done" ? "opacity-50" : ""
              }`}
            />

            {tile.status === "uploading" && (
              <div className="absolute inset-0 grid place-items-center bg-black/10">
                <Loader2 className="h-6 w-6 animate-spin text-white drop-shadow" />
              </div>
            )}

            {tile.status === "error" && (
              <div className="absolute inset-0 grid place-items-center bg-danger/70 p-2 text-center">
                <span className="flex flex-col items-center gap-1 text-[11px] font-medium text-white">
                  <AlertCircle className="h-4 w-4" />
                  {tile.error ?? "Failed"}
                </span>
              </div>
            )}

            {i === 0 && tile.status === "done" && (
              <span className="absolute left-1.5 top-1.5 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                Cover
              </span>
            )}

            {i > 0 && tile.status === "done" && (
              <button
                type="button"
                onClick={() => makeCover(tile.key)}
                title="Set as cover photo"
                className="absolute left-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-md bg-black/50 text-white opacity-0 transition-opacity hover:bg-black/70 focus:opacity-100 group-hover:opacity-100"
              >
                <Star className="h-3.5 w-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => remove(tile.key)}
              title="Remove photo"
              className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-md bg-black/50 text-white transition-colors hover:bg-danger focus:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {!full && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <ImageUp className="h-6 w-6" />
            <span className="text-xs font-medium">Add photo</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="sr-only"
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = ""; // allow re-selecting the same file
        }}
      />

      <div className="mt-1.5 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {tiles.length}/{MAX} photos · first photo is the cover · JPG, PNG or WebP
        </p>
      </div>
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  );
}
