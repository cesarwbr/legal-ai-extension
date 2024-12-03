function findPrivacyPolicyLink() {
  const possibleLinks = document.querySelectorAll("a");
  const privacyLinks = Array.from(possibleLinks).filter((link) => {
    const text = link.textContent?.toLowerCase();
    return text?.includes("privacy") || text?.includes("policy");
  });

  let currentPageWithPrivacyPolicy: string | null = null;

  if (privacyLinks.length === 0) {
    // check if there is a text that container "privacy policy"
    const text = document.body.textContent?.toLowerCase();
    if (text?.includes("privacy policy")) {
      currentPageWithPrivacyPolicy = window.location.href;
    }
  }

  let privacyPolicyLink: string | null = null;
  if (privacyLinks.length > 0) {
    privacyPolicyLink = privacyLinks[0].href;
  } else if (currentPageWithPrivacyPolicy) {
    privacyPolicyLink = currentPageWithPrivacyPolicy;
  }

  if (privacyPolicyLink) {
    chrome.runtime.sendMessage({
      action: "POLICY_FOUND",
      value: privacyPolicyLink,
    });
  } else {
    chrome.runtime.sendMessage({
      action: "NO_POLICY_FOUND",
    });
  }
}

findPrivacyPolicyLink();
