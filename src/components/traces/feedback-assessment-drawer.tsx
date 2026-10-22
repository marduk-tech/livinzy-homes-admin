import { useAuth0 } from "@auth0/auth0-react";
import {
  Alert,
  Button,
  Collapse,
  Descriptions,
  Divider,
  Drawer,
  Empty,
  Flex,
  Form,
  Input,
  Popconfirm,
  Select,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { useEffect } from "react";
import ReactMarkdown from "react-markdown";
import {
  useAssessBrickchatFeedbackMutation,
  useGetBrickchatPrompts,
  useUpdateBrickchatFeedbackAssessmentMutation,
} from "../../hooks/brickchat-hooks";
import { BrickchatFeedbackAssessmentUpdate } from "../../libs/api/brickchat";
import {
  BRICKCHAT_FEEDBACK_CATEGORY_OPTIONS,
  BRICKCHAT_FEEDBACK_RATING_OPTIONS,
  BRICKCHAT_FEEDBACK_ROOT_CAUSE_OPTIONS,
  BrickchatFeedback,
  BrickchatFeedbackRootCause,
} from "../../types/brickchat-feedback";
import { markdownBox, markdownComponents, messageBox } from "./prompt-text-styles";

type AssessmentFormValues = {
  rootCause?: BrickchatFeedbackRootCause;
  blocks?: string[];
  expected?: string;
  // edited as JSON text, sent as an object
  checks?: string;
  question?: string;
};

const formatDate = (date?: string) =>
  // @ant-design/pro-chat sets dayjs's global locale to zh-cn, so pin English
  date ? dayjs(date).locale("en").format("DD MMM YYYY, hh:mm A") : "";

const jsonBlock = (value: unknown) => (
  <div style={messageBox}>{JSON.stringify(value, null, 2)}</div>
);

const isSystemRole = (role: string) =>
  role === "SystemMessage" || role === "system";

// Review panel for one feedback entry: what was said, the turn it was about
// (the snapshot captured when it was submitted), and its assessment - drafted
// by an LLM ("Run assessment"), edited and confirmed by a reviewer. Only a
// confirmed assessment is used as an eval case or prompt revision target.
export function FeedbackAssessmentDrawer({
  feedback,
  onClose,
}: {
  feedback: BrickchatFeedback | null;
  onClose: () => void;
}) {
  const { user } = useAuth0();
  const { data: prompts } = useGetBrickchatPrompts();
  const assess = useAssessBrickchatFeedbackMutation();
  const updateAssessment = useUpdateBrickchatFeedbackAssessmentMutation();
  const [form] = Form.useForm<AssessmentFormValues>();
  const rootCause = Form.useWatch("rootCause", form);

  const assessment = feedback?.assessment;
  const snapshot = feedback?.snapshot;
  const confirmed = !!assessment?.confirmedAt;

  // reload the form whenever the stored assessment changes (a new draft, a
  // save, a confirmation) - the list refetches after each mutation. Keyed on
  // its content, not object identity: a background refetch (e.g. on window
  // focus) returns new but identical objects and mustn't wipe unsaved edits.
  const assessmentKey = JSON.stringify(assessment ?? null);
  useEffect(() => {
    form.resetFields();
    form.setFieldsValue({
      rootCause: assessment?.rootCause,
      blocks: assessment?.blocks ?? [],
      expected: assessment?.expected,
      checks: assessment?.checks
        ? JSON.stringify(assessment.checks, null, 2)
        : undefined,
      question: assessment?.question,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- assessmentKey stands in for assessment
  }, [form, feedback?._id, assessmentKey]);

  if (!feedback) return null;

  const busy = assess.isPending || updateAssessment.isPending;

  const toUpdate = (
    values: AssessmentFormValues,
  ): BrickchatFeedbackAssessmentUpdate => ({
    rootCause: values.rootCause,
    blocks: values.rootCause === "prompt" ? values.blocks ?? [] : [],
    expected: values.expected?.trim() || null,
    checks: values.checks?.trim() ? JSON.parse(values.checks) : null,
    question: values.question?.trim() || null,
  });

  // edits are only sent when something was changed - sending them marks the
  // assessment as the reviewer's own draft
  const save = async (confirm?: boolean) => {
    try {
      const touched = form.isFieldsTouched();
      const values = await form.validateFields();
      await updateAssessment.mutateAsync({
        id: feedback._id,
        update: {
          ...(touched ? toUpdate(values) : {}),
          ...(confirm !== undefined ? { confirm, reviewer: user?.email } : {}),
        },
      });
    } catch {
      // validation errors render inline; API errors are toasted by the mutation
    }
  };

  const ratingLabel = BRICKCHAT_FEEDBACK_RATING_OPTIONS.find(
    (o) => o.value === feedback.rating,
  )?.label;
  const categoryLabel = BRICKCHAT_FEEDBACK_CATEGORY_OPTIONS.find(
    (o) => o.value === feedback.category,
  )?.label;
  const plannerContext = (snapshot?.plannerInput as { role: string; content: string }[] | undefined)
    ?.filter((m) => isSystemRole(m.role))
    .map((m) => m.content)
    .join("\n\n---\n\n");

  return (
    <Drawer
      title="Feedback assessment"
      open={!!feedback}
      onClose={onClose}
      width={760}
      destroyOnClose
    >
      <Typography.Title level={5}>Feedback</Typography.Title>
      <Descriptions column={1} size="small" bordered>
        <Descriptions.Item label="Level">
          {feedback.turnId ? "One answer" : "Whole conversation"}
        </Descriptions.Item>
        <Descriptions.Item label="Rating">
          {feedback.rating ? `${feedback.rating} - ${ratingLabel}` : "None"}
        </Descriptions.Item>
        <Descriptions.Item label="Category">
          {categoryLabel ?? "None"}
        </Descriptions.Item>
        <Descriptions.Item label="Text">
          {feedback.text || "None"}
        </Descriptions.Item>
      </Descriptions>

      <Divider />
      <Typography.Title level={5}>The turn</Typography.Title>
      {!feedback.turnId ? (
        <Alert
          type="info"
          showIcon
          message="Feedback on the whole conversation - there's no single turn to show."
        />
      ) : !snapshot ? (
        <Alert
          type="info"
          showIcon
          message="Not captured yet - running the assessment captures it first."
        />
      ) : (
        <Flex vertical gap={8}>
          {snapshot.captureErrors?.length ? (
            <Alert
              type="warning"
              showIcon
              message="Partly captured"
              description={snapshot.captureErrors.join(" · ")}
            />
          ) : null}
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Query">{snapshot.query}</Descriptions.Item>
            <Descriptions.Item label="Updated query">
              {snapshot.updatedQuery}
            </Descriptions.Item>
            <Descriptions.Item label="Intent">
              {typeof snapshot.intent?.intent === "string" ? (
                <Tag>{snapshot.intent.intent}</Tag>
              ) : null}
              {typeof snapshot.intent?.subIntent === "string" ? (
                <Tag>{snapshot.intent.subIntent}</Tag>
              ) : null}
            </Descriptions.Item>
            <Descriptions.Item label="Outcome">{snapshot.outcome}</Descriptions.Item>
            <Descriptions.Item label="Prompt versions">
              <Flex wrap gap={4}>
                {Object.entries(snapshot.promptVersions ?? {}).map(
                  ([key, version]) => (
                    <Tag key={key} bordered={false}>
                      {key}@{version}
                    </Tag>
                  ),
                )}
              </Flex>
            </Descriptions.Item>
          </Descriptions>
          {snapshot.answer ? (
            <div style={markdownBox}>
              <ReactMarkdown components={markdownComponents}>
                {snapshot.answer}
              </ReactMarkdown>
            </div>
          ) : null}
          <Collapse
            size="small"
            items={[
              {
                key: "intent",
                label: "Intent (all fields)",
                children: jsonBlock(snapshot.intent),
              },
              {
                key: "plan",
                label: "Plan",
                children: jsonBlock(snapshot.plan),
              },
              ...(plannerContext
                ? [
                    {
                      key: "context",
                      label: "Planner context",
                      children: (
                        <div style={messageBox}>{plannerContext}</div>
                      ),
                    },
                  ]
                : []),
            ]}
          />
        </Flex>
      )}

      <Divider />
      <Flex align="center" justify="space-between">
        <Typography.Title level={5} style={{ margin: 0 }}>
          Assessment
        </Typography.Title>
        {assessment ? (
          <Popconfirm
            title="Replace the current assessment with a new LLM draft?"
            onConfirm={() => assess.mutate(feedback._id)}
          >
            <Button loading={assess.isPending} disabled={busy}>
              Re-run assessment
            </Button>
          </Popconfirm>
        ) : (
          <Button
            type="primary"
            loading={assess.isPending}
            disabled={busy}
            onClick={() => assess.mutate(feedback._id)}
          >
            Run assessment
          </Button>
        )}
      </Flex>

      {!assessment ? (
        <Empty
          description="Not assessed yet"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <>
          <Typography.Paragraph type="secondary" style={{ marginTop: 8 }}>
            Drafted by {assessment.draftedBy === "llm" ? "the LLM" : "a reviewer"}{" "}
            {formatDate(assessment.draftedAt)}
            {confirmed
              ? ` · Confirmed by ${assessment.confirmedBy} ${formatDate(assessment.confirmedAt)}`
              : " · Not confirmed"}
          </Typography.Paragraph>
          {assessment.question ? (
            <Alert
              type="warning"
              showIcon
              message="Needs clarification"
              description={assessment.question}
              style={{ marginBottom: 12 }}
            />
          ) : null}
          <Form form={form} layout="vertical" disabled={busy}>
            <Form.Item
              name="rootCause"
              label="Root cause"
              rules={[{ required: true, message: "Pick a root cause" }]}
            >
              <Select options={BRICKCHAT_FEEDBACK_ROOT_CAUSE_OPTIONS} />
            </Form.Item>
            {rootCause === "prompt" ? (
              <Form.Item
                name="blocks"
                label="Prompt blocks responsible"
                extra="Blocks used in this turn are listed in the prompt versions above."
              >
                <Select
                  mode="multiple"
                  showSearch
                  options={(prompts ?? []).map((p) => ({
                    value: p.key,
                    label: `${p.key} (${p.group})`,
                  }))}
                />
              </Form.Item>
            ) : null}
            <Form.Item
              name="expected"
              label="Expected"
              extra="What should have happened - also the rubric a fixed answer is judged against."
            >
              <Input.TextArea rows={3} style={{ resize: "none" }} />
            </Form.Item>
            <Form.Item
              name="checks"
              label="Checks (JSON)"
              extra='Exact planner fields that should have been different, e.g. {"intent": "projectsShortlist"}.'
              rules={[
                {
                  validator: async (_, value?: string) => {
                    if (!value?.trim()) return;
                    const parsed = JSON.parse(value);
                    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
                      throw new Error("Must be a JSON object");
                    }
                  },
                  message: "Must be a JSON object",
                },
              ]}
            >
              <Input.TextArea
                rows={3}
                style={{ resize: "none", fontFamily: "monospace" }}
              />
            </Form.Item>
            <Form.Item name="question" label="Open question">
              <Input.TextArea rows={2} style={{ resize: "none" }} />
            </Form.Item>
          </Form>
          <Flex justify="end" gap={8}>
            {confirmed ? (
              <Button disabled={busy} onClick={() => save(false)}>
                Withdraw confirmation
              </Button>
            ) : null}
            <Button
              disabled={busy}
              loading={updateAssessment.isPending}
              onClick={() => save()}
            >
              Save
            </Button>
            <Button
              type="primary"
              disabled={busy || !user?.email}
              loading={updateAssessment.isPending}
              onClick={() => save(true)}
            >
              {confirmed ? "Save & keep confirmed" : "Confirm"}
            </Button>
          </Flex>
        </>
      )}
    </Drawer>
  );
}
