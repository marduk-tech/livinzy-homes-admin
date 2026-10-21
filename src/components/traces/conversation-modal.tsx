import { Empty, Flex, Modal, Spin, Tag, Typography } from "antd";
import ReactMarkdown from "react-markdown";
import { useGetBrickchatConversation } from "../../hooks/brickchat-hooks";
import { errorMessage } from "../../libs/api-error";
import { FONT_SIZES } from "../../theme/font-sizes";
import { BrickchatConversationTurn } from "../../types/brickchat-logger";

const inputBox: React.CSSProperties = {
  padding: "8px 12px",
  backgroundColor: "#e6f4ff",
  borderRadius: 6,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
};

const outputBox: React.CSSProperties = {
  padding: "4px 12px",
  backgroundColor: "#fafafa",
  border: "1px solid #f0f0f0",
  borderRadius: 6,
  fontSize: FONT_SIZES.PARA,
  wordBreak: "break-word",
};

function ConversationTurn({
  turn,
  index,
}: {
  turn: BrickchatConversationTurn;
  index: number;
}) {
  const { output } = turn;
  const projectCount = output?.projectsList?.length || 0;

  return (
    <div style={{ marginBottom: 24 }}>
      <Typography.Text type="secondary" style={{ fontSize: FONT_SIZES.SUB_TEXT }}>
        Turn {index + 1} · Input
      </Typography.Text>
      <div style={{ ...inputBox, margin: "4px 0 12px" }}>
        {turn.input || "(empty query)"}
      </div>

      <Flex gap={8} align="center">
        <Typography.Text type="secondary" style={{ fontSize: FONT_SIZES.SUB_TEXT }}>
          Output
        </Typography.Text>
        {projectCount > 0 && <Tag color="blue">{projectCount} projects</Tag>}
      </Flex>
      <div style={{ ...outputBox, marginTop: 4 }}>
        {output?.summary ? (
          <ReactMarkdown>{output.summary}</ReactMarkdown>
        ) : (
          <p>
            <Typography.Text type="secondary">
              {output ? "(empty summary)" : "(no response recorded)"}
            </Typography.Text>
          </p>
        )}
        {output?.followupPrompt && (
          <ReactMarkdown>{`*${output.followupPrompt}*`}</ReactMarkdown>
        )}
      </div>
    </div>
  );
}

export function ConversationModal({
  threadId,
  open,
  onClose,
}: {
  threadId: string;
  open: boolean;
  onClose: () => void;
}) {
  const { data, isLoading, isError, error } = useGetBrickchatConversation(
    threadId,
    open,
  );

  const renderBody = () => {
    if (isLoading) {
      return (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin />
        </div>
      );
    }
    if (isError) {
      return (
        <Empty description={errorMessage(error, "Failed to fetch conversation")} />
      );
    }
    if (!data?.turns?.length) {
      return <Empty description="No conversation found for this thread_id" />;
    }
    return data.turns.map((turn, i) => (
      <ConversationTurn key={i} turn={turn} index={i} />
    ));
  };

  return (
    <Modal
      title="Conversation"
      open={open}
      onCancel={onClose}
      footer={null}
      width={900}
      styles={{ body: { maxHeight: "75vh", overflowY: "auto" } }}
    >
      {renderBody()}
    </Modal>
  );
}
