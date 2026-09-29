import {
  Alert,
  Button,
  Card,
  Col,
  Flex,
  Input,
  InputNumber,
  Row,
  Select,
  Spin,
  Switch,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { useMemo, useState } from "react";
import { useClearConfigOverride, useGatewayConfig, usePatchGatewayConfig } from "../../hooks/portal-gateway-hooks";
import type { ConfigSource, FieldHint } from "../../libs/api/portal-gateway";
import { errorMessage } from "../../libs/api-error";

type Plain = Record<string, unknown>;
const isPlain = (v: unknown): v is Plain => typeof v === "object" && v !== null && !Array.isArray(v);

const SOURCE_COLOR: Record<ConfigSource, string> = {
  default: "default",
  file: "geekblue",
  env: "purple",
  override: "gold",
};

// One row per leaf, e.g. "portals.housing.warm.minDwellMs".
function leaves(obj: unknown, prefix = ""): { path: string; value: unknown }[] {
  if (!isPlain(obj)) return [{ path: prefix, value: obj }];
  return Object.entries(obj).flatMap(([k, v]) => leaves(v, prefix ? `${prefix}.${k}` : k));
}

function setPath(target: Plain, path: string, value: unknown): void {
  const keys = path.split(".");
  let node = target;
  for (const k of keys.slice(0, -1)) node = (node[k] = isPlain(node[k]) ? node[k] : {}) as Plain;
  node[keys[keys.length - 1]] = value;
}

// e.g. maxAgeMs: null = off. Stays empty after switching on until a number is typed.
function NullableNumber({
  value,
  disabled,
  onChange,
}: {
  value: number | null;
  disabled: boolean;
  onChange: (v: unknown) => void;
}) {
  const [on, setOn] = useState(value !== null);
  return (
    <Flex gap={6} align="center">
      <Switch
        size="small"
        checked={on}
        disabled={disabled}
        checkedChildren="on"
        unCheckedChildren="off"
        onChange={(checked) => {
          setOn(checked);
          if (!checked) onChange(null);
        }}
      />
      {on && (
        <InputNumber
          size="small"
          value={value ?? undefined}
          disabled={disabled}
          placeholder="value"
          onChange={(v) => v != null && onChange(v)}
        />
      )}
    </Flex>
  );
}

function Field({
  value,
  original,
  hint,
  disabled,
  onChange,
}: {
  value: unknown;
  original: unknown;
  hint?: FieldHint;
  disabled: boolean;
  onChange: (v: unknown) => void;
}) {
  if (hint?.type === "number" && hint.nullable) {
    return <NullableNumber value={value as number | null} disabled={disabled} onChange={onChange} />;
  }
  if (typeof original === "boolean") {
    return <Switch size="small" checked={value as boolean} disabled={disabled} onChange={onChange} />;
  }
  if (typeof original === "number") {
    return <InputNumber size="small" value={value as number} disabled={disabled} onChange={(v) => onChange(v ?? 0)} />;
  }
  if (Array.isArray(original)) {
    // ladderMinutes etc.; proxies are shown redacted and are restart-only anyway
    if (hint?.type === "number[]" || (original.length > 0 && original.every((x) => typeof x === "number"))) {
      return (
        <Select
          size="small"
          mode="tags"
          style={{ minWidth: 260 }}
          disabled={disabled}
          value={(value as number[]).map(String)}
          onChange={(v: string[]) => onChange(v.map(Number).filter((n) => Number.isFinite(n)))}
        />
      );
    }
    return <Typography.Text type="secondary">{original.length} item(s)</Typography.Text>;
  }
  // strings and nullable strings (null = off)
  return (
    <Input
      size="small"
      style={{ minWidth: 320 }}
      disabled={disabled}
      value={(value as string | null) ?? ""}
      placeholder={original === null ? "empty = off" : undefined}
      onChange={(e) => onChange(e.target.value === "" && original === null ? null : e.target.value)}
    />
  );
}

export function ConfigTab() {
  const { data, isLoading, error } = useGatewayConfig();
  const save = usePatchGatewayConfig();
  const reset = useClearConfigOverride();
  const [edits, setEdits] = useState<Record<string, unknown>>({});

  const sections = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.config).map(([section, value]) => ({
      section,
      restartOnly: data.restartOnly.includes(section),
      fields: isPlain(value) ? leaves(value, section) : [{ path: section, value }],
    }));
  }, [data]);

  if (isLoading) return <Spin />;
  if (error || !data) return <Alert type="error" showIcon message={errorMessage(error, "Could not load config")} />;

  const dirty = Object.keys(edits).length;

  const submit = () => {
    const patch: Plain = {};
    for (const [path, value] of Object.entries(edits)) setPath(patch, path, value);
    save.mutate(patch, { onSuccess: () => setEdits({}) });
  };

  return (
    <Flex vertical gap={12}>
      <Alert
        type="info"
        showIcon
        message="Values resolve as default < portal-gateway.local.json < env < override (saved here). Changes apply live, except restart-only sections."
      />
      <Flex gap={8}>
        <Button type="primary" disabled={!dirty} loading={save.isPending} onClick={submit}>
          Save {dirty ? `${dirty} change${dirty > 1 ? "s" : ""}` : ""}
        </Button>
        <Button disabled={!dirty} onClick={() => setEdits({})}>
          Discard
        </Button>
      </Flex>

      <Row gutter={[16, 16]}>
        {sections.map(({ section, restartOnly, fields }) => (
          <Col key={section} xs={24} xl={12}>
            <Card
              size="small"
              title={
                <Flex gap={8} align="center">
                  {section}
                  {restartOnly && <Tag>restart-only</Tag>}
                </Flex>
              }
            >
              <Flex vertical gap={6}>
                {fields.map(({ path, value }) => {
                  const source = data.sources[path] ?? "default";
                  const current = path in edits ? edits[path] : value;
                  return (
                    <Flex key={path} justify="space-between" align="center" gap={8} wrap>
                      <Typography.Text style={{ fontFamily: "monospace", fontSize: 12 }}>
                        {path.slice(section.length + 1) || section}
                      </Typography.Text>
                      <Flex gap={6} align="center">
                        <Field
                          value={current}
                          original={value}
                          hint={data.fields?.[path]}
                          disabled={restartOnly}
                          onChange={(v) => setEdits((e) => ({ ...e, [path]: v }))}
                        />
                        <Tag color={SOURCE_COLOR[source]}>{source}</Tag>
                        {source === "override" && (
                          <Tooltip title="Drop the override and fall back to env/default">
                            <Typography.Link onClick={() => reset.mutate(path)}>reset</Typography.Link>
                          </Tooltip>
                        )}
                      </Flex>
                    </Flex>
                  );
                })}
              </Flex>
            </Card>
          </Col>
        ))}
      </Row>
    </Flex>
  );
}
