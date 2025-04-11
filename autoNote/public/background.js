chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "GET_ACCESS_TOKEN") {
      chrome.identity.getAuthToken({ interactive: true }, function (token) {
        if (chrome.runtime.lastError || !token) {
          console.error("Auth failed:", chrome.runtime.lastError);
          sendResponse({ success: false });
        } else {
          console.log("✅ Access Token:", token);
          sendResponse({ success: true, token });
        }
      });
  
      return true; // Keep the message channel open for async sendResponse
    }
  });  