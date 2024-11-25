console.log("Sidepanel loaded");

async function runPrompt(prompt: string, params: any) {
  try {
    // @ts-ignore
    const session = await window.ai.languageModel.create(params);
    return session.prompt(prompt);
  } catch (e) {
    console.log("Prompt failed");
    console.error(e);
    console.log("Prompt:", prompt);
    throw e;
  }
}

function parseMarkdownTable(markdownText: string) {
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

const SYSTEM_PROMPT = `
You are an expert privacy lawyer with over 15 years of experience reviewing privacy policies. Analyze the provided privacy policy and list key points users should know. For each point, provide a title, a one-line explanation and rate its privacy impact (Low/Medium/High) in markdown table format with the columns: 'title', 'explanation' and 'impact'
`;

async function main() {
  const markdown = await runPrompt(
    `
  Transfer of Personal Data Between Countries
  
  Apple products and offerings connect you to the world. To make that possible, your personal data may be transferred to or accessed by entities around the world, including Apple-affiliated companies, to perform processing activities such as those described in this Privacy Policy in connection with your use of our products and services. Apple complies with laws on the transfer of personal data between countries to help ensure your data is protected, wherever it may be.
  
  The Apple entity that controls your personal data may differ depending on where you live. For example, Apple Store information is controlled by individual retail entities in each country and Apple Media Services-related personal data may be controlled by various Apple entities as reflected in the terms of service. If you do not reside in the U.S., your personal data may be processed by Apple Inc. and other Apple-affiliated companies on behalf of the Apple entity controlling personal data for your jurisdiction. For example, Imagery and associated data collected by Apple around the world to improve Apple Maps and to support our Look Around feature is transferred to Apple Inc. in California.
  
  Personal data relating to individuals in the European Economic Area, the United Kingdom, and Switzerland is controlled by Apple Distribution International Limited in Ireland. Apple’s international transfer of personal data collected in the European Economic Area, the United Kingdom, and Switzerland is governed by Standard Contractual Clauses. If you have questions or would like a copy of Apple’s Standard Contractual Clauses, you can contact us at apple.com/legal/privacy/contact.
  
  Personal data collected by Apple or an Apple-affiliated company worldwide is generally stored by Apple Inc. in the United States. Regardless of where your personal data is stored, Apple maintains the same high level of protection and safeguarding measures.
  
  Apple’s privacy practices, as described in this Privacy Policy, comply with the Global Cross-Border Privacy Rules (CBPRs) System and the Global Privacy Recognition for Processors (PRP) System. For more information about the Global CBPR and PRP Systems, visit Global CBPR Forum. To view our certifications, visit CBPR System Compliance Directory. For more information about the scope of our participation, or to submit a privacy inquiry through BBB National Programs, our Accountability Agent, visit:
  
  Cross-Border Privacy Rules Program
  
  Privacy Recognition for Processors Program
  
  Personal data relating to individuals in the People’s Republic of China may be processed by Apple in countries outside of the People’s Republic of China, such as Apple Inc. in the United States or Apple Distribution International Limited in the Republic of Ireland. Where this occurs, it will be done in compliance with local laws, including the Personal Information Protection Law. For the purposes of processing set out in this Privacy Policy, Apple may also transfer such personal data to third-party service providers, who may in turn store or transfer the data outside of the People’s Republic of China. For more information, visit China Mainland Privacy Disclosures.`,
    {
      systemPrompt: SYSTEM_PROMPT,
      temperature: 0,
      topK: 3,
    }
  );

  const result = parseMarkdownTable(markdown);
  console.log(JSON.stringify(result, null, 2));
}

main();
