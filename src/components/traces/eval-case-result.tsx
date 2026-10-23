import { ProfileOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Flex, Tag, Tooltip, Typography } from "antd";
import ReactMarkdown from "react-markdown";
import { useNavigate } from "react-router-dom";
import { FONT_SIZES } from "../../theme/font-sizes";
import { EvalCaseResult, EvalTurnResult } from "../../types/brickchat-eval";
import { BRICKFI_LOGGER_PATHS } from "./brickfi-logger-paths";
import { JudgeScores } from "./eval-judge-scores";
import { formatSeconds } from "./eval-status";

const hasKeys = (o?: Record<string, unknown> | null) =>
  !!o && Object.keys(o).length > 0;

// checksDetail keys are "<check>.<turnIndex>" for per-turn checks
const turnCheckFailed = (
  result: EvalCaseResult,
  check: string,
  index: number,
) => result.checksDetail?.[`${check}.${index}`] === false;

function TurnResult({
  result,
  turn,
  index,
}: {
  result: EvalCaseResult;
  turn: EvalTurnResult;
  index: number;
}) {
  const intentFailed =
    turnCheckFailed(result, "intent", index) ||
    turnCheckFailed(result, "subIntent", index);
  const toolsFailed = turnCheckFailed(result, "tools", index);

  return (
    <Card
      size="small"
      title={
        <Typography.Text style={{ whiteSpace: "normal" }}>
          {index + 1}. “{turn.q}”
        </Typography.Text>
      }
      extra={<Typography.Text type="secondary">{formatSeconds(turn.latencyMs)}</Typography.Text>}
    >
      <Flex vertical gap={8}>
        <Flex gap={6} wrap align="center">
          <Tag color={intentFailed ? "red" : "blue"}>
            {turn.intent ?? "no intent"}
            {turn.subIntent ? ` / ${turn.subIntent}` : ""}
          </Tag>
          <Typography.Text type="secondary">plan</Typography.Text>
          {turn.plan.length ? (
            turn.toolRuns.map((run) => (
              <Tooltip
                key={run.stepId}
                title={run.empty ? "Returned nothing" : `${run.count} result(s)`}
              >
                <Tag color={run.empty ? "red" : toolsFailed ? "orange" : "default"}>
                  {run.tool}
                </Tag>
              </Tooltip>
            ))
          ) : (
            <Tag color={toolsFailed ? "orange" : "default"}>none</Tag>
          )}
          {turn.error ? <Tag color="red">error: {turn.error}</Tag> : null}
        </Flex>

        {hasKeys(turn.metadata) ? (
          <Typography.Paragraph
            type="secondary"
            style={{ fontSize: FONT_SIZES.SUB_TEXT, margin: 0 }}
            ellipsis={{ rows: 1, expandable: true, symbol: "more" }}
          >
            filters: {JSON.stringify(turn.metadata)}
          </Typography.Paragraph>
        ) : null}

        {turn.answer?.summary ? (
          <div style={{ fontSize: FONT_SIZES.SUB_TEXT }}>
            <ReactMarkdown>{turn.answer.summary}</ReactMarkdown>
          </div>
        ) : turn.prompt ? (
          <Typography.Text italic>{turn.prompt}</Typography.Text>
        ) : (
          <Typography.Text type="secondary">No answer</Typography.Text>
        )}

        {turn.answer?.projectNames?.length ? (
          <Flex gap={4} wrap>
            {turn.answer.projectNames.map((name) => (
              <Tag key={name} bordered={false}>
                {name}
              </Tag>
            ))}
          </Flex>
        ) : null}
      </Flex>
    </Card>
  );
}

export function EvalCaseResultView({ result }: { result: EvalCaseResult }) {
  const navigate = useNavigate();
  const failedChecks = Object.entries(result.checksDetail || {})
    .filter(([name, ok]) => !ok && !result.softFailures?.includes(name))
    .map(([name]) => name);

  return (
    <Flex vertical gap={10}>
      {result.knownIssue ? (
        <Alert type="warning" showIcon message="Known issue" description={result.knownIssue} />
      ) : null}
      {result.error ? <Alert type="error" showIcon message={result.error} /> : null}

      <Flex gap={6} wrap align="center">
        {failedChecks.map((name) => (
          <Tag key={name} color="red">
            {name}
          </Tag>
        ))}
        {result.softFailures?.map((name) => (
          <Tooltip key={name} title="Soft check - doesn't fail the case">
            <Tag color="orange">{name}</Tag>
          </Tooltip>
        ))}
        {!failedChecks.length && !result.softFailures?.length ? (
          <Tag color="green">all checks passed</Tag>
        ) : null}
        <JudgeScores judge={result.judge} />
        {result.threadId ? (
          <Button
            size="small"
            icon={<ProfileOutlined />}
            onClick={() => navigate(BRICKFI_LOGGER_PATHS.thread(result.threadId!))}
          >
            Open trace
          </Button>
        ) : null}
      </Flex>

      {result.judge?.reasoning ? (
        <Typography.Text type="secondary">Judge: {result.judge.reasoning}</Typography.Text>
      ) : null}

      {result.turns.map((turn, i) => (
        <TurnResult key={i} result={result} turn={turn} index={i} />
      ))}
    </Flex>
  );
}
