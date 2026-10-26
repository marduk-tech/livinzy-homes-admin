import { DiffLine, diffTokens } from "./line-diff";

export type WordPart = DiffLine;

export type PointDiff =
  | { type: "same" | "added" | "removed"; html: string }
  | { type: "modified"; before: WordPart[]; after: WordPart[] }
  | { type: "formatting"; beforeHtml: string; afterHtml: string };

export type GroupDiff = {
  key: string;
  label: string;
  rating?: { before?: number; after?: number };
  presence: "both" | "added" | "removed";
  points: PointDiff[];
  changeCount: number;
};

export type PillarDiff = { groups: GroupDiff[]; changeCount: number };

const MAX_WORD_DIFF_CELLS = 250_000;
const FORMAT_SELECTOR = "b, strong, i, em, u, s, a, .highlight";

const SKIPPED_KEYS = new Set(["_id", "version"]);

const toLabel = (key: string) =>
  key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

const toArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.filter((v) => typeof v === "string");
  return typeof value === "string" && value ? [value] : [];
};

const toRating = (value: unknown) => {
  const n = Number(value);
  return value != null && value !== "" && Number.isFinite(n) ? n : undefined;
};

const parseHtml = (html: string) => {
  const root = new DOMParser().parseFromString(html, "text/html").body;
  const clean = (s: string | null) =>
    (s || "").replace(/\s+/g, " ").trim();
  const format = Array.from(root.querySelectorAll(FORMAT_SELECTOR))
    .map((el) => `${el.tagName}.${el.className}:${clean(el.textContent)}`)
    .join("|");
  // keep "<b>Title</b><br>Body" from gluing into "TitleBody"
  root.querySelectorAll("br").forEach((br) => br.replaceWith(" "));
  root
    .querySelectorAll("div, p, li")
    .forEach((el) => el.append(" "));
  return { text: clean(root.textContent), format };
};

const mergeParts = (parts: WordPart[]) =>
  parts.reduce<WordPart[]>((acc, part) => {
    const last = acc[acc.length - 1];
    if (last && last.type === part.type) last.text += part.text;
    else acc.push({ ...part });
    return acc;
  }, []);

const diffWords = (before: string, after: string) => {
  const a = before.match(/\S+\s*/g) || [];
  const b = after.match(/\S+\s*/g) || [];
  if (a.length * b.length > MAX_WORD_DIFF_CELLS) {
    return {
      before: [{ type: "removed" as const, text: before }],
      after: [{ type: "added" as const, text: after }],
    };
  }
  const parts = diffTokens(a, b);
  return {
    before: mergeParts(parts.filter((p) => p.type !== "added")),
    after: mergeParts(parts.filter((p) => p.type !== "removed")),
  };
};

const diffPoints = (beforeHtml: string[], afterHtml: string[]) => {
  // compare plain text, the editor re-serializes html even with no edits
  const before = beforeHtml.map((html) => ({ html, ...parseHtml(html) }));
  const after = afterHtml.map((html) => ({ html, ...parseHtml(html) }));
  const steps = diffTokens(
    before.map((p) => p.text),
    after.map((p) => p.text),
  );

  const points: PointDiff[] = [];
  let removed: typeof before = [];
  let added: typeof after = [];
  let i = 0;
  let j = 0;

  // removed/added bullets between the same unchanged ones count as edits
  const flush = () => {
    const paired = Math.min(removed.length, added.length);
    for (let k = 0; k < paired; k++) {
      points.push({
        type: "modified",
        ...diffWords(removed[k].text, added[k].text),
      });
    }
    removed
      .slice(paired)
      .forEach((p) => points.push({ type: "removed", html: p.html }));
    added
      .slice(paired)
      .forEach((p) => points.push({ type: "added", html: p.html }));
    removed = [];
    added = [];
  };

  steps.forEach((step) => {
    if (step.type === "removed") removed.push(before[i++]);
    else if (step.type === "added") added.push(after[j++]);
    else {
      flush();
      const a = before[i++];
      const b = after[j++];
      points.push(
        a.format === b.format
          ? { type: "same", html: b.html }
          : { type: "formatting", beforeHtml: a.html, afterHtml: b.html },
      );
    }
  });
  flush();

  return points;
};

const buildGroup = (
  key: string,
  label: string,
  before: any,
  after: any,
  hasRating: boolean,
): GroupDiff => {
  const presence =
    !hasRating || (before && after) ? "both" : before ? "removed" : "added";
  const points = diffPoints(
    toArray(hasRating ? before?.reasoning : before),
    toArray(hasRating ? after?.reasoning : after),
  );
  const rating = hasRating
    ? { before: toRating(before?.rating), after: toRating(after?.rating) }
    : undefined;

  let changeCount = points.filter((p) => p.type !== "same").length;
  if (presence !== "both") changeCount = 1;
  else if (rating && rating.before !== rating.after) changeCount += 1;

  return { key, label, rating, presence, points, changeCount };
};

export const diffPillar = (
  sectionKey: string,
  original: any,
  current: any,
): PillarDiff | null => {
  if (!original || !current) return null;

  let groups: GroupDiff[];
  if (sectionKey === "summary") {
    groups = [
      buildGroup("pros", "Pros", original.pros, current.pros, false),
      buildGroup("cons", "Cons", original.cons, current.cons, false),
    ];
  } else {
    const isGroup = (obj: any, k: string) =>
      !SKIPPED_KEYS.has(k) && !!obj[k] && typeof obj[k] === "object";
    const keys = [
      ...Object.keys(current).filter((k) => isGroup(current, k)),
      ...Object.keys(original).filter(
        (k) => isGroup(original, k) && !isGroup(current, k),
      ),
    ];
    groups = keys.map((k) =>
      buildGroup(
        k,
        toLabel(k),
        isGroup(original, k) ? original[k] : undefined,
        isGroup(current, k) ? current[k] : undefined,
        true,
      ),
    );
  }

  return {
    groups,
    changeCount: groups.reduce((sum, g) => sum + g.changeCount, 0),
  };
};
