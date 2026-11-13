import { useAuth0 } from "@auth0/auth0-react";
import { GithubOutlined } from "@ant-design/icons";
import { Button, Flex, Modal, Select, Tag, Tooltip, Typography } from "antd";
import { createContext, useContext, useState } from "react";
import { useSendFeedbackToFactoryMutation } from "../../hooks/brickchat-hooks";
import {
  BrickchatFeedback,
  FACTORY_REPOS,
  FactoryRepo,
  FactoryStage,
  FactoryStatus,
} from "../../types/brickchat-feedback";

// Factory status by feedback id, polled once for the whole table
export const FactoryStatusContext = createContext<
  Record<string, FactoryStatus> | undefined
>(undefined);

const STAGE_TAGS: Record<FactoryStage, { label: string; color: string }> = {
  triaging: { label: "Triaging", color: "blue" },
  "needs-input": { label: "Needs your input", color: "volcano" },
  "in-progress": { label: "In progress", color: "processing" },
  "pr-open": { label: "PR open", color: "purple" },
  done: { label: "Done", color: "green" },
  closed: { label: "Closed", color: "default" },
  unknown: { label: "Status unavailable", color: "default" },
};

const stageTooltip = (status: FactoryStatus, issueRef: string) => {
  const prs = status.pullRequests ?? [];
  switch (status.stage) {
    case "needs-input":
      return "Factory has questions for you. Answer with a comment on the GitHub issue.";
    case "pr-open":
    case "done":
      return prs
        .map((pr) => `${pr.repo}#${pr.number} (${pr.state})`)
        .join(", ");
    case "closed":
      return `Factory closed ${issueRef} (${status.closedReason?.replace("_", " ") ?? "closed"})`;
    case "unknown":
      return status.error ?? "Couldn't read the GitHub issue";
    default:
      return `Sent to Factory as ${issueRef}`;
  }
};

// Where a click on the tag should go: the PR once there is one, the
// questions when Factory is waiting, otherwise the issue
const stageLink = (status: FactoryStatus | undefined, issueUrl: string) => {
  const prs = status?.pullRequests ?? [];
  const pr = prs.find((p) => p.state === "open") ?? prs[0];
  if (status?.stage === "needs-input" && status.triageCommentUrl) {
    return status.triageCommentUrl;
  }
  return pr?.url ?? issueUrl;
};

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

  const statuses = useContext(FactoryStatusContext);
  const issue = feedback.githubIssue;
  if (issue) {
    const status = statuses?.[feedback._id];
    const issueRef = `${issue.repo}#${issue.number}`;
    const stage = status ? STAGE_TAGS[status.stage] : undefined;
    const pr = status?.pullRequests?.find((p) => p.state === "open");
    return (
      <Tooltip
        title={
          status
            ? `${issueRef} · ${stageTooltip(status, issueRef)}`
            : `Sent to Factory as ${issueRef}`
        }
      >
        <Tag
          icon={<GithubOutlined />}
          color={stage?.color ?? "geekblue"}
          style={{ cursor: "pointer", marginInlineEnd: 0 }}
          onClick={() =>
            window.open(stageLink(status, issue.url), "_blank", "noopener")
          }
        >
          {/* the column keeps it short; the issue number is in the tooltip */}
          {compact && stage ? stage.label : `#${issue.number}`}
          {!compact && stage && ` · ${stage.label}`}
          {pr && ` #${pr.number}`}
        </Tag>
      </Tooltip>
    );
  }

  const reason = blockedReason(feedback);
  // in the table, rows that can't be sent stay quiet instead of showing a
  // column of disabled buttons
  if (compact && reason) {
    return (
      <Tooltip title={reason}>
        <Typography.Text type="secondary">—</Typography.Text>
      </Tooltip>
    );
  }
  const button = compact ? (
    <Button size="small" icon={<GithubOutlined />} onClick={() => setOpen(true)}>
      Send
    </Button>
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
