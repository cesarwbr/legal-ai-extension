import { Lexer, Token } from "marked";
import { encode } from "gpt-tokenizer";
import { Chunk, Section } from "./types";
import { Prompts } from "./prompts";

export class Chunker {
  private constructor() {}

  public static chunk(markdown: string) {
    const sections = this.parseMarkdownStructure(markdown);
    const chunks = this.combineTokenThreshold(sections);

    return chunks;
  }

  private static parseMarkdownStructure(markdownText: string) {
    const lexer = new Lexer();
    const tokens = lexer.lex(markdownText);

    // Group content by sections based on headers
    const sections: Section[] = [];
    let currentSection: Section = {
      title: "Introduction",
      level: 0,
      content: "",
      tokens: [],
    };

    for (const token of tokens) {
      if (token.type === "heading") {
        // Save previous section if it has content
        if (currentSection.content.trim() || currentSection.tokens.length > 0) {
          sections.push({ ...currentSection });
        }

        // Start new section
        currentSection = {
          title: token.text,
          level: token.depth,
          content: "",
          tokens: [],
        };
      } else {
        // Add token to current section
        currentSection.tokens.push(token);

        // Convert token to text
        if (token.type === "paragraph") {
          currentSection.content += token.text + "\n\n";
        } else if (token.type === "list") {
          const listItems = token.items
            .map((item: any) => `• ${item.text}`)
            .join("\n");
          currentSection.content += listItems + "\n\n";
        } else if (token.type === "text") {
          currentSection.content += token.text + "\n";
        }
      }
    }

    // Add the last section
    if (currentSection.content.trim() || currentSection.tokens.length > 0) {
      sections.push(currentSection);
    }

    return sections;
  }

  private static estimateTokens(text: string) {
    return encode(text).length;
  }

  private static splitLargeSection(section: Section, maxTokens: number) {
    const paragraphs = section.content.split("\n\n");
    const chunks = [];
    let currentChunk = {
      title: section.title,
      content: "",
      sections: [],
    };
    let currentTokens = this.estimateTokens(section.title);

    for (const paragraph of paragraphs) {
      const paragraphTokens = this.estimateTokens(paragraph);

      if (currentTokens + paragraphTokens > maxTokens) {
        if (currentChunk.content) {
          chunks.push({ ...currentChunk });
          currentChunk = {
            title: `${section.title} (continued)`,
            content: paragraph,
            sections: [],
          };
          currentTokens =
            this.estimateTokens(currentChunk.title) + paragraphTokens;
        }
      } else {
        currentChunk.content +=
          (currentChunk.content ? "\n\n" : "") + paragraph;
        currentTokens += paragraphTokens;
      }
    }

    if (currentChunk.content) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  private static combineTokenThreshold(sections: Section[]) {
    const chunks: Chunk[] = [];
    let currentChunk: Chunk = {
      title: "",
      content: "",
      sections: [],
    };
    let currentTokens = 0;

    // Maximum tokens for a chunk, leaving room for prompt and response
    const MAX_CHUNK_TOKENS =
      Prompts.MAX_TOKENS_PER_REQUEST -
      Prompts.RESERVED_ANSWER_TOKENS -
      Prompts.systemTokensLength -
      Prompts.analysisPromptWithTitleTokensLength;

    for (const section of sections) {
      const sectionText = `${section.title}\n${section.content}`;
      const sectionTokens = this.estimateTokens(sectionText);

      // If this single section is too large, split it further
      if (sectionTokens > MAX_CHUNK_TOKENS) {
        // If we have accumulated content, save it as a chunk
        if (currentTokens > 0) {
          chunks.push({ ...currentChunk });
          currentChunk = {
            title: "",
            content: "",
            sections: [],
          };
          currentTokens = 0;
        }

        // Split large section into smaller chunks
        const splitChunks = this.splitLargeSection(section, MAX_CHUNK_TOKENS);
        chunks.push(...splitChunks);
        continue;
      }

      // If adding this section would exceed the token limit
      if (currentTokens + sectionTokens > MAX_CHUNK_TOKENS) {
        // Save current chunk
        chunks.push({ ...currentChunk });
        // Start new chunk with this section
        currentChunk = {
          title: section.title,
          content: section.content,
          sections: [section],
        };
        currentTokens = sectionTokens;
      } else {
        // Add section to current chunk
        if (!currentChunk.title) {
          currentChunk.title = section.title;
        }
        currentChunk.content += `\n\n${section.content}`;
        currentChunk.sections.push(section);
        currentTokens += sectionTokens;
      }
    }

    // Add the last chunk if it has content
    if (currentTokens > 0) {
      chunks.push(currentChunk);
    }

    return chunks;
  }
}
