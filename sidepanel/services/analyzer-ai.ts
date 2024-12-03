import {
  Finding,
  Chunk,
  RiskLevel,
  LLMFinding,
  InformationGatheringFinding,
  Confidence,
} from "./types";
import { Prompts } from "./prompts";

export class AnalyzerAI {
  private constructor() {}

  public static async analyze(chunks: Chunk[]) {
    if (chunks.length === 0) {
      return {
        analyses: {
          summary: {
            total_findings: 0,
            risk_distribution: {
              LOW: 0,
              MEDIUM: 0,
              HIGH: 0,
            },
          },
          allFindings: [],
        },
        summary: "",
        conclusion: null,
      };
    }

    const informationGatheringFindings =
      await this.getInformationGatheringFindings(chunks);

    const serviceName = await this.getServiceName(chunks[0]);

    const finalAnalysis = await this.getFinalAnalysis(
      informationGatheringFindings,
      serviceName
    );

    const conclusion = await this.getFinalConclusion(
      finalAnalysis,
      serviceName
    );

    const finalAnalysisSummary = this.mergeAnalyses(finalAnalysis);

    chrome.runtime.sendMessage({ action: "DISMISS_BADGE" });

    return {
      analyses: finalAnalysisSummary,
      summary: "",
      conclusion,
      serviceName,
    };
  }

  private static async runPrompt(prompt: string, params: any) {
    const TIMEOUT_MS = 200000; // 200 second timeout

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(
          new Error("Prompt execution timed out after " + TIMEOUT_MS + "ms")
        );
      }, TIMEOUT_MS);
    });

    const promptPromise = async () => {
      let session: any;
      try {
        // @ts-ignore
        session = await chrome.aiOriginTrial.languageModel.create(params);
        const result = await session.prompt(prompt);
        return result;
      } catch (e) {
        console.error(e);
        throw e;
      } finally {
        if (session) {
          session.destroy();
        }
      }
    };

    // Race between the prompt execution and timeout
    try {
      return await Promise.race([promptPromise(), timeoutPromise]);
    } catch (error) {
      console.error("Prompt execution failed:", error);
      throw error;
    }
  }

  private static parseMarkdownTable(markdownText: string) {
    // Regular expression to match markdown tables
    const tableRegex = /\|(.+)\|[\r\n]+\|([-|\s]+)\|[\r\n]+((.*\|[\r\n]*)+)/g;

    // Function to clean cell content
    const cleanCell = (cell: string) => {
      return cell
        .trim()
        .replace(/^\*\*(.*)\*\*$/, "$1") // Remove bold markers
        .replace(/<br>/g, "\n") // Convert HTML line breaks to newlines
        .trim();
    };

    // Function to parse a single table
    function parseTable(tableMatch: string) {
      // Split the table into lines
      const lines = tableMatch.split("\n").filter((line) => line.trim());

      // Parse headers
      const headers = lines[0]
        .split("|")
        .filter((cell) => cell.trim())
        .map(cleanCell);

      // Skip the separator line (line with |---|---|)

      // Parse rows
      const rows = lines
        .slice(2)
        .filter((line) => line.trim() && line.includes("|"))
        .map((line) => {
          const cells = line
            .split("|")
            .filter((cell) => cell.trim())
            .map(cleanCell);

          // Create object with header keys and cell values
          return headers.reduce((obj: any, header: string, index: number) => {
            obj[header] = cells[index] || "";
            return obj;
          }, {});
        });

      return rows;
    }

    // Find all tables in the markdown text
    const tables: any[] = [];
    let match: RegExpExecArray | null;
    while ((match = tableRegex.exec(markdownText)) !== null) {
      tables.push(parseTable(match[0]));
    }

    // If only one table was found, return just that table's data
    // Otherwise return array of all tables
    return tables.length === 1 ? tables[0] : tables;
  }

  private static transformLLMResult(llmFinding: LLMFinding) {
    return {
      finding: llmFinding.finding,
      reasoning: llmFinding.reasoning,
      riskLevel: llmFinding.risk_level.toUpperCase() as RiskLevel,
      category: llmFinding.category,
      confidence: llmFinding.confidence.toUpperCase() as Confidence,
    };
  }

  private static async getFinalConclusion(
    findings: Finding[],
    serviceName: string
  ) {
    const systemPrompt = Prompts.SYSTEM_PROMPT_CONCLUSION;
    const conclusionPrompt = `
    Service/Company: ${serviceName}
    Text to analyze:
    """
    ${findings
      .map(
        (f) =>
          `- ${f.category} | Risk: ${f.riskLevel} | Finding: ${f.finding} | Reasoning: ${f.reasoning}`
      )
      .join("\n")}
    """
    `;

    const markdown = await this.runPrompt(conclusionPrompt, {
      systemPrompt: systemPrompt,
      temperature: 0,
      topK: 10,
    });

    const result = this.parseMarkdownTable(markdown) as {
      priority: string;
      conclusion: string;
      action: string;
    }[];

    return result[0];
  }

  private static transformFindingsStringIntoArray(findings: string) {
    try {
      return JSON.parse(findings);
    } catch (error) {
      console.error("Error transforming findings string into array:", error);
      return [];
    }
  }

  private static groupInformationGatheringFindingsByCategory(
    findings: InformationGatheringFinding[]
  ) {
    const grouped: { [key: string]: string[] } = {};
    findings.forEach((f) => {
      const findingsArray = this.transformFindingsStringIntoArray(f.findings);

      if (!findingsArray.length) {
        return;
      }

      grouped[f.category] = grouped[f.category] || [];
      grouped[f.category] = [...grouped[f.category], ...findingsArray];
    });
    return grouped;
  }

  private static async getFinalAnalysis(
    findings: InformationGatheringFinding[],
    serviceName: string
  ) {
    try {
      const groupedFindings = Object.entries(
        this.groupInformationGatheringFindingsByCategory(findings)
      );

      const analysisResults = await this.promiseAllWithLimit(
        groupedFindings,
        async ([category, findings]: [string, string[]]) => {
          try {
            const systemPrompt =
              Prompts.getCategoryFinalAnalysisSystemPrompt(category);
            const analysisPrompt = `
              Service/Company: ${serviceName}
              Findings to analyze:
              ${findings.map((finding) => `- ${finding}`).join("\n")}
            `;

            const markdown = await this.runPrompt(analysisPrompt, {
              systemPrompt: systemPrompt,
              temperature: 0,
              topK: 10,
            });

            const result = this.parseMarkdownTable(markdown) as LLMFinding[];
            return result.length === 0
              ? null
              : this.transformLLMResult(result[0]);
          } catch (error) {
            console.error(`🚫 Error analyzing category ${category}:`, error);
            return null;
          }
        }
      );

      return analysisResults.filter((f) => f !== null) as Finding[];
    } catch (error) {
      console.error("Error getting final analysis:", error);
      throw error;
    }
  }

  private static async promiseAllWithLimit(
    items: any[],
    promiseFn: (item: any) => Promise<any>,
    limit = 4
  ) {
    const results = [];
    const executing = new Set();

    for (const [index, item] of items.entries()) {
      const promise = promiseFn(item).then((result) => {
        executing.delete(promise);
        return result;
      });
      executing.add(promise);
      results[index] = promise;

      if (executing.size >= limit) {
        await Promise.race(executing);
      }
    }

    return Promise.all(results);
  }

  private static async getServiceName(firstChunk: Chunk) {
    const systemPrompt = Prompts.SYSTEM_PROMPT_SERVICE_NAME;
    const serviceNamePrompt = `
    Text to analyze:
    ${firstChunk.content}
    `;

    const markdown = await this.runPrompt(serviceNamePrompt, {
      systemPrompt: systemPrompt,
      temperature: 0,
      topK: 10,
    });

    const result = this.parseMarkdownTable(markdown) as {
      service_name: string;
    }[];
    return result[0].service_name;
  }

  private static async getInformationGatheringFindings(chunks: Chunk[]) {
    try {
      const systemPrompt = Prompts.SYSTEM_PROMPT_INFORMATION_GATHERING;
      const findings: InformationGatheringFinding[] = [];
      for (const chunk of chunks) {
        try {
          const analysisPrompt = `
        This section is titled "${chunk.title}".
        Text to analyze:
        ${chunk.content}
        `;

          const markdown = await this.runPrompt(analysisPrompt, {
            systemPrompt: systemPrompt,
            temperature: 0,
            topK: 10,
          });

          const result = this.parseMarkdownTable(
            markdown
          ) as InformationGatheringFinding[];
          findings.push(...result);
        } catch (error) {
          console.error(`🚫 Error analyzing chunk ${chunk.title}:`, error);
        }
      }

      return findings;
    } catch (error) {
      console.error("Error getting information gathering findings:", error);
      throw error;
    }
  }

  private static getRiskLevel(riskLevel: RiskLevel) {
    const levels: { [key in RiskLevel]: number } = {
      LOW: 1,
      MEDIUM: 2,
      HIGH: 3,
    };
    return levels[riskLevel];
  }

  private static calculateRiskDistribution(findings: Finding[]) {
    const distribution: { [key in RiskLevel]: number } = {
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
    };

    findings.forEach((finding) => {
      distribution[finding.riskLevel] =
        (distribution[finding.riskLevel] || 0) + 1;
    });

    return distribution;
  }

  private static mergeAnalyses(findings: Finding[]) {
    return {
      summary: {
        total_findings: findings.length,
        risk_distribution: this.calculateRiskDistribution(findings),
      },
      allFindings: findings,
    };
  }
}
