import { Typography } from "antd";
import { useMemo } from "react";
import { DiffLine, diffLines } from "../../libs/line-diff";
import { FONT_SIZES } from "../../theme/font-sizes";

// unchanged lines kept around each change when not showing everything
const CONTEXT_LINES = 3;

const LINE_STYLES: Record<DiffLine["type"], React.CSSProperties> = {
  same: {},
  added: { backgroundColor: "#e6ffec" },
  removed: { backgroundColor: "#ffebe9" },
};

const LINE_PREFIX: Record<DiffLine["type"], string> = {
  same: "  ",
  added: "+ ",
  removed: "- ",
};

type Row = DiffLine | { type: "gap"; count: number };

// Unchanged runs longer than the context on both sides collapse to a
// "N unchanged lines" marker
const withContext = (lines: DiffLine[]): Row[] => {
  const keep = lines.map((line, i) =>
    line.type !== "same"
      ? true
      : lines
          .slice(Math.max(0, i - CONTEXT_LINES), i + CONTEXT_LINES + 1)
          .some((l) => l.type !== "same"),
  );
  const rows: Row[] = [];
  lines.forEach((line, i) => {
    if (keep[i]) {
      rows.push(line);
      return;
    }
    const last = rows[rows.length - 1];
    if (last?.type === "gap") last.count += 1;
    else rows.push({ type: "gap", count: 1 });
  });
  return rows;
};

// Line diff of a prompt block's text before and after a revision
export function TextDiff({
  before,
  after,
  showAll = false,
}: {
  before: string;
  after: string;
  showAll?: boolean;
}) {
  const lines = useMemo(() => diffLines(before, after), [before, after]);
  const rows = showAll ? lines : withContext(lines);

  if (!lines.some((l) => l.type !== "same")) {
    return <Typography.Text type="secondary">No changes</Typography.Text>;
  }

  return (
    <div
      style={{
        fontFamily: "monospace",
        fontSize: FONT_SIZES.SUB_TEXT,
        border: "1px solid #f0f0f0",
        borderRadius: 4,
        maxHeight: 480,
        overflowY: "auto",
      }}
    >
      {rows.map((row, i) =>
        row.type === "gap" ? (
          <div
            key={i}
            style={{ padding: "2px 8px", color: "#999", backgroundColor: "#fafafa" }}
          >
            … {row.count} unchanged line{row.count === 1 ? "" : "s"}
          </div>
        ) : (
          <div
            key={i}
            style={{
              padding: "0 8px",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              ...LINE_STYLES[row.type],
            }}
          >
            {LINE_PREFIX[row.type]}
            {row.text}
          </div>
        ),
      )}
    </div>
  );
}
