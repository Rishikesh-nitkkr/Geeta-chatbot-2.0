import { describe, expect, it } from "vitest";
import { createGuidance, inferSituation, rankVerses } from "./guidance";

describe("guidance engine", () => {
  it("matches exam stress with stress/action verses", () => {
    const result = createGuidance("I am stressed about my college exam marks and cannot sleep");

    expect(result.situation).toBe("stress");
    expect(result.verse.tags).toEqual(expect.arrayContaining(["stress"]));
    expect(result.audioScript).toContain("Bhagavad Gita");
  });

  it("honors explicit situation selection", () => {
    expect(inferSituation("My mind is distracted", "discipline")).toBe("discipline");
  });

  it("ranks overthinking toward mind practice verses", () => {
    const [top] = rankVerses("I keep overthinking every decision and my mind will not stop");

    expect(top.verse.tags.some((tag) => ["overthinking", "mind", "confusion"].includes(tag))).toBe(true);
    expect(top.score).toBeGreaterThan(0);
  });

  it("keeps generated guidance bounded and personal", () => {
    const result = createGuidance("I failed an interview and feel useless");

    expect(result.krishnaGuidance.length).toBeGreaterThan(120);
    expect(result.practicalAdvice.length).toBeGreaterThanOrEqual(3);
    expect(result.reflectionPrompt).toContain("today");
  });
});
