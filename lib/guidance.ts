import { gitaVerses, situationMap } from "./gita-data";
import type { GitaVerse, GuidanceResponse, SituationKey } from "./types";

// ─── Greeting detection ───────────────────────────────────────────────────────
const GREETING_RE = /^(hi|hello|hey|namaste|namaskar|hare krishna|jai shree krishna|jai sri krishna|good morning|good evening|good night|good afternoon|radhe radhe|om|ॐ)\b/i;

export function isGreeting(query: string): boolean {
  return GREETING_RE.test(query.trim());
}

// ─── Stop words ───────────────────────────────────────────────────────────────
const stopWords = new Set([
  "a","an","and","are","as","at","be","but","for","from","how",
  "i","in","is","it","my","of","on","or","so","the","to","with",
  "what","when","why","me","we","do","did","just","very","really"
]);

// ─── Synonym / emotion tag expansion ─────────────────────────────────────────
const synonymTags: Record<string, string[]> = {
  // Original
  anxious:        ["stress","fear","anxiety","overthinking"],
  anxiety:        ["stress","fear","overthinking"],
  exam:           ["stress","study","results"],
  interview:      ["career","fear","pressure"],
  job:            ["career","duty","stress"],
  confused:       ["confusion","overthinking","decision"],
  confusion:      ["confusion","doubt","decision"],
  doubt:          ["doubt","overthinking"],
  breakup:        ["relationship","emotions","grief"],
  angry:          ["anger","relationship","impulse"],
  procrastination:["discipline","habit","routine"],
  lazy:           ["discipline","habit","self-control"],
  failed:         ["failure","resilience"],
  marks:          ["exam","results","stress"],
  compare:        ["comparison","failure"],
  comparison:     ["comparison","purpose"],
  lonely:         ["loneliness","self-worth","faith"],
  depression:     ["grief","support","hope"],
  sad:            ["grief","emotions","support"],
  money:          ["career","fear","stress"],
  future:         ["fear","uncertainty","career"],
  focus:          ["focus","mind","discipline"],
  distracted:     ["focus","overthinking","practice"],
  meditation:     ["meditation","mind","peace"],
  // Emotions — positive
  happy:          ["gratitude","peace","devotion","joy"],
  happiness:      ["gratitude","peace","joy"],
  joy:            ["gratitude","peace","devotion"],
  grateful:       ["gratitude","devotion","faith","peace"],
  gratitude:      ["gratitude","devotion","faith"],
  excited:        ["motivation","energy","action"],
  motivated:      ["discipline","action","duty","purpose"],
  positive:       ["gratitude","hope","faith","peace"],
  calm:           ["peace","meditation","mind"],
  peaceful:       ["peace","meditation","gratitude"],
  content:        ["gratitude","peace","detachment"],
  // Emotions — negative / difficult
  negative:       ["grief","fear","stress","overthinking"],
  hopeless:       ["hope","grief","faith","support"],
  helpless:       ["support","faith","hope","surrender"],
  lost:           ["purpose","confusion","doubt","identity"],
  worthless:      ["self-worth","identity","faith"],
  heartbroken:    ["grief","relationship","emotions","loss"],
  grief:          ["grief","support","emotions"],
  guilt:          ["forgiveness","surrender","karma"],
  shame:          ["self-worth","forgiveness","identity"],
  regret:         ["surrender","forgiveness","action"],
  jealous:        ["comparison","desire","ego"],
  jealousy:       ["comparison","desire","ego"],
  envy:           ["comparison","purpose","failure"],
  hate:           ["anger","impulse","relationship"],
  anger:          ["anger","impulse","relationship"],
  frustrated:     ["stress","patience","duty"],
  overwhelmed:    ["stress","anxiety","pressure"],
  panic:          ["fear","stress","overthinking"],
  scared:         ["fear","uncertainty","courage"],
  worried:        ["overthinking","stress","fear"],
  // Life situations
  purpose:        ["purpose","dharma","confusion","identity"],
  career:         ["career","duty","stress","purpose"],
  relationship:   ["relationship","emotions","love"],
  love:           ["relationship","devotion","emotions"],
  family:         ["relationship","duty","emotions"],
  health:         ["stress","patience","mind"],
  study:          ["discipline","focus","stress"],
  success:        ["action","duty","purpose"],
  failure:        ["failure","resilience","purpose"],
  habit:          ["discipline","routine","self-control"],
  sleep:          ["stress","mind","peace"],
  tired:          ["stress","discipline","patience"],
  burnout:        ["stress","rest","detachment"],
  bored:          ["discipline","purpose","action"],
};

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1 && !stopWords.has(token));
}

function expandTokens(tokens: string[]): string[] {
  const expanded = new Set(tokens);
  tokens.forEach((token) => {
    synonymTags[token]?.forEach((tag) => expanded.add(tag));
  });
  return Array.from(expanded);
}

export function inferSituation(query: string, preferred?: string): SituationKey | "general" {
  if (preferred && preferred in situationMap) {
    return preferred as SituationKey;
  }

  const tokens = expandTokens(tokenize(query));
  let best: SituationKey | "general" = "general";
  let bestScore = 0;

  Object.entries(situationMap).forEach(([key, situation]) => {
    const score = situation.tags.reduce((total, tag) => total + (tokens.includes(tag) ? 1 : 0), 0);
    if (score > bestScore) {
      best = key as SituationKey;
      bestScore = score;
    }
  });

  return best;
}

export function rankVerses(
  query: string,
  preferredSituation?: string
): Array<{ verse: GitaVerse; score: number; matchedTags: string[] }> {
  const cleanQuery = query.trim();
  const tokens = expandTokens(tokenize(cleanQuery));
  const situation = inferSituation(cleanQuery, preferredSituation);
  const situationTags = situation === "general" ? [] : situationMap[situation].tags;

  return gitaVerses
    .map((verse) => {
      const verseText = `${verse.tags.join(" ")} ${verse.meaning} ${verse.guidance} ${verse.practicalAdvice.join(" ")}`;
      const verseTokens = new Set(expandTokens(tokenize(verseText)));
      const matchedTags = Array.from(new Set([...tokens, ...situationTags])).filter(
        (token) => verseTokens.has(token) || verse.tags.includes(token)
      );
      const directScore = tokens.reduce(
        (total, token) => total + (verseTokens.has(token) || verse.tags.includes(token) ? 4 : 0),
        0
      );
      const situationScore = situationTags.reduce(
        (total, tag) => total + (verse.tags.includes(tag) ? 3 : 0),
        0
      );
      const exactSituationBoost = situation !== "general" && verse.tags.includes(situation) ? 10 : 0;
      return {
        verse,
        score: directScore + situationScore + exactSituationBoost + Math.min(matchedTags.length, 6),
        matchedTags
      };
    })
    .sort((a, b) => b.score - a.score);
}

function personalOpening(query: string): string {
  const lower = query.toLowerCase();
  if (/(happy|joy|grateful|bliss|peace|content)/.test(lower)) {
    return "Beautiful heart, hold this peace like a sacred flame. Let gratitude deepen your roots while joy expands your wings.";
  }
  if (/(sad|cry|tears|grief|heartbroken|loss)/.test(lower)) {
    return "Gentle soul, your tears are not weakness — they are love becoming visible. Let the heart feel, and then let the Divine carry what is too heavy.";
  }
  if (/(angry|anger|rage|frustrated|hate)/.test(lower)) {
    return "Brave one, fire can forge or destroy. Pause before you speak, breathe before you act. The Gita asks you to lead your inner kingdom, not be ruled by it.";
  }
  if (/(lonely|alone|abandoned|isolated)/.test(lower)) {
    return "My dear one, you are never truly alone. The Divine sits quietly in the chamber of every heart, waiting to be remembered.";
  }
  if (/(hopeless|worthless|useless|pointless|lost)/.test(lower)) {
    return "Listen — no sincere effort on the path of dharma is ever wasted. Even in your darkest moment, you are more than what you feel right now.";
  }
  if (/(exam|marks|college|study|student)/.test(lower)) {
    return "Beloved one, your worth is not the number written on a page. Let study become your offering, and let calm effort be your strength.";
  }
  if (/(job|career|interview|salary|work|startup)/.test(lower)) {
    return "Dear one, your career is a field of dharma, not a courtroom for your self-worth. Work with clarity, honesty, and brave patience.";
  }
  if (/(breakup|relationship|friend|family|love)/.test(lower)) {
    return "Gentle heart, love should open you toward truth, not make you forget the Divine seated within you. Choose compassion with self-respect.";
  }
  if (/(fear|scared|future|uncertain|loss)/.test(lower)) {
    return "My child, fear becomes smaller when you stand near truth. You do not need to see the whole road to take the next dharmic step.";
  }
  return "My dear one, I hear the weight behind your question. Come closer to your own quiet center; wisdom is already waiting there.";
}

// ─── Low-confidence threshold ─────────────────────────────────────────────────
const MIN_CONFIDENCE = 0.55;

export function createGuidance(
  query: string,
  preferredSituation?: string
): GuidanceResponse & { isLowConfidence?: boolean } {
  const cleanQuery = query.replace(/\s+/g, " ").trim().slice(0, 1200);
  const ranked = rankVerses(cleanQuery, preferredSituation);
  const top = ranked[0];
  const situation = inferSituation(cleanQuery, preferredSituation);
  const rawConfidence = Math.min(0.98, Math.max(0.4, top.score / 38));
  const confidence = rawConfidence;
  const isLowConfidence = confidence < MIN_CONFIDENCE || top.matchedTags.length === 0;
  const opening = personalOpening(cleanQuery);
  const situationLine =
    situation === "general"
      ? "Do not rush to label the entire life from one difficult moment."
      : situationMap[situation].mantra;
  const krishnaGuidance = `${opening} ${situationLine} ${top.verse.guidance}`;
  const reflectionPrompt = "What is one action I can do today with devotion, and one outcome I can lovingly release?";
  const audioScript = [
    "Om.",
    `Bhagavad Gita, chapter ${top.verse.chapter}, verse ${top.verse.verse}.`,
    top.verse.sanskrit,
    top.verse.meaning,
    "Krishna guidance for you.",
    krishnaGuidance,
    "Practical advice.",
    ...top.verse.practicalAdvice
  ].join(" ");

  return {
    query: cleanQuery,
    situation,
    verse: top.verse,
    confidence,
    krishnaGuidance,
    practicalAdvice: top.verse.practicalAdvice,
    reflectionPrompt,
    audioScript,
    matchedTags: top.matchedTags,
    isLowConfidence
  };
}

export function getDailyVerse(seedDate = new Date()): GitaVerse {
  const seed = Number(`${seedDate.getFullYear()}${seedDate.getMonth() + 1}${seedDate.getDate()}`);
  return gitaVerses[seed % gitaVerses.length];
}

export function getNextVerse(currentId?: string): GitaVerse {
  const index = gitaVerses.findIndex((verse) => verse.id === currentId);
  return gitaVerses[(index + 1 + gitaVerses.length) % gitaVerses.length];
}
