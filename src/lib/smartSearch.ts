const GROUPS = [
  ['doctor', 'physician', 'medical', 'medicine', 'healthcare', 'health'],
  ['nurse', 'nursing', 'rn', 'patient', 'clinical', 'clinic'],
  ['counselor', 'counselling', 'counseling', 'therapist', 'therapy', 'mental', 'psychology'],
  ['software', 'developer', 'programmer', 'programming', 'coder', 'coding', 'computer', 'tech', 'technology', 'it'],
  ['cybersecurity', 'security', 'hacker', 'network'],
  ['teacher', 'teaching', 'educator', 'education', 'school', 'professor', 'instructor'],
  ['lawyer', 'attorney', 'legal', 'law', 'paralegal'],
  ['police', 'officer', 'detective', 'investigator', 'law-enforcement'],
  ['firefighter', 'fire', 'emergency', 'rescue', 'emt', 'paramedic'],
  ['accountant', 'accounting', 'finance', 'financial', 'money', 'banking', 'budget'],
  ['entrepreneur', 'entrepreneurship', 'business', 'owner', 'startup', 'self-employed'],
  ['manager', 'management', 'leader', 'leadership', 'supervisor'],
  ['marketing', 'advertising', 'brand', 'social-media', 'promotion'],
  ['sales', 'selling', 'representative', 'customer'],
  ['designer', 'design', 'creative', 'artist', 'art', 'graphic', 'ux'],
  ['writer', 'writing', 'author', 'journalist', 'journalism', 'editor', 'communications'],
  ['engineer', 'engineering', 'stem', 'technical'],
  ['scientist', 'science', 'researcher', 'research', 'laboratory', 'lab'],
  ['animal', 'animals', 'wildlife', 'veterinary', 'vet', 'nature'],
  ['electrician', 'plumber', 'hvac', 'mechanic', 'technician', 'trades', 'repair'],
  ['chef', 'cook', 'cooking', 'food', 'restaurant', 'culinary'],
  ['remote', 'virtual', 'online', 'work-from-home', 'wfh'],
  ['help', 'helping', 'service', 'support', 'care'],
] as const;

export function normalizeSearch(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\bwork from home\b/g, ' remote ')
    .trim();
}

const ALIASES = new Map<string, string[]>();
for (const group of GROUPS) {
  const normalized = group.map(normalizeSearch);
  for (const term of normalized) ALIASES.set(term, normalized);
}

function editDistance(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 2) return 3;
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const current = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = current;
    }
  }
  return row[b.length];
}

function isAdjacentSwap(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const different = Array.from({ length: a.length }, (_, index) => index).filter((index) => a[index] !== b[index]);
  return different.length === 2 && different[1] === different[0] + 1 && a[different[0]] === b[different[1]] && a[different[1]] === b[different[0]];
}

function tokenScore(queryToken: string, document: string, documentTokens: string[]): number {
  let variants = ALIASES.get(queryToken);
  if (!variants && queryToken.length >= 4) {
    const threshold = queryToken.length >= 8 ? 2 : 1;
    for (const [alias, group] of ALIASES) {
      if (Math.abs(alias.length - queryToken.length) <= threshold && (editDistance(queryToken, alias) <= threshold || isAdjacentSwap(queryToken, alias))) {
        variants = [queryToken, ...group];
        break;
      }
    }
  }
  variants ??= [queryToken];
  let best = 0;
  for (const variant of variants) {
    if (documentTokens.includes(variant)) best = Math.max(best, variant === queryToken ? 1 : 0.86);
    else if (documentTokens.some((token) => token.startsWith(variant) || (variant.length >= 4 && token.includes(variant)))) best = Math.max(best, variant === queryToken ? 0.94 : 0.8);
    else if (variant.length >= 4) {
      const threshold = variant.length >= 8 ? 2 : 1;
      if (documentTokens.some((token) => Math.abs(token.length - variant.length) <= threshold && (editDistance(variant, token) <= threshold || isAdjacentSwap(variant, token)))) best = Math.max(best, variant === queryToken ? 0.78 : 0.68);
    }
  }
  if (document.includes(queryToken)) best = Math.max(best, 0.96);
  return best;
}

/** Returns -1 when there is no plausible match; larger values are more relevant. */
export function smartSearchScore(query: string, fields: Array<string | undefined | null>): number {
  const normalizedQuery = normalizeSearch(query);
  if (!normalizedQuery) return 0;
  const document = normalizeSearch(fields.filter(Boolean).join(' '));
  const documentTokens = Array.from(new Set(document.split(' ').filter(Boolean)));
  const queryTokens = Array.from(new Set(normalizedQuery.split(' ').filter(Boolean)));
  const scores = queryTokens.map((token) => tokenScore(token, document, documentTokens));
  if (scores.some((score) => score === 0)) return -1;
  const phraseBonus = document.includes(normalizedQuery) ? 0.35 : 0;
  return scores.reduce((sum, score) => sum + score, 0) / scores.length + phraseBonus;
}

export function smartMatches(query: string, fields: Array<string | undefined | null>): boolean {
  return smartSearchScore(query, fields) >= 0;
}
