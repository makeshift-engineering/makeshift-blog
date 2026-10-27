import React from "react";

/**
 * Static illustration: The two-handed pointer rewiring when inserting a node.
 * No state, no hydration. Rendered once at build time.
 */

const W = 820;
const H = 345;

const Y_L2 = 65;
const Y_L1 = 150;
const Y_L0 = 235;

const X_PRED = 125;
const X_NEW = 380;
const X_NEXT = 635;

const CELL_W = 58;
const CELL_H = 28;
const RX = 5;

const FONT_MONO = "var(--font-mono)";

// Helper style for halo text so lines never visually clash with letters
const haloText = {
  fontFamily: FONT_MONO,
  paintOrder: "stroke fill",
  stroke: "var(--bg-0)",
  strokeWidth: 6,
  strokeLinejoin: "round" as const,
};

export default function InsertDiagram() {
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
          aria-label="Skip list insertion diagram showing the two-step pointer rewiring when inserting key 22 between predecessor 12 and next node 24."
          style={{
            width: "100%",
            minWidth: 640,
            height: "auto",
            display: "block",
          }}
        >
          <title>Insert: Connecting a New Node Floor by Floor</title>

          <defs>
            {/* Arrowhead markers */}
            <marker
              id="ins-arr-teal"
              markerWidth="7"
              markerHeight="7"
              refX="6"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 7 3.5, 0 7" fill="var(--teal)" />
            </marker>

            <marker
              id="ins-arr-accent"
              markerWidth="7"
              markerHeight="7"
              refX="6"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 7 3.5, 0 7" fill="var(--accent)" />
            </marker>

            <marker
              id="ins-arr-dim"
              markerWidth="7"
              markerHeight="7"
              refX="6"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 7 3.5, 0 7" fill="var(--border-3)" />
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
          {/* LANE 2 (UNTOUCHED)                                        */}
          {/* ========================================================= */}
          <line
            x1={X_PRED + CELL_W}
            y1={Y_L2 + CELL_H / 2}
            x2={X_NEXT - 2}
            y2={Y_L2 + CELL_H / 2}
            stroke="var(--border-3)"
            strokeWidth={1.75}
            markerEnd="url(#ins-arr-dim)"
          />
          <text
            x={(X_PRED + CELL_W + X_NEXT) / 2}
            y={Y_L2 - 12}
            textAnchor="middle"
            fontSize="11"
            fill="var(--fg-2)"
            {...haloText}
          >
            L2 untouched (new tower is only height 2)
          </text>

          {/* ========================================================= */}
          {/* LANE 1 (STEP 1 & STEP 2)                                  */}
          {/* ========================================================= */}

          {/* Old disconnected link (arched high in the space between L2 and L1) */}
          <path
            d={`M ${X_PRED + CELL_W} ${Y_L1 + 2} Q ${(X_PRED + X_NEXT) / 2 + 25} ${Y_L1 - 38} ${X_NEXT} ${Y_L1 + 2}`}
            fill="none"
            stroke="#e5736d"
            strokeWidth={1.5}
            strokeDasharray="3 3"
            opacity={0.5}
          />
          <text
            x={(X_PRED + X_NEXT) / 2 + 25}
            y={Y_L1 - 28}
            textAnchor="middle"
            fontSize="10.5"
            fontWeight="600"
            fill="#e5736d"
            {...haloText}
          >
            ✕ old direct link broken
          </text>

          {/* Step 2 arrow: 12 -> 22 */}
          <line
            x1={X_PRED + CELL_W}
            y1={Y_L1 + CELL_H / 2}
            x2={X_NEW - 2}
            y2={Y_L1 + CELL_H / 2}
            stroke="var(--accent)"
            strokeWidth={2.5}
            markerEnd="url(#ins-arr-accent)"
          />
          <text
            x={(X_PRED + CELL_W + X_NEW) / 2}
            y={Y_L1 - 8}
            textAnchor="middle"
            fontSize="11"
            fontWeight="700"
            fill="var(--accent)"
            {...haloText}
          >
            ② preds[1].next[1] = n
          </text>

          {/* Step 1 arrow: 22 -> 24 */}
          <line
            x1={X_NEW + CELL_W}
            y1={Y_L1 + CELL_H / 2}
            x2={X_NEXT - 2}
            y2={Y_L1 + CELL_H / 2}
            stroke="var(--teal)"
            strokeWidth={2.5}
            markerEnd="url(#ins-arr-teal)"
          />
          <text
            x={(X_NEW + CELL_W + X_NEXT) / 2}
            y={Y_L1 - 8}
            textAnchor="middle"
            fontSize="11"
            fontWeight="700"
            fill="var(--teal)"
            {...haloText}
          >
            ① n.next[1] = preds[1].next[1]
          </text>

          {/* ========================================================= */}
          {/* LANE 0 (BOTTOM LANE)                                      */}
          {/* ========================================================= */}

          {/* Step 2 arrow: 12 -> 22 */}
          <line
            x1={X_PRED + CELL_W}
            y1={Y_L0 + CELL_H / 2}
            x2={X_NEW - 2}
            y2={Y_L0 + CELL_H / 2}
            stroke="var(--accent)"
            strokeWidth={2.5}
            markerEnd="url(#ins-arr-accent)"
          />
          <text
            x={(X_PRED + CELL_W + X_NEW) / 2}
            y={Y_L0 - 8}
            textAnchor="middle"
            fontSize="11"
            fontWeight="700"
            fill="var(--accent)"
            {...haloText}
          >
            ② preds[0].next[0] = n
          </text>

          {/* Step 1 arrow: 22 -> 24 */}
          <line
            x1={X_NEW + CELL_W}
            y1={Y_L0 + CELL_H / 2}
            x2={X_NEXT - 2}
            y2={Y_L0 + CELL_H / 2}
            stroke="var(--teal)"
            strokeWidth={2.5}
            markerEnd="url(#ins-arr-teal)"
          />
          <text
            x={(X_NEW + CELL_W + X_NEXT) / 2}
            y={Y_L0 - 8}
            textAnchor="middle"
            fontSize="11"
            fontWeight="700"
            fill="var(--teal)"
            {...haloText}
          >
            ① n.next[0] = preds[0].next[0]
          </text>

          {/* ========================================================= */}
          {/* TOWERS / NODES                                            */}
          {/* ========================================================= */}

          {/* Node 12 (Predecessor) */}
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
              12
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
              12
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

          {/* Node 22 (New Node - Height 2) */}
          <g>
            {/* Ghost tower indicator at L2 */}
            <rect
              x={X_NEW}
              y={Y_L2}
              width={CELL_W}
              height={CELL_H}
              rx={RX}
              fill="none"
              stroke="var(--border-3)"
              strokeDasharray="2 3"
              strokeWidth={1}
              opacity={0.3}
            />
            {[Y_L1, Y_L0].map((y, idx) => (
              <rect
                key={idx}
                x={X_NEW}
                y={y}
                width={CELL_W}
                height={CELL_H}
                rx={RX}
                fill="var(--accent-subtle)"
                stroke="var(--accent)"
                strokeWidth={2}
              />
            ))}
            <text
              x={X_NEW + CELL_W / 2}
              y={Y_L0 + CELL_H / 2 + 4}
              textAnchor="middle"
              fontFamily={FONT_MONO}
              fontSize="12"
              fontWeight="700"
              fill="var(--accent)"
            >
              22
            </text>
            <text
              x={X_NEW + CELL_W / 2}
              y={Y_L0 + CELL_H + 18}
              textAnchor="middle"
              fontFamily={FONT_MONO}
              fontSize="12"
              fontWeight="700"
              fill="var(--accent)"
            >
              22
            </text>
            <text
              x={X_NEW + CELL_W / 2}
              y={Y_L0 + CELL_H + 32}
              textAnchor="middle"
              fontFamily={FONT_MONO}
              fontSize="10"
              fontWeight="600"
              fill="var(--accent)"
            >
              (new node)
            </text>
          </g>

          {/* Node 24 (Next Node) */}
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
              24
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
              24
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
          <g transform={`translate(100, ${H - 12})`}>
            <circle cx={0} cy={-4} r={4.5} fill="var(--teal)" />
            <text
              x={12}
              y={0}
              fontFamily={FONT_MONO}
              fontSize="11"
              fill="var(--fg-1)"
            >
              Step 1: Grab onto next node first
            </text>

            <circle cx={290} cy={-4} r={4.5} fill="var(--accent)" />
            <text
              x={302}
              y={0}
              fontFamily={FONT_MONO}
              fontSize="11"
              fill="var(--fg-1)"
            >
              Step 2: Predecessor links to new node
            </text>
          </g>
        </svg>
      </div>
    </figure>
  );
}
