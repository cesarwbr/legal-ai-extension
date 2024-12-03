import browser from "webextension-polyfill";
import Analytics from "./scripts/google-analytics";

// chrome.sidePanel
//   .setPanelBehavior({ openPanelOnActionClick: true })
//   .catch((error) => console.error(error));

type Message =
  | {
      action: "POLICY_FOUND";
      value: string;
    }
  | {
      action: "NO_POLICY_FOUND";
      value: null;
    }
  | {
      action: "DISMISS_BADGE";
      value: null;
    };

type ResponseCallback = (data: any) => void;

async function handleMessage(
  { action, value }: Message,
  response: ResponseCallback
) {
  console.log("Received message:", action, value);
  if (action === "POLICY_FOUND") {
    await showBadge(value);
    response({ message: "success" });
  } else if (action === "NO_POLICY_FOUND") {
    currentPolicyUrl = null;
    await hideBadge();
    response({ message: "success" });
  } else if (action === "DISMISS_BADGE") {
    await hideBadge();
    response({ message: "success" });
  } else {
    response({ data: null, error: "Unknown action" });
  }
}

let currentPolicyUrl: string | null = null;
async function showBadge(url: string) {
  console.log("showBadge", url);
  currentPolicyUrl = url;
  await chrome.storage.local.set({ policyUrl: url });
  // Enable the extension icon
  chrome.action.setBadgeText({ text: "READ" });
  chrome.action.setBadgeBackgroundColor({ color: "#4CAF50" });
}

async function hideBadge() {
  chrome.action.setBadgeText({ text: "" });
}

// chrome.contextMenus.onClicked.addListener(async (info, tab) => {
//   if (info.menuItemId === "openSidePanel") {
//     await hideBadge();
//     // This will open the panel in all the pages on the current window.
//     await analyzePolicyContent(currentPolicyUrl ?? "", tab as chrome.tabs.Tab);
//   }
// });

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  console.log("Extension icon clicked");
  console.log("Current policy URL:", currentPolicyUrl);
  if (currentPolicyUrl) {
    await hideBadge();
    await analyzePolicyContent(currentPolicyUrl, tab);
  }
});

async function analyzePolicyContent(url: string, tab: chrome.tabs.Tab) {
  try {
    const response = await fetch(url);
    const html = await response.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const textContent = doc.body?.textContent?.trim();

    console.log("textContent", textContent);

    await chrome.storage.local.set({
      policyContent: textContent,
      policyUrl: url,
    });

    // This will now work because it's in response to clicking the extension icon
    // Open side panel
    if (chrome.sidePanel && chrome.sidePanel.open) {
      await chrome.sidePanel.open({ windowId: tab.windowId });
    }
  } catch (error) {
    console.error("Error analyzing policy:", error);
  }
}

// @ts-ignore
browser.runtime.onMessage.addListener((msg, _sender, response) => {
  try {
    handleMessage(msg as Message, response);
  } catch (e) {
    console.info(`Cannot handle the ${msg} message`);
  }

  return true;
});

// Analytics
addEventListener("unhandledrejection", async (event) => {
  Analytics.fireErrorEvent(event.reason);
});

browser.runtime.onInstalled.addListener(() => {
  console.log("Extension installed/updated");
  Analytics.fireEvent("install");

  // chrome.contextMenus.create({
  //   id: "openSidePanel",
  //   title: "Open side panel",
  //   contexts: ["all"],
  // });
});
