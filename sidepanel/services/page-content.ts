export async function getPageContent() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab || !tab.id) {
    throw new Error("No active tab found");
  }

  const result = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: getMainContent,
  });

  if (!result || !result[0] || !result[0].result) {
    throw new Error("No result found");
  }

  return result[0].result as string;
}

function getMainContent() {
  // Function to calculate text-to-html ratio for an element
  function getTextToHtmlRatio(element: HTMLElement) {
    const text = element.innerText.trim();
    const html = element.innerHTML.trim();
    if (html.length === 0) return 0;
    return text.length / html.length;
  }

  // Function to count paragraphs and meaningful content
  // function getContentScore(element: HTMLElement) {
  //   const paragraphs = element.getElementsByTagName("p").length;
  //   const images = element.getElementsByTagName("img").length;
  //   const lists =
  //     element.getElementsByTagName("ul").length +
  //     element.getElementsByTagName("ol").length;
  //   return paragraphs + images + lists * 2;
  // }

  function cleanText(text: string) {
    // Remove tabs and multiple newlines
    // text = text.replace(/[\t\n]+/g, "\n");
    // Remove multiple newlines
    // text = text.replace(/\n\s+/g, "\n");

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
    const element = document.querySelector(selector);
    if (element) {
      mainContent.push(cleanText((element as HTMLElement).innerHTML));
    }
  }

  console.log("Main content:", mainContent);

  // if (mainContent.length > 0) {
  //   return mainContent.join("\n");
  // }

  // Second try: Find the element with the most content
  let bestElement = null;
  let bestScore = 0;
  let maxTextRatio = 0;

  // Get all major container elements
  const containers = document.querySelectorAll("div, section, article");

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

    // if (
    //   score > bestScore ||
    //   (score === bestScore && textRatio > maxTextRatio)
    // ) {
    //   bestScore = score;
    //   maxTextRatio = textRatio;
    //   bestElement = container;
    // }
    if (textRatio > 0.2) {
      content.push(cleanText((container as HTMLElement).innerText));
    }
  });

  // if (content.length > 0) {
  //   return content.join("\n");
  // }

  console.log("Content:", content);

  // // If we found a good content container, return its text
  // if (bestElement && bestScore > 2) {
  //   return cleanText((bestElement as HTMLElement).innerHTML);
  // }

  // Fallback: Get body content excluding obvious non-content elements
  const body = document.body;

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
