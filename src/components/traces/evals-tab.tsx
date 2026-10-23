import { useAuth0 } from "@auth0/auth0-react";
import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  UploadOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Empty,
  Flex,
  Menu,
  Popconfirm,
  Spin,
  Table,
  TableColumnType,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  isEvalRunActive,
  useDeleteEvalCaseMutation,
  useGetEvalCases,
  useGetEvalRun,
  useGetEvalRuns,
  useStartEvalRunMutation,
  useStopEvalRunMutation,
} from "../../hooks/brickchat-hooks";
import { FONT_SIZES } from "../../theme/font-sizes";
import {
  EvalCase,
  EvalCaseInput,
  EvalLastResult,
  EvalRunListItem,
} from "../../types/brickchat-eval";
import { BRICKFI_LOGGER_PATHS } from "./brickfi-logger-paths";
import { EvalCaseDrawer } from "./eval-case-drawer";
import { EvalCaseResultView } from "./eval-case-result";
import { downloadEvalCases } from "./eval-export";
import { EvalImportModal } from "./eval-import-modal";
import { JudgeScores } from "./eval-judge-scores";
import { EvalRunDetail } from "./eval-run-detail";
import {
  EVAL_RUN_STATUS_COLORS,
  EVAL_STATUS_COLORS,
  formatEvalDate,
  formatSeconds,
  runDurationMs,
  runScopeLabel,
} from "./eval-status";

// only fetched when the row is expanded
function LastResultDetail({
  caseId,
  lastResult,
}: {
  caseId: string;
  lastResult: EvalLastResult;
}) {
  const { data: run, isLoading } = useGetEvalRun(lastResult.runId);
  if (isLoading) return <Spin size="small" />;
  const result = run?.results.find((r) => r.id === caseId);
  return result ? (
    <EvalCaseResultView result={result} />
  ) : (
    <Empty description="Result not found" />
  );
}

function LastResultCell({ lastResult }: { lastResult: EvalLastResult | null }) {
  const navigate = useNavigate();
  if (!lastResult)
    return <Typography.Text type="secondary">Not run yet</Typography.Text>;
  return (
    <Flex vertical gap={2} align="start">
      <Flex gap={4} align="center">
        <Tag color={EVAL_STATUS_COLORS[lastResult.status]}>
          {lastResult.status}
        </Tag>
        <JudgeScores judge={lastResult.judge} />
      </Flex>
      <Typography.Link
        style={{ fontSize: FONT_SIZES.SUB_TEXT }}
        onClick={(e) => {
          e.stopPropagation();
          navigate(BRICKFI_LOGGER_PATHS.evalRun(lastResult.runId));
        }}
      >
        {formatEvalDate(lastResult.runAt)} ·{" "}
        {formatSeconds(lastResult.latencyMs)}
      </Typography.Link>
    </Flex>
  );
}

const caseColumns: TableColumnType<EvalCase>[] = [
  {
    title: "Use case",
    dataIndex: "category",
    key: "category",
    width: 170,
    render: (category: string) => <Tag bordered={false}>{category}</Tag>,
  },
  {
    title: "Case",
    key: "id",
    width: 220,
    render: (_, c) => (
      <Flex gap={4} align="center" wrap>
        <Typography.Text>{c.id}</Typography.Text>
        {c.knownIssue ? (
          <Tooltip title={c.knownIssue}>
            <WarningOutlined style={{ color: "orange" }} />
          </Tooltip>
        ) : null}
      </Flex>
    ),
  },
  {
    title: "Turns",
    key: "turns",
    render: (_, c) => (
      <Flex vertical gap={4}>
        {c.turns.map((t, i) => (
          <Flex key={i} gap={4} wrap align="center">
            <Typography.Text>
              {i + 1}. {t.q}
            </Typography.Text>
            {t.expectIntent ? <Tag color="blue">{t.expectIntent}</Tag> : null}
            {t.expectTools?.map((tool) => (
              <Tag key={tool} bordered={false}>
                {tool}
              </Tag>
            ))}
          </Flex>
        ))}
      </Flex>
    ),
  },
  {
    title: "Last result",
    key: "lastResult",
    width: 200,
    render: (_, c) => <LastResultCell lastResult={c.lastResult} />,
  },
];

function ActiveRunBanner({ run }: { run: EvalRunListItem }) {
  const navigate = useNavigate();
  const stop = useStopEvalRunMutation();
  return (
    <Alert
      type="info"
      showIcon
      message={
        <>
          Running <b>{runScopeLabel(run)}</b> - {run.resultsCount} /{" "}
          {run.casesTotal ?? "?"} cases done,{" "}
          {formatSeconds(runDurationMs(run))} so far
          {run.triggeredBy ? ` (started by ${run.triggeredBy})` : ""}
        </>
      }
      action={
        <Flex gap={8}>
          <Button
            size="small"
            onClick={() => navigate(BRICKFI_LOGGER_PATHS.evalRun(run._id))}
          >
            View
          </Button>
          <Popconfirm
            title="Stop this run?"
            onConfirm={() => stop.mutate(run._id)}
          >
            <Button size="small" danger loading={stop.isPending}>
              Stop
            </Button>
          </Popconfirm>
        </Flex>
      }
    />
  );
}

const toInput = ({ lastResult: _lastResult, ...c }: EvalCase): EvalCaseInput =>
  c;

function CasesView({
  intents,
  tools,
  softFamilies,
  cases,
  runActive,
}: {
  intents: string[];
  tools: string[];
  softFamilies: string[];
  cases: EvalCase[];
  runActive: boolean;
}) {
  const navigate = useNavigate();
  const { user } = useAuth0();
  const start = useStartEvalRunMutation();
  const deleteCase = useDeleteEvalCaseMutation();
  const [selectedIntent, setSelectedIntent] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // null: closed, "new": adding, otherwise the case being edited
  const [drawerCase, setDrawerCase] = useState<EvalCaseInput | "new" | null>(
    null,
  );
  const [importOpen, setImportOpen] = useState(false);

  const categoriesByIntent = useMemo(() => {
    const byIntent: Record<string, string[]> = {};
    for (const c of cases) {
      byIntent[c.intent] = byIntent[c.intent] ?? [];
      if (!byIntent[c.intent].includes(c.category))
        byIntent[c.intent].push(c.category);
    }
    return byIntent;
  }, [cases]);

  const actionsColumn: TableColumnType<EvalCase> = {
    key: "actions",
    width: 80,
    render: (_, c) => (
      <Flex gap={2} onClick={(e) => e.stopPropagation()}>
        <Tooltip title="Edit">
          <Button
            size="small"
            type="text"
            icon={<EditOutlined />}
            onClick={() => setDrawerCase(toInput(c))}
          />
        </Tooltip>
        <Popconfirm
          title={`Delete ${c.id}?`}
          description="Past run results stay, but the case won't run again."
          okText="Delete"
          okButtonProps={{ danger: true }}
          onConfirm={() => deleteCase.mutate(c.id)}
        >
          <Button size="small" type="text" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      </Flex>
    ),
  };

  const intent =
    selectedIntent ??
    intents.find((i) => cases.some((c) => c.intent === i)) ??
    intents[0];
  const intentCases = cases.filter((c) => c.intent === intent);
  // selections from another intent don't carry over
  const selected = selectedIds.filter((id) =>
    intentCases.some((c) => c.id === id),
  );

  const run = async (payload: { intent?: string; caseIds?: string[] }) => {
    try {
      const created = await start.mutateAsync({
        ...payload,
        triggeredBy: user?.email,
      });
      setSelectedIds([]);
      navigate(BRICKFI_LOGGER_PATHS.evalRun(created._id));
    } catch {
      // toasted by the mutation
    }
  };

  const runDisabledReason = runActive
    ? "Another run is in progress"
    : undefined;

  return (
    <Flex vertical gap={12}>
      <Flex justify="space-between" align="center" wrap gap={8}>
        <Typography.Text type="secondary">
          {cases.length} case{cases.length === 1 ? "" : "s"} across{" "}
          {new Set(cases.map((c) => c.intent)).size} intents
        </Typography.Text>
        <Flex gap={8}>
          <Button icon={<UploadOutlined />} onClick={() => setImportOpen(true)}>
            Import JSON
          </Button>
          <Button
            icon={<DownloadOutlined />}
            disabled={!cases.length}
            onClick={downloadEvalCases}
          >
            Export JSON
          </Button>
          <Button icon={<PlusOutlined />} onClick={() => setDrawerCase("new")}>
            New case
          </Button>
        </Flex>
      </Flex>
      <Flex gap={16} align="start" wrap>
        <Menu
          mode="inline"
          style={{ width: 260, flexShrink: 0 }}
          selectedKeys={[intent]}
          onClick={({ key }) => setSelectedIntent(key)}
          items={intents.map((i) => {
            const ofIntent = cases.filter((c) => c.intent === i);
            const passed = ofIntent.filter((c) => c.lastResult?.pass).length;
            return {
              key: i,
              disabled: !ofIntent.length,
              label: (
                <Flex justify="space-between">
                  <span>{i}</span>
                  <Typography.Text
                    type="secondary"
                    style={{ fontSize: FONT_SIZES.SUB_TEXT }}
                  >
                    {ofIntent.length}
                    {ofIntent.length ? ` · ${passed}✓` : ""}
                  </Typography.Text>
                </Flex>
              ),
            };
          })}
        />

        <Card
          size="small"
          style={{ flex: 1, minWidth: 320 }}
          title={`${intent} (${intentCases.length})`}
          extra={
            <Flex gap={8}>
              <Tooltip title={runDisabledReason}>
                <Button
                  disabled={!selected.length || runActive}
                  loading={start.isPending && !!selected.length}
                  onClick={() => run({ caseIds: selected })}
                >
                  Run selected ({selected.length})
                </Button>
              </Tooltip>
              <Tooltip title={runDisabledReason}>
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  disabled={!intentCases.length || runActive}
                  loading={start.isPending && !selected.length}
                  onClick={() => run({ intent })}
                >
                  Run {intent}
                </Button>
              </Tooltip>
            </Flex>
          }
        >
          {intentCases.length ? (
            <Table
              size="small"
              rowKey="id"
              pagination={false}
              columns={[...caseColumns, actionsColumn]}
              dataSource={[...intentCases].sort((a, b) =>
                a.category.localeCompare(b.category),
              )}
              rowSelection={{
                selectedRowKeys: selected,
                onChange: (keys) => setSelectedIds(keys as string[]),
              }}
              expandable={{
                rowExpandable: (c) => !!c.lastResult,
                expandedRowRender: (c) => (
                  <LastResultDetail caseId={c.id} lastResult={c.lastResult!} />
                ),
              }}
            />
          ) : (
            <Empty
              description={
                cases.length
                  ? "No cases for this intent yet"
                  : "No cases yet - import queries.json or add one"
              }
            />
          )}
        </Card>
      </Flex>

      <EvalCaseDrawer
        open={drawerCase !== null}
        editing={drawerCase === "new" ? null : drawerCase}
        defaultIntent={intent}
        intents={intents}
        tools={tools}
        softFamilies={softFamilies}
        categoriesByIntent={categoriesByIntent}
        onClose={() => setDrawerCase(null)}
      />
      <EvalImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </Flex>
  );
}

const runColumns: TableColumnType<EvalRunListItem>[] = [
  {
    title: "Started",
    key: "started",
    render: (_, r) => formatEvalDate(r.startedAt || r.createdAt),
  },
  {
    title: "Scope",
    key: "scope",
    render: (_, r) =>
      r.scope?.caseIds?.length ? (
        <Tooltip title={r.scope.caseIds.join(", ")}>
          <Tag>{runScopeLabel(r)}</Tag>
        </Tooltip>
      ) : (
        <Tag color="blue">{runScopeLabel(r)}</Tag>
      ),
  },
  {
    title: "Status",
    key: "status",
    render: (_, r) => (
      <Tag color={EVAL_RUN_STATUS_COLORS[r.status]}>{r.status}</Tag>
    ),
  },
  {
    title: "Passed",
    key: "passed",
    render: (_, r) => `${r.passed} / ${r.casesTotal ?? r.resultsCount}`,
  },
  {
    title: "Judge r / f / rt",
    key: "judge",
    render: (_, r) => (
      <JudgeScores
        judge={{
          relevance: r.avgRelevance ?? undefined,
          faithfulness: r.avgFaithfulness ?? undefined,
          routing: r.avgRouting ?? undefined,
        }}
      />
    ),
  },
  {
    title: "Duration",
    key: "duration",
    render: (_, r) => formatSeconds(runDurationMs(r)),
  },
];

export function EvalsTab() {
  const { runId } = useParams<{ runId?: string }>();
  const navigate = useNavigate();
  const runs = useGetEvalRuns();
  const activeRun = runs.data?.find((r) => isEvalRunActive(r.status));
  const cases = useGetEvalCases(!!activeRun);

  const caseOrder = useMemo(
    () => new Map((cases.data?.cases ?? []).map((c, i) => [c.id, i])),
    [cases.data],
  );

  if (runId) {
    return <EvalRunDetail runId={runId} caseOrder={caseOrder} />;
  }

  return (
    <Flex vertical gap={16}>
      {activeRun ? <ActiveRunBanner run={activeRun} /> : null}

      {cases.isLoading ? (
        <Spin />
      ) : cases.data ? (
        <CasesView
          intents={cases.data.intents}
          tools={cases.data.tools}
          softFamilies={cases.data.softFamilies}
          cases={cases.data.cases}
          runActive={!!activeRun}
        />
      ) : (
        <Empty description="Couldn't load eval cases" />
      )}

      <Flex vertical gap={4}>
        <Typography.Text strong>Runs</Typography.Text>
        <Table
          size="small"
          rowKey="_id"
          loading={runs.isLoading}
          columns={runColumns}
          dataSource={runs.data ?? []}
          pagination={{ pageSize: 10, hideOnSinglePage: true }}
          onRow={(r) => ({
            onClick: () => navigate(BRICKFI_LOGGER_PATHS.evalRun(r._id)),
            style: { cursor: "pointer" },
          })}
          locale={{
            emptyText: "No runs yet - pick an intent above and run it",
          }}
        />
      </Flex>
    </Flex>
  );
}
