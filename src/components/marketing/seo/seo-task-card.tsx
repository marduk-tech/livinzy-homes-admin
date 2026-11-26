import {
  Alert,
  Button,
  Card,
  Checkbox,
  Collapse,
  Descriptions,
  Flex,
  Input,
  Modal,
  Popconfirm,
  Radio,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import { useState } from "react";
import {
  useAddSeoTaskLesson,
  usePublishSeoTask,
  useRollbackSeoTask,
  useUpdateSeoTask,
} from "../../../hooks/seo-hooks";
import { SEO_CATEGORIES, SeoMeasure, SeoTask, SeoTaskGroup } from "../../../types/seo";
import { SeoDiff } from "./seo-diff";
import { SeoEvidence } from "./seo-evidence";

const PRIORITY_COLORS: Record<string, string> = { P1: "red", P2: "orange", P3: "blue", P4: "default" };
const STATUS_COLORS: Record<string, string> = {
  proposed: "blue",
  needs_changes: "orange",
  approved: "cyan",
  drafting: "processing",
  in_qa: "processing",
  ready: "green",
  published: "purple",
  measuring: "purple",
  done: "default",
  rejected: "default",
  rolled_back: "volcano",
  cancelled: "default",
};
const VERDICT_COLORS: Record<string, string> = { improved: "green", neutral: "default", worse: "red", pending: "blue" };

const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "-");

function MeasureTable({ d14, d28, baseline }: { d14?: SeoMeasure; d28?: SeoMeasure; baseline?: any }) {
  const row = (label: string, m?: SeoMeasure) =>
    m && m.before
      ? {
          key: label,
          label,
          clicks: `${m.before.clicks} → ${m.after.clicks}`,
          impressions: `${m.before.impressions} → ${m.after.impressions}`,
          ctr: `${((m.before.ctr || 0) * 100).toFixed(1)}% → ${((m.after.ctr || 0) * 100).toFixed(1)}%`,
          position: `${m.before.position?.toFixed(1) ?? "-"} → ${m.after.position?.toFixed(1) ?? "-"}`,
          conversions: m.conversions ? `${m.conversions.before} → ${m.conversions.after}` : "-",
          verdict: m.verdict,
        }
      : null;
  const rows = [row("Day 14", d14), row("Day 28", d28)].filter(Boolean);
  if (!rows.length) {
    return (
      <Typography.Text type="secondary">
        Waiting for data - day 14 is measured on day 17 and day 28 on day 31 (Search Console lags ~3 days).
        {baseline?.gsc && ` Baseline: ${baseline.gsc.clicks} clicks, ${baseline.gsc.impressions} impressions, position ${baseline.gsc.position?.toFixed(1)}.`}
      </Typography.Text>
    );
  }
  return (
    <Table
      size="small"
      pagination={false}
      dataSource={rows as any[]}
      columns={[
        { title: "", dataIndex: "label", width: 70 },
        { title: "Clicks", dataIndex: "clicks" },
        { title: "Impressions", dataIndex: "impressions" },
        { title: "CTR", dataIndex: "ctr" },
        { title: "Position", dataIndex: "position" },
        { title: "Conversions", dataIndex: "conversions" },
        { title: "Verdict", dataIndex: "verdict", render: (v) => v && <Tag color={VERDICT_COLORS[v]}>{v}</Tag> },
      ]}
    />
  );
}

export function SeoTaskCard({ task, group }: { task: SeoTask; group: SeoTaskGroup }) {
  const update = useUpdateSeoTask();
  const publish = usePublishSeoTask();
  const rollback = useRollbackSeoTask();
  const addLesson = useAddSeoTaskLesson();

  const [editing, setEditing] = useState(false);
  const [proposal, setProposal] = useState(task.proposal || "");
  const [priority, setPriority] = useState(task.priority);
  const [selectedOption, setSelectedOption] = useState<number | undefined>(task.draft?.selectedOption);
  const [selectedLinks, setSelectedLinks] = useState<number[]>(
    (task.draft?.options || []).map((o, i) => (o.selected ? i : -1)).filter((i) => i >= 0)
  );
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [toPlaybook, setToPlaybook] = useState(false);
  const [sendBackOpen, setSendBackOpen] = useState(false);
  const [sendBackNote, setSendBackNote] = useState("");
  const [lessonOpen, setLessonOpen] = useState(false);
  const [lesson, setLesson] = useState("");

  const busy = update.isPending || publish.isPending || rollback.isPending;
  const options = task.draft?.options || [];
  const inInbox = group === "inbox";

  const approve = () =>
    update.mutate({
      id: task._id,
      action: "approve",
      ...(editing ? { edits: { proposal, priority } } : {}),
      ...(task.category === 4 ? { selectedOption } : {}),
      ...(task.category === 5 ? { selectedLinks } : {}),
    });

  const header = (
    <Flex align="center" gap={8} wrap="wrap" style={{ width: "100%" }}>
      <Tag color={PRIORITY_COLORS[task.priority]}>{task.priority}</Tag>
      <Tag>{`${task.category} · ${SEO_CATEGORIES[task.category]}`}</Tag>
      <Typography.Text strong style={{ flex: 1, minWidth: 240 }}>
        {task.title}
      </Typography.Text>
      {task.results?.suggestRollback && <Tag color="red">rollback suggested</Tag>}
      {task.results?.verdict && task.results.verdict !== "pending" && (
        <Tag color={VERDICT_COLORS[task.results.verdict]}>{task.results.verdict}</Tag>
      )}
      <Tag color={STATUS_COLORS[task.status]}>{task.status.replace("_", " ")}</Tag>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {fmtDate(task.createdAt)}
      </Typography.Text>
    </Flex>
  );

  return (
    <Collapse
      style={{ marginBottom: 8, background: "white" }}
      items={[
        {
          key: task._id,
          label: header,
          children: (
            <Flex vertical gap={16}>
              {task.error && <Alert type="error" showIcon message={task.error} />}
              <Descriptions size="small" column={{ xs: 1, md: 2 }}>
                {task.targetUrl && (
                  <Descriptions.Item label="Page">
                    <a href={task.targetUrl} target="_blank" rel="noreferrer">
                      {task.targetUrl}
                    </a>
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="Trigger">
                  {task.trigger?.source} - {task.trigger?.rule}
                </Descriptions.Item>
                {task.links?.githubIssue && (
                  <Descriptions.Item label="GitHub issue">
                    <a href={task.links.githubIssue} target="_blank" rel="noreferrer">
                      {task.links.githubIssue}
                    </a>
                  </Descriptions.Item>
                )}
                {task.links?.previewUrl && (
                  <Descriptions.Item label="Ghost draft">
                    <a href={task.links.previewUrl} target="_blank" rel="noreferrer">
                      Open in Ghost
                    </a>
                  </Descriptions.Item>
                )}
                {task.approvedBy && <Descriptions.Item label="Approved by">{task.approvedBy}</Descriptions.Item>}
                {task.publishedAt && <Descriptions.Item label="Published">{fmtDate(task.publishedAt)}</Descriptions.Item>}
              </Descriptions>

              <Card size="small" title="Proposal">
                {editing ? (
                  <Flex vertical gap={8}>
                    <Input.TextArea rows={3} value={proposal} onChange={(e) => setProposal(e.target.value)} />
                    <Select
                      style={{ width: 120 }}
                      value={priority}
                      onChange={setPriority}
                      options={["P1", "P2", "P3", "P4"].map((p) => ({ value: p, label: p }))}
                    />
                  </Flex>
                ) : (
                  <Typography.Paragraph style={{ marginBottom: 4 }}>{task.proposal}</Typography.Paragraph>
                )}
                <Typography.Text type="secondary">Success metric: {task.successMetric}</Typography.Text>
              </Card>

              <Card size="small" title="Evidence">
                <SeoEvidence evidence={task.evidence} />
              </Card>

              {task.category === 4 && options.length > 0 && (
                <Card size="small" title="Pick a title and description (picking one approves it)">
                  <Radio.Group
                    value={selectedOption}
                    onChange={(e) => setSelectedOption(e.target.value)}
                    disabled={!inInbox}
                  >
                    <Space direction="vertical">
                      {options.map((o, i) => (
                        <Radio key={i} value={i}>
                          <div>
                            <b>{o.title}</b> <Typography.Text type="secondary">({o.title.length})</Typography.Text>
                          </div>
                          <div>
                            {o.description} <Typography.Text type="secondary">({o.description.length})</Typography.Text>
                          </div>
                          {o.rationale && (
                            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                              {o.rationale}
                            </Typography.Text>
                          )}
                        </Radio>
                      ))}
                    </Space>
                  </Radio.Group>
                  {task.draft?.before && (
                    <Typography.Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
                      Now: {task.draft.before.metaTitle} - {task.draft.before.metaDescription}
                    </Typography.Paragraph>
                  )}
                </Card>
              )}

              {task.category === 5 && (
                <Card size="small" title="Links to add (untick any that don't fit)">
                  {options.length ? (
                    <Checkbox.Group
                      value={selectedLinks}
                      onChange={(v) => setSelectedLinks(v as number[])}
                      disabled={!inInbox}
                      style={{ width: "100%" }}
                    >
                      <Space direction="vertical" style={{ width: "100%" }}>
                        {options.map((o, i) => (
                          <Checkbox key={i} value={i}>
                            <a href={o.sourceUrl} target="_blank" rel="noreferrer">
                              {o.sourceUrl}
                            </a>
                            <div style={{ fontSize: 13 }}>
                              “{o.sentence}” → link text <b>{o.anchorText}</b>
                            </div>
                            {o.reason && (
                              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                {o.reason}
                              </Typography.Text>
                            )}
                          </Checkbox>
                        ))}
                      </Space>
                    </Checkbox.Group>
                  ) : (
                    <Typography.Text type="secondary">
                      No related Ghost pages found to link from. Reject this, or add links in a template (GitHub issue).
                    </Typography.Text>
                  )}
                </Card>
              )}

              {task.qa?.notes && task.qa.notes.length > 0 && (
                <Alert
                  type={task.qa.passed ? "success" : "warning"}
                  showIcon
                  message={`QA ${task.qa.passed ? "passed" : "failed"}${task.qa.rounds ? ` (round ${task.qa.rounds})` : ""}`}
                  description={
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {task.qa.notes.map((n, i) => (
                        <li key={i}>{n}</li>
                      ))}
                    </ul>
                  }
                />
              )}

              {(group === "ready" || group === "measuring" || group === "closed") &&
                (task.draft?.after || task.draft?.before) &&
                task.category !== 4 && <SeoDiff before={task.draft?.before} after={task.draft?.after} />}

              {group === "measuring" && (
                <Card size="small" title="Results">
                  {task.category === 1 ? (
                    <Typography.Text>
                      {task.results?.d14
                        ? `Re-checked ${fmtDate((task.results.d14 as any).recheckedAt)}: ${task.results.d14.stillFailing} of ${task.results.d14.of} URLs still failing.`
                        : "Re-checked daily once the fix is deployed - closes when every URL passes."}
                    </Typography.Text>
                  ) : (
                    <MeasureTable d14={task.results?.d14} d28={task.results?.d28} baseline={task.baseline} />
                  )}
                  {task.inspections && task.inspections.length > 0 && (
                    <Flex gap={8} style={{ marginTop: 8 }} wrap="wrap">
                      {task.inspections.map((i, idx) => (
                        <Tag key={idx} color={i.doneAt ? (i.result?.indexed ? "green" : "red") : "default"}>
                          Inspection {fmtDate(i.dueAt)}:{" "}
                          {i.doneAt ? i.result?.coverageState || i.result?.verdict : "pending"}
                        </Tag>
                      ))}
                    </Flex>
                  )}
                </Card>
              )}

              {task.notes && task.notes.length > 0 && (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {task.notes.map((n) => `${fmtDate(n.at)} ${n.by || ""}: ${n.text}`).join(" · ")}
                </Typography.Text>
              )}

              {/* actions */}
              <Flex gap={8} wrap="wrap">
                {inInbox && (
                  <>
                    <Button
                      type="primary"
                      loading={update.isPending}
                      disabled={
                        (task.category === 4 && selectedOption == null) ||
                        (task.category === 5 && !selectedLinks.length)
                      }
                      onClick={approve}
                    >
                      {task.status === "needs_changes" ? "Approve again (redraft)" : "Approve"}
                    </Button>
                    <Button onClick={() => setEditing((e) => !e)}>{editing ? "Stop editing" : "Edit before approving"}</Button>
                    <Button disabled={busy} onClick={() => update.mutate({ id: task._id, action: "snooze", days: 7 })}>
                      Snooze 1 week
                    </Button>
                    <Button danger disabled={busy} onClick={() => setRejectOpen(true)}>
                      Reject
                    </Button>
                  </>
                )}
                {group === "in_progress" && (
                  <Popconfirm title="Cancel this task?" onConfirm={() => update.mutate({ id: task._id, action: "cancel" })}>
                    <Button danger disabled={busy}>
                      Cancel
                    </Button>
                  </Popconfirm>
                )}
                {group === "ready" && (
                  <>
                    <Popconfirm
                      title="Publish this change to the live page?"
                      onConfirm={() => publish.mutate(task._id)}
                    >
                      <Button type="primary" loading={publish.isPending}>
                        Publish
                      </Button>
                    </Popconfirm>
                    <Button disabled={busy} onClick={() => setSendBackOpen(true)}>
                      Send back with a note
                    </Button>
                    <Button danger disabled={busy} onClick={() => setRejectOpen(true)}>
                      Reject
                    </Button>
                  </>
                )}
                {group === "measuring" && (
                  <>
                    {[3, 4].includes(task.category) && task.targetRef?.kind !== "code" && (
                      <Popconfirm
                        title="Restore what was live before this change?"
                        onConfirm={() => rollback.mutate(task._id)}
                      >
                        <Button danger={task.results?.suggestRollback} loading={rollback.isPending}>
                          Roll back
                        </Button>
                      </Popconfirm>
                    )}
                    <Button disabled={busy} onClick={() => update.mutate({ id: task._id, action: "done" })}>
                      Mark done
                    </Button>
                    <Button onClick={() => setLessonOpen(true)}>Add a lesson to the playbook</Button>
                  </>
                )}
              </Flex>

              <Modal
                title="Reject task"
                open={rejectOpen}
                okText="Reject"
                okButtonProps={{ danger: true, loading: update.isPending }}
                onCancel={() => setRejectOpen(false)}
                onOk={() =>
                  update.mutate(
                    { id: task._id, action: "reject", reason: rejectReason, addToPlaybook: toPlaybook },
                    { onSuccess: () => setRejectOpen(false) }
                  )
                }
              >
                <Input.TextArea
                  rows={3}
                  placeholder="Why? (the agents learn from it if you add it to the playbook)"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
                <Checkbox style={{ marginTop: 8 }} checked={toPlaybook} onChange={(e) => setToPlaybook(e.target.checked)}>
                  Add the reason to the playbook as a correction
                </Checkbox>
              </Modal>
              <Modal
                title="Send back to the writer"
                open={sendBackOpen}
                okText="Send back"
                okButtonProps={{ loading: update.isPending }}
                onCancel={() => setSendBackOpen(false)}
                onOk={() =>
                  update.mutate(
                    { id: task._id, action: "send_back", note: sendBackNote },
                    { onSuccess: () => setSendBackOpen(false) }
                  )
                }
              >
                <Input.TextArea
                  rows={3}
                  placeholder="What should change?"
                  value={sendBackNote}
                  onChange={(e) => setSendBackNote(e.target.value)}
                />
              </Modal>
              <Modal
                title="Add a lesson to the playbook"
                open={lessonOpen}
                okText="Add"
                okButtonProps={{ loading: addLesson.isPending, disabled: !lesson.trim() }}
                onCancel={() => setLessonOpen(false)}
                onOk={() =>
                  addLesson.mutate({ id: task._id, text: lesson }, { onSuccess: () => setLessonOpen(false) })
                }
              >
                <Input.TextArea
                  rows={3}
                  placeholder='e.g. "Comparison pages convert; glossary terms rarely do"'
                  value={lesson}
                  onChange={(e) => setLesson(e.target.value)}
                />
              </Modal>
            </Flex>
          ),
        },
      ]}
    />
  );
}
