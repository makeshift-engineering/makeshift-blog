import React, { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import InteractiveWrapper from "../../../components/interactive/InteractiveWrapper";
import {
  MAX_LEVEL,
  seed,
  buildFrames,
  nextAt,
  highestLevel,
  FIND_CODE,
  INSERT_CODE,
  DELETE_CODE,
} from "./model";
import type { Frame, Op, Entry } from "./model";

const COL = 62;
const CELL_W = 46;
const CELL_H = 22;
const ROW = 30;
const PAD_X = 14;
const PAD_Y = 14;
const RED = "#e5736d";

const btn = (primary = false, disabled = false): CSSProperties => ({
  fontFamily: "var(--font-mono)",
  fontSize: "0.75rem",
  padding: "0.4rem 0.75rem",
  borderRadius: "var(--radius-sm)",
  border: `1px solid ${primary ? "var(--accent)" : "var(--border-3)"}`,
  background: primary ? "var(--accent-subtle)" : "var(--bg-2)",
  color: primary ? "var(--accent)" : "var(--fg-1)",
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.45 : 1,
});

const field: CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "0.8125rem",
  padding: "0.4rem 0.6rem",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--border-3)",
  background: "var(--bg-0)",
  color: "var(--fg-0)",
};

const codeFor = {
  find: { title: "findPredecessors", lines: FIND_CODE },
  insert: { title: "insertNode", lines: INSERT_CODE },
  delete: { title: "unlink", lines: DELETE_CODE },
};

function Lab() {
  const [entries, setEntries] = useState<Entry[]>(seed);
  const [frames, setFrames] = useState<Frame[] | null>(null);
  const [fi, setFi] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(900);
  const [keyText, setKeyText] = useState("17");
  const [forced, setForced] = useState("random");
  const [idle, setIdle] = useState(
    "Pick a number and hit Search, Insert or Delete. The penguin walks the list one step at a time."
  );

  useEffect(() => {
    if (!playing || !frames) return;
    if (fi >= frames.length - 1) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setFi((i) => i + 1), speed);
    return () => clearTimeout(t);
  }, [playing, fi, frames, speed]);

  const run = (op: Op) => {
    const k = parseInt(keyText, 10);
    if (Number.isNaN(k) || k < 0 || k > 99) {
      setFrames(null);
      setIdle("Keys here are whole numbers from 0 to 99.");
      return;
    }
    const { frames: f, after } = buildFrames(
      entries,
      op,
      k,
      forced === "random" ? null : Number(forced)
    );
    setFrames(f);
    setFi(0);
    setPlaying(true);
    setEntries(after);
  };

  const reset = () => {
    setEntries(seed);
    setFrames(null);
    setPlaying(false);
    setFi(0);
    setIdle("List reset. Go again!");
  };

  const frame = frames ? frames[Math.min(fi, frames.length - 1)] : null;
  const shown = frame ? frame.entries : entries;
  const busy = playing;

  const links = useMemo(() => {
    const out: { level: number; from: number; to: number | null }[] = [];
    for (let level = 0; level < MAX_LEVEL; level++) {
      let cur = -1;
      for (;;) {
        const n = nextAt(shown, cur, level);
        out.push({ level, from: cur, to: n });
        if (n === null) break;
        cur = n;
      }
    }
    return out;
  }, [shown]);

  const xOf = (i: number) => PAD_X + (i + 1) * COL;
  const yOf = (level: number) => PAD_Y + (MAX_LEVEL - 1 - level) * ROW;
  const width = PAD_X * 2 + (shown.length + 1) * COL + 24;
  const height = PAD_Y * 2 + MAX_LEVEL * ROW + 26;
  const topActive = highestLevel(shown);

  const same = (
    a: { level: number; from: number; to: number | null },
    b: { level: number; from: number; to: number | null }
  ) => a.level === b.level && a.from === b.from && a.to === b.to;

  const toneColor =
    frame?.tone === "good"
      ? "var(--accent)"
      : frame?.tone === "bad"
        ? RED
        : "var(--fg-0)";

  const code = frame ? codeFor[frame.codeId] : codeFor.find;
  const predEntries = frame
    ? Object.entries(frame.preds)
        .map(([l, i]) => ({ level: Number(l), idx: i }))
        .sort((a, b) => b.level - a.level)
    : [];

  const penguinLevel = frame ? (frame.level < 0 ? 0 : frame.level) : 0;
  const penguinIdx = frame ? frame.cur : -1;

  return (
    <div style={{ fontFamily: "var(--font-body)" }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          alignItems: "center",
          marginBottom: "0.75rem",
        }}
      >
        <input
          style={{ ...field, width: "4.5rem" }}
          value={keyText}
          inputMode="numeric"
          aria-label="key"
          onChange={(e) =>
            setKeyText(e.target.value.replace(/\D/g, "").slice(0, 2))
          }
          disabled={busy}
        />
        <button
          style={btn(true, busy)}
          onClick={() => run("search")}
          disabled={busy}
        >
          Search
        </button>
        <button
          style={btn(true, busy)}
          onClick={() => run("insert")}
          disabled={busy}
        >
          Insert
        </button>
        <button
          style={btn(false, busy)}
          onClick={() => run("delete")}
          disabled={busy}
        >
          Delete
        </button>
        <select
          style={{ ...field, padding: "0.4rem 0.4rem" }}
          value={forced}
          onChange={(e) => setForced(e.target.value)}
          aria-label="tower height for insert"
          disabled={busy}
        >
          <option value="random">height: coin flips</option>
          {[1, 2, 3, 4, 5].map((h) => (
            <option key={h} value={h}>
              height: {h}
            </option>
          ))}
        </select>
        <button style={btn(false, busy)} onClick={reset} disabled={busy}>
          Reset
        </button>
      </div>

      <div
        style={{
          overflowX: "auto",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-sm)",
          background: "var(--bg-0)",
        }}
      >
        <svg
          width={width}
          height={height}
          role="img"
          aria-label="Skip list with lanes, towers and the search penguin"
        >
          <defs>
            <marker
              id="arr"
              markerWidth="6"
              markerHeight="6"
              refX="5"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L6,3 L0,6 z" fill="context-stroke" />
            </marker>
          </defs>

          {links.map((l, i) => {
            const y = yOf(l.level) + CELL_H / 2;
            const x1 = xOf(l.from) + CELL_W;
            const x2 =
              l.to === null ? xOf(shown.length - 1) + COL - 4 : xOf(l.to) - 1;
            const isHot = frame?.hot.some((h) => same(h, l));
            const isTrail = frame?.trail.some((h) => same(h, l));
            const color = isHot
              ? "var(--accent)"
              : isTrail
                ? "var(--teal)"
                : "var(--border-3)";
            if (x2 - x1 < 2) return null;
            return (
              <g key={i}>
                <line
                  x1={x1}
                  y1={y}
                  x2={x2}
                  y2={y}
                  stroke={color}
                  strokeWidth={isHot ? 3 : isTrail ? 2 : 1}
                  strokeDasharray={l.to === null ? "3 3" : undefined}
                  markerEnd={l.to === null ? undefined : "url(#arr)"}
                />
                {l.to === null && (
                  <text
                    x={x2 + 3}
                    y={y + 3}
                    fontSize="9"
                    fill="var(--fg-3)"
                    fontFamily="var(--font-mono)"
                  >
                    nil
                  </text>
                )}
              </g>
            );
          })}

          {[-1, ...shown.map((_, i) => i)].map((idx) => {
            const e = idx >= 0 ? shown[idx] : null;
            const h = e ? e.height : MAX_LEVEL;
            const x = xOf(idx);
            return (
              <g key={idx === -1 ? "head" : e!.key}>
                {Array.from({ length: h }).map((_, level) => {
                  const isCur =
                    frame && frame.cur === idx && frame.level === level;
                  const isNxt =
                    frame && frame.nxt === idx && frame.level === level;
                  const isNew = frame && frame.newIdx === idx;
                  const dim = idx === -1 && level >= topActive;
                  const stroke = isCur
                    ? "var(--accent)"
                    : isNxt
                      ? "var(--teal)"
                      : isNew
                        ? "var(--accent)"
                        : "var(--border-3)";
                  const fill = isCur
                    ? "var(--accent-glow)"
                    : isNxt
                      ? "var(--teal-subtle)"
                      : isNew
                        ? "var(--accent-subtle)"
                        : "var(--bg-2)";
                  return (
                    <rect
                      key={level}
                      x={x}
                      y={yOf(level)}
                      width={CELL_W}
                      height={CELL_H}
                      rx={4}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={isCur || isNxt || isNew ? 2 : 1}
                      opacity={dim ? 0.3 : 1}
                    />
                  );
                })}
                <text
                  x={x + CELL_W / 2}
                  y={yOf(0) + CELL_H + 17}
                  textAnchor="middle"
                  fontSize="12"
                  fontFamily="var(--font-mono)"
                  fill={e ? "var(--fg-1)" : "var(--fg-2)"}
                >
                  {e ? e.key : "head"}
                </text>
              </g>
            );
          })}

          {frame?.ghost.map((g, i) => (
            <rect
              key={`g${i}`}
              x={xOf(g.idx)}
              y={yOf(g.level)}
              width={CELL_W}
              height={CELL_H}
              rx={4}
              fill="none"
              stroke="var(--accent)"
              strokeDasharray="4 3"
              opacity={0.45}
            />
          ))}

          {predEntries.map((p) => (
            <text
              key={`p${p.level}`}
              x={xOf(p.idx) + 6}
              y={yOf(p.level) + 15}
              fontSize="10"
              fontFamily="var(--font-mono)"
              fill="var(--teal)"
              fontWeight="700"
            >
              pred
            </text>
          ))}

          {frame && (
            <g
              style={{
                transform: `translate(${xOf(penguinIdx) + CELL_W / 2}px, ${yOf(penguinLevel) + CELL_H / 2 + 5}px)`,
                transition: "transform 450ms cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              <text
                textAnchor="middle"
                fontSize="16"
                style={{ pointerEvents: "none" }}
              >
                🐧
              </text>
            </g>
          )}
        </svg>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          alignItems: "center",
          margin: "0.75rem 0 0.5rem",
        }}
      >
        <button
          style={btn(false, !frames || fi === 0 || busy)}
          disabled={!frames || fi === 0 || busy}
          onClick={() => setFi((i) => Math.max(0, i - 1))}
        >
          ◀ Back
        </button>
        <button
          style={btn(true, !frames)}
          disabled={!frames}
          onClick={() => {
            if (!frames) return;
            if (fi >= frames.length - 1) setFi(0);
            setPlaying((p) => !p);
          }}
        >
          {playing
            ? "❚❚ Pause"
            : fi >= (frames?.length ?? 1) - 1
              ? "↻ Replay"
              : "▶ Play"}
        </button>
        <button
          style={btn(false, !frames || busy || fi >= (frames?.length ?? 1) - 1)}
          disabled={!frames || busy || fi >= (frames?.length ?? 1) - 1}
          onClick={() =>
            setFi((i) => Math.min((frames?.length ?? 1) - 1, i + 1))
          }
        >
          Next ▶
        </button>
        <select
          style={{ ...field, padding: "0.4rem 0.4rem" }}
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          aria-label="speed"
        >
          <option value={1500}>slow</option>
          <option value={900}>normal</option>
          <option value={400}>fast</option>
        </select>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.6875rem",
            color: "var(--fg-2)",
          }}
        >
          {frames ? `step ${fi + 1}/${frames.length}` : ""} · highest lane: L
          {topActive - 1} · {shown.length} nodes
        </span>
      </div>

      <div
        style={{
          minHeight: "3.4rem",
          padding: "0.7rem 0.9rem",
          borderRadius: "var(--radius-sm)",
          background: "var(--bg-2)",
          border: "1px solid var(--border-2)",
          fontSize: "0.9rem",
          lineHeight: 1.55,
          color: frame ? toneColor : "var(--fg-1)",
        }}
      >
        {frame ? frame.text : idle}
      </div>

      {predEntries.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.4rem",
            marginTop: "0.6rem",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.6875rem",
              color: "var(--fg-2)",
            }}
          >
            predecessors:
          </span>
          {predEntries.map((p) => (
            <span
              key={p.level}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.6875rem",
                padding: "0.15rem 0.5rem",
                borderRadius: 999,
                background: "var(--teal-subtle)",
                color: "var(--teal)",
                border: "1px solid var(--border-2)",
              }}
            >
              L{p.level} ←{" "}
              {p.idx === -1 ? "head" : (frame?.entries[p.idx]?.key ?? "?")}
            </span>
          ))}
        </div>
      )}

      <div
        style={{
          marginTop: "0.75rem",
          border: "1px solid var(--border-2)",
          borderRadius: "var(--radius-sm)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "0.35rem 0.75rem",
            background: "var(--bg-2)",
            fontFamily: "var(--font-mono)",
            fontSize: "0.6875rem",
            color: "var(--fg-2)",
          }}
        >
          {code.title}
        </div>
        <pre
          style={{
            margin: 0,
            padding: "0.5rem 0",
            background: "var(--bg-0)",
            overflowX: "auto",
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            lineHeight: 1.7,
          }}
        >
          {code.lines.map((line, i) => {
            const on = frame?.lines.includes(i);
            return (
              <div
                key={i}
                style={{
                  padding: "0 0.9rem",
                  background: on ? "var(--accent-subtle)" : "transparent",
                  borderLeft: `3px solid ${on ? "var(--accent)" : "transparent"}`,
                  color: on ? "var(--fg-0)" : "var(--fg-2)",
                  whiteSpace: "pre",
                }}
              >
                {line}
              </div>
            );
          })}
        </pre>
      </div>

      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.6875rem",
          color: "var(--fg-3)",
          marginTop: "0.6rem",
        }}
      >
        green = penguin / just-written pointers · teal = trail so far and the
        next pointer being checked · dashed = tower levels not linked yet (or
        about to go)
      </div>
    </div>
  );
}

export default function SkipListLab() {
  return (
    <InteractiveWrapper caption="Step through search, insert and delete. Every highlighted line is the real code running.">
      <Lab />
    </InteractiveWrapper>
  );
}
