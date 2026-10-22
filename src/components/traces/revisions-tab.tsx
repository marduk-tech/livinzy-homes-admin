import { useAuth0 } from "@auth0/auth0-react";
import {
  Alert,
  Button,
  Card,
  Divider,
  Empty,
  Flex,
  Segmented,
  Table,
  TableColumnType,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import {
  useGenerateRevisionMutation,
  useGetRevisionGroups,
  useGetRevisions,
} from "../../hooks/brickchat-hooks";
import { errorMessage } from "../../libs/api-error";
import {
  BrickchatRevision,
  BrickchatRevisionCase,
  BrickchatRevisionGroup,
  BrickchatRevisionStatus,
} from "../../types/brickchat-revision";
import { RevisionDrawer } from "./revision-drawer";
import { REVISION_STATUS_COLORS } from "./revision-status";

// same limit the backend enforces (MAX_BLOCKS_PER_REVISION) - shown up front
// so a too-large selection is visible before generating
const MAX_BLOCKS_PER_REVISION = 6;

const formatDate = (date: string) =>
  // @ant-design/pro-chat sets dayjs's global locale to zh-cn, so pin English
  dayjs(date).locale("en").format("DD MMM YYYY, hh:mm A");

const caseColumns: TableColumnType<BrickchatRevisionCase>[] = [
  {
    title: "Feedback",
    key: "feedback",
    render: (_, c) => (
      <Flex vertical gap={2}>
        <Flex gap={4} wrap>
          {c.rating ? <Tag>Rating {c.rating}</Tag> : null}
          {c.category ? <Tag>{c.category}</Tag> : null}
        </Flex>
        {c.query ? (
          <Typography.Text type="secondary">“{c.query}”</Typography.Text>
        ) : null}
        {c.text ? <Typography.Text>{c.text}</Typography.Text> : null}
      </Flex>
    ),
  },
  {
    title: "Expected",
    dataIndex: "expected",
    key: "expected",
  },
  {
    title: "Blocks",
    dataIndex: "blocks",
    key: "blocks",
    render: (blocks: string[]) => (
      <Flex vertical gap={2}>
        {blocks.map((b) => (
          <Typography.Text key={b} code style={{ fontSize: 11 }}>
            {b}
          </Typography.Text>
        ))}
      </Flex>
    ),
  },
];

// One group of open cases: its blocks, its cases (all selected by default)
// and a button to draft a revision from the selected ones. Selecting fewer
// cases is how a too-large group gets split.
function OpenGroupCard({
  group,
  onGenerated,
  onViewRevision,
}: {
  group: BrickchatRevisionGroup;
  onGenerated: (revisionId: string) => void;
  onViewRevision: (revisionId: string) => void;
}) {
  const { user } = useAuth0();
  const generate = useGenerateRevisionMutation();
  const [checkedIds, setCheckedIds] = useState<string[]>(() =>
    group.cases.map((c) => c._id),
  );
  // a refetch can drop a case from the group (e.g. drafted elsewhere) -
  // only ever send the ones still in it
  const selectedIds = checkedIds.filter((id) =>
    group.cases.some((c) => c._id === id),
  );
  const selectedBlocks = new Set(
    group.cases
      .filter((c) => selectedIds.includes(c._id))
      .flatMap((c) => c.blocks),
  );
  const blocked = group.blockedByRevisionIds.length > 0;
  const tooMany = selectedBlocks.size > MAX_BLOCKS_PER_REVISION;

  return (
    <Card
      size="small"
      title={
        <Flex align="center" gap={6} wrap>
          {group.blocks.map((b) => (
            <Tag key={b} color="blue">
              {b}
            </Tag>
          ))}
        </Flex>
      }
      extra={
        <Button
          type="primary"
          loading={generate.isPending}
          disabled={!selectedIds.length || tooMany || blocked}
          onClick={async () => {
            try {
              const revision = await generate.mutateAsync({
                feedbackIds: selectedIds,
                createdBy: user?.email,
              });
              onGenerated(revision._id);
            } catch {
              // toasted by the mutation
            }
          }}
        >
          Generate revision ({selectedIds.length} case
          {selectedIds.length === 1 ? "" : "s"})
        </Button>
      }
    >
      {generate.isPending ? (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 8 }}
          message="Drafting the edits - this can take a minute."
        />
      ) : null}
      {blocked ? (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 8 }}
          message="A draft revision already touches some of these blocks - activate or reject it first."
          action={
            <Button
              size="small"
              onClick={() => onViewRevision(group.blockedByRevisionIds[0])}
            >
              View draft
            </Button>
          }
        />
      ) : null}
      {tooMany ? (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 8 }}
          message={`The selected cases touch ${selectedBlocks.size} blocks - one revision can touch at most ${MAX_BLOCKS_PER_REVISION}. Select fewer cases.`}
        />
      ) : null}
      <Table
        size="small"
        rowKey="_id"
        dataSource={group.cases}
        columns={caseColumns}
        pagination={false}
        rowSelection={{
          selectedRowKeys: selectedIds,
          onChange: (keys) => setCheckedIds(keys as string[]),
        }}
      />
    </Card>
  );
}

const STATUS_FILTERS: { label: string; value: BrickchatRevisionStatus | "all" }[] = [
  { label: "Drafts", value: "draft" },
  { label: "Active", value: "active" },
  { label: "All", value: "all" },
];

const getRevisionColumns = (
  onView: (revision: BrickchatRevision) => void,
): TableColumnType<BrickchatRevision>[] => [
  {
    title: "Created",
    dataIndex: "createdAt",
    key: "createdAt",
    width: 170,
    render: (createdAt: string) => formatDate(createdAt),
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    width: 110,
    render: (status: BrickchatRevisionStatus) => (
      <Tag color={REVISION_STATUS_COLORS[status]}>{status}</Tag>
    ),
  },
  {
    title: "Blocks",
    key: "blocks",
    render: (_, r) => (
      <Flex gap={4} wrap>
        {r.blocks.map((b) => (
          <Tag key={b.key}>{b.key}</Tag>
        ))}
      </Flex>
    ),
  },
  {
    title: "Cases",
    key: "cases",
    width: 70,
    render: (_, r) => r.feedbackIds.length,
  },
  {
    title: "Source",
    dataIndex: "source",
    key: "source",
    width: 140,
  },
  {
    title: "",
    key: "view",
    width: 70,
    render: (_, r) => (
      <Button type="link" onClick={() => onView(r)}>
        View
      </Button>
    ),
  },
];

// Turning confirmed feedback into prompt changes: open cases grouped by the
// blocks they implicate (each group drafts into one revision), and the
// revisions themselves - drafts to review, active ones to roll back.
export function RevisionsTab() {
  const groups = useGetRevisionGroups();
  // all revisions (the backend caps the list), filtered here - so the
  // drawer can find any revision by id, whatever the filter
  const revisions = useGetRevisions();
  const [statusFilter, setStatusFilter] = useState<
    BrickchatRevisionStatus | "all"
  >("draft");
  const [viewingId, setViewingId] = useState<string | null>(null);
  const viewing = revisions.data?.find((r) => r._id === viewingId) ?? null;

  const filtered =
    statusFilter === "all"
      ? revisions.data
      : revisions.data?.filter((r) => r.status === statusFilter);

  return (
    <>
      <Typography.Title level={5}>Open cases</Typography.Title>
      <Typography.Paragraph type="secondary">
        Confirmed, prompt-caused feedback not yet addressed - grouped so
        cases that share prompt blocks are fixed together.
      </Typography.Paragraph>
      {groups.isError ? (
        <Empty
          description={errorMessage(groups.error, "Failed to fetch open cases")}
        />
      ) : groups.isLoading ? (
        <Card loading size="small" />
      ) : !groups.data?.length ? (
        <Empty description="No open cases" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <Flex vertical gap={12}>
          {groups.data.map((group) => (
            <OpenGroupCard
              key={group.blocks.join(",")}
              group={group}
              onGenerated={setViewingId}
              onViewRevision={setViewingId}
            />
          ))}
        </Flex>
      )}

      <Divider />
      <Flex align="center" justify="space-between" style={{ marginBottom: 12 }}>
        <Typography.Title level={5} style={{ margin: 0 }}>
          Revisions
        </Typography.Title>
        <Segmented
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as BrickchatRevisionStatus | "all")}
          options={STATUS_FILTERS}
        />
      </Flex>
      {revisions.isError ? (
        <Empty
          description={errorMessage(revisions.error, "Failed to fetch revisions")}
        />
      ) : (
        <Table
          rowKey="_id"
          dataSource={filtered}
          columns={getRevisionColumns((r) => setViewingId(r._id))}
          loading={revisions.isLoading}
        />
      )}

      <RevisionDrawer revision={viewing} onClose={() => setViewingId(null)} />
    </>
  );
}
