import browser from "webextension-polyfill";
import Analytics from "./scripts/google-analytics";

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

type Message = {
  action: "someAction";
  value: null;
};

type ResponseCallback = (data: any) => void;

async function handleMessage(
  { action, value }: Message,
  response: ResponseCallback
) {
  if (action === "someAction") {
    response({ message: "success" });
  } else {
    response({ data: null, error: "Unknown action" });
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
  Analytics.fireEvent("install");
});
