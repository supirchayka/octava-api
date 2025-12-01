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

/**
 * Проверяем, относится ли путь к seed-файлам, чтобы можно было скрывать
 * заглушки, когда в базе появились реальные загрузки.
 */
export function isSeedFilePath(filePath?: string | null): boolean {
  if (!filePath) return false;
  const normalized = filePath.replace(/^\/+/, '');
  return normalized.startsWith('uploads/seed/') || normalized.startsWith('seed/');
}
