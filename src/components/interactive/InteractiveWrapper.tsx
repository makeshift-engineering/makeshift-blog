import React from "react";
import type { CSSProperties, ReactNode } from "react";

interface Props {
  caption?: string;
  children: ReactNode;
}

const containerStyle: CSSProperties = {
  background: "var(--bg-1)",
  border: "1px solid var(--border-2)",
  borderRadius: "var(--radius-md)",
  padding: "1.5rem",
  margin: "2rem 0",
  overflow: "hidden",
};

const captionStyle: CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "0.75rem",
  color: "var(--fg-3)",
  textAlign: "center" as const,
  marginTop: "1rem",
  letterSpacing: "0.03em",
};

export default function InteractiveWrapper({ caption, children }: Props) {
  return (
    <figure style={containerStyle}>
      <div>{children}</div>
      {caption && <figcaption style={captionStyle}>{caption}</figcaption>}
    </figure>
  );
}
