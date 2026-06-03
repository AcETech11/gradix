"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { ImagePlus, LoaderCircle, Replace, UploadCloud } from "lucide-react";
import { useDropzone } from "react-dropzone";

import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type ImageUploadProps = {
  bucket: "school-logos" | "signatures";
  schoolId: string;
  label: string;
  value?: string;
  onUploaded: (url: string) => void;
};

const maxSize = 2 * 1024 * 1024;
const allowedTypes = ["image/png", "image/jpeg", "image/webp"];

function sanitizeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
}

export function ImageUpload({ bucket, schoolId, label, value, onUploaded }: ImageUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState(value ?? "");
  const [isPending, startTransition] = useTransition();

  const uploadFile = (file: File) => {
    setError(null);
    setProgress(8);

    if (!allowedTypes.includes(file.type)) {
      setError("Upload a PNG, JPG, or WebP image.");
      setProgress(0);
      return;
    }

    if (file.size > maxSize) {
      setError("Image must be 2MB or smaller.");
      setProgress(0);
      return;
    }

    startTransition(async () => {
      try {
        setProgress(35);
        const supabase = createClient();
        const path = `${schoolId}/${Date.now()}-${sanitizeFileName(file.name)}`;
        const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
          cacheControl: "3600",
          upsert: true,
        });

        if (uploadError) {
          setError(uploadError.message);
          setProgress(0);
          return;
        }

        setProgress(80);
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        setPreview(data.publicUrl);
        onUploaded(data.publicUrl);
        setProgress(100);
      } catch {
        setError("Upload failed. Check your connection and try again.");
        setProgress(0);
      }
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/webp": [".webp"],
    },
    maxFiles: 1,
    maxSize,
    onDropAccepted: ([file]) => uploadFile(file),
    onDropRejected: () => setError("Upload a PNG, JPG, or WebP image up to 2MB."),
  });

  const previewAlt = useMemo(() => `${label} preview`, [label]);

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-slate-800">{label}</p>
      <div
        {...getRootProps()}
        className={cn(
          "group flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed p-5 text-center transition-all",
          isDragActive ? "border-orange-400 bg-orange-50" : "border-slate-300 bg-white hover:border-orange-300 hover:bg-orange-50/50",
        )}
      >
        <input {...getInputProps()} />
        {preview ? (
          <div className="space-y-4">
            <div className="relative mx-auto size-28 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              <Image src={preview} alt={previewAlt} fill sizes="112px" className="object-contain p-2" unoptimized />
            </div>
            <span className="inline-flex items-center gap-2 text-sm font-medium text-orange-600">
              <Replace className="size-4" aria-hidden="true" />
              Replace image
            </span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
              {isPending ? <LoaderCircle className="size-6 animate-spin" /> : <ImagePlus className="size-6" />}
            </div>
            <div>
              <p className="font-semibold text-slate-900">Drag and drop image here</p>
              <p className="mt-1 text-sm text-slate-500">PNG, JPG, or WebP up to 2MB</p>
            </div>
            <span className="inline-flex items-center gap-2 text-sm font-medium text-orange-600">
              <UploadCloud className="size-4" aria-hidden="true" />
              Browse files
            </span>
          </div>
        )}
      </div>
      {progress > 0 && progress < 100 ? (
        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-orange-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
