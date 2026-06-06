export function normalizeResultCode(value: string) {
  const compact = value.toUpperCase().replace(/\s+/g, "").replace(/[^A-Z0-9-]/g, "");

  if (compact.includes("-")) {
    return compact;
  }

  if (compact.length > 3) {
    return `${compact.slice(0, 3)}-${compact.slice(3)}`;
  }

  return compact;
}
