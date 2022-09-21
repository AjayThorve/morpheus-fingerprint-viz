import React, { useEffect, useRef, useState } from "react";
import styles from "../styles/components/ruler.module.css";

function Ruler({ mean, score }) {
  const min = Math.min(mean, score);
  const max = Math.max(mean, score);
  return (
    <div>
      <span
        className={styles.rulerLabel}
        style={{
          marginLeft: `${score * 100}%`,
        }}
      >
        Score({parseFloat(score).toFixed(2)})
      </span>

      <div className={styles.ruler}>
        {[...Array(100)].map((e, i) => (
          <div
            key={i}
            className={
              i / 100 >= min && i / 100 <= max
                ? `${styles.rulerRule} ${styles.rulerBG}`
                : styles.rulerRule
            }
          ></div>
        ))}
      </div>
      <div
        className={styles.rulerLabel}
        style={{
          marginLeft: `${mean * 100}%`,
        }}
      >
        Mean({parseFloat(mean).toFixed(2)})
      </div>
    </div>
  );
}

export default Ruler;
