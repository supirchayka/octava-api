// src/utils/files.ts

/**
 * Строим публичный URL для файла по его path из БД.
 * В сидере мы используем пути вида "uploads/seed/xxx.jpg",
 * а fastify-static отдаёт /uploads/*, так что:
 * - "uploads/seed/xxx.jpg" -> "/uploads/seed/xxx.jpg"
 * - "seed/xxx.jpg"         -> "/uploads/seed/xxx.jpg"
 */
export function buildFileUrl(filePath: string): string {
  if (!filePath) return '';
  const normalized = filePath.replace(/^\/+/, '');

  if (normalized.startsWith('uploads/')) {
    return `/${normalized}`;
  }

  return `/uploads/${normalized}`;
}
