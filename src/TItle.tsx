import React from "react";

/**
 * 最初に表示される
 */
const Title = () => {
  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <p
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        翼持つ言羽にてあなたに語ろう……
      </p>
    </div>
  );
};

export default Title;
