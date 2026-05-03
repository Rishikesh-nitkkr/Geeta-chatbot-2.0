export type SituationKey = "stress" | "fear" | "overthinking" | "failure" | "discipline";

export type GitaVerse = {
  id: string;
  chapter: number;
  verse: string;
  chapterTitle: string;
  sanskrit: string;
  transliteration: string;
  meaning: string;
  guidance: string;
  practicalAdvice: string[];
  tags: string[];
  quote: string;
};

export type GuidanceResponse = {
  query: string;
  situation: SituationKey | "general";
  verse: GitaVerse;
  confidence: number;
  krishnaGuidance: string;
  practicalAdvice: string[];
  reflectionPrompt: string;
  audioScript: string;
  matchedTags: string[];
};

export type Chapter = {
  number: number;
  title: string;
  summary: string;
  verses: GitaVerse[];
};

export type GrowthEntry = {
  id: string;
  date: string;
  moodBefore: number;
  moodAfter: number;
  meditationMinutes: number;
  reflection: string;
  lesson: string;
};
