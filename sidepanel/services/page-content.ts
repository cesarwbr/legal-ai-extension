export async function getPageContent() {
  const storage = await chrome.storage.local.get("policyUrl");
  const response = await fetch(storage.policyUrl);
  const html = await response.text();

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const content = getMainContent(doc);
  return content;
}

export async function getPageUrl() {
  const policyUrl = await chrome.storage.local.get("policyUrl");
  return policyUrl.policyUrl;
}

function getMainContent(doc: Document) {
  // Function to calculate text-to-html ratio for an element
  function getTextToHtmlRatio(element: HTMLElement) {
    const text = element.innerText.trim();
    const html = element.innerHTML.trim();
    if (html.length === 0) return 0;
    return text.length / html.length;
  }

  function cleanText(text: string) {
    // remove all links
    text = text.replace(/https?:\/\/\S+/g, "");

    // remove all images
    text = text.replace(/<img\b[^<>]*>/gi, "");

    return text.trim();
  }

  // Try to find main content using common selectors
  const commonSelectors = [
    "main",
    "article",
    '[role="main"]',
    "#main-content",
    "#content",
    ".main-content",
    ".content",
    ".post-content",
    ".article-content",
  ];

  // First try: Look for semantic elements
  const mainContent = [];
  for (const selector of commonSelectors) {
    const element = doc.querySelector(selector);
    if (element) {
      mainContent.push(cleanText((element as HTMLElement).innerHTML));
    }
  }

  // Second try: Find the element with the most content
  let bestElement = null;
  let bestScore = 0;
  let maxTextRatio = 0;

  // Get all major container elements
  const containers = doc.querySelectorAll("div, section, article");

  const content: string[] = [];
  containers.forEach((container) => {
    // Skip if it's likely a header, footer, or sidebar
    if (
      container.tagName === "HEADER" ||
      container.tagName === "FOOTER" ||
      container.id.toLowerCase().includes("header") ||
      container.id.toLowerCase().includes("footer") ||
      container.id.toLowerCase().includes("sidebar") ||
      container.className.toLowerCase().includes("header") ||
      container.className.toLowerCase().includes("footer") ||
      container.className.toLowerCase().includes("sidebar") ||
      container.className.toLowerCase().includes("menu") ||
      container.className.toLowerCase().includes("nav")
    ) {
      return;
    }

    // const score = getContentScore(container as HTMLElement);
    const textRatio = getTextToHtmlRatio(container as HTMLElement);

    if (textRatio > 0.2) {
      content.push(cleanText((container as HTMLElement).innerText));
    }
  });

  // Fallback: Get body content excluding obvious non-content elements
  const body = doc.body;

  // Remove common non-content elements before getting text
  const elementsToRemove: string[] = [
    "header",
    "footer",
    "nav",
    "aside",
    ".header",
    ".footer",
    ".nav",
    ".sidebar",
    ".menu",
    ".advertisement",
    ".ads",
    "#header",
    "#footer",
    "#nav",
    "#sidebar",
    "#menu",
    "script",
    "style",
  ];

  // Create a clone of the body to avoid modifying the actual page
  const bodyClone = body.cloneNode(true);

  // Remove non-content elements from the clone
  elementsToRemove.forEach((selector) => {
    const elements = (bodyClone as HTMLElement).querySelectorAll(selector);
    elements.forEach((element) => (element as HTMLElement).remove());
  });

  // Return the cleaned body text
  return cleanText((bodyClone as HTMLElement).innerHTML);
}
