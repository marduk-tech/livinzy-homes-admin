import { useAuth0 } from "@auth0/auth0-react";
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Divider,
  Drawer,
  Flex,
  Input,
  List,
  Popconfirm,
  Switch,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import {
  useRevisionActionMutation,
  useUpdateRevisionMutation,
} from "../../hooks/brickchat-hooks";
import {
  BrickchatRevision,
  BrickchatRevisionBlock,
} from "../../types/brickchat-revision";
import { REVISION_STATUS_COLORS } from "./revision-status";
import { TextDiff } from "./text-diff";

const formatDate = (date?: string) =>
  // @ant-design/pro-chat sets dayjs's global locale to zh-cn, so pin English
  date ? dayjs(date).locale("en").format("DD MMM YYYY, hh:mm A") : "";

// data blocks are JSON values - diff and edit them as formatted JSON
const bodyText = (body: unknown) =>
  typeof body === "string" ? body : JSON.stringify(body ?? null, null, 2);

const versionLabel = (version: number | null) =>
  version === null ? "the code default" : `v${version}`;

function RevisionBlockCard({
  revision,
  block,
}: {
  revision: BrickchatRevision;
  block: BrickchatRevisionBlock;
}) {
  const updateRevision = useUpdateRevisionMutation();
  const [showAll, setShowAll] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const isDraft = revision.status === "draft";

  // a draft can only go live on top of the version it was drafted from;
  // an active revision can only roll back while its version is the live one
  const stale = isDraft && block.activeVersion !== block.basedOnVersion;
  const superseded =
    revision.status === "active" && block.activeVersion !== block.version;

  const save = async () => {
    if (editing === null) return;
    let body: unknown = editing;
    if (block.kind === "data") {
      try {
        body = JSON.parse(editing);
      } catch {
        setJsonError("Not valid JSON");
        return;
      }
    }
    try {
      await updateRevision.mutateAsync({
        revisionId: revision._id,
        update: { blocks: [{ key: block.key, body }] },
      });
      setEditing(null);
    } catch {
      // the server's reason (e.g. a dropped placeholder) is toasted
    }
  };

  return (
    <Card
      size="small"
      title={
        <Flex align="center" gap={6} wrap>
          <Typography.Text strong>{block.key}</Typography.Text>
          {block.group ? <Tag>{block.group}</Tag> : null}
          <Tag bordered={false}>
            {versionLabel(block.basedOnVersion)} → v{block.version}
          </Tag>
        </Flex>
      }
      extra={
        <Flex align="center" gap={8}>
          <Flex align="center" gap={4}>
            <Switch size="small" checked={showAll} onChange={setShowAll} />
            <Typography.Text type="secondary">Full text</Typography.Text>
          </Flex>
          {isDraft && editing === null ? (
            <Button
              size="small"
              onClick={() => {
                setJsonError(null);
                setEditing(bodyText(block.proposedBody));
              }}
            >
              Edit
            </Button>
          ) : null}
        </Flex>
      }
    >
      {stale ? (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 8 }}
          message={`Active is now ${versionLabel(block.activeVersion)}, not ${versionLabel(block.basedOnVersion)} this was drafted from - activating will be refused. Reject this and generate again.`}
        />
      ) : null}
      {superseded ? (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 8 }}
          message={`Since replaced - active is now ${versionLabel(block.activeVersion)}.`}
        />
      ) : null}
      {editing !== null ? (
        <Flex vertical gap={8}>
          <Input.TextArea
            value={editing}
            onChange={(e) => {
              setJsonError(null);
              setEditing(e.target.value);
            }}
            autoSize={{ minRows: 8, maxRows: 24 }}
            style={{ fontFamily: "monospace" }}
            disabled={updateRevision.isPending}
          />
          {jsonError ? (
            <Typography.Text type="danger">{jsonError}</Typography.Text>
          ) : null}
          <Flex justify="end" gap={8}>
            <Button
              onClick={() => setEditing(null)}
              disabled={updateRevision.isPending}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              loading={updateRevision.isPending}
              onClick={save}
            >
              Save
            </Button>
          </Flex>
        </Flex>
      ) : (
        <TextDiff
          before={bodyText(block.baseBody)}
          after={bodyText(block.proposedBody)}
          showAll={showAll}
        />
      )}
    </Card>
  );
}

// Review panel for one prompt revision: why (rationale), for whom (the
// feedback cases it addresses), and what (a diff per block against the
// version it was drafted from). A draft can be edited, then activated - all
// its blocks go live together - or rejected; an active one rolled back.
export function RevisionDrawer({
  revision,
  onClose,
}: {
  revision: BrickchatRevision | null;
  onClose: () => void;
}) {
  const { user } = useAuth0();
  const updateRevision = useUpdateRevisionMutation();
  const revisionAction = useRevisionActionMutation();
  const [rationale, setRationale] = useState<string | null>(null);

  if (!revision) return null;

  const isDraft = revision.status === "draft";
  const reviewer = user?.email;
  const runAction = (action: "activate" | "reject" | "rollback") =>
    reviewer &&
    revisionAction.mutate({ revisionId: revision._id, action, reviewer });

  const saveRationale = async () => {
    try {
      await updateRevision.mutateAsync({
        revisionId: revision._id,
        update: { rationale: rationale ?? "" },
      });
      setRationale(null);
    } catch {
      // toasted by the mutation
    }
  };

  return (
    <Drawer
      title="Prompt revision"
      open={!!revision}
      onClose={() => {
        setRationale(null);
        onClose();
      }}
      width={960}
      destroyOnClose
      extra={
        <Flex gap={8}>
          {isDraft ? (
            <>
              <Popconfirm
                title="Reject this revision? Its cases go back to open."
                onConfirm={() => runAction("reject")}
              >
                <Button danger disabled={!reviewer || revisionAction.isPending}>
                  Reject
                </Button>
              </Popconfirm>
              <Popconfirm
                title={`Make all ${revision.blocks.length} block(s) live now?`}
                onConfirm={() => runAction("activate")}
              >
                <Button
                  type="primary"
                  loading={revisionAction.isPending}
                  disabled={!reviewer}
                >
                  Activate
                </Button>
              </Popconfirm>
            </>
          ) : null}
          {revision.status === "active" ? (
            <Popconfirm
              title="Roll back? Its blocks return to the versions they replaced, and its cases reopen."
              onConfirm={() => runAction("rollback")}
            >
              <Button
                danger
                loading={revisionAction.isPending}
                disabled={!reviewer}
              >
                Roll back
              </Button>
            </Popconfirm>
          ) : null}
        </Flex>
      }
    >
      <Descriptions column={2} size="small" bordered>
        <Descriptions.Item label="Status">
          <Tag color={REVISION_STATUS_COLORS[revision.status]}>
            {revision.status}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Source">{revision.source}</Descriptions.Item>
        <Descriptions.Item label="Created">
          {formatDate(revision.createdAt)}
          {revision.createdBy ? ` by ${revision.createdBy}` : ""}
        </Descriptions.Item>
        <Descriptions.Item label="Decided">
          {revision.status === "active"
            ? `Activated ${formatDate(revision.activatedAt)} by ${revision.approvedBy}`
            : revision.status === "rejected"
              ? `Rejected ${formatDate(revision.rejectedAt)} by ${revision.rejectedBy}`
              : revision.status === "rolled-back"
                ? `Rolled back ${formatDate(revision.rolledBackAt)} by ${revision.rolledBackBy}`
                : "Pending review"}
        </Descriptions.Item>
      </Descriptions>

      <Divider orientation="left">Rationale</Divider>
      {rationale !== null ? (
        <Flex vertical gap={8}>
          <Input.TextArea
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            autoSize={{ minRows: 3, maxRows: 8 }}
          />
          <Flex justify="end" gap={8}>
            <Button onClick={() => setRationale(null)}>Cancel</Button>
            <Button
              type="primary"
              loading={updateRevision.isPending}
              onClick={saveRationale}
            >
              Save
            </Button>
          </Flex>
        </Flex>
      ) : (
        <Flex align="start" justify="space-between" gap={8}>
          <Typography.Paragraph style={{ marginBottom: 0 }}>
            {revision.rationale || (
              <Typography.Text type="secondary">None</Typography.Text>
            )}
          </Typography.Paragraph>
          {isDraft ? (
            <Button size="small" onClick={() => setRationale(revision.rationale ?? "")}>
              Edit
            </Button>
          ) : null}
        </Flex>
      )}

      <Divider orientation="left">
        Cases ({revision.cases.length})
      </Divider>
      {revision.cases.length ? (
        <List
          size="small"
          bordered
          dataSource={revision.cases}
          renderItem={(c) => (
            <List.Item>
              <Flex vertical gap={2} style={{ width: "100%" }}>
                <Flex align="center" gap={6} wrap>
                  {c.rating ? <Tag>Rating {c.rating}</Tag> : null}
                  {c.category ? <Tag>{c.category}</Tag> : null}
                  {c.status ? <Tag bordered={false}>{c.status}</Tag> : null}
                  {c.query ? (
                    <Typography.Text type="secondary">“{c.query}”</Typography.Text>
                  ) : null}
                </Flex>
                {c.text ? <Typography.Text>{c.text}</Typography.Text> : null}
                {c.expected ? (
                  <Typography.Text type="secondary">
                    Expected: {c.expected}
                  </Typography.Text>
                ) : null}
              </Flex>
            </List.Item>
          )}
        />
      ) : (
        <Typography.Text type="secondary">
          None - not generated from feedback.
        </Typography.Text>
      )}

      <Divider orientation="left">
        Changes ({revision.blocks.length} block
        {revision.blocks.length === 1 ? "" : "s"})
      </Divider>
      <Flex vertical gap={12}>
        {revision.blocks.map((block) => (
          <RevisionBlockCard
            key={`${block.key}@${block.version}`}
            revision={revision}
            block={block}
          />
        ))}
      </Flex>
    </Drawer>
  );
}
