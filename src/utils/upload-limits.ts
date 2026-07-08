const DEFAULT_MAX_UPLOAD_SIZE_MB = 100;

function parsePositiveNumber(value: string | undefined) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export const MAX_UPLOAD_SIZE_MB =
  parsePositiveNumber(process.env.MAX_UPLOAD_SIZE_MB) ??
  DEFAULT_MAX_UPLOAD_SIZE_MB;

export const MAX_UPLOAD_SIZE_BYTES = Math.floor(
  MAX_UPLOAD_SIZE_MB * 1024 * 1024,
);
