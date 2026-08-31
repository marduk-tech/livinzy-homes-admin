import {
  Alert,
  Flex,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Typography,
} from "antd";
import { useState } from "react";
import { useScriptOptions } from "../../hooks/use-script-options";
import { useUnknownValues } from "../../hooks/use-unknown-values";
import { ScriptParam } from "../../libs/api/manage-scripts";
import { OBJECT_ID } from "../../libs/build-script-args";

interface ScriptParamFieldProps {
  param: ScriptParam;
  value: unknown;
  onChange: (value: unknown) => void;
  dependsOnValue?: unknown;
}

export function ScriptParamField({
  param,
  value,
  onChange,
  dependsOnValue,
}: ScriptParamFieldProps) {
  const [search, setSearch] = useState("");
  const { options, loading, serverSearched } = useScriptOptions(
    param.source,
    search,
    dependsOnValue,
  );

  const entries = (Array.isArray(value) ? value : [value])
    .filter((v): v is string => typeof v === "string" && !!v.trim())
    .map((v) => v.trim());

  const malformed =
    param.expects === "objectId"
      ? entries.filter((v) => !OBJECT_ID.test(v))
      : [];
  const badFormat = malformed.length > 0;

  // Checking a malformed id against the db would just stack a second error on it.
  const { unknown, checking } = useUnknownValues(
    param.source,
    value,
    !badFormat,
  );

  const dependsOn =
    param.source?.kind === "remote" ? param.source.dependsOn : undefined;
  const blocked = !!dependsOn && !dependsOnValue;

  // Server-searched lists must not also be filtered client-side, or a result the
  // server just returned gets hidden because the label doesn't contain the query.
  const searchProps = serverSearched
    ? { filterOption: false as const, onSearch: setSearch }
    : {
        onSearch: setSearch,
        filterOption: (input: string, option?: { label?: string }) =>
          (option?.label ?? "").toLowerCase().includes(input.toLowerCase()),
      };

  const hint = blocked ? `Pick a ${dependsOn} first.` : param.hint;

  const label = (
    <>
      {param.label}
      {param.required && <Typography.Text type="danger"> *</Typography.Text>}
    </>
  );

  if (param.control === "flag") {
    return (
      <Form.Item help={hint} style={{ marginBottom: 16 }}>
        <Flex align="center" gap={8}>
          <Switch
            checked={value === true}
            onChange={(checked) => onChange(checked)}
          />
          <Typography.Text>{param.label}</Typography.Text>
        </Flex>
      </Form.Item>
    );
  }

  const control = () => {
    switch (param.control) {
      case "number":
        return (
          <InputNumber
            style={{ width: "100%" }}
            min={1}
            value={value as number | undefined}
            placeholder={param.placeholder}
            onChange={(v) => onChange(v ?? undefined)}
          />
        );

      case "text":
        return (
          <Input
            allowClear
            status={badFormat ? "error" : undefined}
            value={value as string | undefined}
            placeholder={param.placeholder}
            onChange={(e) => onChange(e.target.value)}
          />
        );

      case "select":
      case "multiselect":
      case "tags":
        return (
          <Select
            showSearch
            allowClear
            mode={
              param.control === "tags"
                ? "tags"
                : param.control === "multiselect"
                  ? "multiple"
                  : undefined
            }
            disabled={blocked}
            loading={loading}
            options={options}
            value={(value as string | string[] | undefined) ?? undefined}
            placeholder={param.placeholder ?? `Select ${param.label}`}
            onChange={(v) => onChange(v)}
            onBlur={() => setSearch("")}
            notFoundContent={
              loading
                ? "Loading..."
                : param.control === "tags"
                  ? "No matches — type a value and press enter"
                  : "No matches"
            }
            {...searchProps}
          />
        );
    }
  };

  const warning = () => {
    if (badFormat) {
      return (
        <Alert
          type="error"
          showIcon
          style={{ marginTop: 8 }}
          message={
            malformed.length > 1
              ? `Not 24-character Mongo ids: ${malformed.join(", ")}`
              : `Not a 24-character Mongo id: ${malformed[0]}`
          }
        />
      );
    }

    if (checking || unknown.length === 0) return null;

    const isDeveloper =
      param.source?.kind === "remote" && param.source.name === "developers";

    return (
      <Alert
        type="warning"
        showIcon
        style={{ marginTop: 8 }}
        message={
          isDeveloper
            ? `Not found: ${unknown.join(", ")}`
            : `Not in reraprojects: ${unknown.join(", ")}`
        }
        description="You can still run it — the script may find it, or fail with a list of near matches."
      />
    );
  };

  return (
    <Form.Item label={label} help={hint} style={{ marginBottom: 16 }}>
      {control()}
      {warning()}
    </Form.Item>
  );
}
