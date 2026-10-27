import { Checkbox, Flex, Modal, Typography } from "antd";
import { useEffect, useState } from "react";

import { SCORE_CARD_PARTS } from "../../libs/api/projects";

interface GenerateScoreCardModalProps {
  open: boolean;
  /** shown after "Generate Score Card - " in the title */
  subject: string;
  /** more than one project is being generated - only changes the wording */
  multiple?: boolean;
  /** `pillars` is empty to generate whatever hasn't been scored yet */
  onGenerate: (pillars: string[]) => void;
  onCancel: () => void;
}

// Picks which score card parts to generate before calling generate-score -
// shared by the projects list (one project) and the Brick360 projects list
// (a batch). Leaving every part unchecked generates only the parts not yet
// scored; ticking parts regenerates just those, even if already scored.
export const GenerateScoreCardModal: React.FC<GenerateScoreCardModalProps> = ({
  open,
  subject,
  multiple,
  onGenerate,
  onCancel,
}) => {
  const [pillars, setPillars] = useState<string[]>([]);

  // every opening starts with nothing ticked
  useEffect(() => {
    if (open) setPillars([]);
  }, [open]);

  return (
    <Modal
      title={`Generate Score Card - ${subject}`}
      open={open}
      okText={
        pillars.length
          ? `Regenerate ${pillars.length} part${pillars.length > 1 ? "s" : ""}`
          : "Generate"
      }
      onOk={() => onGenerate(pillars)}
      onCancel={onCancel}
      destroyOnClose
    >
      <Flex vertical gap={12}>
        <Typography.Text type="secondary">
          {multiple
            ? "Each project's data is re-processed first, then scored - this may take several minutes."
            : "The project's data is re-processed first, then scored - this may take a few minutes."}{" "}
          Pick the parts to regenerate, or leave them all unchecked to generate
          whatever hasn't been scored yet.
        </Typography.Text>
        <Checkbox.Group
          value={pillars}
          onChange={(values) => setPillars(values as string[])}
        >
          <Flex vertical gap={8}>
            {SCORE_CARD_PARTS.map((part) => (
              <Checkbox key={part.value} value={part.value}>
                {part.label}
              </Checkbox>
            ))}
          </Flex>
        </Checkbox.Group>
        {pillars.length > 0 && !pillars.includes("summary") && (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            The summary (pros & cons) is written from all pillars - tick it
            too if a regenerated pillar should be reflected there.
          </Typography.Text>
        )}
      </Flex>
    </Modal>
  );
};
