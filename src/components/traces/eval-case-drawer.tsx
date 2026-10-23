import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useAuth0 } from "@auth0/auth0-react";
import {
  AutoComplete,
  Button,
  Card,
  Checkbox,
  Divider,
  Drawer,
  Flex,
  Form,
  Input,
  InputNumber,
  message,
  Select,
  Typography,
} from "antd";
import { useEffect } from "react";
import { useSaveEvalCaseMutation } from "../../hooks/brickchat-hooks";
import { EvalCaseInput, EvalTurnSpec } from "../../types/brickchat-eval";

// saved as expectTools: [] ("plans nothing"), unlike an empty select
const NO_TOOLS = "__none__";
// rarer per-turn checks, edited as JSON
const EXTRA_TURN_KEYS = [
  "expectIntentArgs",
  "expectMetadata",
  "expectSoftMetadata",
] as const;
const EXTRA_JSON_PLACEHOLDER = `{
  "expectMetadata": { "localities": ["whitefield"], "sqftPrice": { "min": 8000, "max": 10500 } },
  "expectIntentArgs": { "cheaperThanAnchor": true },
  "expectSoftMetadata": ["amenities"]
}`;

interface TurnForm {
  q: string;
  expectIntent?: string;
  expectSubIntent?: string;
  expectTools?: string[];
  expectNonEmpty?: string[];
  minProjects?: number | null;
  expectPrompt?: boolean;
  extraJson?: string;
}

interface CaseForm {
  id: string;
  intent: string;
  category: string;
  source: "csv" | "manual";
  knownIssue?: string;
  notes?: string;
  soft?: string[];
  expectMinProjects?: number | null;
  directAnswer?: boolean;
  expectImages?: boolean;
  answerMentions?: string[];
  promptAllowed?: boolean;
  turns: TurnForm[];
}

const toolsToForm = (tools?: string[]) =>
  tools == null ? undefined : tools.length ? tools : [NO_TOOLS];
const toolsFromForm = (tools?: string[]) =>
  !tools?.length ? undefined : tools.includes(NO_TOOLS) ? [] : tools;

const toForm = (c: EvalCaseInput): CaseForm => ({
  id: c.id,
  intent: c.intent,
  category: c.category,
  source: c.source ?? "manual",
  knownIssue: c.knownIssue,
  notes: c.notes,
  soft: c.soft,
  expectMinProjects: c.expect?.minProjects,
  directAnswer: c.expect?.directAnswer,
  expectImages: c.expect?.expectImages,
  answerMentions: c.expect?.answerMentions,
  promptAllowed: c.expect?.promptAllowed,
  turns: c.turns.map((t) => {
    const extra = Object.fromEntries(
      EXTRA_TURN_KEYS.filter((k) => t[k] != null).map((k) => [k, t[k]]),
    );
    return {
      q: t.q,
      expectIntent: t.expectIntent,
      expectSubIntent: t.expectSubIntent,
      expectTools: toolsToForm(t.expectTools),
      expectNonEmpty: t.expectNonEmpty,
      minProjects: t.minProjects,
      expectPrompt: t.expectPrompt,
      extraJson: Object.keys(extra).length
        ? JSON.stringify(extra, null, 2)
        : undefined,
    };
  }),
});

const compact = <T extends object>(o: T) =>
  Object.fromEntries(
    Object.entries(o).filter(
      ([, v]) =>
        v != null &&
        v !== "" &&
        v !== false &&
        !(Array.isArray(v) && !v.length),
    ),
  ) as Partial<T>;

const fromForm = (f: CaseForm): EvalCaseInput => {
  const turns = f.turns.map((t) => {
    const extra = t.extraJson?.trim() ? JSON.parse(t.extraJson) : {};
    return {
      ...compact({
        q: t.q.trim(),
        expectIntent: t.expectIntent,
        expectSubIntent: t.expectSubIntent?.trim(),
        expectNonEmpty: t.expectNonEmpty,
        minProjects: t.minProjects,
        expectPrompt: t.expectPrompt,
        ...extra,
      }),
      // [] means "plans no tools", so it skips compact
      ...(toolsFromForm(t.expectTools)
        ? { expectTools: toolsFromForm(t.expectTools) }
        : {}),
    } as EvalTurnSpec;
  });
  const expect = compact({
    minProjects: f.expectMinProjects,
    directAnswer: f.directAnswer,
    expectImages: f.expectImages,
    answerMentions: f.answerMentions,
    promptAllowed: f.promptAllowed,
  });
  return {
    id: f.id.trim(),
    intent: f.intent,
    category: f.category.trim(),
    source: f.source,
    turns,
    ...(Object.keys(expect).length ? { expect } : {}),
    ...compact({
      soft: f.soft,
      knownIssue: f.knownIssue?.trim(),
      notes: f.notes?.trim(),
    }),
  };
};

const validateExtraJson = (_: unknown, value?: string) => {
  if (!value?.trim()) return Promise.resolve();
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return Promise.reject(new Error("Must be a JSON object"));
    const unknown = Object.keys(parsed).filter(
      (k) => !(EXTRA_TURN_KEYS as readonly string[]).includes(k),
    );
    return unknown.length
      ? Promise.reject(
          new Error(
            `Only ${EXTRA_TURN_KEYS.join(", ")} go here (got ${unknown.join(", ")})`,
          ),
        )
      : Promise.resolve();
  } catch {
    return Promise.reject(new Error("Not valid JSON"));
  }
};

const emptyTurn: TurnForm = { q: "" };

// editing is null for a new case
export function EvalCaseDrawer({
  open,
  editing,
  defaultIntent,
  intents,
  tools,
  softFamilies,
  categoriesByIntent,
  onClose,
}: {
  open: boolean;
  editing: EvalCaseInput | null;
  defaultIntent: string;
  intents: string[];
  tools: string[];
  softFamilies: string[];
  categoriesByIntent: Record<string, string[]>;
  onClose: () => void;
}) {
  const { user } = useAuth0();
  const [form] = Form.useForm<CaseForm>();
  const save = useSaveEvalCaseMutation();
  const intent = Form.useWatch("intent", form);
  const isNew = !editing;

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue(
      editing
        ? toForm(editing)
        : {
            intent: defaultIntent,
            source: "manual",
            turns: [{ ...emptyTurn, expectIntent: defaultIntent }],
          },
    );
  }, [open, editing, defaultIntent, form]);

  const intentOptions = intents.map((i) => ({ value: i, label: i }));
  const toolOptions = tools.map((t) => ({ value: t, label: t }));

  const onSave = async () => {
    let values: CaseForm;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    try {
      await save.mutateAsync({
        evalCase: { ...fromForm(values), updatedBy: user?.email },
        isNew,
      });
      message.success(isNew ? "Case added" : "Case saved");
      onClose();
    } catch {
      // toasted by the mutation
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={760}
      title={isNew ? "New eval case" : `Edit ${editing?.id}`}
      destroyOnClose
      extra={
        <Flex gap={8}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" loading={save.isPending} onClick={onSave}>
            {isNew ? "Add case" : "Save"}
          </Button>
        </Flex>
      }
    >
      <Form form={form} layout="vertical" requiredMark="optional">
        <Flex gap={12}>
          <Form.Item
            name="id"
            label="Case id"
            style={{ flex: 1 }}
            tooltip={
              isNew
                ? undefined
                : "Can't change - past run results are keyed by it"
            }
            rules={[
              { required: true },
              {
                pattern: /^[a-z0-9]+(-[a-z0-9]+)*$/,
                message: "Lowercase letters, numbers and dashes",
              },
            ]}
          >
            <Input
              disabled={!isNew}
              placeholder="e.g. discover-villa-budget-only"
            />
          </Form.Item>
          <Form.Item
            name="intent"
            label="Intent"
            style={{ flex: 1 }}
            rules={[{ required: true }]}
          >
            <Select options={intentOptions} />
          </Form.Item>
          <Form.Item
            name="category"
            label="Use case"
            style={{ flex: 1 }}
            rules={[{ required: true, whitespace: true }]}
          >
            <AutoComplete
              options={(categoriesByIntent[intent] ?? []).map((c) => ({
                value: c,
              }))}
              placeholder="e.g. budget only (villa)"
              filterOption={(input, option) =>
                (option?.value ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </Form.Item>
        </Flex>

        <Form.Item name="source" hidden>
          <Input />
        </Form.Item>

        <Typography.Text strong>Turns</Typography.Text>
        <Form.List
          name="turns"
          rules={[
            {
              validator: (_, turns?: TurnForm[]) =>
                turns?.length
                  ? Promise.resolve()
                  : Promise.reject(new Error("Add at least one turn")),
            },
          ]}
        >
          {(fields, { add, remove, move }, { errors }) => (
            <Flex vertical gap={12} style={{ marginTop: 8 }}>
              {fields.map((field, index) => (
                <Card
                  key={field.key}
                  size="small"
                  title={`Turn ${index + 1}`}
                  extra={
                    <Flex gap={4}>
                      <Button
                        size="small"
                        type="text"
                        icon={<ArrowUpOutlined />}
                        disabled={index === 0}
                        onClick={() => move(index, index - 1)}
                      />
                      <Button
                        size="small"
                        type="text"
                        icon={<ArrowDownOutlined />}
                        disabled={index === fields.length - 1}
                        onClick={() => move(index, index + 1)}
                      />
                      <Button
                        size="small"
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        disabled={fields.length === 1}
                        onClick={() => remove(field.name)}
                      />
                    </Flex>
                  }
                >
                  <Form.Item
                    name={[field.name, "q"]}
                    label="User query"
                    rules={[{ required: true, whitespace: true }]}
                  >
                    <Input.TextArea autoSize={{ minRows: 1, maxRows: 4 }} />
                  </Form.Item>
                  <Flex gap={12}>
                    <Form.Item
                      name={[field.name, "expectIntent"]}
                      label="Expected intent"
                      style={{ flex: 1 }}
                    >
                      <Select
                        allowClear
                        options={intentOptions}
                        placeholder="not checked"
                      />
                    </Form.Item>
                    <Form.Item
                      name={[field.name, "expectSubIntent"]}
                      label="Expected subIntent"
                      style={{ flex: 1 }}
                    >
                      <Input placeholder="e.g. discoveryMore" />
                    </Form.Item>
                  </Flex>
                  <Flex gap={12}>
                    <Form.Item
                      name={[field.name, "expectTools"]}
                      label="Expected plan (exact)"
                      tooltip="The tools the planner should plan, in any order. Pick 'no tools' if it should plan nothing."
                      style={{ flex: 1 }}
                      rules={[
                        {
                          validator: (_, v?: string[]) =>
                            v?.includes(NO_TOOLS) && v.length > 1
                              ? Promise.reject(
                                  new Error("Pick either 'no tools' or tools"),
                                )
                              : Promise.resolve(),
                        },
                      ]}
                    >
                      <Select
                        mode="multiple"
                        allowClear
                        placeholder="not checked"
                        options={[
                          { value: NO_TOOLS, label: "no tools" },
                          ...toolOptions,
                        ]}
                      />
                    </Form.Item>
                    <Form.Item
                      name={[field.name, "expectNonEmpty"]}
                      label="Must return results"
                      tooltip="Tools that must come back with something"
                      style={{ flex: 1 }}
                    >
                      <Select
                        mode="multiple"
                        allowClear
                        placeholder="not checked"
                        options={toolOptions}
                      />
                    </Form.Item>
                  </Flex>
                  <Flex gap={12} align="center">
                    <Form.Item
                      name={[field.name, "minProjects"]}
                      label="Min projects shown"
                    >
                      <InputNumber min={0} precision={0} placeholder="-" />
                    </Form.Item>
                    <Form.Item
                      name={[field.name, "expectPrompt"]}
                      valuePropName="checked"
                      style={{ marginTop: 22 }}
                    >
                      <Checkbox>Expects a clarifying prompt</Checkbox>
                    </Form.Item>
                  </Flex>
                  <Form.Item
                    name={[field.name, "extraJson"]}
                    label="Other checks (JSON)"
                    tooltip="expectMetadata / expectIntentArgs take {min, max}, {absent: true}, {optional: true} or {excludes: [...]} predicates as well as plain values"
                    rules={[{ validator: validateExtraJson }]}
                  >
                    <Input.TextArea
                      autoSize={{ minRows: 2, maxRows: 12 }}
                      placeholder={EXTRA_JSON_PLACEHOLDER}
                      style={{ fontFamily: "monospace", fontSize: 12 }}
                    />
                  </Form.Item>
                </Card>
              ))}
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={() => add({ ...emptyTurn, expectIntent: intent })}
              >
                Add follow-up turn
              </Button>
              <Form.ErrorList errors={errors} />
            </Flex>
          )}
        </Form.List>

        <Divider />
        <Typography.Text strong>Final answer checks</Typography.Text>
        <Flex gap={16} wrap align="center" style={{ marginTop: 8 }}>
          <Form.Item name="expectMinProjects" label="Min projects">
            <InputNumber min={0} precision={0} placeholder="-" />
          </Form.Item>
          <Form.Item
            name="directAnswer"
            valuePropName="checked"
            style={{ marginTop: 22 }}
          >
            <Checkbox>Direct answer</Checkbox>
          </Form.Item>
          <Form.Item
            name="expectImages"
            valuePropName="checked"
            style={{ marginTop: 22 }}
          >
            <Checkbox>Shows images</Checkbox>
          </Form.Item>
          <Form.Item
            name="promptAllowed"
            valuePropName="checked"
            style={{ marginTop: 22 }}
          >
            <Checkbox>Answer or prompt is fine</Checkbox>
          </Form.Item>
        </Flex>
        <Form.Item name="answerMentions" label="Answer must mention">
          <Select
            mode="tags"
            tokenSeparators={[","]}
            placeholder="words or phrases"
          />
        </Form.Item>
        <Form.Item
          name="soft"
          label="Soft checks"
          tooltip="Failures in these checks are reported but don't fail the case"
        >
          <Select
            mode="multiple"
            allowClear
            options={softFamilies.map((s) => ({ value: s, label: s }))}
          />
        </Form.Item>

        <Divider />
        <Form.Item
          name="knownIssue"
          label="Known issue"
          tooltip="Set this and a failing case shows as KNOWN-FAIL instead of FAIL"
        >
          <Input.TextArea autoSize={{ minRows: 1, maxRows: 4 }} />
        </Form.Item>
        <Form.Item name="notes" label="Notes">
          <Input.TextArea autoSize={{ minRows: 1, maxRows: 4 }} />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
