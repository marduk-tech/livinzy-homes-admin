import { useAuth0 } from "@auth0/auth0-react";
import { GithubOutlined } from "@ant-design/icons";
import { Button, Flex, Modal, Select, Tag, Tooltip, Typography } from "antd";
import { useState } from "react";
import { useSendFeedbackToFactoryMutation } from "../../hooks/brickchat-hooks";
import {
  BrickchatFeedback,
  FACTORY_REPOS,
  FactoryRepo,
} from "../../types/brickchat-feedback";

// why the feedback can't be sent yet, if it can't
const blockedReason = (feedback: BrickchatFeedback) => {
  if (!feedback.assessment?.confirmedAt) {
    return "Confirm the assessment first";
  }
  if (feedback.assessment.rootCause === "not-an-issue") {
    return "Assessment says this is not an issue";
  }
  return null;
};

// Files the feedback as a GitHub issue that Mastra Factory picks up. Shows a
// link to the issue once it's been sent.
export function SendToFactoryButton({
  feedback,
  compact = false,
}: {
  feedback: BrickchatFeedback;
  compact?: boolean;
}) {
  const { user } = useAuth0();
  const sendToFactory = useSendFeedbackToFactoryMutation();
  const [open, setOpen] = useState(false);
  const [repo, setRepo] = useState<FactoryRepo>("livinzy-homes-services");

  const issue = feedback.githubIssue;
  if (issue) {
    return (
      <Tooltip title={`Sent to Factory as ${issue.repo}#${issue.number}`}>
        <Tag
          icon={<GithubOutlined />}
          color="geekblue"
          style={{ cursor: "pointer", marginInlineEnd: 0 }}
          onClick={() => window.open(issue.url, "_blank", "noopener")}
        >
          #{issue.number}
        </Tag>
      </Tooltip>
    );
  }

  const reason = blockedReason(feedback);
  const button = compact ? (
    <Button
      type="text"
      size="small"
      icon={<GithubOutlined />}
      disabled={!!reason}
      onClick={() => setOpen(true)}
    />
  ) : (
    <Button
      icon={<GithubOutlined />}
      disabled={!!reason}
      onClick={() => setOpen(true)}
    >
      Send to Factory
    </Button>
  );

  return (
    <>
      <Tooltip title={reason ?? "Send to Factory"}>{button}</Tooltip>
      <Modal
        title="Send to Factory"
        open={open}
        okText="Create issue"
        confirmLoading={sendToFactory.isPending}
        onCancel={() => setOpen(false)}
        onOk={() =>
          sendToFactory
            .mutateAsync({ id: feedback._id, repo, requestedBy: user?.email })
            .then(() => setOpen(false))
            // errors are toasted by the mutation
            .catch(() => {})
        }
        destroyOnClose
      >
        <Flex vertical gap={12}>
          <Typography.Text>
            Opens a GitHub issue with this feedback, its snapshot and the
            confirmed assessment. Factory files it straight into Triage and
            starts investigating automatically.
          </Typography.Text>
          <Flex vertical gap={4}>
            <Typography.Text strong>Start in</Typography.Text>
            <Select
              value={repo}
              onChange={setRepo}
              options={FACTORY_REPOS.map((r) => ({ value: r, label: r }))}
            />
            <Typography.Text type="secondary">
              The agent has all three repos checked out and opens a PR in each
              one it changes.
            </Typography.Text>
          </Flex>
        </Flex>
      </Modal>
    </>
  );
}
