import { ArrowLeftOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Descriptions,
  Empty,
  Flex,
  Popconfirm,
  Progress,
  Spin,
  Table,
  TableColumnType,
  Tag,
  Typography,
} from "antd";
import { useNavigate } from "react-router-dom";
import {
  isEvalRunActive,
  useGetEvalRun,
  useStopEvalRunMutation,
} from "../../hooks/brickchat-hooks";
import { EvalCaseResult, EvalSummaryRow } from "../../types/brickchat-eval";
import { BRICKFI_LOGGER_PATHS, BRICKFI_LOGGER_TABS } from "./brickfi-logger-paths";
import { EvalCaseResultView } from "./eval-case-result";
import { JudgeScores } from "./eval-judge-scores";
import {
  EVAL_RUN_STATUS_COLORS,
  EVAL_STATUS_COLORS,
  formatEvalDate,
  formatSeconds,
  runDurationMs,
  runScopeLabel,
} from "./eval-status";

type SummaryRow = EvalSummaryRow & { key: string };

const summaryColumns = (keyTitle: string): TableColumnType<SummaryRow>[] => [
  { title: keyTitle, dataIndex: "key", key: "key" },
  {
    title: "Passed",
    key: "passed",
    render: (_, r) => `${r.passed} / ${r.cases}`,
  },
  { title: "Known fail", dataIndex: "knownFail", key: "knownFail" },
  { title: "Plan mismatches", dataIndex: "planMismatches", key: "planMismatches" },
  { title: "Empty tool runs", dataIndex: "emptyToolRuns", key: "emptyToolRuns" },
  { title: "Errors", dataIndex: "errors", key: "errors" },
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
    title: "Avg turn",
    key: "latency",
    render: (_, r) => formatSeconds(r.avgTurnLatencyMs),
  },
];

function SummaryTable({
  title,
  keyTitle,
  rows,
}: {
  title: string;
  keyTitle: string;
  rows?: Record<string, EvalSummaryRow>;
}) {
  if (!rows || !Object.keys(rows).length) return null;
  return (
    <Flex vertical gap={4}>
      <Typography.Text strong>{title}</Typography.Text>
      <Table
        size="small"
        pagination={false}
        columns={summaryColumns(keyTitle)}
        dataSource={Object.entries(rows).map(([key, row]) => ({ ...row, key }))}
      />
    </Flex>
  );
}

const resultColumns: TableColumnType<EvalCaseResult>[] = [
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    width: 110,
    render: (status: EvalCaseResult["status"]) => (
      <Tag color={EVAL_STATUS_COLORS[status]}>{status}</Tag>
    ),
  },
  { title: "Case", dataIndex: "id", key: "id" },
  {
    title: "Use case",
    dataIndex: "category",
    key: "category",
    render: (category: string) => <Tag bordered={false}>{category}</Tag>,
  },
  {
    title: "Intents",
    key: "intents",
    render: (_, r) =>
      r.turns.map((t) => t.intent ?? "-").join(" → ") || "-",
  },
  {
    title: "Judge",
    key: "judge",
    render: (_, r) => <JudgeScores judge={r.judge} />,
  },
  {
    title: "Latency",
    key: "latency",
    render: (_, r) =>
      formatSeconds(r.turns.reduce((sum, t) => sum + (t.latencyMs || 0), 0)),
  },
];

// caseOrder keeps results in sample-set order while they arrive
export function EvalRunDetail({
  runId,
  caseOrder,
}: {
  runId: string;
  caseOrder: Map<string, number>;
}) {
  const navigate = useNavigate();
  const { data: run, isLoading, error } = useGetEvalRun(runId);
  const stop = useStopEvalRunMutation();
  const back = () => navigate(BRICKFI_LOGGER_PATHS.tab(BRICKFI_LOGGER_TABS.evals));

  if (isLoading) return <Spin />;
  if (error || !run) {
    return (
      <Flex vertical gap={8} align="start">
        <Button icon={<ArrowLeftOutlined />} onClick={back}>
          Back to evals
        </Button>
        <Empty description="Couldn't load this run" />
      </Flex>
    );
  }

  const active = isEvalRunActive(run.status);
  const orderOf = (id: string) => caseOrder.get(id) ?? Number.MAX_SAFE_INTEGER;
  const results = [...run.results].sort((a, b) => orderOf(a.id) - orderOf(b.id));
  const intents = [...new Set(results.map((r) => r.intent || "unassigned"))];

  return (
    <Flex vertical gap={16}>
      <Flex justify="space-between" align="center" wrap gap={8}>
        <Flex align="center" gap={8} wrap>
          <Button icon={<ArrowLeftOutlined />} onClick={back} />
          <Typography.Title level={5} style={{ margin: 0 }}>
            {runScopeLabel(run)}
          </Typography.Title>
          <Tag color={EVAL_RUN_STATUS_COLORS[run.status]}>{run.status}</Tag>
        </Flex>
        {active ? (
          <Popconfirm title="Stop this run?" onConfirm={() => stop.mutate(run._id)}>
            <Button danger loading={stop.isPending}>
              Stop
            </Button>
          </Popconfirm>
        ) : null}
      </Flex>

      <Descriptions size="small" column={{ xs: 1, md: 3 }}>
        <Descriptions.Item label="Started">{formatEvalDate(run.startedAt || run.createdAt)}</Descriptions.Item>
        <Descriptions.Item label="Duration">{formatSeconds(runDurationMs(run))}</Descriptions.Item>
        <Descriptions.Item label="Triggered by">{run.triggeredBy || "-"}</Descriptions.Item>
        <Descriptions.Item label="Model">{run.model || "-"}</Descriptions.Item>
        <Descriptions.Item label="Judge">{run.judgeModel || "-"}</Descriptions.Item>
        <Descriptions.Item label="Label">{run.label || "-"}</Descriptions.Item>
      </Descriptions>

      {run.casesTotal ? (
        <Progress
          percent={Math.round((run.results.length / run.casesTotal) * 100)}
          format={() => `${run.results.length} / ${run.casesTotal} cases`}
          status={active ? "active" : undefined}
        />
      ) : null}

      {run.error ? (
        <Alert
          type="error"
          showIcon
          message="Run failed"
          description={<pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{run.error}</pre>}
        />
      ) : null}

      <SummaryTable title="By intent" keyTitle="Intent" rows={run.summary} />
      <SummaryTable title="By use case" keyTitle="Use case" rows={run.summaryByUseCase} />

      {!results.length ? (
        <Empty description={active ? "Waiting for the first case to finish…" : "No results"} />
      ) : null}
      {intents.map((intent) => (
        <Flex key={intent} vertical gap={4}>
          <Typography.Text strong>{intent}</Typography.Text>
          <Table
            size="small"
            rowKey="id"
            pagination={false}
            columns={resultColumns}
            dataSource={results.filter((r) => (r.intent || "unassigned") === intent)}
            expandable={{
              expandedRowRender: (r) => <EvalCaseResultView result={r} />,
              expandRowByClick: true,
            }}
          />
        </Flex>
      ))}
    </Flex>
  );
}
