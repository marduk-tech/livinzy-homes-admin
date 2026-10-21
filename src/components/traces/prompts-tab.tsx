import {
  Empty,
  Flex,
  Modal,
  Segmented,
  Table,
  TableColumnType,
  Tag,
  Typography,
} from "antd";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { useGetBrickchatPrompts } from "../../hooks/brickchat-hooks";
import { errorMessage } from "../../libs/api-error";
import {
  BrickchatPrompt,
  BrickchatPromptGroup,
  BrickchatPromptStatus,
} from "../../types/brickchat-prompt";
import { markdownBox, markdownComponents, messageBox } from "./prompt-text-styles";

const GROUP_COLORS: Record<BrickchatPromptGroup, string> = {
  planner: "blue",
  discovery: "cyan",
  synthesize: "purple",
};

const STATUS_COLORS: Record<BrickchatPromptStatus, string> = {
  active: "green",
  draft: "orange",
  archived: "default",
  default: "default",
};

const GROUPS: BrickchatPromptGroup[] = ["planner", "discovery", "synthesize"];

const versionLabel = (prompt: BrickchatPrompt) =>
  prompt.version === null ? "code default" : `v${prompt.version}`;

// data blocks are JSON - show them as a fenced code block in the markdown view
const promptMarkdown = (prompt: BrickchatPrompt) =>
  typeof prompt.body === "string"
    ? prompt.body
    : `\`\`\`json\n${JSON.stringify(prompt.body, null, 2)}\n\`\`\``;

const promptRaw = (prompt: BrickchatPrompt) =>
  typeof prompt.body === "string"
    ? prompt.body
    : JSON.stringify(prompt.body, null, 2);

const getColumns = (
  onView: (prompt: BrickchatPrompt) => void,
): TableColumnType<BrickchatPrompt>[] => [
  {
    title: "Name",
    dataIndex: "key",
    key: "key",
    sorter: (a, b) => a.key.localeCompare(b.key),
    render: (key: string, record) => (
      <Typography.Link onClick={() => onView(record)}>{key}</Typography.Link>
    ),
  },
  {
    title: "Group",
    dataIndex: "group",
    key: "group",
    width: 140,
    filters: GROUPS.map((g) => ({ text: g, value: g })),
    onFilter: (value, record) => record.group === value,
    render: (group: BrickchatPromptGroup) => (
      <Tag color={GROUP_COLORS[group]}>{group}</Tag>
    ),
  },
  {
    title: "Latest Version",
    key: "version",
    width: 180,
    render: (_, record) => (
      <Flex align="center" gap={4}>
        <Typography.Text>{versionLabel(record)}</Typography.Text>
        {record.version !== null && (
          <Tag color={STATUS_COLORS[record.status]}>{record.status}</Tag>
        )}
      </Flex>
    ),
  },
];

function PromptModal({
  prompt,
  onClose,
}: {
  prompt: BrickchatPrompt | null;
  onClose: () => void;
}) {
  const [view, setView] = useState<"markdown" | "raw">("markdown");

  return (
    <Modal
      title={prompt?.key}
      open={!!prompt}
      onCancel={onClose}
      footer={null}
      width={960}
      afterClose={() => setView("markdown")}
    >
      {prompt && (
        <>
          <Flex align="center" justify="space-between" gap={8} wrap>
            <Flex align="center" gap={4} wrap>
              <Tag color={GROUP_COLORS[prompt.group]}>{prompt.group}</Tag>
              <Tag>{prompt.kind}</Tag>
              <Tag color={STATUS_COLORS[prompt.status]}>
                {versionLabel(prompt)}
                {prompt.version !== null ? ` · ${prompt.status}` : ""}
              </Tag>
              {prompt.variables.map((v) => (
                <Tag key={v} bordered={false}>{`{{${v}}}`}</Tag>
              ))}
            </Flex>
            <Segmented
              size="small"
              value={view}
              onChange={(v) => setView(v as "markdown" | "raw")}
              options={[
                { label: "Markdown", value: "markdown" },
                { label: "Raw", value: "raw" },
              ]}
            />
          </Flex>
          {view === "markdown" ? (
            <div style={{ ...markdownBox, maxHeight: "65vh" }}>
              <ReactMarkdown components={markdownComponents}>
                {promptMarkdown(prompt)}
              </ReactMarkdown>
            </div>
          ) : (
            <div style={{ ...messageBox, maxHeight: "65vh" }}>
              {promptRaw(prompt)}
            </div>
          )}
        </>
      )}
    </Modal>
  );
}

export function PromptsTab() {
  const { data, isLoading, isError, error } = useGetBrickchatPrompts();
  const [viewing, setViewing] = useState<BrickchatPrompt | null>(null);

  if (isError) {
    return (
      <Empty description={errorMessage(error, "Failed to fetch brickchat prompts")} />
    );
  }

  return (
    <>
      <Table
        dataSource={data}
        columns={getColumns(setViewing)}
        loading={isLoading}
        rowKey="key"
        pagination={false}
      />
      <PromptModal prompt={viewing} onClose={() => setViewing(null)} />
    </>
  );
}
