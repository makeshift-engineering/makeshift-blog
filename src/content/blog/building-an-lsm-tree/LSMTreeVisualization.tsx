import React, { useState, useCallback, useRef, useEffect } from "react";

interface Entry {
  key: string;
  value: string;
  id: number;
}

interface SSTable {
  id: number;
  entries: Entry[];
  level: number;
}

const MEMTABLE_CAPACITY = 4;

const colors = {
  bg: "#111114",
  surface: "#18181c",
  card: "#141418",
  border: "rgba(255, 255, 255, 0.086)",
  accent: "#92e3a9",
  accentSubtle: "rgba(146, 227, 169, 0.07)",
  accentGlow: "rgba(146, 227, 169, 0.2)",
  teal: "#5ec4b6",
  tealSubtle: "rgba(94, 196, 182, 0.07)",
  fg0: "#eef0f2",
  fg1: "#b0b4bc",
  fg2: "#7a7e88",
  fg3: "#52555e",
  purple: "#a78bfa",
  purpleSubtle: "rgba(167, 139, 250, 0.07)",
  amber: "#fbbf24",
  amberSubtle: "rgba(251, 191, 36, 0.07)",
};

export default function LSMTreeVisualization() {
  const [memtable, setMemtable] = useState<Entry[]>([]);
  const [sstables, setSSTables] = useState<SSTable[]>([]);
  const [walEntries, setWalEntries] = useState<Entry[]>([]);
  const [nextId, setNextId] = useState(1);
  const [sstableId, setSSTableId] = useState(1);
  const [flashEntry, setFlashEntry] = useState<number | null>(null);
  const [isCompacting, setIsCompacting] = useState(false);
  const [log, setLog] = useState<string[]>([
    'Ready. Click "Write" to add entries.',
  ]);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [log]);

  const addLog = useCallback((msg: string) => {
    setLog((prev) => [...prev.slice(-19), msg]);
  }, []);

  const handleWrite = useCallback(() => {
    const keys = [
      "user_id",
      "email",
      "name",
      "age",
      "city",
      "role",
      "status",
      "score",
    ];
    const key = keys[Math.floor(Math.random() * keys.length)];
    const value = `v${nextId}`;
    const entry: Entry = { key, value, id: nextId };

    setNextId((n) => n + 1);
    setFlashEntry(entry.id);
    setTimeout(() => setFlashEntry(null), 600);

    // Write to WAL first
    setWalEntries((prev) => [...prev.slice(-5), entry]);
    addLog(`WAL ← write(${key}=${value})`);

    // Then to memtable
    setMemtable((prev) => {
      const newMemtable = [...prev.filter((e) => e.key !== key), entry];

      if (newMemtable.length >= MEMTABLE_CAPACITY) {
        // Flush to SSTable
        setTimeout(() => {
          const sorted = [...newMemtable].sort((a, b) =>
            a.key.localeCompare(b.key)
          );
          const newSSTable: SSTable = {
            id: sstableId,
            entries: sorted,
            level: 0,
          };

          setSSTables((prev) => [newSSTable, ...prev]);
          setSSTableId((n) => n + 1);
          setMemtable([]);
          setWalEntries([]);
          addLog(`Flush → SSTable L0-${sstableId} (${sorted.length} entries)`);
        }, 300);
      }

      return newMemtable;
    });
  }, [nextId, sstableId, addLog]);

  const handleCompact = useCallback(() => {
    const l0Tables = sstables.filter((s) => s.level === 0);
    if (l0Tables.length < 2) {
      addLog("Need ≥ 2 L0 SSTables to compact.");
      return;
    }

    setIsCompacting(true);
    addLog("Compacting L0 SSTables...");

    setTimeout(() => {
      // Merge all L0 entries, latest wins
      const merged = new Map<string, Entry>();
      for (const table of l0Tables.reverse()) {
        for (const entry of table.entries) {
          merged.set(entry.key, entry);
        }
      }

      const sortedEntries = Array.from(merged.values()).sort((a, b) =>
        a.key.localeCompare(b.key)
      );

      const compactedTable: SSTable = {
        id: sstableId,
        entries: sortedEntries,
        level: 1,
      };

      setSSTables((prev) => [
        compactedTable,
        ...prev.filter((s) => s.level !== 0),
      ]);
      setSSTableId((n) => n + 1);
      setIsCompacting(false);
      addLog(
        `Compacted → SSTable L1-${sstableId} (${sortedEntries.length} entries, ${l0Tables.length} merged)`
      );
    }, 800);
  }, [sstables, sstableId, addLog]);

  const l0Count = sstables.filter((s) => s.level === 0).length;

  return (
    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}>
      {/* Controls */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1.25rem",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={handleWrite}
          style={btnStyle(colors.accent, colors.accentSubtle)}
        >
          Write Entry
        </button>
        <button
          onClick={handleCompact}
          disabled={l0Count < 2 || isCompacting}
          style={btnStyle(
            colors.teal,
            colors.tealSubtle,
            l0Count < 2 || isCompacting
          )}
        >
          {isCompacting ? "Compacting..." : `Compact L0 (${l0Count})`}
        </button>
      </div>

      {/* Visualization grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.75rem",
        }}
      >
        {/* WAL */}
        <div style={sectionStyle}>
          <div style={sectionLabelStyle}>// wal</div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.25rem",
              minHeight: 60,
            }}
          >
            {walEntries.length === 0 && (
              <span style={{ color: colors.fg3, fontSize: "0.75rem" }}>
                empty
              </span>
            )}
            {walEntries.map((e) => (
              <div
                key={e.id}
                style={{
                  ...entryStyle,
                  borderColor:
                    flashEntry === e.id ? colors.accent : colors.border,
                  boxShadow:
                    flashEntry === e.id
                      ? `0 0 8px ${colors.accentGlow}`
                      : "none",
                  transition: "all 0.3s ease",
                }}
              >
                <span style={{ color: colors.fg2 }}>{e.key}</span>
                <span style={{ color: colors.accent }}>=</span>
                <span style={{ color: colors.fg0 }}>{e.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Memtable */}
        <div style={sectionStyle}>
          <div style={sectionLabelStyle}>
            // memtable
            <span style={{ color: colors.fg3, marginLeft: "0.5rem" }}>
              {memtable.length}/{MEMTABLE_CAPACITY}
            </span>
          </div>
          {/* Capacity bar */}
          <div
            style={{
              background: colors.bg,
              borderRadius: 4,
              height: 4,
              marginBottom: "0.5rem",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${(memtable.length / MEMTABLE_CAPACITY) * 100}%`,
                background:
                  memtable.length >= MEMTABLE_CAPACITY - 1
                    ? colors.amber
                    : colors.accent,
                borderRadius: 4,
                transition: "width 0.3s ease, background 0.3s ease",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.25rem",
              minHeight: 60,
            }}
          >
            {memtable.length === 0 && (
              <span style={{ color: colors.fg3, fontSize: "0.75rem" }}>
                empty
              </span>
            )}
            {memtable.map((e) => (
              <div
                key={e.id}
                style={{
                  ...entryStyle,
                  borderColor:
                    flashEntry === e.id ? colors.accent : colors.border,
                  boxShadow:
                    flashEntry === e.id
                      ? `0 0 8px ${colors.accentGlow}`
                      : "none",
                  transition: "all 0.3s ease",
                }}
              >
                <span style={{ color: colors.fg2 }}>{e.key}</span>
                <span style={{ color: colors.accent }}>=</span>
                <span style={{ color: colors.fg0 }}>{e.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SSTables */}
      <div style={{ ...sectionStyle, marginTop: "0.75rem" }}>
        <div style={sectionLabelStyle}>// sstables (disk)</div>
        {sstables.length === 0 && (
          <span style={{ color: colors.fg3, fontSize: "0.75rem" }}>
            No SSTables yet. Fill the memtable to trigger a flush.
          </span>
        )}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          {sstables.map((table) => (
            <div
              key={table.id}
              style={{
                background:
                  table.level === 0 ? colors.tealSubtle : colors.purpleSubtle,
                border: `1px solid ${table.level === 0 ? "rgba(94, 196, 182, 0.15)" : "rgba(167, 139, 250, 0.15)"}`,
                borderRadius: 8,
                padding: "0.5rem 0.75rem",
                transition: "all 0.3s ease",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.375rem",
                }}
              >
                <span
                  style={{
                    color: table.level === 0 ? colors.teal : colors.purple,
                    fontWeight: 500,
                  }}
                >
                  L{table.level}-{table.id}
                </span>
                <span style={{ color: colors.fg3, fontSize: "0.6875rem" }}>
                  {table.entries.length} entries (sorted)
                </span>
              </div>
              <div
                style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}
              >
                {table.entries.map((e, i) => (
                  <span
                    key={i}
                    style={{ color: colors.fg2, fontSize: "0.6875rem" }}
                  >
                    {e.key}={e.value}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity log */}
      <div
        ref={logRef}
        style={{
          marginTop: "0.75rem",
          background: colors.bg,
          border: `1px solid ${colors.border}`,
          borderRadius: 8,
          padding: "0.75rem",
          maxHeight: 120,
          overflowY: "auto",
          fontSize: "0.6875rem",
        }}
      >
        {log.map((msg, i) => (
          <div
            key={i}
            style={{
              color: i === log.length - 1 ? colors.fg1 : colors.fg3,
              lineHeight: 1.6,
            }}
          >
            <span style={{ color: colors.fg3, marginRight: "0.5rem" }}>
              {String(i + 1).padStart(2, "0")}
            </span>
            {msg}
          </div>
        ))}
      </div>
    </div>
  );
}

const sectionStyle: React.CSSProperties = {
  background: "var(--bg-2, #18181c)",
  border: "1px solid var(--border, rgba(255,255,255,0.055))",
  borderRadius: 8,
  padding: "0.75rem",
};

const sectionLabelStyle: React.CSSProperties = {
  fontSize: "0.6875rem",
  color: colors.fg3,
  letterSpacing: "0.08em",
  marginBottom: "0.5rem",
  display: "flex",
  alignItems: "center",
};

const entryStyle: React.CSSProperties = {
  background: colors.card,
  border: `1px solid ${colors.border}`,
  borderRadius: 6,
  padding: "0.25rem 0.5rem",
  fontSize: "0.75rem",
  display: "flex",
  gap: "0.25rem",
};

function btnStyle(
  color: string,
  bg: string,
  disabled = false
): React.CSSProperties {
  return {
    fontFamily: "var(--font-mono)",
    fontSize: "0.75rem",
    fontWeight: 500,
    padding: "0.5rem 1rem",
    borderRadius: 8,
    border: `1px solid ${disabled ? colors.border : color}`,
    background: disabled ? "transparent" : bg,
    color: disabled ? colors.fg3 : color,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.2s ease",
    opacity: disabled ? 0.5 : 1,
  };
}
