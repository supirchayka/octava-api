// src/utils/slug.ts

const CYRILLIC_MAP: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
};

const RANDOM_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

export function transliterate(input: string): string {
  return input
    .split('')
    .map((char) => {
      const lower = char.toLowerCase();
      const mapped = CYRILLIC_MAP[lower];
      if (mapped !== undefined) {
        return mapped;
      }
      return lower;
    })
    .join('');
}

export function slugify(input: string): string {
  if (!input) {
    return 'item';
  }

  const transliterated = transliterate(input);
  return transliterated
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')
    .trim() || 'item';
}

export function randomSlugSuffix(length = 4): string {
  let suffix = '';
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * RANDOM_ALPHABET.length);
    suffix += RANDOM_ALPHABET[idx];
  }
  return suffix;
}
