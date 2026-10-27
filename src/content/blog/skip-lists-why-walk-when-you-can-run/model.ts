/**
 * Tiny skip list model shared by the interactive demos in this post.
 *
 * A skip list's lanes are just "every node whose tower is tall enough, in key
 * order", so the whole structure is a sorted array of { key, height }.
 * buildFrames() replays the textbook search / insert / delete steps and
 * records one Frame per teachable moment.
 */

export const MAX_LEVEL = 5;

export interface Entry {
  key: number;
  height: number;
}

export type Op = "search" | "insert" | "delete";
export type CodeId = "find" | "insert" | "delete";

export interface Link {
  level: number;
  from: number; // -1 = head
  to: number | null; // null = nil
}

export interface Cell {
  idx: number;
  level: number;
}

export interface Frame {
  entries: Entry[];
  codeId: CodeId;
  lines: number[];
  level: number; // lane the penguin is on, -1 = none
  cur: number; // -1 = head
  nxt?: number | null;
  preds: Record<number, number>;
  trail: Link[];
  hot: Link[];
  ghost: Cell[];
  newIdx: number | null;
  text: string;
  tone: "info" | "good" | "bad";
}

export const FIND_CODE = [
  "for lvl := s.level - 1; lvl >= 0; lvl-- {",
  "    next := cur.next[lvl]",
  "    for next != nil && next.key < key {",
  "        cur = next",
  "        next = cur.next[lvl]",
  "    }",
  "    preds[lvl] = cur",
  "}",
  "return preds, cur.next[0]",
];

export const INSERT_CODE = [
  "h := randomLevel()",
  "if h > s.level {",
  "    // taller than ever: the head is the predecessor up there",
  "    s.level = h",
  "}",
  "for lvl := 0; lvl < h; lvl++ {",
  "    n.next[lvl] = preds[lvl].next[lvl]",
  "    preds[lvl].next[lvl] = n",
  "}",
];

export const DELETE_CODE = [
  "// unlink the target from every lane it lives on",
  "for lvl := len(target.next) - 1; lvl >= 0; lvl-- {",
  "    preds[lvl].next[lvl] = target.next[lvl]",
  "}",
];

export const seed: Entry[] = [
  { key: 5, height: 1 },
  { key: 12, height: 3 },
  { key: 18, height: 1 },
  { key: 24, height: 2 },
  { key: 31, height: 1 },
  { key: 37, height: 4 },
  { key: 46, height: 1 },
  { key: 58, height: 2 },
];

export const highestLevel = (entries: Entry[]) =>
  Math.max(1, ...entries.map((e) => e.height));

/** Next node (after `from`) that participates in `level`. */
export function nextAt(entries: Entry[], from: number, level: number) {
  for (let i = from + 1; i < entries.length; i++) {
    if (entries[i].height > level) return i;
  }
  return null;
}

/** Same loop as randomLevel() in Go: flip until tails or the cap. */
export function flipCoins(max = MAX_LEVEL) {
  let height = 1;
  const flips: string[] = [];
  while (height < max) {
    const heads = Math.random() < 0.5;
    flips.push(heads ? "H" : "T");
    if (!heads) break;
    height++;
  }
  return { height, flips };
}

export function buildFrames(
  entries: Entry[],
  op: Op,
  key: number,
  forced: number | null
): { frames: Frame[]; after: Entry[] } {
  const frames: Frame[] = [];
  const preds: Record<number, number> = {};
  const trail: Link[] = [];
  const top = highestLevel(entries);
  const nameIn = (list: Entry[], i: number) =>
    i === -1 ? "head" : String(list[i].key);

  const mk = (over: Partial<Frame>): Frame => ({
    entries,
    codeId: "find",
    lines: [],
    level: -1,
    cur: -1,
    nxt: undefined,
    preds: { ...preds },
    trail: [...trail],
    hot: [],
    ghost: [],
    newIdx: null,
    text: "",
    tone: "info",
    ...over,
  });

  let cur = -1;
  frames.push(
    mk({
      lines: [0],
      level: top - 1,
      text: `Start at the head on the top lane (L${top - 1}). We're hunting for ${key}.`,
    })
  );

  for (let level = top - 1; level >= 0; level--) {
    for (;;) {
      const nxt = nextAt(entries, cur, level);
      if (nxt !== null && entries[nxt].key < key) {
        trail.push({ level, from: cur, to: nxt });
        cur = nxt;
        frames.push(
          mk({
            lines: [2, 3, 4],
            level,
            text: `L${level}: ${entries[nxt].key} is smaller than ${key}, so hop right onto it.`,
          })
        );
        continue;
      }
      preds[level] = cur;
      const why =
        nxt === null
          ? "next is nil"
          : `next is ${entries[nxt].key}, which isn't smaller than ${key}`;
      frames.push(
        mk({
          lines: [2, 6],
          level,
          nxt,
          text: `L${level}: ${why}. Can't go further on this lane, so remember ${nameIn(entries, cur)} as pred[${level}] and drop down.`,
        })
      );
      break;
    }
  }

  const cand = nextAt(entries, cur, 0);
  const found = cand !== null && entries[cand].key === key;
  const candName = cand === null ? "nil" : String(entries[cand].key);
  frames.push(
    mk({
      lines: [8],
      level: 0,
      nxt: cand,
      tone: found ? "good" : "info",
      text: found
        ? `Bottom lane: next is ${key}. Found it!`
        : `Bottom lane: next is ${candName}. ${key} isn't in the list, but we now know exactly where it belongs: right after ${nameIn(entries, cur)}.`,
    })
  );

  if (op === "search") return { frames, after: entries };

  if (op === "insert") {
    if (found) {
      frames.push(
        mk({
          codeId: "insert",
          level: 0,
          text: `${key} already exists, so Put just overwrites its value. No pointers change at all.`,
          tone: "good",
        })
      );
      return { frames, after: entries };
    }
    const { height, flips } =
      forced !== null ? { height: forced, flips: [] } : flipCoins();
    frames.push(
      mk({
        codeId: "insert",
        lines: [0],
        level: 0,
        text:
          forced !== null
            ? `You picked a tower of height ${height}.`
            : `Flip coins: ${flips.join(" ")}. That's a tower of height ${height}.`,
      })
    );
    if (height > top) {
      for (let l = top; l < height; l++) preds[l] = -1;
      frames.push(
        mk({
          codeId: "insert",
          lines: [1, 2, 3],
          level: height - 1,
          text: `Height ${height} beats every tower so far, so brand new lane(s) open up. The head is the predecessor on those.`,
        })
      );
    }
    const after = [...entries];
    after.splice(cur + 1, 0, { key, height });
    const newIdx = cur + 1;
    for (let l = 0; l < height; l++) {
      const partial = after.map((e, i) =>
        i === newIdx ? { ...e, height: l + 1 } : e
      );
      const p = preds[l];
      const on = nextAt(partial, newIdx, l);
      const ghost: Cell[] = [];
      for (let g = l + 1; g < height; g++)
        ghost.push({ idx: newIdx, level: g });
      frames.push({
        ...mk({}),
        entries: partial,
        codeId: "insert",
        lines: [5, 6, 7],
        level: l,
        cur: newIdx,
        newIdx,
        ghost,
        hot: [
          { level: l, from: p, to: newIdx },
          { level: l, from: newIdx, to: on },
        ],
        text: `L${l}: new node points at ${on === null ? "nil" : after[on].key}, then ${nameIn(after, p)} points at the new node. Two pointer writes, done.`,
      });
    }
    frames.push({
      ...mk({}),
      entries: after,
      codeId: "insert",
      cur: newIdx,
      newIdx,
      preds: {},
      trail: [],
      level: -1,
      tone: "good",
      text: `Done! ${key} is in, with a tower ${height} high. Nothing else had to move.`,
    });
    return { frames, after };
  }

  // delete
  if (!found || cand === null) {
    frames.push(
      mk({
        codeId: "delete",
        level: 0,
        tone: "bad",
        text: `${key} isn't in the list, so there's nothing to unlink.`,
      })
    );
    return { frames, after: entries };
  }
  const h = entries[cand].height;
  frames.push(
    mk({
      codeId: "delete",
      lines: [1],
      level: 0,
      newIdx: cand,
      text: `Found ${key}. It lives on ${h} lane${h > 1 ? "s" : ""}, and we have to unlink it from every one of them.`,
    })
  );
  for (let l = h - 1; l >= 0; l--) {
    const partial = entries.map((e, i) =>
      i === cand ? { ...e, height: l } : e
    );
    const p = preds[l];
    const to = nextAt(partial, p, l);
    const ghost: Cell[] = [];
    for (let g = l; g < h; g++) ghost.push({ idx: cand, level: g });
    frames.push({
      ...mk({}),
      entries: partial,
      codeId: "delete",
      lines: [2],
      level: l,
      cur: p,
      newIdx: cand,
      ghost,
      hot: [{ level: l, from: p, to }],
      text: `L${l}: ${nameIn(entries, p)} now skips straight over ${key} to ${to === null ? "nil" : entries[to].key}.`,
    });
  }
  const after = entries.filter((_, i) => i !== cand);
  frames.push({
    ...mk({}),
    entries: after,
    codeId: "delete",
    cur: Math.min(preds[0], after.length - 1),
    preds: {},
    trail: [],
    level: -1,
    tone: "good",
    text: `${key} is unlinked from every lane. Nothing points at it anymore, so Go's garbage collector can have it.`,
  });
  return { frames, after };
}
