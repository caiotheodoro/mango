import { describe, it, expect } from "vitest";
import {
  SYSTEM_PROMPT,
  KNOWLEDGE_NOT_FOUND_RESPONSE,
  OFF_TOPIC_RESPONSE,
} from "../prompts";

describe("System Prompts", () => {
  describe("SYSTEM_PROMPT", () => {
    it("should include mango expert persona", () => {
      expect(SYSTEM_PROMPT).toContain("expert on Brazilian mangos");
    });

    it("should include language instruction", () => {
      expect(SYSTEM_PROMPT).toContain("SAME LANGUAGE the user writes in");
    });

    it("should include tool usage rules", () => {
      expect(SYSTEM_PROMPT).toContain("searchKnowledge");
      expect(SYSTEM_PROMPT).toContain("getMangoImages");
    });

    it("should include citation instructions", () => {
      expect(SYSTEM_PROMPT).toContain("cite sources");
      expect(SYSTEM_PROMPT).toContain("ONLY cite sources that were returned by searchKnowledge");
    });

    it("should define scope boundaries", () => {
      expect(SYSTEM_PROMPT).toContain("SCOPE");
      expect(SYSTEM_PROMPT).toContain("OUT OF SCOPE");
    });

    it("should mention Brazilian mango varieties", () => {
      expect(SYSTEM_PROMPT).toContain("Tommy Atkins");
      expect(SYSTEM_PROMPT).toContain("Palmer");
    });
  });

  describe("KNOWLEDGE_NOT_FOUND_RESPONSE", () => {
    it("should explain knowledge base limitations", () => {
      expect(KNOWLEDGE_NOT_FOUND_RESPONSE).toContain(
        "don't have specific data"
      );
    });

    it("should list available topics", () => {
      expect(KNOWLEDGE_NOT_FOUND_RESPONSE).toContain("Mango varieties");
      expect(KNOWLEDGE_NOT_FOUND_RESPONSE).toContain("Growing regions");
    });
  });

  describe("OFF_TOPIC_RESPONSE", () => {
    it("should politely redirect to mangos", () => {
      expect(OFF_TOPIC_RESPONSE).toContain("specialized in Brazilian mangos");
    });

    it("should suggest alternative topics", () => {
      expect(OFF_TOPIC_RESPONSE).toContain("mango varieties");
    });
  });
});
