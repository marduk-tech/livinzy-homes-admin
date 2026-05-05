import { Collapse, Empty, Flex, Modal, Spin, Typography } from "antd";
import { useGetUserConversations } from "../../hooks/traces-hooks";
import { ConversationThread } from "../../types/conversation";
import { User } from "../../types/user";
import { FONT_SIZES } from "../../theme/font-sizes";
import { COLORS } from "../../theme/colors";
import DynamicReactIcon from "../common/dynamic-react-icon";

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
  fontWeight: 500,
  fontSize: FONT_SIZES.HEADING_4,
  color: "white",
};

const messageBox: React.CSSProperties = {
  padding: 12,
  backgroundColor: "#f5f5f5",
  borderTopRightRadius: 16,
  borderBottomRightRadius: 16,
  borderBottomLeftRadius: 16,
  marginBottom: 0,
};

const tsCaption: React.CSSProperties = {
  fontSize: 11,
  color: "#888",
  marginBottom: 12,
  alignSelf: "flex-end",
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
      style: {
        marginBottom: 8,
        background: COLORS.bgColorDark,
        borderRadius: 8,
        border: "none",
      },
      label: (
        <div>
          <div style={truncatedHeader}>
            {thread.firstQuestion || "(empty question)"}
          </div>
          <Typography.Text
            type="secondary"
            style={{ fontSize: FONT_SIZES.PARA, color: "white" }}
          >
            {formatTimestamp(thread.startTime)} · {thread.messages.length}{" "}
            conversation
            {thread.messages.length === 1 ? "" : "s"}
          </Typography.Text>
        </div>
      ),
      children: (
        <div style={{ height: 400, overflowY: "scroll" }}>
          {thread.messages.map((m, i) => (
            <div key={`${thread.threadId}-${i}`}>
              <Flex gap={2}>
                <DynamicReactIcon
                  size={14}
                  iconName="FiUser"
                  iconSet="fi"
                  color={COLORS.textColorDark}
                ></DynamicReactIcon>
                <Flex vertical>
                  <div style={messageBox}>{m.input || "(no input)"}</div>
                  {m.inputAt ? (
                    <div style={tsCaption}>{formatTimestamp(m.inputAt)}</div>
                  ) : null}
                </Flex>
              </Flex>

              <Flex gap={2}>
                <Flex>
                <DynamicReactIcon
                  size={14}
                  iconName="GiOilySpiral"
                  iconSet="gi"
                  color={COLORS.textColorDark}
                ></DynamicReactIcon>
                </Flex>
                <Flex vertical>
                <div
                  style={messageBox}
                  dangerouslySetInnerHTML={{
                    __html: m.output || "(no output)",
                  }}
                />
                {m.outputAt ? (
                  <div style={tsCaption}>{formatTimestamp(m.outputAt)}</div>
                ) : null}
                </Flex>
              </Flex>
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
      styles={{
        body: { maxHeight: "70vh", overflowY: "auto", scrollbarWidth: "none" },
      }}
      destroyOnClose
    >
      {renderBody()}
    </Modal>
  );
}
