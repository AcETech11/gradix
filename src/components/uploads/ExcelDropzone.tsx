"use client";

import { UploadCloud } from "lucide-react";

type ExcelDropzoneProps = {
  disabled?: boolean;
  fileName?: string;
  onFileReady: (file: { fileName: string; base64: string }) => void;
  onError: (message: string) => void;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function isExcelFile(file: File) {
  return /\.(xlsx|xls)$/i.test(file.name);
}

function readFileAsBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("The file could not be read."));
    reader.onload = () => {
      const result = String(reader.result ?? "");
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.readAsDataURL(file);
  });
}

export function ExcelDropzone({ disabled, fileName, onError, onFileReady }: ExcelDropzoneProps) {
  async function handleFile(file?: File) {
    if (!file) {
      return;
    }

    if (!isExcelFile(file)) {
      onError("Upload a .xlsx or .xls file.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      onError("Upload a file smaller than 5 MB.");
      return;
    }

    try {
      onFileReady({ fileName: file.name, base64: await readFileAsBase64(file) });
    } catch (error) {
      onError(error instanceof Error ? error.message : "The file could not be read.");
    }
  }

  return (
    <label className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-orange-300/30 bg-orange-500/10 p-6 text-center transition hover:bg-orange-500/15">
      <UploadCloud className="size-8 text-orange-200" />
      <span className="mt-3 text-sm font-medium text-slate-100">{fileName || "Drop completed Excel template here"}</span>
      <span className="mt-1 text-xs leading-5 text-slate-400">Accepted formats: .xlsx, .xls. Maximum size: 5 MB.</span>
      <input
        accept=".xlsx,.xls"
        className="sr-only"
        disabled={disabled}
        onChange={(event) => handleFile(event.target.files?.[0])}
        type="file"
      />
    </label>
  );
}
