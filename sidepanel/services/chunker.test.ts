import { describe, it, expect } from "vitest";
import { Chunker } from "./chunker";
import { Chunk, Section } from "./types";

describe("Chunker", () => {
  describe("chunk", () => {
    it("should split markdown into appropriate chunks", () => {
      const markdown = `
# Privacy Policy

## Data Collection
We collect your email and name.

## Data Usage
We use your data for:
- Authentication
- Communication
- Service improvement

## Security
We protect your data using encryption.
`;

      const chunks = Chunker.chunk(markdown);

      expect(chunks).toHaveLength(3);
      expect(chunks[0].title).toBe("Data Collection");
      expect(chunks[1].title).toBe("Data Usage");
      expect(chunks[2].title).toBe("Security");
    });

    it("should handle empty markdown", () => {
      const chunks = Chunker.chunk("");
      expect(chunks).toHaveLength(0);
    });

    it("should combine small sections into single chunk", () => {
      const markdown = `
## Small Section 1
Brief content.

## Small Section 2
Another brief section.
`;
      const chunks = Chunker.chunk(markdown);
      expect(chunks).toHaveLength(1);
      expect(chunks[0].sections).toHaveLength(2);
    });

    it("should split large sections into multiple chunks", () => {
      // Create a very large section that exceeds token limit
      const largeContent = "Lorem ipsum ".repeat(1000);
      const markdown = `
## Large Section
${largeContent}
`;
      const chunks = Chunker.chunk(markdown);
      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks[1].title).toContain("(continued)");
    });
  });

  describe("parseMarkdownStructure", () => {
    it("should correctly parse markdown headers and content", () => {
      const markdown = `
# Main Title

## Section 1
Content 1

## Section 2
- List item 1
- List item 2

### Subsection
Nested content
`;
      const sections = (Chunker as any).parseMarkdownStructure(markdown);

      expect(sections).toHaveLength(4); // Including Introduction
      expect(sections[1].title).toBe("Section 1");
      expect(sections[1].level).toBe(2);
      expect(sections[2].title).toBe("Section 2");
      expect(sections[3].title).toBe("Subsection");
      expect(sections[3].level).toBe(3);
    });
  });

  describe("estimateTokens", () => {
    it("should return reasonable token count estimates", () => {
      const text = "This is a test sentence.";
      const tokens = (Chunker as any).estimateTokens(text);
      expect(tokens).toBeGreaterThan(0);
      expect(tokens).toBeLessThan(text.length);
    });
  });

  describe("combineTokenThreshold", () => {
    it("should combine sections while respecting token limits", () => {
      const sections: Section[] = [
        {
          title: "Section 1",
          level: 2,
          content: "Small content 1",
          tokens: [],
        },
        {
          title: "Section 2",
          level: 2,
          content: "Small content 2",
          tokens: [],
        },
      ];

      const chunks = (Chunker as any).combineTokenThreshold(sections);
      expect(chunks).toHaveLength(1);
      expect(chunks[0].sections).toHaveLength(2);
    });

    it("should create new chunk when token limit exceeded", () => {
      const largeContent = "Lorem ipsum ".repeat(500);
      const sections: Section[] = [
        {
          title: "Large Section 1",
          level: 2,
          content: largeContent,
          tokens: [],
        },
        {
          title: "Large Section 2",
          level: 2,
          content: largeContent,
          tokens: [],
        },
      ];

      const chunks = (Chunker as any).combineTokenThreshold(sections);
      expect(chunks.length).toBeGreaterThan(1);
    });
  });
});
