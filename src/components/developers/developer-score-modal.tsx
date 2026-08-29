import { Empty, Flex, Modal, Progress, Typography } from "antd";

import { DeveloperBrkfiScore } from "../../types/developer";

interface DeveloperScoreModalProps {
  open: boolean;
  onClose: () => void;
  developerName?: string;
  brkfiScore?: DeveloperBrkfiScore;
}

const CRITERIA_LABELS: Record<string, string> = {
  experience: "Experience",
  timeCommitment: "Time Commitment",
  complaints: "Customer Satisfaction",
};

function scoreColor(score: number): string {
  if (score >= 75) return "#52c41a";
  if (score >= 50) return "#faad14";
  return "#ff4d4f";
}

export function DeveloperScoreModal({
  open,
  onClose,
  developerName,
  brkfiScore,
}: DeveloperScoreModalProps) {
  const criteria = brkfiScore?.reasoning
    ? Object.entries(brkfiScore.reasoning).filter(([, value]) => !!value)
    : [];

  return (
    <Modal
      title={
        <Flex vertical gap={2}>
          <Typography.Text strong>
            BrkFi Score — {developerName || "Developer"}
          </Typography.Text>
        </Flex>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={640}
      styles={{ body: { maxHeight: "70vh", overflow: "auto" } }}
      destroyOnClose
    >
      {brkfiScore?.score == null || criteria.length === 0 ? (
        <Empty description="No score available for this developer" style={{ marginTop: 24 }} />
      ) : (
        <Flex vertical gap={24} style={{ paddingTop: 8 }}>
          <Flex align="center" gap={16}>
            <Progress
              type="circle"
              size={72}
              percent={Math.round(brkfiScore.score)}
              strokeColor={scoreColor(brkfiScore.score)}
              format={(percent) => percent}
            />
            <Typography.Text type="secondary">
              Overall score — 50% Experience, 25% Time Commitment, 25% Customer
              Satisfaction
            </Typography.Text>
          </Flex>

          {criteria.map(([key, criterion]) => (
            <div key={key}>
              <Flex align="center" gap={12} style={{ marginBottom: 8 }}>
                <Typography.Title level={5} style={{ margin: 0 }}>
                  {CRITERIA_LABELS[key] || key}
                </Typography.Title>
                {criterion?.rating != null && (
                  <Progress
                    percent={criterion.rating}
                    size="small"
                    style={{ maxWidth: 160 }}
                    strokeColor={scoreColor(criterion.rating)}
                  />
                )}
              </Flex>
              {criterion?.reasoning?.length ? (
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {criterion.reasoning.map((line, i) => (
                    <li key={i}>
                      <Typography.Text>{line}</Typography.Text>
                    </li>
                  ))}
                </ul>
              ) : (
                <Typography.Text type="secondary">
                  No reasoning available.
                </Typography.Text>
              )}
            </div>
          ))}
        </Flex>
      )}
    </Modal>
  );
}
