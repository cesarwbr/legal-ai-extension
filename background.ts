import browser from "webextension-polyfill";
import Analytics from "./scripts/google-analytics";

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

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
  currentPolicyUrl = url;
  await chrome.storage.local.set({ policyUrl: url });
  // Enable the extension icon
  chrome.action.setBadgeText({ text: "READ" });
  chrome.action.setBadgeBackgroundColor({ color: "#4CAF50" });
}

async function hideBadge() {
  chrome.action.setBadgeText({ text: "" });
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
  Analytics.fireEvent("install");
});
