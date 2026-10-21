import React, { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import InteractiveWrapper from "../../../components/interactive/InteractiveWrapper";

const CAP = 16;
const SIZES = [256, 1024, 4096];
const LISTS = 120;
const SEARCHES = 30;

const btn = (primary = false): CSSProperties => ({
  fontFamily: "var(--font-mono)",
  fontSize: "0.75rem",
  padding: "0.35rem 0.7rem",
  borderRadius: "var(--radius-sm)",
  border: `1px solid ${primary ? "var(--accent)" : "var(--border-3)"}`,
  background: primary ? "var(--accent-subtle)" : "var(--bg-2)",
  color: primary ? "var(--accent)" : "var(--fg-1)",
  cursor: "pointer",
});

/** Keys are 1..n. next[i][l] is the next node on lane l (0 means nil). */
function build(n: number, p: number) {
  const heights = Array.from({ length: n }, () => {
    let h = 1;
    while (h < CAP && Math.random() < p) h++;
    return h;
  });
  const lanes = Math.max(...heights);
  const next: number[][] = Array.from({ length: n + 1 }, (_, i) =>
    new Array(i === 0 ? lanes : heights[i - 1]).fill(0)
  );
  const last = new Array(lanes).fill(0);
  for (let i = n; i >= 1; i--) {
    for (let l = 0; l < heights[i - 1]; l++) {
      next[i][l] = last[l];
      last[l] = i;
    }
  }
  for (let l = 0; l < lanes; l++) next[0][l] = last[l];
  const pointers = heights.reduce((a, b) => a + b, 0) / n;
  return { next, lanes, pointers };
}

function search(list: ReturnType<typeof build>, target: number) {
  let cur = 0;
  let compares = 0;
  for (let l = list.lanes - 1; l >= 0; l--) {
    for (;;) {
      const nx = list.next[cur][l];
      if (nx === 0) break;
      compares++;
      if (nx < target) cur = nx;
      else break;
    }
  }
  return compares + 1;
}

function experiment(n: number, p: number, lists: number, searches: number) {
  const avgs: number[] = [];
  let pointers = 0;
  for (let i = 0; i < lists; i++) {
    const list = build(n, p);
    pointers += list.pointers;
    let sum = 0;
    for (let j = 0; j < searches; j++) {
      sum += search(list, 1 + Math.floor(Math.random() * n));
    }
    avgs.push(sum / searches);
  }
  const mean = avgs.reduce((a, b) => a + b, 0) / lists;
  return { avgs, mean, pointers: pointers / lists };
}

const SWEEP_PS = Array.from({ length: 19 }, (_, i) => (i + 1) * 0.05);

function Lab() {
  const [n, setN] = useState(1024);
  const [p, setP] = useState(0.5);
  const [bump, setBump] = useState(0);

  // Random numbers must not be rolled during server render, or the page would
  // hydrate with different text. Compute after mount instead.
  const [result, setResult] = useState<ReturnType<typeof experiment> | null>(
    null
  );
  const [sweep, setSweep] = useState<number[] | null>(null);

  useEffect(() => {
    setResult(experiment(n, p, LISTS, SEARCHES));
  }, [n, p, bump]);

  useEffect(() => {
    setSweep(SWEEP_PS.map((q) => experiment(n, q, 15, 20).mean));
  }, [n, bump]);

  if (!result || !sweep) {
    return (
      <div
        style={{
          minHeight: 420,
          display: "grid",
          placeItems: "center",
          fontFamily: "var(--font-mono)",
          fontSize: "0.75rem",
          color: "var(--fg-2)",
        }}
      >
        Building 120 skip lists…
      </div>
    );
  }

  const min = Math.min(...result.avgs);
  const max = Math.max(...result.avgs);
  const BINS = 12;
  const span = Math.max(max - min, 1e-9);
  const bins = new Array(BINS).fill(0);
  for (const v of result.avgs) {
    bins[Math.min(BINS - 1, Math.floor(((v - min) / span) * BINS))]++;
  }
  const tallest = Math.max(...bins);

  // sweep chart geometry (log y)
  const W = 520;
  const H = 150;
  const PADL = 34;
  const PADB = 20;
  const yMin = Math.log(Math.max(1, Math.min(...sweep) * 0.8));
  const yMax = Math.log(Math.max(...sweep) * 1.1);
  const xOf = (q: number) => PADL + ((q - 0.05) / 0.9) * (W - PADL - 10);
  const yOf = (v: number) =>
    8 + (1 - (Math.log(v) - yMin) / (yMax - yMin)) * (H - PADB - 8);
  const points = SWEEP_PS.map((q, i) => `${xOf(q)},${yOf(sweep[i])}`).join(" ");
  const pc = Math.min(0.95, Math.max(0.05, p));

  const label = (v: number) => (v >= 100 ? v.toFixed(0) : v.toFixed(1));

  return (
    <div style={{ fontFamily: "var(--font-body)" }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          alignItems: "center",
          marginBottom: "0.9rem",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            color: "var(--fg-2)",
          }}
        >
          list size:
        </span>
        {SIZES.map((s) => (
          <button key={s} style={btn(s === n)} onClick={() => setN(s)}>
            {s.toLocaleString()}
          </button>
        ))}
        <button style={btn()} onClick={() => setBump((b) => b + 1)}>
          Re-roll everything
        </button>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            color: "var(--fg-1)",
            marginBottom: 4,
          }}
        >
          <span>chance a tower grows another level (the coin)</span>
          <span style={{ color: "var(--accent)" }}>p = {p.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={p}
          onChange={(e) => setP(Number(e.target.value))}
          style={{ width: "100%", accentColor: "var(--accent)" }}
          aria-label="probability of growing a level"
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontFamily: "var(--font-mono)",
            fontSize: "0.625rem",
            color: "var(--fg-3)",
          }}
        >
          <span>0 (always tails)</span>
          <span>0.5 (fair coin)</span>
          <span>1 (always heads)</span>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "0.6rem",
          marginBottom: "1rem",
        }}
      >
        {[
          { k: "average search", v: `${label(result.mean)} comparisons` },
          { k: "unluckiest list", v: `${label(max)} comparisons` },
          { k: "pointers per node", v: result.pointers.toFixed(2) },
          {
            k: "plain linked list",
            v: `~${Math.round(n / 2).toLocaleString()}`,
          },
        ].map((s) => (
          <div
            key={s.k}
            style={{
              padding: "0.55rem 0.7rem",
              background: "var(--bg-2)",
              border: "1px solid var(--border-2)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.625rem",
                color: "var(--fg-2)",
              }}
            >
              {s.k}
            </div>
            <div
              style={{
                fontSize: "1rem",
                color: "var(--fg-0)",
                fontWeight: 600,
              }}
            >
              {s.v}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.6875rem",
          color: "var(--fg-2)",
          marginBottom: 6,
        }}
      >
        {LISTS} freshly built lists, each searched {SEARCHES} times. Every bar
        counts lists with that average cost.
      </div>
      <div
        style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 90 }}
      >
        {bins.map((c, i) => (
          <div
            key={i}
            title={`${c} lists`}
            style={{
              flex: 1,
              height: `${(c / tallest) * 100}%`,
              minHeight: c ? 2 : 0,
              background: "var(--accent)",
              borderRadius: "2px 2px 0 0",
              transition: "height 250ms var(--ease-out)",
            }}
          />
        ))}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: "var(--font-mono)",
          fontSize: "0.6875rem",
          color: "var(--fg-2)",
          marginTop: 4,
        }}
      >
        <span>luckiest: {label(min)}</span>
        <span>unluckiest: {label(max)}</span>
      </div>

      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.6875rem",
          color: "var(--fg-2)",
          margin: "1.1rem 0 4px",
        }}
      >
        Average comparisons for every p (log scale). The dot is your slider.
      </div>
      <div style={{ overflowX: "auto" }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: "100%", minWidth: 380, height: "auto" }}
          role="img"
          aria-label="Average search cost against p"
        >
          <line
            x1={PADL}
            y1={H - PADB}
            x2={W - 10}
            y2={H - PADB}
            stroke="var(--border-3)"
          />
          <line
            x1={PADL}
            y1={8}
            x2={PADL}
            y2={H - PADB}
            stroke="var(--border-3)"
          />
          <polyline
            points={points}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={2}
          />
          {[0.1, 0.25, 0.5, 0.75, 0.9].map((q) => (
            <g key={q}>
              <line
                x1={xOf(q)}
                y1={H - PADB}
                x2={xOf(q)}
                y2={H - PADB + 4}
                stroke="var(--border-3)"
              />
              <text
                x={xOf(q)}
                y={H - 5}
                textAnchor="middle"
                fontSize="10"
                fontFamily="var(--font-mono)"
                fill="var(--fg-2)"
              >
                {q}
              </text>
            </g>
          ))}
          <text
            x={PADL - 4}
            y={14}
            textAnchor="end"
            fontSize="9"
            fontFamily="var(--font-mono)"
            fill="var(--fg-2)"
          >
            {label(Math.exp(yMax))}
          </text>
          <text
            x={PADL - 4}
            y={H - PADB}
            textAnchor="end"
            fontSize="9"
            fontFamily="var(--font-mono)"
            fill="var(--fg-2)"
          >
            {label(Math.exp(yMin))}
          </text>
          <circle
            cx={xOf(pc)}
            cy={yOf(sweep[Math.round(pc / 0.05) - 1])}
            r={5}
            fill="var(--bg-0)"
            stroke="var(--accent)"
            strokeWidth={2.5}
          />
        </svg>
      </div>
    </div>
  );
}

export default function LuckLab() {
  return (
    <InteractiveWrapper caption="Lists are rebuilt from scratch on every change, so the numbers wiggle a little. That wiggle is the point.">
      <Lab />
    </InteractiveWrapper>
  );
}
