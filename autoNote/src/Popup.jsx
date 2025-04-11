import React from "react";

const Popup = () => {
  return (
    <div style={{ padding: "16px", width: "300px" }}>
      <h2>AutoNote</h2>
      <button onClick={() => alert("Auth flow coming soon!")}>Authorize with Google</button>
    </div>
  );
};

export default Popup;
