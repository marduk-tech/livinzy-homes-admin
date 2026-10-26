import { DiffOutlined } from "@ant-design/icons";
import { Button, Flex, Modal, Switch, Tag, Typography } from "antd";
import React, { useMemo, useState } from "react";
import {
  diffPillar,
  GroupDiff,
  PointDiff,
  WordPart,
} from "../../libs/score-diff";
import { FONT_SIZES } from "../../theme/font-sizes";

const COLORS = {
  addedBg: "#e6ffec",
  addedBorder: "#1a7f37",
  addedWord: "#abf2bc",
  removedBg: "#ffebe9",
  removedBorder: "#cf222e",
  removedWord: "#ffc1c0",
  modifiedBg: "#fffbe6",
  modifiedBorder: "#d4b106",
  formattingBg: "#f0f5ff",
  formattingBorder: "#2f54eb",
  sameBg: "#fafafa",
};

const POINT_TAGS: Record<PointDiff["type"], { label: string; color: string }> =
  {
    modified: { label: "Edited", color: "gold" },
    added: { label: "Added", color: "green" },
    removed: { label: "Removed", color: "red" },
    formatting: { label: "Formatting", color: "geekblue" },
    same: { label: "Unchanged", color: "default" },
  };

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "100px 1fr 1fr",
  gap: 8,
  alignItems: "stretch",
};

const cellStyle = (bg: string, border: string): React.CSSProperties => ({
  backgroundColor: bg,
  borderLeft: `3px solid ${border}`,
  borderRadius: 6,
  padding: "8px 12px",
  fontSize: FONT_SIZES.PARA,
  lineHeight: 1.6,
});

const emptyCellStyle: React.CSSProperties = {
  border: "1px dashed #d9d9d9",
  borderRadius: 6,
  padding: "8px 12px",
  color: "#bfbfbf",
};

function Words({ parts }: { parts: WordPart[] }) {
  return (
    <>
      {parts.map((part, idx) =>
        part.type === "same" ? (
          <span key={idx}>{part.text}</span>
        ) : (
          <span
            key={idx}
            style={{
              backgroundColor:
                part.type === "added" ? COLORS.addedWord : COLORS.removedWord,
              textDecoration:
                part.type === "removed" ? "line-through" : undefined,
              borderRadius: 3,
            }}
          >
            {part.text}
          </span>
        ),
      )}
    </>
  );
}

function HtmlCell({
  html,
  style,
}: {
  html: string;
  style: React.CSSProperties;
}) {
  return (
    <div
      className="reasoning"
      style={style}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

const EmptyCell = () => <div style={emptyCellStyle}>—</div>;

function PointRow({ point }: { point: PointDiff }) {
  const tag = POINT_TAGS[point.type];
  let before: React.ReactNode;
  let after: React.ReactNode;

  switch (point.type) {
    case "modified": {
      const style = cellStyle(COLORS.modifiedBg, COLORS.modifiedBorder);
      before = (
        <div style={style}>
          <Words parts={point.before} />
        </div>
      );
      after = (
        <div style={style}>
          <Words parts={point.after} />
        </div>
      );
      break;
    }
    case "formatting": {
      const style = cellStyle(COLORS.formattingBg, COLORS.formattingBorder);
      before = <HtmlCell html={point.beforeHtml} style={style} />;
      after = <HtmlCell html={point.afterHtml} style={style} />;
      break;
    }
    case "added":
      before = <EmptyCell />;
      after = (
        <HtmlCell
          html={point.html}
          style={cellStyle(COLORS.addedBg, COLORS.addedBorder)}
        />
      );
      break;
    case "removed":
      before = (
        <HtmlCell
          html={point.html}
          style={cellStyle(COLORS.removedBg, COLORS.removedBorder)}
        />
      );
      after = <EmptyCell />;
      break;
    default: {
      const style = {
        ...cellStyle(COLORS.sameBg, "#d9d9d9"),
        color: "#8c8c8c",
      };
      before = <HtmlCell html={point.html} style={style} />;
      after = <HtmlCell html={point.html} style={style} />;
    }
  }

  return (
    <div style={gridStyle}>
      <div>
        <Tag color={tag.color}>{tag.label}</Tag>
      </div>
      {before}
      {after}
    </div>
  );
}

function RatingChange({
  rating,
}: {
  rating: NonNullable<GroupDiff["rating"]>;
}) {
  const { before, after } = rating;
  if (before === after) {
    return before != null ? (
      <Typography.Text type="secondary">Rating {before}/100</Typography.Text>
    ) : null;
  }
  const delta = before != null && after != null ? after - before : undefined;
  return (
    <Tag color={delta == null ? "gold" : delta > 0 ? "green" : "red"}>
      Rating {before ?? "—"} → {after ?? "—"}
      {delta != null && ` (${delta > 0 ? "+" : ""}${delta})`}
    </Tag>
  );
}

function GroupCard({
  group,
  showUnchanged,
}: {
  group: GroupDiff;
  showUnchanged: boolean;
}) {
  const points = showUnchanged
    ? group.points
    : group.presence === "both"
      ? group.points.filter((p) => p.type !== "same")
      : group.points;

  return (
    <div
      style={{
        border: "1px solid #f0f0f0",
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
      }}
    >
      <Flex align="center" gap={8} wrap style={{ marginBottom: 12 }}>
        <Typography.Text strong style={{ fontSize: FONT_SIZES.HEADING_4 }}>
          {group.label}
        </Typography.Text>
        {group.presence === "added" && <Tag color="green">New section</Tag>}
        {group.presence === "removed" && (
          <Tag color="red">Section removed</Tag>
        )}
        {group.rating && <RatingChange rating={group.rating} />}
      </Flex>
      <Flex vertical gap={8}>
        {points.length ? (
          points.map((point, idx) => <PointRow key={idx} point={point} />)
        ) : (
          <Typography.Text type="secondary">
            No changes to the reasoning
          </Typography.Text>
        )}
      </Flex>
    </div>
  );
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function ScoreDiffDialog({
  label,
  sectionKey,
  original,
  current,
}: {
  label: string;
  sectionKey: string;
  original: any;
  current: any;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showUnchanged, setShowUnchanged] = useState(false);

  const diff = useMemo(
    () => diffPillar(sectionKey, original, current),
    [sectionKey, original, current],
  );

  if (!diff || diff.changeCount === 0) return null;

  const allPoints = diff.groups.flatMap((g) => g.points);
  const countOf = (type: PointDiff["type"]) =>
    allPoints.filter((p) => p.type === type).length;
  const ratingChanges = diff.groups.filter(
    (g) =>
      g.presence === "both" && g.rating && g.rating.before !== g.rating.after,
  ).length;

  const summary = [
    { text: plural(ratingChanges, "rating change"), count: ratingChanges },
    ...(["modified", "added", "removed", "formatting"] as const).map((t) => ({
      text: `${countOf(t)} ${POINT_TAGS[t].label.toLowerCase()}`,
      count: countOf(t),
    })),
  ];
  const summaryColors = ["purple", "gold", "green", "red", "geekblue"];

  const visibleGroups = showUnchanged
    ? diff.groups
    : diff.groups.filter((g) => g.changeCount > 0);

  return (
    <>
      <Button icon={<DiffOutlined />} onClick={() => setIsOpen(true)}>
        {plural(diff.changeCount, "change")}
      </Button>

      <Modal
        title={`${label} · reviewer changes`}
        open={isOpen}
        onCancel={() => setIsOpen(false)}
        width={1200}
        style={{ top: 20 }}
        styles={{
          body: { maxHeight: "80vh", overflowY: "auto", paddingRight: 8 },
        }}
        footer={[
          <Button key="close" onClick={() => setIsOpen(false)}>
            Close
          </Button>,
        ]}
      >
        <Flex
          justify="space-between"
          align="center"
          wrap
          gap={8}
          style={{ marginBottom: 16 }}
        >
          <Flex gap={4} wrap>
            {summary.map((s, idx) =>
              s.count > 0 ? (
                <Tag key={idx} color={summaryColors[idx]}>
                  {s.text}
                </Tag>
              ) : null,
            )}
          </Flex>
          <Flex gap={8} align="center">
            <Switch
              size="small"
              checked={showUnchanged}
              onChange={setShowUnchanged}
            />
            <Typography.Text>Show unchanged</Typography.Text>
          </Flex>
        </Flex>

        <div style={{ ...gridStyle, marginBottom: 8 }}>
          <span />
          <Typography.Text type="secondary" strong>
            Original (AI)
          </Typography.Text>
          <Typography.Text type="secondary" strong>
            Reviewed
          </Typography.Text>
        </div>

        {visibleGroups.map((group) => (
          <GroupCard
            key={group.key}
            group={group}
            showUnchanged={showUnchanged}
          />
        ))}
      </Modal>
    </>
  );
}
