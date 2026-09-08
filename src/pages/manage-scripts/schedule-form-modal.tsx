import {
  Alert,
  Col,
  Divider,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Switch,
  Typography,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import {
  useCreateCronSchedule,
  useUpdateCronSchedule,
} from "../../hooks/cron-schedules-hooks";
import { useScriptManifest } from "../../hooks/manage-scripts-hooks";
import { CronSchedule } from "../../libs/api/cron-schedules";
import { buildArgs, missingRequired } from "../../libs/build-script-args";
import {
  ArgsPreview,
  ScriptConfigForm,
  ScriptConfigValue,
} from "./script-config-form";

const PRESETS = [
  { value: "0 2 * * *", label: "Every day at 02:00" },
  { value: "0 2 * * 0", label: "Every Sunday at 02:00" },
  { value: "0 2 1 * *", label: "1st of the month at 02:00" },
  { value: "0 */6 * * *", label: "Every 6 hours" },
];

const TIMEZONES = ["Asia/Kolkata", "UTC"];

interface ScheduleFormModalProps {
  open: boolean;
  schedule?: CronSchedule;
  onClose: () => void;
}

export function ScheduleFormModal({
  open,
  schedule,
  onClose,
}: ScheduleFormModalProps) {
  const { data: manifest } = useScriptManifest();
  const create = useCreateCronSchedule();
  const update = useUpdateCronSchedule();

  const [config, setConfig] = useState<ScriptConfigValue>({ values: {} });
  const [label, setLabel] = useState("");
  const [expression, setExpression] = useState("");
  const [timezone, setTimezone] = useState(TIMEZONES[0]);
  const [enabled, setEnabled] = useState(true);

  // Editing recovers the script and cron, but not the individual param values —
  // args are stored as the built argv, which the manifest can't reliably invert.
  useEffect(() => {
    if (!open) return;
    setConfig({ scriptName: schedule?.script, values: {} });
    setLabel(schedule?.label ?? "");
    setExpression(schedule?.cron ?? "");
    setTimezone(schedule?.timezone ?? TIMEZONES[0]);
    setEnabled(schedule?.enabled ?? true);
  }, [open, schedule]);

  const spec = useMemo(
    () => manifest?.find((s) => s.name === config.scriptName),
    [manifest, config.scriptName],
  );

  const args = spec ? buildArgs(spec, config.modeKey, config.values) : [];
  const missing = spec
    ? missingRequired(spec, config.modeKey, config.values)
    : [];

  // Editing starts with blank params, so a schedule whose script has required
  // ones would otherwise be uneditable — you could never just move its time.
  const usingExistingArgs =
    !!schedule && !args.length && schedule.args.length > 0;
  const keptArgs = usingExistingArgs ? schedule.args : args;
  const canSave =
    !!spec && !!expression && (usingExistingArgs || missing.length === 0);

  const handleSave = () => {
    if (!spec) return;
    const payload = {
      label: label.trim() || undefined,
      script: spec.name,
      args: keptArgs,
      cron: expression.trim(),
      timezone,
      enabled,
    };

    const mutation = schedule
      ? update.mutateAsync({ id: schedule.id, ...payload })
      : create.mutateAsync(payload);

    mutation.then(onClose).catch(() => {
      /* notification already raised by the hook */
    });
  };

  return (
    <Modal
      open={open}
      title={schedule ? "Edit schedule" : "New schedule"}
      okText="Save"
      onOk={handleSave}
      onCancel={onClose}
      okButtonProps={{
        disabled: !canSave,
        loading: create.isPending || update.isPending,
      }}
      width={720}
      destroyOnClose
    >
      <ScriptConfigForm
        manifest={manifest ?? []}
        value={config}
        onChange={setConfig}
        scriptDisabled={!!schedule}
      />

      {usingExistingArgs && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Keeping the existing arguments"
          description={<ArgsPreview args={schedule.args} />}
        />
      )}

      <Divider style={{ margin: "8px 0 16px" }} />

      <Form layout="vertical">
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Cron expression"
              help="Five fields, e.g. 0 2 * * 0 for Sundays at 02:00."
            >
              <Input
                value={expression}
                placeholder="0 2 * * 0"
                onChange={(e) => setExpression(e.target.value)}
                style={{ fontFamily: "monospace" }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Common schedules">
              <Select
                placeholder="Pick one to fill the expression"
                options={PRESETS}
                value={PRESETS.find((p) => p.value === expression)?.value}
                onChange={setExpression}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Timezone">
              <Select
                value={timezone}
                onChange={setTimezone}
                options={TIMEZONES.map((t) => ({ value: t, label: t }))}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Label" help="Optional, for the schedules list.">
              <Input
                value={label}
                placeholder="Weekly pricing refresh"
                onChange={(e) => setLabel(e.target.value)}
              />
            </Form.Item>
          </Col>

          <Col xs={24}>
            <Form.Item label="Enabled">
              <Switch checked={enabled} onChange={setEnabled} />
            </Form.Item>
          </Col>
        </Row>

        {!!spec && (
          <div>
            <Typography.Text type="secondary">Arguments sent</Typography.Text>
            <div style={{ marginTop: 8 }}>
              <ArgsPreview args={keptArgs} />
            </div>
          </div>
        )}

        {missing.length > 0 && !usingExistingArgs && (
          <Typography.Text type="secondary">
            Needs: {missing.join(", ")}
          </Typography.Text>
        )}
      </Form>
    </Modal>
  );
}
