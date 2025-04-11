let lastPathId = null;

function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const interval = setInterval(() => {
        const element = document.querySelector(selector);
        if (element) {
          clearInterval(interval);
          resolve(element);
        } else if (Date.now() - start > timeout) {
          clearInterval(interval);
          reject("Element not found: " + selector);
        }
      }, 500);
    });
  }
  
  async function onNewVideo() {
    try {
      console.log("🔁 New video detected, waiting for transcript...");
  
      const el = await waitForElement("ql-youtube-video", 7000);
      const transcriptRaw = el.getAttribute("transcript");
  
      if (!transcriptRaw) {
        console.warn("Transcript attribute not found.");
        return;
      }
  
      const transcriptJson = JSON.parse(transcriptRaw);
      const textOnly = transcriptJson.map((entry) => entry.text).filter(Boolean);
      console.log(textOnly);
      const paragraph = textOnly.join('@ '); // Join to format into bullets
  
      // Get title of the video
      const heading = document.querySelector("h1")?.innerText || "New Video Section";
      const documentId = "1nOvhpEmfBL97OpM05j24Ofn1NJDrcc8SvvHUXluyceY"; // You can store this in extension storage or backend
  
      // 🔑 Get access token
      chrome.runtime.sendMessage({ type: "GET_ACCESS_TOKEN" }, async (res) => {
        if (!res?.success || !res.token) {
          return console.error("Auth failed");
        }
  
        const accessToken = res.token;
        console.log(`having access token now making backend request`, accessToken);
  
        // 📤 Send to backend
        const response = await fetch("http://localhost:3001/write-section", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            documentId,
            heading,
            paragraph,
          }),
        });
  
        const data = await response.json();
        if (response.ok) {
          console.log("✅ Section written:", heading);
        } else {
          console.error("❌ Failed to write section:", data.message);
        }
      });
    } catch (err) {
      console.error("❌ Error handling new video:", err);
    }
  }
  
  const observer = new MutationObserver(() => {
    const match = location.href.match(/cloudskillsboost\.google\/paths\/(\d+)/);
    if (match) {
      const currentPathId = match[1];
      if (currentPathId !== lastPathId) {
        lastPathId = currentPathId;
        console.log("🎯 New video path detected:", currentPathId);
        onNewVideo();
      }
    }
  });
  
  observer.observe(document, { subtree: true, childList: true });