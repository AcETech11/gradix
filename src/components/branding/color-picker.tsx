"use client";

import { cn } from "@/lib/utils";

type ColorPickerProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

const presets = ["#0f172a", "#f97316", "#2563eb", "#16a34a", "#7c3aed", "#dc2626"];

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-slate-800">{label}</label>
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="size-11 rounded-xl border border-slate-200 bg-transparent"
          aria-label={label}
        />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-orange-200"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {presets.map((color) => (
          <button
            type="button"
            className={cn("size-8 rounded-full border-2 transition-transform hover:scale-105", value === color ? "border-slate-950" : "border-white")}
            style={{ backgroundColor: color }}
            onClick={() => onChange(color)}
            aria-label={`Use ${color}`}
            key={color}
          />
        ))}
      </div>
    </div>
  );
}
