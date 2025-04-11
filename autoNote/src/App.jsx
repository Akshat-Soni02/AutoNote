import { useState } from 'react';
import './App.css';

function App() {
  const [loading, setLoading] = useState(false);

  const handleAuth = () => {
    setLoading(true);
    chrome.runtime.sendMessage({ type: "GET_ACCESS_TOKEN" }, async (res) => {
      setLoading(false);
    
      if (!res || !res.success || !res.token) {
        console.error("Auth failed or token missing:", res);
        return alert("Auth failed");
      }
    
      const accessToken = res.token;
      alert("Access Token: " + accessToken.slice(0, 20) + "...");
    });
    
  };

  return (
    <div style={{ padding: "16px", width: "300px" }}>
      <h2>AutoNote</h2>
      <button onClick={handleAuth}>
        {loading ? "Authorizing..." : "Authorize with Google"}
      </button>
    </div>
  );
}

export default App;
