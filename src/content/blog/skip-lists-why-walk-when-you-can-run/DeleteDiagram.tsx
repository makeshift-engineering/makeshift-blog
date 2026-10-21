import React from "react";

/**
 * Static illustration: Bypassing and unlinking a node during deletion.
 * No state, no hydration. Rendered once at build time.
 */

const W = 820;
const H = 345;

const Y_L2 = 65;
const Y_L1 = 150;
const Y_L0 = 235;

const X_PRED = 125;
const X_TARGET = 380;
const X_NEXT = 635;

const CELL_W = 58;
const CELL_H = 28;
const RX = 5;

const RED = "#e5736d";
const FONT_MONO = "var(--font-mono)";

// Helper style for halo text so lines never visually clash with letters
const haloText = {
  fontFamily: FONT_MONO,
  paintOrder: "stroke fill",
  stroke: "var(--bg-0)",
  strokeWidth: 6,
  strokeLinejoin: "round" as const,
};

export default function DeleteDiagram() {
  return (
    <figure
      style={{
        margin: "2rem 0",
        padding: "1.25rem 1rem 1rem",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-sm)",
        background: "var(--bg-0)",
      }}
    >
      <div style={{ overflowX: "auto" }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label="Skip list deletion diagram showing how predecessor 31 reroutes its pointers around target node 37 directly to next node 46."
          style={{
            width: "100%",
            minWidth: 640,
            height: "auto",
            display: "block",
          }}
        >
          <title>Delete: Bypassing and Freeing a Node</title>

          <defs>
            {/* Arrowhead markers */}
            <marker
              id="del-arr-accent"
              markerWidth="7"
              markerHeight="7"
              refX="6"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 7 3.5, 0 7" fill="var(--accent)" />
            </marker>

            <marker
              id="del-arr-red"
              markerWidth="7"
              markerHeight="7"
              refX="6"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 7 3.5, 0 7" fill={RED} />
            </marker>
          </defs>

          {/* Lane guides & labels */}
          {[
            { y: Y_L2, name: "L2" },
            { y: Y_L1, name: "L1" },
            { y: Y_L0, name: "L0" },
          ].map((l) => (
            <g key={l.name}>
              <text
                x={35}
                y={l.y + CELL_H / 2 + 5}
                fontFamily={FONT_MONO}
                fontSize="13"
                fontWeight="700"
                fill="var(--fg-1)"
              >
                {l.name}
              </text>
              <line
                x1={70}
                y1={l.y + CELL_H / 2}
                x2={W - 25}
                y2={l.y + CELL_H / 2}
                stroke="var(--border-3)"
                strokeDasharray="2 4"
                strokeWidth={1}
                opacity={0.4}
              />
            </g>
          ))}

          {/* ========================================================= */}
          {/* LANE 2: EMPTY LANE CEILING CHECK                          */}
          {/* ========================================================= */}
          <path
            d={`M ${X_PRED + CELL_W} ${Y_L2 + 4} Q ${(X_PRED + X_NEXT) / 2 + 25} ${Y_L2 - 34} ${X_NEXT} ${Y_L2 + 4}`}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={2}
            markerEnd="url(#del-arr-accent)"
          />
          <text
            x={(X_PRED + X_NEXT) / 2 + 25}
            y={Y_L2 - 24}
            textAnchor="middle"
            fontSize="10.5"
            fontWeight="600"
            fill="var(--accent)"
            {...haloText}
          >
            preds[2].next[2] = target.next[2] (if now empty, s.level drops)
          </text>

          {/* ========================================================= */}
          {/* LANE 1: BYPASS LINK                                       */}
          {/* ========================================================= */}
          {/* New bypass arrow curving safely above L1 */}
          <path
            d={`M ${X_PRED + CELL_W} ${Y_L1 + 4} Q ${(X_PRED + X_NEXT) / 2 + 25} ${Y_L1 - 34} ${X_NEXT} ${Y_L1 + 4}`}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={2.5}
            markerEnd="url(#del-arr-accent)"
          />
          <text
            x={(X_PRED + X_NEXT) / 2 + 25}
            y={Y_L1 - 24}
            textAnchor="middle"
            fontSize="11"
            fontWeight="700"
            fill="var(--accent)"
            {...haloText}
          >
            Bypass: preds[1].next[1] = target.next[1]
          </text>

          {/* Old severed arrows on L1 */}
          <line
            x1={X_PRED + CELL_W}
            y1={Y_L1 + CELL_H / 2}
            x2={X_TARGET - 2}
            y2={Y_L1 + CELL_H / 2}
            stroke={RED}
            strokeWidth={1.5}
            strokeDasharray="3 3"
            opacity={0.5}
          />
          <line
            x1={X_TARGET + CELL_W}
            y1={Y_L1 + CELL_H / 2}
            x2={X_NEXT - 2}
            y2={Y_L1 + CELL_H / 2}
            stroke={RED}
            strokeWidth={1.5}
            strokeDasharray="3 3"
            opacity={0.5}
          />
          <text
            x={(X_PRED + CELL_W + X_TARGET) / 2}
            y={Y_L1 + CELL_H / 2 + 13}
            textAnchor="middle"
            fontSize="10"
            fontWeight="600"
            fill={RED}
            {...haloText}
          >
            ✕ severed
          </text>
          <text
            x={(X_TARGET + CELL_W + X_NEXT) / 2}
            y={Y_L1 + CELL_H / 2 + 13}
            textAnchor="middle"
            fontSize="10"
            fontWeight="600"
            fill={RED}
            {...haloText}
          >
            ✕ severed
          </text>

          {/* ========================================================= */}
          {/* LANE 0: BYPASS LINK                                       */}
          {/* ========================================================= */}
          {/* New bypass arrow curving safely above L0 */}
          <path
            d={`M ${X_PRED + CELL_W} ${Y_L0 + 4} Q ${(X_PRED + X_NEXT) / 2 + 25} ${Y_L0 - 34} ${X_NEXT} ${Y_L0 + 4}`}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={2.5}
            markerEnd="url(#del-arr-accent)"
          />
          <text
            x={(X_PRED + X_NEXT) / 2 + 25}
            y={Y_L0 - 24}
            textAnchor="middle"
            fontSize="11"
            fontWeight="700"
            fill="var(--accent)"
            {...haloText}
          >
            Bypass: preds[0].next[0] = target.next[0]
          </text>

          {/* Old severed arrows on L0 */}
          <line
            x1={X_PRED + CELL_W}
            y1={Y_L0 + CELL_H / 2}
            x2={X_TARGET - 2}
            y2={Y_L0 + CELL_H / 2}
            stroke={RED}
            strokeWidth={1.5}
            strokeDasharray="3 3"
            opacity={0.5}
          />
          <line
            x1={X_TARGET + CELL_W}
            y1={Y_L0 + CELL_H / 2}
            x2={X_NEXT - 2}
            y2={Y_L0 + CELL_H / 2}
            stroke={RED}
            strokeWidth={1.5}
            strokeDasharray="3 3"
            opacity={0.5}
          />
          <text
            x={(X_PRED + CELL_W + X_TARGET) / 2}
            y={Y_L0 + CELL_H / 2 + 13}
            textAnchor="middle"
            fontSize="10"
            fontWeight="600"
            fill={RED}
            {...haloText}
          >
            ✕ severed
          </text>
          <text
            x={(X_TARGET + CELL_W + X_NEXT) / 2}
            y={Y_L0 + CELL_H / 2 + 13}
            textAnchor="middle"
            fontSize="10"
            fontWeight="600"
            fill={RED}
            {...haloText}
          >
            ✕ severed
          </text>

          {/* ========================================================= */}
          {/* TOWERS / NODES                                            */}
          {/* ========================================================= */}

          {/* Node 31 (Predecessor) */}
          <g>
            {[Y_L2, Y_L1, Y_L0].map((y, idx) => (
              <rect
                key={idx}
                x={X_PRED}
                y={y}
                width={CELL_W}
                height={CELL_H}
                rx={RX}
                fill="var(--bg-2)"
                stroke="var(--border-3)"
                strokeWidth={1.5}
              />
            ))}
            <text
              x={X_PRED + CELL_W / 2}
              y={Y_L0 + CELL_H / 2 + 4}
              textAnchor="middle"
              fontFamily={FONT_MONO}
              fontSize="12"
              fontWeight="700"
              fill="var(--fg-0)"
            >
              31
            </text>
            <text
              x={X_PRED + CELL_W / 2}
              y={Y_L0 + CELL_H + 18}
              textAnchor="middle"
              fontFamily={FONT_MONO}
              fontSize="12"
              fontWeight="700"
              fill="var(--fg-0)"
            >
              31
            </text>
            <text
              x={X_PRED + CELL_W / 2}
              y={Y_L0 + CELL_H + 32}
              textAnchor="middle"
              fontFamily={FONT_MONO}
              fontSize="10"
              fill="var(--fg-2)"
            >
              (predecessor)
            </text>
          </g>

          {/* Node 37 (Target to Delete) */}
          <g>
            {[Y_L2, Y_L1, Y_L0].map((y, idx) => (
              <rect
                key={idx}
                x={X_TARGET}
                y={y}
                width={CELL_W}
                height={CELL_H}
                rx={RX}
                fill="var(--bg-1)"
                stroke={RED}
                strokeDasharray="4 3"
                strokeWidth={1.75}
                opacity={0.85}
              />
            ))}
            <text
              x={X_TARGET + CELL_W / 2}
              y={Y_L0 + CELL_H / 2 + 4}
              textAnchor="middle"
              fontFamily={FONT_MONO}
              fontSize="12"
              fontWeight="700"
              fill={RED}
            >
              37
            </text>
            <text
              x={X_TARGET + CELL_W / 2}
              y={Y_L0 + CELL_H + 18}
              textAnchor="middle"
              fontFamily={FONT_MONO}
              fontSize="12"
              fontWeight="700"
              fill={RED}
            >
              37
            </text>
            <text
              x={X_TARGET + CELL_W / 2}
              y={Y_L0 + CELL_H + 32}
              textAnchor="middle"
              fontFamily={FONT_MONO}
              fontSize="10"
              fontWeight="600"
              fill={RED}
            >
              (target to unlink)
            </text>
          </g>

          {/* Node 46 (Next Node) */}
          <g>
            {[Y_L2, Y_L1, Y_L0].map((y, idx) => (
              <rect
                key={idx}
                x={X_NEXT}
                y={y}
                width={CELL_W}
                height={CELL_H}
                rx={RX}
                fill="var(--bg-2)"
                stroke="var(--border-3)"
                strokeWidth={1.5}
              />
            ))}
            <text
              x={X_NEXT + CELL_W / 2}
              y={Y_L0 + CELL_H / 2 + 4}
              textAnchor="middle"
              fontFamily={FONT_MONO}
              fontSize="12"
              fontWeight="700"
              fill="var(--fg-0)"
            >
              46
            </text>
            <text
              x={X_NEXT + CELL_W / 2}
              y={Y_L0 + CELL_H + 18}
              textAnchor="middle"
              fontFamily={FONT_MONO}
              fontSize="12"
              fontWeight="700"
              fill="var(--fg-0)"
            >
              46
            </text>
            <text
              x={X_NEXT + CELL_W / 2}
              y={Y_L0 + CELL_H + 32}
              textAnchor="middle"
              fontFamily={FONT_MONO}
              fontSize="10"
              fill="var(--fg-2)"
            >
              (next)
            </text>
          </g>

          {/* ========================================================= */}
          {/* LEGEND                                                    */}
          {/* ========================================================= */}
          <g transform={`translate(70, ${H - 12})`}>
            <circle cx={0} cy={-4} r={4.5} fill="var(--accent)" />
            <text
              x={12}
              y={0}
              fontFamily={FONT_MONO}
              fontSize="11"
              fill="var(--fg-1)"
            >
              Bypass: Predecessor links directly to next node
            </text>

            <circle cx={350} cy={-4} r={4.5} fill={RED} />
            <text
              x={362}
              y={0}
              fontFamily={FONT_MONO}
              fontSize="11"
              fill="var(--fg-1)"
            >
              Target unlinked: free() in C/C++, GC in Go
            </text>
          </g>
        </svg>
      </div>
    </figure>
  );
}
