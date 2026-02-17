import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  extractUrls,
  validateCitations,
  logCitationWarnings,
} from "../validation";

describe("extractUrls", () => {
  it("returns empty array when no URLs in text", () => {
    expect(extractUrls("no urls here")).toEqual([]);
  });

  it("extracts a single URL", () => {
    expect(extractUrls("See https://example.com for more")).toEqual([
      "https://example.com",
    ]);
  });

  it("deduplicates URLs", () => {
    expect(
      extractUrls("Link https://example.com and again https://example.com")
    ).toEqual(["https://example.com"]);
  });

  it("strips trailing punctuation from URLs", () => {
    expect(extractUrls("Source: https://example.com/page.)")).toEqual([
      "https://example.com/page",
    ]);
  });

  it("extracts multiple URLs", () => {
    const text = "First https://a.com and second https://b.com";
    expect(extractUrls(text)).toEqual(["https://a.com", "https://b.com"]);
  });
});

describe("validateCitations", () => {
  it("is valid when no URLs in response", () => {
    const result = validateCitations("No citations", []);
    expect(result.valid).toBe(true);
    expect(result.citedUrls).toEqual([]);
    expect(result.unknownUrls).toEqual([]);
  });

  it("is valid when all cited URLs come from result.results (searchWeb shape)", () => {
    const toolResults = [
      {
        success: true,
        results: [
          { content: "x", sourceUrl: "https://web.com/1" },
          { content: "y", sourceUrl: "https://web.com/2" },
        ],
      },
    ];
    const result = validateCitations(
      "According to [this](https://web.com/1) and [that](https://web.com/2).",
      toolResults
    );
    expect(result.valid).toBe(true);
    expect(result.knownUrls).toContain("https://web.com/1");
    expect(result.knownUrls).toContain("https://web.com/2");
    expect(result.unknownUrls).toEqual([]);
  });

  it("is valid when URLs come from result.output.results (nested shape)", () => {
    const toolResults = [
      { output: { results: [{ sourceUrl: "https://kb.example.com" }] } },
    ];
    const result = validateCitations(
      "Source: [KB](https://kb.example.com)",
      toolResults
    );
    expect(result.valid).toBe(true);
    expect(result.unknownUrls).toEqual([]);
  });

  it("is valid when URL comes from direct result.sourceUrl", () => {
    const toolResults = [{ sourceUrl: "https://direct.com" }];
    const result = validateCitations(
      "See [here](https://direct.com)",
      toolResults
    );
    expect(result.valid).toBe(true);
    expect(result.unknownUrls).toEqual([]);
  });

  it("is invalid when response cites a URL not in tool results", () => {
    const result = validateCitations(
      "See [fake](https://invented.com) for more.",
      []
    );
    expect(result.valid).toBe(false);
    expect(result.citedUrls).toContain("https://invented.com");
    expect(result.unknownUrls).toContain("https://invented.com");
  });

  it("ignores null or undefined sourceUrl in results", () => {
    const toolResults = [
      { results: [{ sourceUrl: "https://ok.com" }, { sourceUrl: null }, {}] },
    ];
    const result = validateCitations("Only [this](https://ok.com)", toolResults);
    expect(result.valid).toBe(true);
  });
});

describe("logCitationWarnings", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("does nothing when validation result is valid", () => {
    logCitationWarnings({
      valid: true,
      citedUrls: [],
      knownUrls: [],
      unknownUrls: [],
    });
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("logs warning when invalid and no context", () => {
    logCitationWarnings({
      valid: false,
      citedUrls: ["https://bad.com"],
      knownUrls: [],
      unknownUrls: ["https://bad.com"],
    });
    expect(console.warn).toHaveBeenCalled();
  });

  it("includes context in warning when provided", () => {
    logCitationWarnings(
      {
        valid: false,
        citedUrls: ["https://bad.com"],
        knownUrls: [],
        unknownUrls: ["https://bad.com"],
      },
      "Session abc"
    );
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("Session abc")
    );
  });
});
