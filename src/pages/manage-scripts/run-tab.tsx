import {
  Alert,
  Button,
  Card,
  Col,
  Flex,
  Form,
  Row,
  Segmented,
  Select,
  Space,
  Tag,
  Typography,
} from "antd";
import { useMemo, useState } from "react";
import { Loader } from "../../components/common/loader";
import {
  useRunScript,
  useScriptManifest,
} from "../../hooks/manage-scripts-hooks";
import { ScriptParam } from "../../libs/api/manage-scripts";
import {
  activeParams,
  buildArgs,
  missingRequired,
  ParamValues,
} from "../../libs/build-script-args";
import { ScriptParamField } from "./script-param-field";

interface RunTabProps {
  onStarted: (jobId: string) => void;
}

export function RunTab({ onStarted }: RunTabProps) {
  const { data: manifest, isLoading, error } = useScriptManifest();
  const runScript = useRunScript();

  const [scriptName, setScriptName] = useState<string>();
  const [modeKey, setModeKey] = useState<string>();
  const [values, setValues] = useState<ParamValues>({});

  const spec = useMemo(
    () => manifest?.find((s) => s.name === scriptName),
    [manifest, scriptName],
  );

  const pickScript = (name: string) => {
    const next = manifest?.find((s) => s.name === name);
    setScriptName(name);
    // A leftover RERA number must not survive into a developer field.
    setModeKey(next?.modes?.[0]?.key);
    setValues({});
  };

  const pickMode = (key: string) => {
    setModeKey(key);
    setValues({});
  };

  const setValue = (param: string, value: unknown) =>
    setValues((prev) => {
      const next = { ...prev, [param]: value };
      // Dependent lists are scoped to their parent, so a stale child is wrong.
      (spec ? activeParams(spec, modeKey) : []).forEach((p) => {
        if (p.source?.kind === "remote" && p.source.dependsOn === param) {
          delete next[p.name];
        }
      });
      return next;
    });

  const browserScripts = (manifest ?? [])
    .filter((s) => s.usesBrowser)
    .map((s) => s.name);

  const fields = spec ? activeParams(spec, modeKey) : [];
  const args = spec ? buildArgs(spec, modeKey, values) : [];
  const missing = spec ? missingRequired(spec, modeKey, values) : [];
  const mode = spec?.modes?.find((m) => m.key === modeKey);

  const dependsOnValue = (param: ScriptParam) =>
    param.source?.kind === "remote" && param.source.dependsOn
      ? values[param.source.dependsOn]
      : undefined;

  const handleRun = () => {
    if (!spec) return;
    runScript.mutate(
      { script: spec.name, args },
      { onSuccess: (data) => onStarted(data.jobId) },
    );
  };

  if (isLoading) return <Loader />;

  if (error) {
    return (
      <Alert
        type="error"
        showIcon
        message="Could not reach the script server"
        description="Check that VITE_SCRIPT_SERVER_API_URL points at a running stagehand instance and that this origin is in its ALLOWED_ORIGINS."
      />
    );
  }

  return (
    <Row gutter={[24, 24]}>
      <Col xs={24} lg={14} xl={15}>
        <Card size="small" title="Configure">
          <Form layout="vertical">
            <Form.Item
              label="Script"
              help={spec?.description}
              style={{ marginBottom: 16 }}
            >
              <Select
                showSearch
                value={scriptName}
                placeholder="Select a script"
                onChange={pickScript}
                options={(manifest ?? []).map((s) => ({
                  value: s.name,
                  label: s.name,
                }))}
              />
            </Form.Item>

            {spec?.modes && spec.modes.length > 0 && (
              <Form.Item style={{ marginTop: 8, marginBottom: 16 }}>
                <Segmented
                  value={modeKey}
                  onChange={(v) => pickMode(v as string)}
                  options={spec.modes.map((m) => ({
                    value: m.key,
                    label: m.label,
                  }))}
                />
                {mode?.hint && (
                  <div style={{ marginTop: 6 }}>
                    <Typography.Text type="secondary">
                      {mode.hint}
                    </Typography.Text>
                  </div>
                )}
              </Form.Item>
            )}

            <Row gutter={16}>
              {fields.map((param) => (
                <Col
                  key={param.name}
                  xs={24}
                  md={param.control === "select" || param.control === "text" ? 12 : 24}
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
        </Card>
      </Col>

      <Col xs={24} lg={10} xl={9}>
        <div style={{ position: "sticky", top: 16 }}>
          <Card size="small" title="Review & run">
            <Flex vertical gap={12}>
              {!spec && (
                <Typography.Text type="secondary">
                  Pick a script to get started.
                </Typography.Text>
              )}

              {spec?.usesBrowser && (
                <Alert
                  type="info"
                  showIcon
                  message="Uses the shared browser profile"
                  description={
                    <>
                      Only one browser script runs at a time (
                      {browserScripts.join(", ")}). If one is already running,
                      this is rejected it does not queue. Everything else can
                      run alongside it, up to 3 jobs at once.
                    </>
                  }
                />
              )}

              {spec?.name === "extract-developer-rera-projects" &&
                values.dryRun !== true && (
                  <Alert
                    type="warning"
                    showIcon
                    message="Dry run is off this writes to reraprojects and takes the browser profile."
                  />
                )}

              {spec && (
                <>
                  <div>
                    <Typography.Text type="secondary">
                      Arguments sent
                    </Typography.Text>
                    <div style={{ marginTop: 8 }}>
                      {args.length ? (
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
                      ) : (
                        <Typography.Text type="secondary">
                          (no arguments)
                        </Typography.Text>
                      )}
                    </div>
                  </div>

                  <Flex align="center" gap={12} wrap>
                    <Button
                      type="primary"
                      loading={runScript.isPending}
                      disabled={missing.length > 0}
                      onClick={handleRun}
                    >
                      Run
                    </Button>
                    {missing.length > 0 && (
                      <Typography.Text type="secondary">
                        Needs: {missing.join(", ")}
                      </Typography.Text>
                    )}
                  </Flex>

                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    Runs go through the retry wrapper — RUN_COUNT passes
                    (default 2), up to RETRY_LIMIT attempts each. One click can
                    mean two full runs.
                  </Typography.Text>
                </>
              )}
            </Flex>
          </Card>
        </div>
      </Col>
    </Row>
  );
}
