import { Collapse, Empty, Modal, Spin, Typography } from "antd";
import { useGetUserConversations } from "../../hooks/traces-hooks";
import { ConversationThread } from "../../types/conversation";
import { User } from "../../types/user";

interface UserConversationsModalProps {
  user: User | null;
  open: boolean;
  onClose: () => void;
}

const formatTimestamp = (iso?: string) => {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const truncatedHeader: React.CSSProperties = {
  display: "-webkit-box",
  WebkitLineClamp: 1,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  textOverflow: "ellipsis",
  maxWidth: "100%",
};

const messageBox: React.CSSProperties = {
  padding: 12,
  backgroundColor: "#f5f5f5",
  borderRadius: 4,
  marginBottom: 8,
  maxHeight: 300,
  overflowY: "auto",
};

const tsCaption: React.CSSProperties = {
  fontSize: 11,
  color: "#888",
  marginBottom: 12,
};

export function UserConversationsModal({
  user,
  open,
  onClose,
}: UserConversationsModalProps) {
  const { data, isLoading, isError } = useGetUserConversations(user?._id);

  const renderBody = () => {
    if (isLoading) {
      return (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin />
        </div>
      );
    }
    if (isError) {
      return <Empty description="Failed to load conversations" />;
    }
    if (!data?.length) {
      return <Empty description="No conversations found for this user" />;
    }

    const items = (data as ConversationThread[]).map((thread) => ({
      key: thread.threadId,
      label: (
        <div>
          <div style={truncatedHeader}>
            {thread.firstQuestion || "(empty question)"}
          </div>
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            {formatTimestamp(thread.startTime)} · {thread.messages.length} turn
            {thread.messages.length === 1 ? "" : "s"}
          </Typography.Text>
        </div>
      ),
      children: (
        <div>
          {thread.messages.map((m, i) => (
            <div key={`${thread.threadId}-${i}`}>
              <Typography.Text strong>Input</Typography.Text>
              <div style={messageBox}>{m.input || "(no input)"}</div>
              {m.inputAt ? (
                <div style={tsCaption}>{formatTimestamp(m.inputAt)}</div>
              ) : null}

              <Typography.Text strong>Output</Typography.Text>
              <div
                style={messageBox}
                dangerouslySetInnerHTML={{ __html: m.output || "(no output)" }}
              />
              {m.outputAt ? (
                <div style={tsCaption}>{formatTimestamp(m.outputAt)}</div>
              ) : null}
            </div>
          ))}
        </div>
      ),
    }));

    return <Collapse accordion items={items} />;
  };

  return (
    <Modal
      title={
        user
          ? `Conversations — ${user.profile?.name || user.mobile || user._id}`
          : "Conversations"
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={900}
      styles={{ body: { maxHeight: "70vh", overflowY: "auto" } }}
      destroyOnClose
    >
      {renderBody()}
    </Modal>
  );
}
