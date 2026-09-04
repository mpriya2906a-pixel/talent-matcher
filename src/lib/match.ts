// Pure, deterministic keyword scoring shared by the server matcher.
// Kept free of server imports so it can be unit-tested and reused client-side.

export function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9+#.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Loose containment: "react" matches "React.js", "node" matches "Node.js". */
function mentions(haystack: string, skill: string): boolean {
  const needle = normalize(skill);
  if (!needle) return false;
  if (haystack.includes(needle)) return true;
  const stripped = needle.replace(/[.\s]/g, "");
  return stripped.length > 2 && haystack.replace(/[.\s]/g, "").includes(stripped);
}

export type KeywordBreakdown = {
  keywordScore: number;
  matchedSkills: string[];
  missingSkills: string[];
};

/**
 * Required skills carry 75% of the keyword weight, preferred skills 25%.
 * When a JD lists no preferred skills, required coverage is the whole score.
 */
export function keywordMatch(opts: {
  requiredSkills: string[];
  preferredSkills: string[];
  candidateSkills: string[];
  candidateText: string;
}): KeywordBreakdown {
  const haystack = normalize(
    [...opts.candidateSkills, opts.candidateText].join(" ").slice(0, 40000),
  );

  const hit = (skill: string) => mentions(haystack, skill);

  const required = opts.requiredSkills.filter(Boolean);
  const preferred = opts.preferredSkills.filter(Boolean);

  const requiredHits = required.filter(hit);
  const preferredHits = preferred.filter(hit);

  const requiredCoverage = required.length ? requiredHits.length / required.length : 0;
  const preferredCoverage = preferred.length ? preferredHits.length / preferred.length : 0;

  let keywordScore: number;
  if (!required.length && !preferred.length) keywordScore = 0;
  else if (!preferred.length) keywordScore = requiredCoverage * 100;
  else if (!required.length) keywordScore = preferredCoverage * 100;
  else keywordScore = (requiredCoverage * 0.75 + preferredCoverage * 0.25) * 100;

  return {
    keywordScore: Math.round(keywordScore * 10) / 10,
    matchedSkills: [...requiredHits, ...preferredHits],
    missingSkills: required.filter((skill) => !hit(skill)),
  };
}

/** PRD weighting: 40% deterministic keyword coverage, 60% AI semantic judgement. */
export function overallScore(keywordScore: number, semanticScore: number): number {
  return Math.round((keywordScore * 0.4 + semanticScore * 0.6) * 10) / 10;
}

export function clampScore(value: number | null): number {
  if (value === null || !Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value * 10) / 10));
}
