import { Alert, Button, Card, Col, Flex, Row, Typography } from "antd";
import { useMemo, useState } from "react";
import { Loader } from "../../components/common/loader";
import {
  useRunScript,
  useScriptManifest,
} from "../../hooks/manage-scripts-hooks";
import { buildArgs, missingRequired } from "../../libs/build-script-args";
import {
  ArgsPreview,
  ScriptConfigForm,
  ScriptConfigValue,
} from "./script-config-form";

interface RunTabProps {
  onStarted: (jobId: string) => void;
}

export function RunTab({ onStarted }: RunTabProps) {
  const { data: manifest, isLoading, error } = useScriptManifest();
  const runScript = useRunScript();

  const [config, setConfig] = useState<ScriptConfigValue>({ values: {} });

  const spec = useMemo(
    () => manifest?.find((s) => s.name === config.scriptName),
    [manifest, config.scriptName],
  );

  const browserScripts = (manifest ?? [])
    .filter((s) => s.usesBrowser)
    .map((s) => s.name);

  const args = spec ? buildArgs(spec, config.modeKey, config.values) : [];
  const missing = spec
    ? missingRequired(spec, config.modeKey, config.values)
    : [];

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
          <ScriptConfigForm
            manifest={manifest ?? []}
            value={config}
            onChange={setConfig}
          />
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
                config.values.dryRun !== true && (
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
                      <ArgsPreview args={args} />
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
