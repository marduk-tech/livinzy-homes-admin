import {
  Col,
  Form,
  Row,
  Segmented,
  Select,
  Space,
  Tag,
  Typography,
} from "antd";
import { useMemo } from "react";
import { ScriptParam, ScriptSpec } from "../../libs/api/manage-scripts";
import { activeParams, ParamValues } from "../../libs/build-script-args";
import { ScriptParamField } from "./script-param-field";

export interface ScriptConfigValue {
  scriptName?: string;
  modeKey?: string;
  values: ParamValues;
}

interface ScriptConfigFormProps {
  manifest: ScriptSpec[];
  value: ScriptConfigValue;
  onChange: (next: ScriptConfigValue) => void;

  scriptDisabled?: boolean;
}

export function ScriptConfigForm({
  manifest,
  value,
  onChange,
  scriptDisabled,
}: ScriptConfigFormProps) {
  const { scriptName, modeKey, values } = value;

  const spec = useMemo(
    () => manifest.find((s) => s.name === scriptName),
    [manifest, scriptName],
  );

  const pickScript = (name: string) => {
    const next = manifest.find((s) => s.name === name);

    onChange({ scriptName: name, modeKey: next?.modes?.[0]?.key, values: {} });
  };

  const pickMode = (key: string) =>
    onChange({ scriptName, modeKey: key, values: {} });

  const setValue = (param: string, next: unknown) => {
    const updated = { ...values, [param]: next };

    (spec ? activeParams(spec, modeKey) : []).forEach((p) => {
      if (p.source?.kind === "remote" && p.source.dependsOn === param) {
        delete updated[p.name];
      }
    });
    onChange({ scriptName, modeKey, values: updated });
  };

  const fields = spec ? activeParams(spec, modeKey) : [];
  const mode = spec?.modes?.find((m) => m.key === modeKey);

  const dependsOnValue = (param: ScriptParam) =>
    param.source?.kind === "remote" && param.source.dependsOn
      ? values[param.source.dependsOn]
      : undefined;

  return (
    <Form layout="vertical">
      <Form.Item
        label="Script"
        help={spec?.description}
        style={{ marginBottom: 16 }}
      >
        <Select
          showSearch
          value={scriptName}
          disabled={scriptDisabled}
          placeholder="Select a script"
          onChange={pickScript}
          options={manifest.map((s) => ({ value: s.name, label: s.name }))}
        />
      </Form.Item>

      {spec?.modes && spec.modes.length > 0 && (
        <Form.Item style={{ marginTop: 8, marginBottom: 16 }}>
          <Segmented
            value={modeKey}
            onChange={(v) => pickMode(v as string)}
            options={spec.modes.map((m) => ({ value: m.key, label: m.label }))}
          />
          {mode?.hint && (
            <div style={{ marginTop: 6 }}>
              <Typography.Text type="secondary">{mode.hint}</Typography.Text>
            </div>
          )}
        </Form.Item>
      )}

      <Row gutter={16}>
        {fields.map((param) => (
          <Col
            key={param.name}
            xs={24}
            md={
              param.control === "select" || param.control === "text" ? 12 : 24
            }
          >
            <ScriptParamField
              param={param}
              value={values[param.name]}
              onChange={(v) => setValue(param.name, v)}
              dependsOnValue={dependsOnValue(param)}
            />
          </Col>
        ))}
      </Row>

      {spec && fields.length === 0 && (
        <Typography.Text type="secondary">
          This script takes no arguments.
        </Typography.Text>
      )}
    </Form>
  );
}

export function ArgsPreview({ args }: { args: string[] }) {
  if (!args.length) {
    return <Typography.Text type="secondary">(no arguments)</Typography.Text>;
  }

  return (
    <Space size={[4, 4]} wrap>
      {args.map((arg, i) => (
        <Tag
          key={`${arg}-${i}`}
          style={{
            fontFamily: "monospace",
            whiteSpace: "normal",
            wordBreak: "break-all",
          }}
        >
          {arg}
        </Tag>
      ))}
    </Space>
  );
}
