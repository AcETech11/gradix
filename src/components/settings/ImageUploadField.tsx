"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { ImagePlus, LoaderCircle, Replace } from "lucide-react";
import { useDropzone } from "react-dropzone";

import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

type ImageUploadFieldProps = {
  bucket: "school-logos" | "signatures";
  schoolId: string;
  label: string;
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  pathPrefix?: string;
  fixedBaseName?: string;
};

const maxSize = 2 * 1024 * 1024;
const allowedTypes = ["image/png", "image/jpeg", "image/webp"];

function sanitizeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
}

export function ImageUploadField({ bucket, fixedBaseName, pathPrefix, schoolId, label, value, onChange, disabled }: ImageUploadFieldProps) {
  const [preview, setPreview] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [pending, startTransition] = useTransition();

  function upload(file: File) {
    setError(null);

    if (!allowedTypes.includes(file.type)) {
      setError("Upload a PNG, JPG, JPEG, or WebP image.");
      return;
    }

    if (file.size > maxSize) {
      setError("Image must be 2MB or smaller.");
      return;
    }

    startTransition(async () => {
      setProgress(20);
      const supabase = createBrowserSupabaseClient();
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "png";
      const fileName = fixedBaseName ? `${fixedBaseName}.${extension}` : `settings-${Date.now()}-${sanitizeFileName(file.name)}`;
      const path = [schoolId, pathPrefix, fileName].filter(Boolean).join("/");
      const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, { cacheControl: "3600", upsert: true });

      if (uploadError) {
        setError(uploadError.message);
        setProgress(0);
        return;
      }

      setProgress(85);
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      setPreview(data.publicUrl);
      onChange(data.publicUrl);
      setProgress(100);
    });
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/webp": [".webp"],
    },
    disabled,
    maxFiles: 1,
    maxSize,
    onDropAccepted: ([file]) => upload(file),
    onDropRejected: () => setError("Upload a valid image up to 2MB."),
  });

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-slate-100">{label}</p>
      <div
        {...getRootProps()}
        className={cn(
          "flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed p-5 text-center transition",
          isDragActive ? "border-orange-300 bg-orange-500/10" : "border-white/10 bg-slate-950/40 hover:border-orange-400/40",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <input {...getInputProps()} />
        {preview ? (
          <div className="space-y-3">
            <div className="relative mx-auto size-24 overflow-hidden rounded-2xl border border-white/10 bg-white">
              <Image alt={`${label} preview`} className="object-contain p-2" fill sizes="96px" src={preview} unoptimized />
            </div>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-orange-200">
              <Replace className="size-4" />
              Replace image
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-200">
              {pending ? <LoaderCircle className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
            </div>
            <div>
              <p className="font-semibold text-slate-100">Drag image here</p>
              <p className="text-sm text-slate-400">PNG, JPG, JPEG, or WebP up to 2MB</p>
            </div>
          </div>
        )}
      </div>
      {progress > 0 && progress < 100 ? <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-orange-500" style={{ width: `${progress}%` }} /></div> : null}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </div>
  );
}
