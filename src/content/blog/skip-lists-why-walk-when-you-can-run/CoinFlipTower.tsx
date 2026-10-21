import React, { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import InteractiveWrapper from "../../../components/interactive/InteractiveWrapper";

const CAP = 8;

const btn = (primary = false, disabled = false): CSSProperties => ({
  fontFamily: "var(--font-mono)",
  fontSize: "0.75rem",
  padding: "0.45rem 0.8rem",
  borderRadius: "var(--radius-sm)",
  border: `1px solid ${primary ? "var(--accent)" : "var(--border-3)"}`,
  background: primary ? "var(--accent-subtle)" : "var(--bg-2)",
  color: primary ? "var(--accent)" : "var(--fg-1)",
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.45 : 1,
});

function Demo() {
  const [height, setHeight] = useState(1);
  const [flips, setFlips] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [counts, setCounts] = useState<number[]>(Array(CAP).fill(0));

  useEffect(() => {
    if (!spinning) return;
    const t = setTimeout(() => {
      const heads = Math.random() < 0.5;
      setSpinning(false);
      setFlips((f) => [...f, heads ? "H" : "T"]);
      if (heads) {
        const next = height + 1;
        setHeight(next);
        if (next >= CAP) setDone(true);
      } else {
        setDone(true);
      }
    }, 550);
    return () => clearTimeout(t);
  }, [spinning, height]);

  const newTower = () => {
    setHeight(1);
    setFlips([]);
    setDone(false);
  };

  const build = (n: number) => {
    setCounts((c) => {
      const out = [...c];
      for (let i = 0; i < n; i++) {
        let h = 1;
        while (h < CAP && Math.random() < 0.5) h++;
        out[h - 1]++;
      }
      return out;
    });
  };

  const total = counts.reduce((a, b) => a + b, 0);
  const last = flips[flips.length - 1];

  return (
    <div style={{ fontFamily: "var(--font-body)" }}>
      <style>{`
        @keyframes sl-pop { from { transform: scaleY(0.2); opacity: 0; } to { transform: none; opacity: 1; } }
        @keyframes sl-spin { from { transform: rotateY(0deg); } to { transform: rotateY(900deg); } }
      `}</style>

      <div
        style={{
          display: "flex",
          gap: "1.5rem",
          alignItems: "flex-end",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column-reverse",
            gap: 4,
            width: 56,
            minHeight: CAP * 26,
            justifyContent: "flex-start",
          }}
          aria-label={`tower of height ${height}`}
        >
          {Array.from({ length: height }).map((_, i) => (
            <div
              key={i}
              style={{
                height: 22,
                borderRadius: 4,
                background:
                  i === height - 1 && done
                    ? "var(--accent-glow)"
                    : "var(--bg-3)",
                border: `1px solid ${i === height - 1 ? "var(--accent)" : "var(--border-3)"}`,
                transformOrigin: "bottom",
                animation: "sl-pop 300ms var(--ease-out)",
              }}
            />
          ))}
        </div>

        <div style={{ flex: 1, minWidth: 220 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.9rem",
              marginBottom: "0.75rem",
            }}
          >
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                fontSize: "1.2rem",
                background: "var(--bg-3)",
                border: "2px solid var(--accent)",
                color: "var(--accent)",
                animation: spinning ? "sl-spin 550ms linear" : undefined,
              }}
            >
              {spinning ? "?" : (last ?? "·")}
            </div>
            <div
              style={{
                fontSize: "0.9rem",
                lineHeight: 1.5,
                color: "var(--fg-1)",
              }}
            >
              {done
                ? height >= CAP
                  ? `Tails never came, but the cap stops us at ${CAP}. Tower height: ${height}.`
                  : `Tails! Tower height: ${height}.`
                : flips.length === 0
                  ? "Every node starts with height 1. Flip to see if it grows."
                  : "Heads! Grow one level, flip again."}
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button
              style={btn(true, spinning || done)}
              disabled={spinning || done}
              onClick={() => setSpinning(true)}
            >
              Flip a coin
            </button>
            <button
              style={btn(false, spinning)}
              disabled={spinning}
              onClick={newTower}
            >
              New tower
            </button>
          </div>
          {flips.length > 0 && (
            <div
              style={{
                marginTop: "0.6rem",
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                color: "var(--fg-2)",
              }}
            >
              flips: {flips.join(" ")}
            </div>
          )}
        </div>
      </div>

      <hr
        style={{
          border: 0,
          borderTop: "1px solid var(--border)",
          margin: "1.25rem 0",
        }}
      />

      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          flexWrap: "wrap",
          marginBottom: "0.9rem",
        }}
      >
        <button style={btn(true)} onClick={() => build(10)}>
          +10 towers
        </button>
        <button style={btn(true)} onClick={() => build(1000)}>
          +1,000 towers
        </button>
        <button style={btn()} onClick={() => setCounts(Array(CAP).fill(0))}>
          Clear
        </button>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            color: "var(--fg-2)",
            alignSelf: "center",
          }}
        >
          {total.toLocaleString()} towers built
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {counts.map((c, i) => {
          const expected =
            i < CAP - 1 ? 100 / 2 ** (i + 1) : 100 / 2 ** (CAP - 1);
          const actual = total ? (c / total) * 100 : 0;
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontFamily: "var(--font-mono)",
                fontSize: "0.6875rem",
                color: "var(--fg-2)",
              }}
            >
              <span style={{ width: 52 }}>height {i + 1}</span>
              <div
                style={{
                  position: "relative",
                  flex: 1,
                  height: 14,
                  background: "var(--bg-3)",
                  borderRadius: 3,
                }}
              >
                <div
                  style={{
                    width: `${actual * 2}%`,
                    height: "100%",
                    background: "var(--accent)",
                    borderRadius: 3,
                    transition: "width 300ms",
                  }}
                />
                <div
                  title="expected"
                  style={{
                    position: "absolute",
                    left: `${expected * 2}%`,
                    top: -2,
                    bottom: -2,
                    width: 2,
                    background: "var(--teal)",
                  }}
                />
              </div>
              <span style={{ width: 92, textAlign: "right" }}>
                {actual.toFixed(1)}%{" "}
                <span style={{ color: "var(--fg-3)" }}>
                  / {expected.toFixed(1)}%
                </span>
              </span>
            </div>
          );
        })}
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.6875rem",
          color: "var(--fg-3)",
          marginTop: "0.6rem",
        }}
      >
        green bar = what you got · teal tick = what the math says (50%, 25%,
        12.5%, …)
      </div>
    </div>
  );
}

export default function CoinFlipTower() {
  return (
    <InteractiveWrapper caption="Tower heights are a coin-flip game. Halve the odds each level.">
      <Demo />
    </InteractiveWrapper>
  );
}
