import { LinkOutlined } from "@ant-design/icons";
import { Button, Flex, Tooltip } from "antd";

export const langsmithThreadUrl = (threadId: string) =>
  `https://smith.langchain.com/o/f789969a-14ab-5073-b68e-2822efcebf90/projects/p/4e5569cf-0f16-4779-ac99-d4297e21b54f?runview=threads&peekedConversationId=${encodeURIComponent(threadId)}`;

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
      />
    </Tooltip>
  );
}

// Thread id text with a LangSmith link button suffixed to it.
export function ThreadIdLink({ threadId }: { threadId: string }) {
  return (
    <Flex align="center" gap={4}>
      <span>{threadId}</span>
      <LangsmithThreadButton threadId={threadId} />
    </Flex>
  );
}
