import { LinkOutlined } from "@ant-design/icons";
import { Button, Flex, Tooltip } from "antd";

const LANGSMITH_PROJECT_URL =
  "https://smith.langchain.com/o/f789969a-14ab-5073-b68e-2822efcebf90/projects/p/4e5569cf-0f16-4779-ac99-d4297e21b54f";

export const langsmithThreadUrl = (threadId: string) =>
  `${LANGSMITH_PROJECT_URL}?runview=threads&peekedConversationId=${encodeURIComponent(threadId)}`;

// trace_id lets LangSmith open a nested (non-root) run inside its trace;
// without it the run page still resolves, just without the trace tree
export const langsmithRunUrl = (runId: string, traceId?: string) =>
  `${LANGSMITH_PROJECT_URL}/r/${encodeURIComponent(runId)}${traceId ? `?trace_id=${encodeURIComponent(traceId)}` : ""}`;

export function LangsmithRunButton({
  runId,
  traceId,
}: {
  runId?: string | null;
  traceId?: string;
}) {
  if (!runId) return null;
  return (
    <Tooltip title="View run in LangSmith">
      <Button
        type="text"
        size="small"
        icon={<LinkOutlined />}
        href={langsmithRunUrl(runId, traceId)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
      />
    </Tooltip>
  );
}

export function LangsmithThreadButton({
  threadId,
  size = "small",
}: {
  threadId?: string | null;
  size?: "small" | "middle";
}) {
  return (
    <Tooltip title="View thread in LangSmith">
      <Button
        type={size === "small" ? "text" : "default"}
        size={size}
        icon={<LinkOutlined />}
        disabled={!threadId}
        href={threadId ? langsmithThreadUrl(threadId) : undefined}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
      >View in Langsmith</Button>
    </Tooltip>
  );
}

// Thread id text with a LangSmith link button suffixed to it.
export function ThreadIdLink({ threadId }: { threadId: string }) {
  return (
    <Flex align="center" gap={4}>
      {/* <span>{threadId}</span> */}
      <LangsmithThreadButton threadId={threadId} />
    </Flex>
  );
}
