/**
 * Product search matching, shared by the storefront collection and the admin
 * product list so both behave the same way.
 *
 * Deliberately shape-agnostic: callers pass the strings they want searched
 * rather than a Product or an AdminProduct, because those two types describe
 * the same thing differently and neither should have to know about the other.
 *
 * The matching itself is intentionally plain — case-insensitive, all terms
 * required. This catalogue is a shop's rail, not a search corpus: fuzzy
 * matching or stemming would mostly produce confident wrong answers on a few
 * dozen items, and there is nothing here for a relevance score to rank.
 */

/**
 * Split a raw query into comparable terms.
 *
 * Returns an empty array for a blank query, which callers read as "no search
 * applied" rather than "matches nothing".
 */
export function searchTerms(raw: string): string[] {
  return raw.toLowerCase().split(/\s+/).filter(Boolean);
}

/** Lowercase, and drop the punctuation that only exists for display ("Men's" -> "mens"). */
function normalize(value: string): string {
  return value.toLowerCase().replace(/['’]/g, "");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * True when every term matches somewhere.
 *
 * Terms are ANDed across the whole set rather than per field, so "denim shirt"
 * still matches a product named "Shirt" in a category called "Denim" — the
 * words a shopper types rarely all live in the same column. Nullish fields are
 * skipped, so an absent description never blocks a match.
 *
 * Free-text fields match on plain substring, which is what makes "shirt" find
 * "Everyday Overshirt".
 *
 * `wordStartFields` match only at the start of a word, and exist for one
 * concrete reason: "Women's" contains "men". With substring matching a shopper
 * typing "men" was served the women's rail — the exact opposite of why category
 * names are searchable at all. Names from a short controlled vocabulary are
 * safe to anchor this way; free text is not, because anchoring it would lose
 * "shirt" -> "Overshirt".
 */
export function matchesAllTerms(
  fields: (string | null | undefined)[],
  terms: string[],
  wordStartFields: (string | null | undefined)[] = []
): boolean {
  if (terms.length === 0) return true;

  const loose = normalize(fields.filter(Boolean).join(" "));
  const anchored = wordStartFields.filter(Boolean).map((value) => normalize(value as string));

  return terms.every((rawTerm) => {
    const term = normalize(rawTerm);
    if (loose.includes(term)) return true;
    const atWordStart = new RegExp(`\\b${escapeRegExp(term)}`);
    return anchored.some((value) => atWordStart.test(value));
  });
}
