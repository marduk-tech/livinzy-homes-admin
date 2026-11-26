import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Empty,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Segmented,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { useMemo, useState } from "react";
import {
  useCreateSeoHealthTask,
  useCreateSeoTaskFromTopic,
  useDeletePlaybookEntry,
  useRunSeoJob,
  useSavePlaybookEntry,
  useSeoHealth,
  useSeoPages,
  useSeoPlaybook,
  useSeoQuestions,
  useSeoSettings,
  useSeoSummary,
  useSeoTasks,
  useSetSeoPageIgnored,
  useUpdateSeoQuestionTopic,
  useUpdateSeoSettings,
} from "../../../hooks/seo-hooks";
import { SeoPlaybookEntry, SeoQuestionTopic, SeoTaskGroup } from "../../../types/seo";
import { SeoTaskCard } from "./seo-task-card";

const num = (v?: number) => (v == null ? "-" : Math.round(v).toLocaleString("en-IN"));

// --------------------------------------------------------------- task lists

const EMPTY_TEXT: Record<SeoTaskGroup, string> = {
  inbox: "Inbox is empty - the analyzer adds up to 10 tasks every Monday at 02:00.",
  in_progress: "Nothing is being drafted.",
  ready: "No drafts waiting to be published.",
  measuring: "No published tasks being measured.",
  closed: "No closed tasks yet.",
};

export function SeoTaskList({ group }: { group: SeoTaskGroup }) {
  const { data, isLoading } = useSeoTasks(group);
  if (isLoading) return <Spin />;
  if (!data?.length) return <Empty description={EMPTY_TEXT[group]} />;
  return (
    <div>
      {data.map((t) => (
        <SeoTaskCard key={t._id} task={t} group={group} />
      ))}
    </div>
  );
}

// ------------------------------------------------------------------- health

export function SeoHealthTab() {
  const { data, isLoading } = useSeoHealth();
  const createTask = useCreateSeoHealthTask();
  const ignore = useSetSeoPageIgnored();
  if (isLoading) return <Spin />;
  if (!data) return <Empty />;
  const coverage = data.coverage || {};
  const totalTracked = Object.values(coverage).reduce((a, b) => a + b, 0);

  return (
    <Flex vertical gap={16}>
      <Row gutter={12}>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic title="Failing checks" value={data.checks.reduce((n, c) => n + c.count, 0)} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic title="Indexed (of inspected)" value={coverage.PASS || 0} suffix={`/ ${totalTracked - (coverage.NOT_CHECKED || 0)}`} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic title="Not inspected yet" value={coverage.NOT_CHECKED || 0} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic title="Orphan pages" value={data.orphans.length} />
          </Card>
        </Col>
      </Row>

      <Card size="small" title={`Failing checks by cause (crawl of week ${data.weekOf})`}>
        {data.checks.length ? (
          <Table
            size="small"
            rowKey="cause"
            pagination={false}
            dataSource={data.checks}
            expandable={{
              expandedRowRender: (row) => (
                <Table
                  size="small"
                  rowKey="url"
                  pagination={{ pageSize: 10, hideOnSinglePage: true }}
                  dataSource={row.urls}
                  columns={[
                    { title: "URL", dataIndex: "url", render: (u) => <a href={u} target="_blank" rel="noreferrer">{u}</a> },
                    { title: "Expected", dataIndex: "expected", width: 150 },
                    { title: "Actual", dataIndex: "actual" },
                    {
                      title: "",
                      width: 90,
                      render: (_, r) => (
                        <Popconfirm title="Stop tracking this URL?" onConfirm={() => ignore.mutate({ url: r.url, ignored: true })}>
                          <Button size="small" type="link">
                            Ignore URL
                          </Button>
                        </Popconfirm>
                      ),
                    },
                  ]}
                />
              ),
            }}
            columns={[
              { title: "Cause", dataIndex: "cause" },
              { title: "Pages", dataIndex: "count", width: 80 },
              {
                title: "",
                width: 160,
                render: (_, row) =>
                  row.taskId ? (
                    <Tag color="blue">task created</Tag>
                  ) : (
                    <Button size="small" loading={createTask.isPending} onClick={() => createTask.mutate(row.cause)}>
                      Create a fix task
                    </Button>
                  ),
              },
            ]}
          />
        ) : (
          <Empty description="Every sitemap URL passed (or no crawl has run yet)." image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

      <Card size="small" title="Core Web Vitals per template (PageSpeed, mobile)">
        <Table
          size="small"
          rowKey="url"
          pagination={false}
          dataSource={data.coreWebVitals}
          locale={{ emptyText: "No PageSpeed run yet" }}
          columns={[
            { title: "Template", dataIndex: "template", width: 110 },
            { title: "URL", dataIndex: "url", render: (u) => <a href={u} target="_blank" rel="noreferrer">{u}</a> },
            {
              title: "LCP",
              dataIndex: "lcpMs",
              render: (v) => v != null && <Tag color={v > 2500 ? "red" : "green"}>{(v / 1000).toFixed(1)} s</Tag>,
            },
            {
              title: "INP",
              dataIndex: "inpMs",
              render: (v) => (v != null ? <Tag color={v > 200 ? "red" : "green"}>{Math.round(v)} ms</Tag> : "-"),
            },
            {
              title: "CLS",
              dataIndex: "cls",
              render: (v) => v != null && <Tag color={v > 0.1 ? "red" : "green"}>{v.toFixed(2)}</Tag>,
            },
            { title: "Data", dataIndex: "source", width: 70 },
          ]}
        />
      </Card>

      <Card size="small" title={`Not indexed (${data.notIndexed.length})`}>
        <Table
          size="small"
          rowKey="url"
          pagination={{ pageSize: 10, hideOnSinglePage: true }}
          dataSource={data.notIndexed}
          locale={{ emptyText: "None" }}
          columns={[
            { title: "URL", dataIndex: "url", render: (u) => <a href={u} target="_blank" rel="noreferrer">{u}</a> },
            { title: "Google says", render: (_, r) => r.latest?.indexVerdict },
            { title: "First seen", dataIndex: "firstSeenAt", render: (d) => d && new Date(d).toLocaleDateString("en-IN") },
          ]}
        />
      </Card>

      {data.orphans.length > 0 && (
        <Card size="small" title="Orphan pages (no internal links)">
          {data.orphans.slice(0, 100).map((o) => (
            <div key={o.url}>
              <a href={o.url} target="_blank" rel="noreferrer">
                {o.url}
              </a>
            </div>
          ))}
        </Card>
      )}
    </Flex>
  );
}

// ---------------------------------------------------------------- questions

export function SeoQuestionsTab() {
  const { data, isLoading } = useSeoQuestions();
  const markCovered = useUpdateSeoQuestionTopic();
  const createTask = useCreateSeoTaskFromTopic();
  const [covering, setCovering] = useState<SeoQuestionTopic | null>(null);
  const [coverUrl, setCoverUrl] = useState("");
  if (isLoading) return <Spin />;

  return (
    <>
      <Table
        size="small"
        rowKey="_id"
        dataSource={data || []}
        pagination={{ pageSize: 25 }}
        locale={{ emptyText: "No questions grouped yet - seo-collect runs Sunday 23:00." }}
        expandable={{
          expandedRowRender: (t) => (
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {t.exampleQuestions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          ),
        }}
        columns={[
          {
            title: "Topic",
            dataIndex: "label",
            render: (label, t) => (
              <Space>
                {label}
                {t.isComparison && <Tag color="purple">comparison</Tag>}
              </Space>
            ),
          },
          { title: "Last 7 days", dataIndex: "lastWeekCount", width: 100, sorter: (a, b) => (a.lastWeekCount || 0) - (b.lastWeekCount || 0) },
          {
            title: "Trend",
            width: 140,
            render: (_, t) => (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {t.trend.slice(-6).map((w) => w.count).join(" · ")}
              </Typography.Text>
            ),
          },
          {
            title: "Covering page",
            dataIndex: "coveredByUrl",
            render: (u, t) =>
              u ? (
                <Tooltip title={t.coverageNote}>
                  <a href={u} target="_blank" rel="noreferrer">
                    {u.replace(/^https?:\/\/[^/]+/, "")}
                  </a>
                </Tooltip>
              ) : (
                <Typography.Text type="warning">none</Typography.Text>
              ),
          },
          {
            title: "",
            width: 280,
            render: (_, t) => (
              <Space size={4} wrap>
                <Button size="small" onClick={() => { setCovering(t); setCoverUrl(t.coveredByUrl || ""); }}>
                  {t.coveredByUrl ? "Change page" : "Mark as covered"}
                </Button>
                {t.coveredByUrl ? (
                  <Button size="small" onClick={() => createTask.mutate({ id: t._id, category: 3 })}>
                    Refresh task
                  </Button>
                ) : (
                  <Button size="small" onClick={() => createTask.mutate({ id: t._id, category: 8 })}>
                    New content task
                  </Button>
                )}
              </Space>
            ),
          },
        ]}
      />
      <Modal
        title={`Which page answers "${covering?.label}"?`}
        open={!!covering}
        onCancel={() => setCovering(null)}
        okText="Save"
        onOk={() =>
          covering &&
          markCovered.mutate(
            { id: covering._id, coveredByUrl: coverUrl.trim() || null },
            { onSuccess: () => setCovering(null) }
          )
        }
      >
        <Input placeholder="https://www.brickfi.in/... (empty = not covered)" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} />
      </Modal>
    </>
  );
}

// -------------------------------------------------------------------- pages

const KIND_LABELS: Record<string, string> = {
  home: "Home",
  developer: "Developer",
  glossary: "Glossary",
  project: "Brick360",
  blog: "Blog",
  static: "Static",
  other: "Other",
};

export function SeoPagesTab() {
  const [kind, setKind] = useState<string | undefined>();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("impressions");
  const params = useMemo(() => ({ kind, q: q || undefined, page, pageSize: 50, sort }), [kind, q, page, sort]);
  const { data, isLoading } = useSeoPages(params);
  const ignore = useSetSeoPageIgnored();

  return (
    <Flex vertical gap={12}>
      <Flex gap={8} wrap="wrap" align="center">
        <Segmented
          value={kind || "all"}
          onChange={(v) => { setKind(v === "all" ? undefined : String(v)); setPage(1); }}
          options={[
            { value: "all", label: "All" },
            ...Object.entries(KIND_LABELS).map(([value, label]) => ({
              value,
              label: `${label}${data?.byKind?.[value] != null ? ` (${data.byKind[value]})` : ""}`,
            })),
          ]}
        />
        <Input.Search placeholder="Filter by URL" allowClear style={{ width: 240 }} onSearch={(v) => { setQ(v); setPage(1); }} />
        <Select
          value={sort}
          onChange={setSort}
          style={{ width: 160 }}
          options={[
            { value: "impressions", label: "Most impressions" },
            { value: "clicks", label: "Most clicks" },
            { value: "position", label: "Best position" },
            { value: "newest", label: "Newest" },
          ]}
        />
      </Flex>
      <Table
        size="small"
        rowKey="url"
        loading={isLoading}
        dataSource={data?.items || []}
        pagination={{ current: page, pageSize: 50, total: data?.total, onChange: setPage, showSizeChanger: false }}
        columns={[
          {
            title: "Page",
            dataIndex: "url",
            render: (u, p) => (
              <Flex vertical>
                <a href={u} target="_blank" rel="noreferrer">
                  {u.replace(/^https?:\/\//, "")}
                </a>
                {p.title && <Typography.Text type="secondary" style={{ fontSize: 12 }}>{p.title}</Typography.Text>}
              </Flex>
            ),
          },
          { title: "Type", dataIndex: "kind", width: 90, render: (k) => KIND_LABELS[k] || k },
          { title: "Clicks", render: (_, p) => num(p.latest?.clicks), width: 70 },
          { title: "Impr.", render: (_, p) => num(p.latest?.impressions), width: 80 },
          { title: "Pos.", render: (_, p) => p.latest?.position?.toFixed(1) ?? "-", width: 60 },
          { title: "Leads", render: (_, p) => num(p.latest?.conversions), width: 60 },
          {
            title: "Status",
            width: 70,
            render: (_, p) => p.latest?.status != null && <Tag color={p.latest.status === 200 ? "green" : "red"}>{p.latest.status}</Tag>,
          },
          {
            title: "Checks",
            width: 70,
            render: (_, p) => (p.latest?.failingChecks ? <Badge count={p.latest.failingChecks} /> : p.latest?.status ? "ok" : "-"),
          },
          { title: "In-links", render: (_, p) => p.latest?.inLinks ?? "-", width: 70 },
          {
            title: "Indexed",
            width: 80,
            render: (_, p) =>
              p.latest?.indexVerdict ? (
                <Tag color={p.latest.indexVerdict === "PASS" ? "green" : "orange"}>{p.latest.indexVerdict === "PASS" ? "yes" : "no"}</Tag>
              ) : (
                "-"
              ),
          },
          {
            title: "",
            width: 80,
            render: (_, p) => (
              <Button size="small" type="link" onClick={() => ignore.mutate({ url: p.url, ignored: !p.ignored })}>
                {p.ignored ? "Track" : "Ignore"}
              </Button>
            ),
          },
        ]}
      />
    </Flex>
  );
}

// ----------------------------------------------------------------- playbook

const KIND_HELP: Record<string, string> = {
  fact: "A fact the agents may state (with its source)",
  voice: "How Brickfi writes",
  rule: "Something to always / never do",
  correction: "A lesson from a rejected or measured task",
};

export function SeoPlaybookTab() {
  const { data, isLoading } = useSeoPlaybook();
  const save = useSavePlaybookEntry();
  const remove = useDeletePlaybookEntry();
  const [editing, setEditing] = useState<Partial<SeoPlaybookEntry> | null>(null);

  return (
    <Flex vertical gap={12}>
      <Alert
        type="info"
        showIcon
        message="The writer and the QA reviewer read every entry here on every draft."
      />
      <div>
        <Button type="primary" onClick={() => setEditing({ kind: "rule", text: "" })}>
          Add entry
        </Button>
      </div>
      <Table
        size="small"
        rowKey="_id"
        loading={isLoading}
        dataSource={data || []}
        pagination={false}
        columns={[
          { title: "Kind", dataIndex: "kind", width: 110, render: (k) => <Tooltip title={KIND_HELP[k]}><Tag>{k}</Tag></Tooltip> },
          { title: "Text", dataIndex: "text" },
          { title: "Added by", dataIndex: "addedBy", width: 160 },
          {
            title: "",
            width: 130,
            render: (_, e) => (
              <Space size={4}>
                <Button size="small" type="link" onClick={() => setEditing(e)}>
                  Edit
                </Button>
                <Popconfirm title="Delete this entry?" onConfirm={() => remove.mutate(e._id)}>
                  <Button size="small" type="link" danger>
                    Delete
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />
      <Modal
        title={editing?._id ? "Edit playbook entry" : "Add playbook entry"}
        open={!!editing}
        onCancel={() => setEditing(null)}
        okButtonProps={{ disabled: !editing?.text?.trim(), loading: save.isPending }}
        onOk={() =>
          editing &&
          save.mutate(
            { id: editing._id, kind: editing.kind, text: editing.text || "" },
            { onSuccess: () => setEditing(null) }
          )
        }
      >
        <Flex vertical gap={8}>
          <Select
            value={editing?.kind}
            onChange={(kind) => setEditing((e) => ({ ...e, kind }))}
            options={Object.entries(KIND_HELP).map(([value, help]) => ({ value, label: `${value} - ${help}` }))}
          />
          <Input.TextArea
            rows={4}
            value={editing?.text}
            onChange={(ev) => setEditing((e) => ({ ...e, text: ev.target.value }))}
          />
        </Flex>
      </Modal>
    </Flex>
  );
}

// ----------------------------------------------------------------- settings

const SETTING_HELP: Record<string, string> = {
  inboxCap: "Tasks the analyzer may add to the Inbox per week",
  nearPageOneMinPosition: "Refresh: queries from this position...",
  nearPageOneMaxPosition: "...to this position",
  nearPageOneMinImpressions: "...with at least this many impressions in 28 days",
  losingClicksDropPct: "Refresh: clicks down this % vs previous 28 days AND vs last year",
  losingClicksMinClicks: "...for pages with at least this many clicks before",
  lowCtrMinImpressions: "Titles: pages with at least this many impressions...",
  lowCtrRatio: "...and CTR under this share of the expected CTR for their position",
  overlapSharedQueriesPct: "Merge: two URLs sharing this % of their top queries",
  overlapMinImpressions: "...each with at least this many impressions",
  questionTopicMinCount: "New content / Refresh: topic asked this many times in 7 days",
  comparisonMinCount: "Comparison page: this many 'X vs Y' questions",
  unansweredQueryMinImpressions: "New content: query with this many impressions whose page ranks > 20",
  seasonalRisePct: "Seasonal: rose this % last year 4-6 weeks from now",
  seasonalMinImpressions: "...with at least this many impressions",
  notIndexedDays: "Indexing: not indexed this many days after the page appeared",
  weeklyInspectionBudget: "URL inspections per weekly run (Google allows 2,000/day)",
  cwvLcpMs: "Core Web Vitals: LCP limit (ms)",
  cwvInpMs: "Core Web Vitals: INP limit (ms)",
  cwvCls: "Core Web Vitals: CLS limit",
  crawlMaxUrls: "Crawler: max URLs per run",
  crawlConcurrency: "Crawler: parallel requests",
  conversionEvents: "PostHog events counted as organic conversions",
  maxQaRounds: "QA rounds before a draft goes back to the Inbox",
};

export function SeoSettingsTab() {
  const { data: summary } = useSeoSummary();
  const { data, isLoading } = useSeoSettings();
  const save = useUpdateSeoSettings();
  const runJob = useRunSeoJob();
  const [form] = Form.useForm();

  if (isLoading || !data) return <Spin />;

  return (
    <Flex vertical gap={16}>
      <Card size="small" title="Jobs">
        <Table
          size="small"
          rowKey="name"
          pagination={false}
          dataSource={summary?.jobs || []}
          columns={[
            { title: "Job", dataIndex: "name", width: 120 },
            { title: "Schedule (IST cron)", dataIndex: "schedule", width: 140 },
            { title: "Does", dataIndex: "does" },
            {
              title: "Last run",
              width: 220,
              render: (_, j) =>
                j.lastRun ? (
                  <Tooltip title={<pre style={{ margin: 0, fontSize: 11 }}>{JSON.stringify(j.lastRun.result || j.lastRun.error, null, 1)}</pre>}>
                    <Tag color={j.lastRun.status === "ok" ? "green" : j.lastRun.status === "failed" ? "red" : "processing"}>
                      {j.lastRun.status}
                    </Tag>
                    {new Date(j.lastRun.finishedAt || j.lastRun.startedAt).toLocaleString("en-IN")}
                  </Tooltip>
                ) : (
                  "never"
                ),
            },
            {
              title: "",
              width: 90,
              render: (_, j) => (
                <Button size="small" disabled={j.lastRun?.status === "running"} onClick={() => runJob.mutate(j.name)}>
                  Run now
                </Button>
              ),
            },
          ]}
        />
      </Card>

      <Card size="small" title="Integrations">
        <Flex gap={8} wrap="wrap">
          {Object.entries(summary?.integrations || {}).map(([k, ok]) => (
            <Tag key={k} color={ok ? "green" : "red"}>
              {k}: {ok ? "configured" : "not configured"}
            </Tag>
          ))}
        </Flex>
      </Card>

      <Card size="small" title="Rule thresholds">
        <Form
          form={form}
          layout="vertical"
          initialValues={data.thresholds}
          onFinish={(values) => save.mutate(values)}
        >
          <Row gutter={16}>
            {Object.keys(data.defaults).map((key) => (
              <Col xs={24} md={12} lg={8} key={key}>
                <Form.Item
                  name={key}
                  label={key}
                  tooltip={`${SETTING_HELP[key] || ""} (default: ${JSON.stringify(data.defaults[key])})`}
                >
                  {Array.isArray(data.defaults[key]) ? (
                    <Select mode="tags" tokenSeparators={[","]} />
                  ) : (
                    <InputNumber style={{ width: "100%" }} />
                  )}
                </Form.Item>
              </Col>
            ))}
          </Row>
          <Button type="primary" htmlType="submit" loading={save.isPending}>
            Save thresholds
          </Button>
        </Form>
      </Card>
    </Flex>
  );
}
