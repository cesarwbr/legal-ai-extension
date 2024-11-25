import { encode } from "gpt-tokenizer";
import { Finding, Chunk, RiskLevel, LLMFinding, RISK_LEVELS } from "./types";
import { Prompts } from "./prompts";

export class AnalyzerAI {
  private constructor() {}

  public static async analyze(chunks: Chunk[]) {
    const analyses: { findings: Finding[] }[] = [];
    for (const chunk of chunks) {
      try {
        console.log("Analyzing chunk:", chunk.title);
        const analysis = await this.analyzeChunk(chunk);
        console.log("🎉 Analysis:", analysis);
        analyses.push(analysis);
      } catch (error) {
        console.error("🚫 Error analyzing chunk:", error);
      }
    }

    // const analyses = await Promise.all(
    //   chunks.map((chunk) => this.analyzeChunk(chunk))
    // );

    console.log("Analyses:", analyses);

    const finalAnalysis = this.mergeAnalyses(analyses);
    return finalAnalysis;
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
        session = await window.ai.languageModel.create(params);
        session.addEventListener("contextoverflow", () => {
          console.log("Context overflow!");
        });
        console.log(
          `System prompt tokens 2: ${await session.countPromptTokens(
            params.systemPrompt
          )}`
        );
        console.log(
          `Prompting tokens: ${await session.countPromptTokens(prompt)}`
        );
        console.log("Prompting...", "tokens left:", session);
        const result = await session.prompt(prompt);
        console.log(
          `Result tokens: ${await session.countPromptTokens(result)}`
        );
        console.log("Prompted!", "tokens left:", session);
        return result;
      } catch (e) {
        console.log("Prompt failed");
        console.error(e);
        console.log("Prompt:", prompt);
        throw e;
      } finally {
        if (session) {
          console.log("⛓️‍💥 Destroying session");
          session.destroy();
          console.log("⛓️‍💥 Session destroyed");
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

  private static transformLLMResult(llmFindings: LLMFinding[]) {
    return llmFindings
      .filter((llmFinding) => {
        return (
          Prompts.ANALYSIS_CATEGORIES.includes(llmFinding.category) &&
          RISK_LEVELS.includes(llmFinding.risk_level.toUpperCase() as RiskLevel)
        );
      })
      .map((llmFinding) => ({
        title: llmFinding.title,
        finding: llmFinding.finding,
        riskExplanation: llmFinding.why_risky,
        riskLevel: llmFinding.risk_level.toUpperCase() as RiskLevel,
        category: llmFinding.category,
      }));
  }

  private static async analyzeChunk(
    chunk: Chunk
  ): Promise<{ findings: Finding[] }> {
    try {
      const systemPrompt = Prompts.SYSTEM_PROMPT;

      const analysisPrompt = `
      This section is titled "${chunk.title}".
      Text to analyze:
      ${chunk.content}
      `;

      console.log(`System prompt tokens: ${encode(systemPrompt).length}`);

      const markdown = await this.runPrompt(analysisPrompt, {
        systemPrompt: systemPrompt,
        temperature: 0,
        topK: 10,
      });

      const result = this.parseMarkdownTable(markdown) as LLMFinding[];

      return { findings: this.transformLLMResult(result) };
    } catch (error) {
      console.error("Error analyzing chunk:", error);
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

  private static mergeAnalyses(analyses: { findings: Finding[] }[]) {
    // Combine findings from multiple chunks and remove duplicates
    const allFindings = analyses.flatMap((analysis) => analysis.findings);
    const uniqueFindings = new Map<string, Finding>();

    for (const finding of allFindings) {
      const key = `${finding.category}-${finding.title}`; // Create unique key
      const existingFinding = uniqueFindings.get(key);

      if (
        !existingFinding ||
        this.getRiskLevel(finding.riskLevel) >
          this.getRiskLevel(existingFinding.riskLevel)
      ) {
        uniqueFindings.set(key, finding);
      }
    }

    // Group findings by category
    const groupedFindings: { [key: string]: Finding[] } = {};
    Prompts.ANALYSIS_CATEGORIES.forEach((category) => {
      groupedFindings[category] = [];
    });

    for (const finding of uniqueFindings.values()) {
      if (groupedFindings[finding.category]) {
        groupedFindings[finding.category].push(finding);
      }
    }

    // Sort findings by risk level within each category
    Object.values(groupedFindings).forEach((findings) => {
      findings.sort(
        (a, b) =>
          this.getRiskLevel(b.riskLevel) - this.getRiskLevel(a.riskLevel)
      );
    });

    return {
      summary: {
        total_findings: uniqueFindings.size,
        risk_distribution: this.calculateRiskDistribution(
          Array.from(uniqueFindings.values())
        ),
      },
      findings_by_category: groupedFindings,
    };
  }
}
