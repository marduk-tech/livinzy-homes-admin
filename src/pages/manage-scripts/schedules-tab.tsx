import { PlusOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Flex,
  Popconfirm,
  Switch,
  Table,
  TableColumnType,
  Tag,
  Typography,
} from "antd";
import { useState } from "react";
import {
  useCronSchedules,
  useDeleteCronSchedule,
  useRunCronScheduleNow,
  useUpdateCronSchedule,
} from "../../hooks/cron-schedules-hooks";
import { CronSchedule } from "../../libs/api/cron-schedules";
import { ScheduleFormModal } from "./schedule-form-modal";

interface SchedulesTabProps {
  onStarted: (jobId: string) => void;
}

export function SchedulesTab({ onStarted }: SchedulesTabProps) {
  const { data: schedules, isLoading, error } = useCronSchedules();
  const update = useUpdateCronSchedule();
  const remove = useDeleteCronSchedule();
  const runNow = useRunCronScheduleNow();

  const [editing, setEditing] = useState<CronSchedule>();
  const [modalOpen, setModalOpen] = useState(false);

  const openNew = () => {
    setEditing(undefined);
    setModalOpen(true);
  };

  const openEdit = (schedule: CronSchedule) => {
    setEditing(schedule);
    setModalOpen(true);
  };

  const columns: TableColumnType<CronSchedule>[] = [
    {
      title: "Schedule",
      key: "label",
      render: (_, record) => (
        <Flex vertical>
          <Typography.Text strong>
            {record.label || record.script}
          </Typography.Text>
          <Typography.Text
            type="secondary"
            style={{ fontFamily: "monospace", fontSize: 12 }}
          >
            {[record.script, ...record.args].join(" ")}
          </Typography.Text>
        </Flex>
      ),
    },
    {
      title: "Cron",
      dataIndex: "cron",
      width: 140,
      render: (value: string, record) => (
        <Flex vertical>
          <Typography.Text style={{ fontFamily: "monospace", fontSize: 12 }}>
            {value}
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {record.timezone}
          </Typography.Text>
        </Flex>
      ),
    },
    {
      title: "Next run",
      key: "nextRun",
      width: 190,
      render: (_, record) =>
        record.nextRun ? (
          new Date(record.nextRun).toLocaleString()
        ) : (
          <Typography.Text type="secondary">
            {record.enabled ? "not armed" : "—"}
          </Typography.Text>
        ),
    },
    {
      title: "Last run",
      key: "lastRun",
      width: 190,
      render: (_, record) =>
        record.lastRunAt ? (
          <Button
            type="link"
            size="small"
            style={{ padding: 0 }}
            onClick={() => record.lastJobId && onStarted(record.lastJobId)}
          >
            {new Date(record.lastRunAt).toLocaleString()}
          </Button>
        ) : (
          <Typography.Text type="secondary">never</Typography.Text>
        ),
    },
    {
      title: "On",
      key: "enabled",
      width: 70,
      render: (_, record) => (
        <Switch
          size="small"
          checked={record.enabled}
          loading={update.isPending}
          onChange={(enabled) =>
            update.mutate({ id: record.id, enabled })
          }
        />
      ),
    },
    {
      title: "",
      key: "actions",
      width: 190,
      render: (_, record) => (
        <Flex gap={8}>
          <Button size="small" onClick={() => openEdit(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Run this now?"
            description="Starts immediately, outside the schedule."
            onConfirm={() =>
              runNow.mutate(record.id, {
                onSuccess: (data) => onStarted(data.jobId),
              })
            }
          >
            <Button size="small">Run now</Button>
          </Popconfirm>
          <Popconfirm
            title="Delete this schedule?"
            description="Past runs are kept."
            onConfirm={() => remove.mutate(record.id)}
          >
            <Button size="small" danger>
              Delete
            </Button>
          </Popconfirm>
        </Flex>
      ),
    },
  ];

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

  const noneArmed =
    !!schedules?.some((s) => s.enabled) &&
    schedules.every((s) => !s.nextRun);

  return (
    <Flex vertical gap={12}>
      <Flex justify="space-between" align="center" gap={16} wrap>
        <Typography.Text type="secondary">
          Scheduled runs show up under Runs tagged <Tag>cron</Tag> alongside
          manual ones. A fire the server has to reject is recorded too, as{" "}
          <Tag>skipped</Tag>.
        </Typography.Text>
        <Button type="primary" icon={<PlusOutlined />} onClick={openNew}>
          Add schedule
        </Button>
      </Flex>

      {noneArmed && (
        <Alert
          type="warning"
          showIcon
          message="Nothing is armed on the server"
          description="Schedules are enabled here but none report a next run, which is what CRON_ENABLED=false looks like. Set it to true on the script server."
        />
      )}

      <Table
        rowKey="id"
        size="small"
        loading={isLoading}
        dataSource={schedules}
        columns={columns}
        pagination={false}
      />

      <ScheduleFormModal
        open={modalOpen}
        schedule={editing}
        onClose={() => setModalOpen(false)}
      />
    </Flex>
  );
}
