import sanitizeHtml from 'sanitize-html';

const DEFAULT_ALLOWED_TAGS = [
  'div',
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  'ul',
  'ol',
  'li',
];

export function sanitizeRichText(value?: string | null) {
  const trimmed = (value ?? '').trim();
  if (!trimmed) return '';

  const normalizedInput = looksLikeHtml(trimmed)
    ? trimmed
    : plainTextToHtml(trimmed);

  return sanitizeHtml(normalizedInput, {
    allowedTags: DEFAULT_ALLOWED_TAGS,
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
    parser: { lowerCaseTags: true },
  })
    .replace(/&nbsp;/g, ' ')
    .replace(/<p>\s*<\/p>/g, '')
    .trim();
}

function looksLikeHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function plainTextToHtml(value: string) {
  const normalized = value.replace(/\r\n/g, '\n');
  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0)
    .map(
      (paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`,
    );

  return paragraphs.join('');
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
