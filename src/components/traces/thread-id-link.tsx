import {
  ExportOutlined,
  LinkOutlined,
  ProfileOutlined,
} from "@ant-design/icons";
import { Button, Flex, Modal, Tooltip, Typography } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FONT_SIZES } from "../../theme/font-sizes";
import { BRICKFI_LOGGER_PATHS } from "./brickfi-logger-paths";

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

const linkOptionStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  width: "100%",
  height: "auto",
  padding: "10px 12px",
  textAlign: "left",
  whiteSpace: "normal",
};

// One row in the thread-links dialog: title + what it opens.
function ThreadLinkOption({
  icon,
  title,
  description,
  ...linkProps
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  target?: string;
  rel?: string;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
}) {
  return (
    <Button style={linkOptionStyle} {...linkProps}>
      {icon}
      <Flex vertical style={{ minWidth: 0 }}>
        <Typography.Text strong>{title}</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: FONT_SIZES.SUB_TEXT }}>
          {description}
        </Typography.Text>
      </Flex>
    </Button>
  );
}

// Icon button for a thread that opens a small dialog offering both places
// to inspect it: the LangSmith thread view (new tab) and this admin's own
// Brickfi Logger thread page (in-app navigation).
export function ThreadLinksButton({
  threadId,
  size = "small",
}: {
  threadId?: string | null;
  size?: "small" | "middle";
}) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    // rows that host this button are often clickable themselves, and React
    // bubbles events out of the Modal's portal too - so stop everything here
    <span onClick={(e) => e.stopPropagation()}>
      <Tooltip title="Open thread">
        <Button
          type={size === "small" ? "text" : "default"}
          size={size}
          icon={<LinkOutlined />}
          disabled={!threadId}
          aria-label="Open thread"
          onClick={() => setOpen(true)}
        />
      </Tooltip>
      {threadId && (
        <Modal
          open={open}
          onCancel={() => setOpen(false)}
          footer={null}
          title="Open thread"
          width={420}
          destroyOnClose
        >
          <Typography.Text
            type="secondary"
            copyable
            style={{ fontSize: FONT_SIZES.SUB_TEXT, fontFamily: "monospace" }}
          >
            {threadId}
          </Typography.Text>
          <Flex vertical gap={8} style={{ marginTop: 12 }}>
            <ThreadLinkOption
              icon={<ExportOutlined />}
              title="LangSmith"
              description="Full trace of every run in this thread (new tab)"
              href={langsmithThreadUrl(threadId)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
            />
            <ThreadLinkOption
              icon={<ProfileOutlined />}
              title="Brickfi Logger thread page"
              description="Turns, plan, step logs and LLM calls"
              href={BRICKFI_LOGGER_PATHS.thread(threadId)}
              onClick={(e) => {
                // ctrl/cmd-click still opens a new tab via the href
                if (e.metaKey || e.ctrlKey) return;
                e.preventDefault();
                setOpen(false);
                navigate(BRICKFI_LOGGER_PATHS.thread(threadId));
              }}
            />
          </Flex>
        </Modal>
      )}
    </span>
  );
}

// Thread id text with a thread-links button suffixed to it.
export function ThreadIdLink({ threadId }: { threadId: string }) {
  return (
    <Flex align="center" gap={4}>
      {/* <span>{threadId}</span> */}
      <ThreadLinksButton threadId={threadId} />
    </Flex>
  );
}
