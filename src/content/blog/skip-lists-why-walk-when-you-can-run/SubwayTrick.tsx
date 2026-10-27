import React from "react";

/**
 * Static illustration: the "subway lines" mental model of a skip list.
 * No state, no hydration. Rendered once at build time.
 */

const W = 900;
const H = 372;
const X0 = 64;
const STEP = 7.7; // px per station
const x = (stop: number) => X0 + stop * STEP;

const Y1 = 84; // super-express
const Y2 = 194; // express
const Y3 = 304; // local

const C1 = "var(--teal)";
const C2 = "#e5736d";
const C3 = "var(--accent)";

const FONT = "var(--font-mono)";

const express = Array.from({ length: 11 }, (_, i) => i * 10);
const local = Array.from({ length: 101 }, (_, i) => i);

function Arrow({ cx, y1, y2 }: { cx: number; y1: number; y2: number }) {
  return (
    <g>
      <line
        x1={cx}
        y1={y1}
        x2={cx}
        y2={y2 - 6}
        stroke="var(--fg-1)"
        strokeWidth={2.5}
      />
      <polygon
        points={`${cx - 6},${y2 - 8} ${cx + 6},${y2 - 8} ${cx},${y2 + 1}`}
        fill="var(--fg-1)"
      />
    </g>
  );
}

function LaneTitle({
  y,
  name,
  note,
}: {
  y: number;
  name: string;
  note: string;
}) {
  return (
    <text
      x={X0 - 12}
      y={y - 34}
      fontFamily={FONT}
      fontSize="12"
      fill="var(--fg-1)"
    >
      <tspan fontWeight="700" fill="var(--fg-0)">
        {name}
      </tspan>
      <tspan fill="var(--fg-2)"> {note}</tspan>
    </text>
  );
}

function StepLabel({
  cx,
  y,
  color,
  children,
}: {
  cx: number;
  y: number;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <text
      x={cx}
      y={y}
      textAnchor="middle"
      fontFamily={FONT}
      fontSize="13"
      fontWeight="700"
      fill={color}
    >
      {children}
    </text>
  );
}

export default function SubwayLanes() {
  return (
    <figure
      style={{
        margin: "2rem 0",
        padding: "1rem 1rem 0.75rem",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-sm)",
        background: "var(--bg-0)",
      }}
    >
      <div style={{ overflowX: "auto" }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label="Three subway lanes: a super-express stopping every 50th station, an express stopping every 10th, and a local stopping at every station. The route to station 87 takes the super-express to 50, the express to 80, then the local to 87."
          style={{
            width: "100%",
            minWidth: 680,
            height: "auto",
            display: "block",
          }}
        >
          <title>How a skip list works, using subway lines as a metaphor</title>

          {/* dashed guides: each lane's stops line up with the lane below */}
          {[0, 50, 100].map((s) => (
            <line
              key={`g1-${s}`}
              x1={x(s)}
              y1={Y1 + 12}
              x2={x(s)}
              y2={Y2 - 12}
              stroke="var(--border-3)"
              strokeDasharray="3 4"
            />
          ))}
          {express.map((s) => (
            <line
              key={`g2-${s}`}
              x1={x(s)}
              y1={Y2 + 12}
              x2={x(s)}
              y2={Y3 - 4}
              stroke="var(--border-3)"
              strokeDasharray="3 4"
            />
          ))}

          {/* lane titles */}
          <LaneTitle
            y={Y1}
            name="L1 · SUPER-EXPRESS"
            note="stops every 50th station"
          />
          <LaneTitle
            y={Y2}
            name="L2 · EXPRESS"
            note="stops every 10th station"
          />
          <LaneTitle y={Y3} name="L3 · LOCAL" note="stops at every station" />

          {/* lane tracks */}
          <line
            x1={x(0)}
            y1={Y1}
            x2={x(100)}
            y2={Y1}
            stroke="var(--border-3)"
            strokeWidth={2}
          />
          <line
            x1={x(0)}
            y1={Y2}
            x2={x(100)}
            y2={Y2}
            stroke="var(--border-3)"
            strokeWidth={2}
          />
          <line
            x1={x(0)}
            y1={Y3}
            x2={x(100)}
            y2={Y3}
            stroke="var(--border-3)"
            strokeWidth={2}
          />

          {/* the route: three legs */}
          <line
            x1={x(0)}
            y1={Y1}
            x2={x(50)}
            y2={Y1}
            stroke={C1}
            strokeWidth={6}
            strokeLinecap="round"
            opacity={0.85}
          />
          <line
            x1={x(50)}
            y1={Y2}
            x2={x(80)}
            y2={Y2}
            stroke={C2}
            strokeWidth={6}
            strokeLinecap="round"
            opacity={0.85}
          />
          <line
            x1={x(80)}
            y1={Y3}
            x2={x(87)}
            y2={Y3}
            stroke={C3}
            strokeWidth={6}
            strokeLinecap="round"
            opacity={0.85}
          />

          {/* hop-off arrows */}
          <Arrow cx={x(50)} y1={Y1 + 12} y2={Y2 - 12} />
          <Arrow cx={x(80)} y1={Y2 + 12} y2={Y3 - 10} />
          <text
            x={x(50) + 14}
            y={(Y1 + Y2) / 2 + 4}
            fontFamily={FONT}
            fontSize="11"
            fill="var(--fg-2)"
          >
            hop off, and ride…
          </text>

          {/* step labels */}
          <StepLabel cx={(x(0) + x(50)) / 2} y={Y1 - 14} color={C1}>
            1. Super-express to 50
          </StepLabel>
          <StepLabel cx={(x(50) + x(80)) / 2} y={Y2 - 16} color={C2}>
            2. Express to 80
          </StepLabel>
          <StepLabel cx={x(87) + 6} y={Y3 - 22} color={C3}>
            3. Local to 87
          </StepLabel>

          {/* L1 stops */}
          {[0, 50, 100].map((s) => (
            <g key={`s1-${s}`}>
              <circle
                cx={x(s)}
                cy={Y1}
                r={12}
                fill={s <= 50 ? "var(--teal-subtle)" : "var(--bg-2)"}
                stroke={s <= 50 ? C1 : "var(--border-3)"}
                strokeWidth={2}
              />
              <text
                x={x(s)}
                y={Y1 + 4}
                textAnchor="middle"
                fontFamily={FONT}
                fontSize="11"
                fill="var(--fg-0)"
              >
                {s}
              </text>
            </g>
          ))}

          {/* L2 stops */}
          {express.map((s) => {
            const on = s >= 50 && s <= 80;
            return (
              <g key={`s2-${s}`}>
                <circle cx={x(s)} cy={Y2} r={12} fill="var(--bg-2)" />
                <circle
                  cx={x(s)}
                  cy={Y2}
                  r={12}
                  fill={on ? "rgba(229,115,109,0.18)" : "var(--bg-2)"}
                  stroke={on ? C2 : "var(--border-3)"}
                  strokeWidth={2}
                />
                <text
                  x={x(s)}
                  y={Y2 + 4}
                  textAnchor="middle"
                  fontFamily={FONT}
                  fontSize="11"
                  fill="var(--fg-0)"
                >
                  {s}
                </text>
              </g>
            );
          })}

          {/* L3 stops: every single station */}
          {local.map((s) => {
            const on = s >= 80 && s <= 87;
            return (
              <circle
                key={`s3-${s}`}
                cx={x(s)}
                cy={Y3}
                r={on ? 3.6 : 2.8}
                fill={on ? C3 : "var(--bg-3)"}
                stroke={on ? C3 : "var(--border-3)"}
              />
            );
          })}

          {/* destination */}
          <circle cx={x(87)} cy={Y3} r={17} fill="var(--accent-glow)" />
          <circle
            cx={x(87)}
            cy={Y3}
            r={10}
            fill="var(--bg-2)"
            stroke={C3}
            strokeWidth={3}
          />
          <text
            x={x(87)}
            y={Y3 + 4}
            textAnchor="middle"
            fontFamily={FONT}
            fontSize="10"
            fontWeight="700"
            fill="var(--fg-0)"
          >
            87
          </text>
          {/* local lane tick labels */}
          {[0, 10, 20, 30, 50, 80, 100].map((s) => (
            <text
              key={`t-${s}`}
              x={x(s)}
              y={Y3 + 22}
              textAnchor="middle"
              fontFamily={FONT}
              fontSize="10"
              fill="var(--fg-2)"
            >
              {s}
            </text>
          ))}
        </svg>
      </div>
      <figcaption
        style={{
          marginTop: "0.5rem",
          textAlign: "center",
          fontFamily: "var(--font-body)",
          fontSize: "0.875rem",
          color: "var(--fg-2)",
        }}
      >
        Each lane is a sparser version of the one below it. The bottom lane
        holds every node.
      </figcaption>
    </figure>
  );
}
