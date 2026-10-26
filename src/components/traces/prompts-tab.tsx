import { useAuth0 } from "@auth0/auth0-react";
import {
  Alert,
  Button,
  Empty,
  Flex,
  Input,
  Modal,
  Segmented,
  Table,
  TableColumnType,
  Tabs,
  Tag,
  Typography,
} from "antd";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  useCreatePromptDraftMutation,
  useGetBrickchatPrompts,
  useGetRevisions,
} from "../../hooks/brickchat-hooks";
import { errorMessage } from "../../libs/api-error";
import {
  BrickchatPrompt,
  BrickchatPromptGroup,
  BrickchatPromptStatus,
} from "../../types/brickchat-prompt";
import { RevisionDrawer } from "./revision-drawer";
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

// BRICK_GUIDE_INTENT_DEFINITION -> "Brick Guide Intent Definition"
const formatKey = (key: string) =>
  key
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");

const formatGroup = (group: BrickchatPromptGroup) =>
  group[0].toUpperCase() + group.slice(1);

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
      <Typography.Link onClick={() => onView(record)}>
        {formatKey(key)}
      </Typography.Link>
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

// View a prompt, or edit it. An edit is saved as a draft revision, never
// served directly - it goes live only once activated from the revision
// drawer, like any other revision. A prompt whose latest version is already
// a draft is edited in that draft's revision instead, so one key never has
// two drafts competing to replace the same active version.
function PromptModal({
  prompt,
  onClose,
  onOpenRevision,
}: {
  prompt: BrickchatPrompt | null;
  onClose: () => void;
  onOpenRevision: (revisionId: string) => void;
}) {
  const { user } = useAuth0();
  const createDraft = useCreatePromptDraftMutation();
  const [view, setView] = useState<"markdown" | "raw">("markdown");
  const [editing, setEditing] = useState<string | null>(null);
  const [rationale, setRationale] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  const hasDraft = prompt?.status === "draft" && !!prompt.revisionId;

  const saveDraft = async () => {
    if (!prompt || editing === null) return;
    let body: unknown = editing;
    if (prompt.kind === "data") {
      try {
        body = JSON.parse(editing);
      } catch {
        setJsonError("Not valid JSON");
        return;
      }
    }
    try {
      const revision = await createDraft.mutateAsync({
        key: prompt.key,
        body,
        rationale: rationale.trim() || undefined,
        createdBy: user?.email,
      });
      onClose();
      onOpenRevision(revision._id);
    } catch {
      // the server's reason (e.g. a dropped placeholder) is toasted
    }
  };

  return (
    <Modal
      title={prompt && formatKey(prompt.key)}
      open={!!prompt}
      onCancel={onClose}
      footer={null}
      width={960}
      afterClose={() => {
        setView("markdown");
        setEditing(null);
        setRationale("");
        setJsonError(null);
      }}
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
            {editing === null ? (
              <Flex align="center" gap={8}>
                <Segmented
                  size="small"
                  value={view}
                  onChange={(v) => setView(v as "markdown" | "raw")}
                  options={[
                    { label: "Markdown", value: "markdown" },
                    { label: "Raw", value: "raw" },
                  ]}
                />
                {hasDraft ? (
                  <Button
                    size="small"
                    type="primary"
                    onClick={() => {
                      onClose();
                      onOpenRevision(prompt.revisionId!);
                    }}
                  >
                    Review draft
                  </Button>
                ) : (
                  <Button
                    size="small"
                    onClick={() => {
                      setJsonError(null);
                      setEditing(prompt.body == null ? "" : promptRaw(prompt));
                    }}
                  >
                    Edit
                  </Button>
                )}
              </Flex>
            ) : null}
          </Flex>
          {editing !== null ? (
            <Flex vertical gap={8} style={{ marginTop: 12 }}>
              <Alert
                type="info"
                showIcon
                message="Saving creates a draft revision. It isn't served until a reviewer activates it."
              />
              <Input.TextArea
                value={editing}
                onChange={(e) => {
                  setJsonError(null);
                  setEditing(e.target.value);
                }}
                autoSize={{ minRows: 12, maxRows: 28 }}
                style={{ fontFamily: "monospace" }}
                disabled={createDraft.isPending}
              />
              {jsonError ? (
                <Typography.Text type="danger">{jsonError}</Typography.Text>
              ) : null}
              <Input.TextArea
                placeholder="Why this change? (optional - shown to the reviewer)"
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                autoSize={{ minRows: 2, maxRows: 6 }}
                disabled={createDraft.isPending}
              />
              <Flex justify="end" gap={8}>
                <Button
                  onClick={() => setEditing(null)}
                  disabled={createDraft.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  loading={createDraft.isPending}
                  onClick={saveDraft}
                >
                  Save as draft
                </Button>
              </Flex>
            </Flex>
          ) : view === "markdown" ? (
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
  const revisions = useGetRevisions();
  const [viewing, setViewing] = useState<BrickchatPrompt | null>(null);
  // looked up in the revisions list so the drawer reflects refetches
  // (an edit, activation or rejection)
  const [revisionId, setRevisionId] = useState<string | null>(null);
  const openRevision =
    revisions.data?.find((r) => r._id === revisionId) ?? null;

  if (isError) {
    return (
      <Empty description={errorMessage(error, "Failed to fetch brickchat prompts")} />
    );
  }

  return (
    <>
      <Tabs
        items={GROUPS.map((group) => {
          const prompts = data?.filter((p) => p.group === group) ?? [];
          return {
            key: group,
            label: (
              <Flex align="center" gap={6}>
                {formatGroup(group)}
                <Tag color={GROUP_COLORS[group]} bordered={false}>
                  {prompts.length}
                </Tag>
              </Flex>
            ),
            children: (
              <Table
                dataSource={prompts}
                columns={getColumns(setViewing)}
                loading={isLoading}
                rowKey="key"
                pagination={false}
              />
            ),
          };
        })}
      />
      <PromptModal
        prompt={viewing}
        onClose={() => setViewing(null)}
        onOpenRevision={setRevisionId}
      />
      <RevisionDrawer
        revision={openRevision}
        onClose={() => setRevisionId(null)}
      />
    </>
  );
}
