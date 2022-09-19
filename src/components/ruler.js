import React, { useEffect, useRef, useState } from "react";

function Ruler({ mean, score }) {
  const min = Math.min(mean, score);
  const max = Math.max(mean, score);
  return (
    <div>
      <span
        style={{
          marginLeft: `${score * 100}%`,
          fontSize: 13,
          color: "#f2f2f2",
        }}
      >
        Score({parseFloat(score).toFixed(2)})
      </span>

      <div className="ruler">
        {[...Array(100)].map((e, i) => (
          <div
            key={i}
            className={
              i / 100 >= min && i / 100 <= max
                ? "ruler-rule ruler-bg"
                : "ruler-rule"
            }
          ></div>
        ))}
      </div>
      <div
        style={{
          marginTop: 5,
          marginLeft: `${mean * 100}%`,
          fontSize: 13,
          color: "#f2f2f2",
        }}
      >
        Mean({parseFloat(mean).toFixed(2)})
      </div>
    </div>
  );
}

export default Ruler;
