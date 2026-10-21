import React, { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import InteractiveWrapper from "../../../components/interactive/InteractiveWrapper";

const SIZES = [8, 32, 128, 512, 2048];
const CAP = 16;

const btn = (primary = false): CSSProperties => ({
  fontFamily: "var(--font-mono)",
  fontSize: "0.75rem",
  padding: "0.45rem 0.8rem",
  borderRadius: "var(--radius-sm)",
  border: `1px solid ${primary ? "var(--accent)" : "var(--border-3)"}`,
  background: primary ? "var(--accent-subtle)" : "var(--bg-2)",
  color: primary ? "var(--accent)" : "var(--fg-1)",
  cursor: "pointer",
});

/** Keys are 1..n. next[i][l] is the next node on lane l (0 means nil). */
function build(n: number) {
  const heights = Array.from({ length: n }, () => {
    let h = 1;
    while (h < CAP && Math.random() < 0.5) h++;
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
  return { next, lanes };
}

function skipSearch(list: ReturnType<typeof build>, target: number) {
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
  return compares + 1; // final equality check on the bottom lane
}

function Race() {
  const [n, setN] = useState(128);
  const [seedBump, setSeedBump] = useState(0);
  const list = useMemo(() => build(n), [n, seedBump]);
  const [last, setLast] = useState<{
    t: number;
    ll: number;
    sl: number;
  } | null>(null);
  const [totals, setTotals] = useState({ runs: 0, ll: 0, sl: 0 });

  const reset = (size: number) => {
    setN(size);
    setLast(null);
    setTotals({ runs: 0, ll: 0, sl: 0 });
  };

  const go = (times: number) => {
    let ll = 0;
    let sl = 0;
    let lt = 0;
    let ls = 0;
    let target = 1;
    for (let i = 0; i < times; i++) {
      target = 1 + Math.floor(Math.random() * n);
      lt = target; // walking a plain linked list: `target` comparisons
      ls = skipSearch(list, target);
      ll += lt;
      sl += ls;
    }
    setLast({ t: target, ll: lt, sl: ls });
    setTotals((tt) => ({
      runs: tt.runs + times,
      ll: tt.ll + ll,
      sl: tt.sl + sl,
    }));
  };

  const avgLL = totals.runs ? totals.ll / totals.runs : 0;
  const avgSL = totals.runs ? totals.sl / totals.runs : 0;
  const pct = (v: number) => `${Math.max(0.6, (v / n) * 100)}%`;

  const Bar = ({
    label,
    value,
    color,
  }: {
    label: string;
    value: number;
    color: string;
  }) => (
    <div style={{ marginBottom: 10 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: "var(--font-mono)",
          fontSize: "0.6875rem",
          color: "var(--fg-2)",
          marginBottom: 3,
        }}
      >
        <span>{label}</span>
        <span>
          {value ? `${Math.round(value * 10) / 10} comparisons` : "—"}
        </span>
      </div>
      <div style={{ height: 12, borderRadius: 3, background: "var(--bg-3)" }}>
        <div
          style={{
            width: value ? pct(value) : 0,
            height: "100%",
            borderRadius: 3,
            background: color,
            transition: "width 350ms var(--ease-out)",
          }}
        />
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: "var(--font-body)" }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.4rem",
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
          <button
            key={s}
            style={{ ...btn(s === n), padding: "0.3rem 0.6rem" }}
            onClick={() => reset(s)}
          >
            {s.toLocaleString()}
          </button>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          flexWrap: "wrap",
          marginBottom: "1rem",
        }}
      >
        <button style={btn(true)} onClick={() => go(1)}>
          Search a random key
        </button>
        <button style={btn(true)} onClick={() => go(100)}>
          Run 100 searches
        </button>
        <button
          style={btn()}
          onClick={() => {
            setSeedBump((b) => b + 1);
            setLast(null);
            setTotals({ runs: 0, ll: 0, sl: 0 });
          }}
        >
          Re-roll the towers
        </button>
      </div>

      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.75rem",
          color: "var(--fg-1)",
          marginBottom: 8,
        }}
      >
        {last
          ? `Last search: key ${last.t}`
          : "Press a button to start the race."}
      </div>
      <Bar
        label="plain linked list (last)"
        value={last?.ll ?? 0}
        color="#e5736d"
      />
      <Bar
        label="skip list (last)"
        value={last?.sl ?? 0}
        color="var(--accent)"
      />

      {totals.runs > 0 && (
        <div
          style={{
            marginTop: "0.9rem",
            padding: "0.7rem 0.9rem",
            background: "var(--bg-2)",
            border: "1px solid var(--border-2)",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.875rem",
            lineHeight: 1.6,
            color: "var(--fg-1)",
          }}
        >
          Over {totals.runs.toLocaleString()} search
          {totals.runs > 1 ? "es" : ""}: linked list averaged{" "}
          <b style={{ color: "#e5736d" }}>{avgLL.toFixed(1)}</b>, skip list
          averaged <b style={{ color: "var(--accent)" }}>{avgSL.toFixed(1)}</b>.
          For reference, 2·log₂({n.toLocaleString()}) ={" "}
          {(2 * Math.log2(n)).toFixed(1)}.
        </div>
      )}
    </div>
  );
}

export default function SearchRace() {
  return (
    <InteractiveWrapper caption="Bars are scaled to the list size. Crank it to 2,048 and watch the green bar all but vanish.">
      <Race />
    </InteractiveWrapper>
  );
}
