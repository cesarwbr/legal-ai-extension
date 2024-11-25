import { encode } from "gpt-tokenizer";
import { Chunk } from "./types";

export class Prompts {
  public static readonly MAX_TOKENS_PER_REQUEST = 4144;
  public static readonly RESERVED_ANSWER_TOKENS = 1500;

  public static readonly ANALYSIS_CATEGORIES = [
    "data_collection",
    "data_sharing",
    "user_rights",
    "security_measures",
    "retention_policy",
    "third_party_access",
    "cookies_tracking",
    "childrens_privacy",
    "international_transfers",
    "policy_changes",
  ];

  // return `You are an expert privacy lawyer with over 15 years of experience reviewing privacy policies.
  // Analyze the provided section of a privacy policy and list key points users should know.
  // Categories to analyze: ${this.ANALYSIS_CATEGORIES.join(", ")}
  // For each relevant finding, provide a title, a one-line justification (explanation), assign a risk level (Low/Medium/High), and category (category_name) in markdown table format with the columns: 'title', 'justification', 'risk_level', and 'category'.
  // `;

  public static readonly SYSTEM_PROMPT = `As a privacy lawyer, analyze this privacy policy section in a markdown table with columns:
- title: Brief heading
- finding: What the policy says
- risk_level: LOW/MEDIUM/HIGH
- why_risky: Explain WHY this risk level was chosen, focusing on user impact
- category: ${this.ANALYSIS_CATEGORIES.join(", ")}

Example:
| title | finding | risk_level | why_risky | category |
| Third Party Sharing | Shares with YouTube, Arena Chat | HIGH | Multiple sharing partners means higher breach risk and less user control | data_sharing |`;

  public static get systemTokensLength() {
    return encode(this.SYSTEM_PROMPT).length;
  }

  public static getAnalysisPrompt(chunk: Chunk) {
    return `This section is titled "${chunk.title}".
    Text to analyze:
    ${chunk.content}
    `;
  }

  public static get analysisPromptWithTitleTokensLength() {
    return encode(
      this.getAnalysisPrompt({
        title: "Example Title With Spaces And Punctuation !@#$%^&*()",
        content: "",
        sections: [],
      })
    ).length;
  }
}
