import { LinkOutlined, SearchOutlined } from "@ant-design/icons";
import {
  Button,
  Collapse,
  Empty,
  Flex,
  Input,
  Spin,
  Table,
  TableColumnType,
  Tag,
  Typography,
} from "antd";
import { useState } from "react";
import {
  useGetBrickchatLog,
  useGetRecentBrickchatLogs,
} from "../../hooks/brickchat-hooks";
import { errorMessage } from "../../libs/api-error";
import { COLORS } from "../../theme/colors";
import { FONT_SIZES } from "../../theme/font-sizes";
import {
  BrickchatPlanStep,
  BrickchatRecentThread,
  BrickchatStepLog,
  BrickchatTurn,
} from "../../types/brickchat-logger";

const formatTimestamp = (iso?: string) => {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
};

const formatDuration = (ms?: number) => {
  if (ms == null || Number.isNaN(ms)) return "-";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

const turnDurationMs = (turn: BrickchatTurn) => {
  if (!turn.startedAt || !turn.finishedAt) return undefined;
  return new Date(turn.finishedAt).getTime() - new Date(turn.startedAt).getTime();
};

const isTurnError = (turn: BrickchatTurn) =>
  !!turn.error || turn.outcome === "error" || turn.outcome === "plannerError";

// A log line is "<iso timestamp> <rest>" (see log-capture.service.js on the
// backend) - split on the first space, which an ISO 8601 timestamp never
// contains, rather than a more elaborate parse.
const parseLogLine = (line: string) => {
  const spaceIdx = line.indexOf(" ");
  const maybeTs = spaceIdx > -1 ? line.slice(0, spaceIdx) : "";
  if (/^\d{4}-\d{2}-\d{2}T/.test(maybeTs)) {
    return { timestamp: maybeTs, message: line.slice(spaceIdx + 1) };
  }
  return { timestamp: null, message: line };
};

const logBox: React.CSSProperties = {
  padding: 10,
  backgroundColor: "#f5f5f5",
  borderRadius: 4,
  maxHeight: 300,
  overflowY: "auto",
  fontFamily: "monospace",
  fontSize: FONT_SIZES.SUB_TEXT,
};

function LogLines({ logs }: { logs: string[] }) {
  if (!logs?.length) {
    return (
      <Typography.Text type="secondary" style={{ fontSize: FONT_SIZES.SUB_TEXT }}>
        No logs captured.
      </Typography.Text>
    );
  }
  return (
    <div style={logBox}>
      {logs.map((line, i) => {
        const { timestamp, message } = parseLogLine(line);
        return (
          <div key={i} style={{ marginBottom: 4 }}>
            {timestamp && (
              <span style={{ color: COLORS.textColorLight, marginRight: 8 }}>
                {formatTimestamp(timestamp)}
              </span>
            )}
            <span>{message}</span>
          </div>
        );
      })}
    </div>
  );
}

function StepPanelLabel({ step }: { step: BrickchatStepLog }) {
  return (
    <Flex gap={8} align="center">
      <Typography.Text strong>
        {step.id} · {step.tool}
      </Typography.Text>
      <Tag color={step.status === "error" ? "red" : "green"}>{step.status}</Tag>
      <Typography.Text type="secondary" style={{ fontSize: FONT_SIZES.SUB_TEXT }}>
        {formatDuration(step.durationMs)}
      </Typography.Text>
      {step.dependsOn?.length > 0 && (
        <Typography.Text type="secondary" style={{ fontSize: FONT_SIZES.SUB_TEXT }}>
          depends on: {step.dependsOn.join(", ")}
        </Typography.Text>
      )}
    </Flex>
  );
}

// Groups plan steps into dependency layers - layer N contains every step
// whose dependsOn are all satisfied by layers 0..N-1 - mirroring topoLayers
// in executor.js exactly, so this shows the same execution order the
// backend actually used rather than just the plan's raw array order.
const computePlanLayers = (steps: BrickchatPlanStep[]): BrickchatPlanStep[][] => {
  const remaining = new Map(steps.map((s) => [s.id, s]));
  const done = new Set<string>();
  const layers: BrickchatPlanStep[][] = [];
  while (remaining.size) {
    const ready = [...remaining.values()].filter((s) =>
      (s.dependsOn || []).every((d) => done.has(d)),
    );
    if (!ready.length) {
      // unresolved/circular dependsOn - shouldn't happen from a well-formed
      // plan, but show what's left rather than looping forever
      layers.push([...remaining.values()]);
      break;
    }
    layers.push(ready);
    ready.forEach((s) => {
      remaining.delete(s.id);
      done.add(s.id);
    });
  }
  return layers;
};

const MAX_ARG_VALUE_LEN = 150;
const formatArgValue = (value: unknown): string => {
  if (value == null) return "-";
  let str: string;
  if (typeof value === "string") str = value;
  else {
    try {
      str = JSON.stringify(value);
    } catch {
      str = String(value);
    }
  }
  return str.length > MAX_ARG_VALUE_LEN
    ? `${str.slice(0, MAX_ARG_VALUE_LEN)}…`
    : str;
};

const planCard: React.CSSProperties = {
  border: `1px solid ${COLORS.borderColorDark}`,
  borderRadius: 6,
  padding: "8px 12px",
  minWidth: 220,
  maxWidth: 320,
  background: "white",
};

function PlanStepCard({ step }: { step: BrickchatPlanStep }) {
  const args = (step.args || {}) as Record<string, unknown>;
  const argEntries = Object.entries(args).filter(([, v]) => v != null);

  return (
    <div style={planCard}>
      <Flex gap={6} align="center" wrap="wrap">
        <Typography.Text strong>{step.id}</Typography.Text>
        <Tag color="blue">{step.tool}</Tag>
      </Flex>
      {step.dependsOn && step.dependsOn.length > 0 && (
        <Typography.Text
          type="secondary"
          style={{ fontSize: FONT_SIZES.SUB_TEXT, display: "block", marginTop: 4 }}
        >
          ← depends on {step.dependsOn.join(", ")}
        </Typography.Text>
      )}
      {argEntries.length > 0 && (
        <div style={{ marginTop: 6 }}>
          {argEntries.map(([key, value]) => (
            <div key={key} style={{ fontSize: FONT_SIZES.SUB_TEXT, marginBottom: 2 }}>
              <Typography.Text type="secondary">{key}: </Typography.Text>
              <Typography.Text style={{ fontFamily: "monospace" }}>
                {formatArgValue(value)}
              </Typography.Text>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const intentBox: React.CSSProperties = {
  border: `1px solid ${COLORS.borderColorDark}`,
  borderRadius: 6,
  padding: "8px 12px",
  background: "white",
  display: "inline-block",
};

function IntentView({ intent }: { intent?: unknown }) {
  const entries = Object.entries((intent || {}) as Record<string, unknown>).filter(
    ([, v]) => v != null,
  );
  if (!entries.length) {
    return (
      <Typography.Text type="secondary" style={{ fontSize: FONT_SIZES.SUB_TEXT }}>
        No intent captured this turn.
      </Typography.Text>
    );
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={intentBox}>
        {entries.map(([key, value]) => (
          <div key={key} style={{ fontSize: FONT_SIZES.SUB_TEXT, marginBottom: 2 }}>
            <Typography.Text type="secondary">{key}: </Typography.Text>
            <Typography.Text style={{ fontFamily: "monospace" }}>
              {formatArgValue(value)}
            </Typography.Text>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlanView({ plan }: { plan?: { steps: BrickchatPlanStep[] } }) {
  const steps = plan?.steps;
  if (!steps?.length) {
    return (
      <Typography.Text type="secondary" style={{ fontSize: FONT_SIZES.SUB_TEXT }}>
        No plan compiled this turn.
      </Typography.Text>
    );
  }

  const layers = computePlanLayers(steps);

  return (
    <div style={{ marginBottom: 12 }}>
      {layers.map((layer, i) => (
        <div key={i}>
          <Flex gap={12} wrap="wrap">
            {layer.map((step) => (
              <PlanStepCard key={step.id} step={step} />
            ))}
          </Flex>
          {i < layers.length - 1 && (
            <div
              style={{
                textAlign: "center",
                color: COLORS.textColorLight,
                margin: "2px 0",
              }}
            >
              ↓
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function TurnDetails({ turn }: { turn: BrickchatTurn }) {
  const items = [
    {
      key: "planner",
      label: <Typography.Text strong>Planner</Typography.Text>,
      children: (
        <>
          <Typography.Text
            type="secondary"
            style={{ fontSize: FONT_SIZES.SUB_TEXT, display: "block", marginBottom: 4 }}
          >
            Intent
          </Typography.Text>
          <IntentView intent={turn.intent} />
          <Typography.Text
            type="secondary"
            style={{ fontSize: FONT_SIZES.SUB_TEXT, display: "block", marginBottom: 4 }}
          >
            Plan
          </Typography.Text>
          <PlanView plan={turn.plan} />
          <LogLines logs={turn.plannerLogs} />
        </>
      ),
    },
    ...(turn.steps || []).map((step) => ({
      key: `step-${step.id}`,
      label: <StepPanelLabel step={step} />,
      children: (
        <>
          {step.error && (
            <Typography.Text type="danger" style={{ display: "block", marginBottom: 8 }}>
              {step.error}
            </Typography.Text>
          )}
          <LogLines logs={step.logs} />
        </>
      ),
    })),
    {
      key: "synthesis",
      label: <Typography.Text strong>Synthesis</Typography.Text>,
      children: <LogLines logs={turn.synthesisLogs} />,
    },
  ];

  return <Collapse items={items} style={{ margin: "8px 0" }} />;
}

export function BrickchatTab() {
  const [threadIdInput, setThreadIdInput] = useState("");
  const [searchedThreadId, setSearchedThreadId] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useGetBrickchatLog(searchedThreadId);
  const { data: recentThreads, isLoading: recentLoading } =
    useGetRecentBrickchatLogs(10);

  const handleSearch = () => {
    if (threadIdInput.trim()) setSearchedThreadId(threadIdInput.trim());
  };

  const handleSelectRecentThread = (threadId: string) => {
    setThreadIdInput(threadId);
    setSearchedThreadId(threadId);
  };

  const recentColumns: TableColumnType<BrickchatRecentThread>[] = [
    {
      title: "Query",
      dataIndex: "query",
      key: "query",
      render: (query: string) => (
        <div
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {query || "(empty query)"}
        </div>
      ),
    },
    {
      title: "Started",
      dataIndex: "startedAt",
      key: "startedAt",
      width: 200,
      render: (startedAt: string) => formatTimestamp(startedAt),
    },
  ];

  const columns: TableColumnType<BrickchatTurn>[] = [
    {
      title: "Query",
      dataIndex: "query",
      key: "query",
      render: (query: string) => (
        <div
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {query || "(empty query)"}
        </div>
      ),
    },
    {
      title: "Started",
      dataIndex: "startedAt",
      key: "startedAt",
      width: 200,
      render: (startedAt: string) => formatTimestamp(startedAt),
    },
    {
      title: "Time Taken",
      key: "duration",
      width: 120,
      render: (_: unknown, turn: BrickchatTurn) => formatDuration(turnDurationMs(turn)),
    },
    {
      title: "Status",
      key: "status",
      width: 120,
      render: (_: unknown, turn: BrickchatTurn) =>
        isTurnError(turn) ? (
          <Tag color="red">Error</Tag>
        ) : (
          <Tag color="green">Success</Tag>
        ),
    },
  ];

  const renderBody = () => {
    if (!searchedThreadId) {
      return (
        <Empty description="Enter a thread_id above to look up its brickchat log" />
      );
    }
    if (isLoading) {
      return (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin />
        </div>
      );
    }
    if (isError) {
      return (
        <Empty
          description={errorMessage(error, "Failed to fetch brickchat log")}
        />
      );
    }
    if (!data?.turns?.length) {
      return <Empty description="No turns found for this thread_id" />;
    }

    return (
      <Table
        dataSource={data.turns}
        columns={columns}
        rowKey="turnId"
        pagination={false}
        expandable={{
          expandedRowRender: (turn) => <TurnDetails turn={turn} />,
        }}
      />
    );
  };

  return (
    <div>
      <Typography.Title level={5} style={{ padding: "0 10px" }}>
        Recent brickchat threads
      </Typography.Title>
      <Table
        dataSource={recentThreads}
        columns={recentColumns}
        loading={recentLoading}
        rowKey="thread_id"
        size="small"
        pagination={false}
        style={{ marginBottom: 20 }}
        onRow={(record) => ({
          onClick: () => handleSelectRecentThread(record.thread_id),
          style: {
            cursor: "pointer",
            backgroundColor:
              record.thread_id === searchedThreadId ? "#fafafa" : undefined,
          },
        })}
      />

      <Flex gap={8} style={{ marginBottom: 20, padding: "0 10px" }}>
        <Input
          style={{ maxWidth: 420 }}
          placeholder="Enter thread_id"
          value={threadIdInput}
          onChange={(e) => setThreadIdInput(e.target.value)}
          onPressEnter={handleSearch}
        />
        <Button
          type="primary"
          icon={<SearchOutlined />}
          disabled={!threadIdInput.trim()}
          loading={isLoading}
          onClick={handleSearch}
        >
          Search
        </Button>
        <Button
          icon={<LinkOutlined />}
          disabled={!searchedThreadId}
          style={{ marginLeft: "auto" }}
          onClick={() => {
            window.open(
              `https://smith.langchain.com/o/f789969a-14ab-5073-b68e-2822efcebf90/projects/p/4e5569cf-0f16-4779-ac99-d4297e21b54f?runview=threads&peekedConversationId=${searchedThreadId}`,
              "_blank",
            );
          }}
        >
          View in LangSmith
        </Button>
      </Flex>

      {renderBody()}
    </div>
  );
}
