import { Tag, Tooltip } from "antd";
import { EvalJudge } from "../../types/brickchat-eval";

const score = (n?: number | null) =>
  n == null ? "-" : Math.round(n * 10) / 10;

// r/f/rt, reasoning on hover
export function JudgeScores({
  judge,
}: {
  judge?: Pick<EvalJudge, "relevance" | "faithfulness" | "routing" | "reasoning"> | null;
}) {
  if (!judge) return <>-</>;
  return (
    <Tooltip title={judge.reasoning ? judge.reasoning : "relevance / faithfulness / routing"}>
      <Tag bordered={false}>
        {score(judge.relevance)} / {score(judge.faithfulness)} / {score(judge.routing)}
      </Tag>
    </Tooltip>
  );
}
