import { encode } from "gpt-tokenizer";
import { Chunk, InformationGatheringFinding } from "./types";

export class Prompts {
  public static readonly MAX_TOKENS_PER_REQUEST = 2600;
  public static readonly RESERVED_ANSWER_TOKENS = 1500;

  public static readonly ANALYSIS_CATEGORIES = [
    {
      name: "data_collection",
      description: "What personal data is collected",
      riskGuidelines: `HIGH: Extensive collection of sensitive data
MEDIUM: Standard collection for functionality
LOW: Minimal data collection, clear purpose`,
    },
    {
      name: "data_sharing",
      description:
        "Who gets access to user data, including explicit mentions of not selling data",
      riskGuidelines: `HIGH: Shares with many third parties or unclear sharing
MEDIUM: Limited sharing with clear purposes
LOW: No sharing or only essential sharing with clear limits`,
    },
    {
      name: "third_party_services",
      description:
        "Which external services process your data and if their policies apply",
      riskGuidelines: `HIGH: Many third parties, no policy links
MEDIUM: Few third parties with policies
LOW: Minimal third-party use`,
    },
    {
      name: "user_rights",
      description: "How users can control their data",
      riskGuidelines: `HIGH: Few or no user rights
MEDIUM: Standard rights without clear process
LOW: Comprehensive rights with clear process`,
    },
    {
      name: "contact_&_support",
      description: "How users can reach out about privacy concerns",
      riskGuidelines: `HIGH: No contact method
MEDIUM: Single contact method
LOW: Multiple contact methods with clear process`,
    },
    {
      name: "security",
      description: "Measures to protect user data",
      riskGuidelines: `HIGH: No security measures mentioned
MEDIUM: Relies on third-party security only
LOW: Explicit security measures described`,
    },
    {
      name: "policy_updates",
      description: "How changes are communicated",
      riskGuidelines: `HIGH: No update process
MEDIUM: Updates mentioned without notification process
LOW: Clear update process with notification method`,
    },
  ];

  // return `You are an expert privacy lawyer with over 15 years of experience reviewing privacy policies.
  // Analyze the provided section of a privacy policy and list key points users should know.
  // Categories to analyze: ${this.ANALYSIS_CATEGORIES.join(", ")}
  // For each relevant finding, provide a title, a one-line justification (explanation), assign a risk level (Low/Medium/High), and category (category_name) in markdown table format with the columns: 'title', 'justification', 'risk_level', and 'category'.
  // `;

  public static readonly SYSTEM_PROMPT = `You are a privacy policy analyzer. Your task is to identify and explain the most critical aspects of privacy policies in simple terms.
  Focus on these categories: ${this.ANALYSIS_CATEGORIES.join(", ")}.
  Return your analysis in a markdown table with columns:
  - category: ${this.ANALYSIS_CATEGORIES.map(
    (c) => `${c.name}: (${c.description})`
  ).join(", ")}
  - finding: Bullet-point list of specific findings
  - risk_level: LOW/MEDIUM/HIGH
  - reasoning: Clear explanation of privacy implications and why the risk level was chosen

Risk Level Guidelines:
${this.ANALYSIS_CATEGORIES.map((c) => `${c.name}: ${c.riskGuidelines}`).join(
  "\n"
)}

  Example:
  | category | finding | risk_level | reasoning |
  |---|---|---|---|
  | data_sharing | Shares with YouTube, Arena Chat | HIGH | Multiple sharing partners means higher breach risk and less user control;

Avoid repeating third-party mentions across categories unless specifically relevant.
Ensure reasoning is provided for all categories and matches risk level.
Keep language simple and focused on user impact.
`;

  public static readonly SYSTEM_PROMPT_INFORMATION_GATHERING = `You are analyzing a chunk of a privacy policy. You task is to extract information withou making final assessments.
Extract any relevant information for these categories:
${this.ANALYSIS_CATEGORIES.map((c) => `${c.name}: (${c.description})`).join(
  ", "
)}

Return your findings in a markdown table with columns:
- category: ${this.ANALYSIS_CATEGORIES.map(
    (c) => `${c.name}: (${c.description})`
  ).join(", ")}
- finding: What the policy says

Example:
| category | findings |
|---|---|
| data_collection | ["List of specific findings"] |

Do not make assumptions about missing information. Only report what is explicitly stated in this chunk.
`;

  public static readonly SYSTEM_PROMPT_FINAL_ANALYSIS = `You are analyzing the complete findings from a privacy policy. Based on the collected information, provide a final analysis of the privacy policy.

Return your analysis in a markdown table with columns:
- category: ${this.ANALYSIS_CATEGORIES.map(
    (c) => `${c.name}: (${c.description})`
  ).join(", ")}
- finding: Bullet-point list of specific findings
- risk_level: LOW/MEDIUM/HIGH
- reasoning: Clear explanation of privacy implications and why the risk level was chosen
- confidence: COMPLETE/PARTIAL

Example:
| category | finding | risk_level | reasoning | confidence |
|---|---|---|---|---|
| data_collection | ["List of specific findings"] | HIGH | Explanation of privacy implications | COMPLETE |

Risk Level Guidelines:
${this.ANALYSIS_CATEGORIES.map((c) => `${c.name}: ${c.riskGuidelines}`).join(
  "\n"
)}

Important Rules:
1. Mark categories with incomplete information as PARTIAL.
2. Only mark categories as COMPLETE when you have evidence of full section coverage.
3. If a finding could be contradicted by unseen sections, note this in reasoning.
4. Default to MEDIUM risk when information is partial.
5. Keep language simple and focused on user impact.
`;

  public static readonly SYSTEM_PROMPT_SERVICE_NAME = `You are an expert privacy policy analyzer. Your task is to identify and return the name of the company or service that the privacy policy belongs to.
  Return the name of the company or service in a markdown table with columns:
  - service_name: The name of the company or service

  Example:
  | service_name |
  |---|
  | Arena Chat |  
  `;

  public static readonly SYSTEM_PROMPT_CONCLUSION = `You are an expert privacy policy analyzer tasked with generating a clear, actionable conclusion based on previous privacy policy analysis findings.
Your task is to synthesize the key findings into a single, focused recommendation for end users. The conclusion should:

Highlight the single most important privacy concern or action item
Use plain, non-technical language
Be specific and actionable
Not exceed 2 sentences

Return the conclusion in a markdown table with these columns:

- priority: CRITICAL/HIGH/MEDIUM/LOW
- conclusion: The key takeaway in clear, simple terms in markdown format
- action: One specific step the user should take in markdown format

Example:
| priority | conclusion | action |
|---|---|---|
| HIGH | This app shares your location data with numerous third-party advertisers. | Turn off location sharing in app settings or only enable while using the app. |

Note: Focus only on the most critical finding. If multiple serious issues exist, prioritize those with the greatest potential privacy impact or those that users can actually act upon.
  `;

  public static get systemTokensLength() {
    return Math.max(
      encode(this.SYSTEM_PROMPT).length,
      encode(this.SYSTEM_PROMPT_INFORMATION_GATHERING).length,
      encode(this.SYSTEM_PROMPT_FINAL_ANALYSIS).length,
      encode(this.SYSTEM_PROMPT_CONCLUSION).length
    );
  }

  public static getAnalysisPrompt(chunk: Chunk) {
    return `This section is titled "${chunk.title}".
    Text to analyze:
    ${chunk.content}
    `;
  }

  public static getCategoryFinalAnalysisSystemPrompt(category: string) {
    const analysisCategory = this.ANALYSIS_CATEGORIES.find(
      (c) => c.name === category
    )!;
    return `You are a privacy policy analyzer expert in analyzing ${analysisCategory}. Based on the collected information, provide a final analysis of the privacy policy.

Return your analysis in a markdown table in one row with columns:
- category: ${category}
- finding: Bullet-point list of specific findings
- risk_level: LOW/MEDIUM/HIGH
- reasoning: Clear explanation of privacy implications and why the risk level was chosen
- confidence: COMPLETE/PARTIAL

Example:
| category | finding | risk_level | reasoning | confidence |
|---|---|---|---|---|
| data_collection | ["List of specific findings"] | HIGH | Explanation of privacy implications | COMPLETE |

Risk Level Guidelines:
${analysisCategory.riskGuidelines}

Important Rules:
1. Mark categories with incomplete information as PARTIAL.
2. Only mark categories as COMPLETE when you have evidence of full section coverage.
3. If a finding could be contradicted by unseen sections, note this in reasoning.
4. Keep language simple and focused on user impact.
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
