import TurndownService from "turndown";

function HtmlToMarkdownConverter(html: string) {
  // Initialize turndown service with custom options
  const turndownService = new TurndownService({
    headingStyle: "atx",
    hr: "---",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
    emDelimiter: "_",
  });

  // Custom rules for better conversion
  turndownService.addRule("strikethrough", {
    filter: ["del", "s"],
    replacement: function (content) {
      return "~~" + content + "~~";
    },
  });

  const markdown = turndownService.turndown(html);
  return cleanMarkdown(markdown);
}

function cleanMarkdown(markdown: string) {
  // Remove HTML tags and their content
  let cleaned = markdown.replace(/<[^>]*>/g, "");

  // Remove the closing bracket patterns that appear at the end of links
  cleaned = cleaned.replace(/\]\( *\)/g, "");

  // Remove links with only HTML content
  cleaned = cleaned.replace(/\[[^\]]*\]\([^)]*<\/.*?\)/g, "");

  // Clean up any remaining square brackets with empty or whitespace content
  cleaned = cleaned.replace(/\[\s*\]/g, "");

  // Remove any remaining square brackets around text
  cleaned = cleaned.replace(/\[(.*?)\]/g, "$1");

  // remove images
  cleaned = cleaned.replace(/!\[.*?\]\((.*?)\)/g, "");

  // remove links
  cleaned = cleaned.replace(/\[(.*?)\]\((.*?)\)/g, "$1");

  return cleaned.trim();
}

export default HtmlToMarkdownConverter;
