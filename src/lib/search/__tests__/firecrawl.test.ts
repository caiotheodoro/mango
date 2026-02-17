import { describe, it, expect, vi, beforeEach } from "vitest";
import Firecrawl from "@mendable/firecrawl-js";
import { searchWeb } from "../firecrawl";

vi.mock("@mendable/firecrawl-js", () => ({
  default: vi.fn().mockImplementation(function MockFirecrawl() {
    return { search: vi.fn().mockResolvedValue({}) };
  }),
}));

describe("searchWeb", () => {
  const originalEnv = process.env.FIRECRAWL_API_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.FIRECRAWL_API_KEY = originalEnv;
  });

  it("returns empty array when FIRECRAWL_API_KEY is not set", async () => {
    process.env.FIRECRAWL_API_KEY = "";
    const results = await searchWeb("mango varieties Brazil");
    expect(results).toEqual([]);
  });

  it("returns empty array when FIRECRAWL_API_KEY is undefined", async () => {
    delete process.env.FIRECRAWL_API_KEY;
    const results = await searchWeb("mango");
    expect(results).toEqual([]);
  });

 

  it("returns normalized results when API key is set and client returns data", async () => {
    process.env.FIRECRAWL_API_KEY = "test-key";
    vi.mocked(Firecrawl).mockImplementation(function MockFirecrawl() {
      return {
        search: vi.fn().mockResolvedValue({
          web: [
            { url: "https://example.com/1", title: "Page 1", description: "Snippet 1" },
            { url: "https://example.com/2", title: "Page 2", markdown: "Full content 2" },
          ],
        }),
      };
    });

    const results = await searchWeb("Brazilian mango", { limit: 3 });
    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({
      title: "Page 1",
      url: "https://example.com/1",
      content: "Snippet 1",
    });
    expect(results[1]).toEqual({
      title: "Page 2",
      url: "https://example.com/2",
      content: "Full content 2",
    });
  });

  it("normalizes items with only metadata.url and metadata.title", async () => {
    process.env.FIRECRAWL_API_KEY = "test-key";
    vi.mocked(Firecrawl).mockImplementation(function MockFirecrawl() {
      return {
        search: vi.fn().mockResolvedValue({
          web: [
            { metadata: { url: "https://meta.example.com", title: "Meta Title" }, description: "Snippet" },
          ],
        }),
      };
    });
    const results = await searchWeb("query");
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({
      title: "Meta Title",
      url: "https://meta.example.com",
      content: "Snippet",
    });
  });

  it("excludes items with no URL from scraping (no fallback)", async () => {
    process.env.FIRECRAWL_API_KEY = "test-key";
    vi.mocked(Firecrawl).mockImplementation(function MockFirecrawl() {
      return {
        search: vi.fn().mockResolvedValue({
          web: [{ description: "Only description" }],
        }),
      };
    });
    const results = await searchWeb("query");
    expect(results).toEqual([]);
  });

  it("caps limit at 10 when options.limit exceeds 10", async () => {
    process.env.FIRECRAWL_API_KEY = "test-key";
    const searchFn = vi.fn().mockResolvedValue({ web: [] });
    vi.mocked(Firecrawl).mockImplementation(function MockFirecrawl() {
      return { search: searchFn };
    });
    await searchWeb("query", { limit: 15 });
    expect(searchFn).toHaveBeenCalledWith("query", expect.objectContaining({ limit: 10 }));
  });

  it("returns empty array when client returns no web array", async () => {
    process.env.FIRECRAWL_API_KEY = "test-key";
    vi.mocked(Firecrawl).mockImplementation(function MockFirecrawl() {
      return { search: vi.fn().mockResolvedValue({}) };
    });

    const results = await searchWeb("mango");
    expect(results).toEqual([]);
  });

  it("returns empty array on client error", async () => {
    process.env.FIRECRAWL_API_KEY = "test-key";
    vi.mocked(Firecrawl).mockImplementation(function MockFirecrawl() {
      return { search: vi.fn().mockRejectedValue(new Error("API error")) };
    });

    const results = await searchWeb("mango");
    expect(results).toEqual([]);
  });
});
