import { LoadingOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Drawer,
  Flex,
  Popconfirm,
  Segmented,
  Table,
  TableColumnType,
  Tag,
  Typography,
} from "antd";
import { useState } from "react";
import { useCronSchedules } from "../../hooks/cron-schedules-hooks";
import {
  useScriptJob,
  useScriptJobs,
  useStopJob,
} from "../../hooks/manage-scripts-hooks";
import { Job, JobSummary, jobLogsUrl } from "../../libs/api/manage-scripts";
import { JobLogViewer } from "./job-log-viewer";

const STATUS_COLOR: Record<string, string> = {
  running: "processing",
  done: "success",
  error: "error",
  stopped: "default",
  interrupted: "warning",
  skipped: "default",
};

const STATUSES = [
  "running",
  "done",
  "error",
  "stopped",
  "interrupted",
  "skipped",
];

const KINDS = ["run", "cron", "developer-gen"];

const PAGE = 200;

const RETENTION_DAYS = 30;

function summarize(job: JobSummary): string {
  const meta = job.meta ?? {};
  if (typeof meta.script === "string") {
    const args = Array.isArray(meta.args) ? (meta.args as string[]) : [];
    return [meta.script, ...args].join(" ");
  }
  if (typeof meta.developerId === "string") return meta.developerId;
  return "—";
}

function duration(job: JobSummary): string {
  const end = job.finishedAt ? new Date(job.finishedAt) : new Date();
  const seconds = (end.getTime() - new Date(job.startedAt).getTime()) / 1000;
  if (seconds < 60) return `${seconds.toFixed(0)}s`;
  if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`;
  return `${(seconds / 3600).toFixed(1)}h`;
}

function LogNotice({ job }: { job: Job }) {
  if (job.logsExpired) {
    return (
      <Alert
        type="info"
        showIcon
        message={`Logs were cleared after ${RETENTION_DAYS} days`}
        description={
          job.logLines
            ? `The run kept its result; its ${job.logLines.toLocaleString()} log lines are gone.`
            : undefined
        }
      />
    );
  }

  if (!job.logsTruncated) return null;

  return (
    <Flex justify="space-between" align="center" gap={12} wrap>
      <Typography.Text type="secondary">
        Showing the last {(job.logs?.length ?? 0).toLocaleString()} of{" "}
        {(job.logLines ?? 0).toLocaleString()} lines.
      </Typography.Text>
      <Typography.Link href={jobLogsUrl(job.id)} target="_blank">
        Open the full log
      </Typography.Link>
    </Flex>
  );
}

interface RunsTabProps {
  selectedJobId?: string;
  onSelectJob: (jobId?: string) => void;
}

export function RunsTab({ selectedJobId, onSelectJob }: RunsTabProps) {
  const [kind, setKind] = useState<string>("all");
  const [limit, setLimit] = useState(PAGE);

  const {
    data: jobs,
    isLoading,
    error,
  } = useScriptJobs({ limit, kind: kind === "all" ? undefined : kind });
  const { data: job } = useScriptJob(selectedJobId);
  const { data: schedules } = useCronSchedules();
  const stopJob = useStopJob();

  const scheduleName = (id?: string) => {
    if (!id) return undefined;
    const match = schedules?.find((s) => s.id === id);
    return match?.label || match?.cron;
  };

  const columns: TableColumnType<JobSummary>[] = [
    {
      title: "Status",
      dataIndex: "status",
      width: 130,
      render: (status: string) => (
        <Tag
          color={STATUS_COLOR[status] ?? "default"}
          icon={status === "running" ? <LoadingOutlined spin /> : undefined}
        >
          {status}
        </Tag>
      ),
      filters: STATUSES.map((s) => ({ text: s, value: s })),
      onFilter: (value, record) => record.status === value,
    },
    { title: "Kind", dataIndex: "kind", width: 130 },
    {
      title: "Run",
      key: "summary",
      render: (_, record) => (
        <Flex vertical>
          <Typography.Text style={{ fontFamily: "monospace", fontSize: 12 }}>
            {summarize(record)}
          </Typography.Text>
          {record.scheduleId && (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              via {scheduleName(record.scheduleId) ?? "a deleted schedule"}
            </Typography.Text>
          )}
        </Flex>
      ),
    },
    {
      title: "Started",
      dataIndex: "startedAt",
      width: 180,
      sorter: (a, b) => a.startedAt.localeCompare(b.startedAt),
      defaultSortOrder: "descend",
      render: (value: string) => new Date(value).toLocaleString(),
    },
    {
      title: "Duration",
      key: "duration",
      width: 100,
      render: (_, record) => duration(record),
    },
    {
      title: "",
      key: "actions",
      width: 90,
      render: (_, record) =>
        record.status === "running" ? (
          <Popconfirm
            title="Stop this run?"
            description="Stopping mid-run is not a clean undo — anything already written stays."
            onConfirm={(e) => {
              e?.stopPropagation();
              stopJob.mutate(record.id);
            }}
            onCancel={(e) => e?.stopPropagation()}
          >
            <Button danger size="small" onClick={(e) => e.stopPropagation()}>
              Stop
            </Button>
          </Popconfirm>
        ) : null,
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

  return (
    <Flex vertical gap={12}>
      <Flex justify="space-between" align="center" gap={16} wrap>
        <Typography.Text type="secondary">
          Every run is kept on the script server's disk with its full output, so
          scheduled runs are still here after a redeploy. Logs are cleared after{" "}
          {RETENTION_DAYS} days; the runs themselves stay.
        </Typography.Text>
        <Segmented
          value={kind}
          onChange={(value) => {
            setKind(value as string);
            setLimit(PAGE);
          }}
          options={[
            { value: "all", label: "All" },
            ...KINDS.map((k) => ({ value: k, label: k })),
          ]}
        />
      </Flex>

      <Table
        rowKey="id"
        size="small"
        loading={isLoading}
        dataSource={jobs}
        columns={columns}
        pagination={{ pageSize: 20, hideOnSinglePage: true }}
        onRow={(record) => ({
          onClick: () => onSelectJob(record.id),
          style: { cursor: "pointer" },
        })}
      />

      {jobs && jobs.length >= limit && (
        <Flex justify="center">
          <Button onClick={() => setLimit((n) => n + PAGE)}>Load more</Button>
        </Flex>
      )}

      <Drawer
        open={!!selectedJobId}
        onClose={() => onSelectJob(undefined)}
        width={820}
        title={
          job ? (
            <Flex align="center" gap={12}>
              <Tag color={STATUS_COLOR[job.status] ?? "default"}>
                {job.status}
              </Tag>
              <Typography.Text
                style={{ fontFamily: "monospace", fontSize: 13 }}
              >
                {summarize(job)}
              </Typography.Text>
            </Flex>
          ) : (
            "Run"
          )
        }
        extra={
          job?.status === "running" && (
            <Button danger size="small" onClick={() => stopJob.mutate(job.id)}>
              Stop
            </Button>
          )
        }
      >
        {job && (
          <Flex vertical gap={12}>
            <Typography.Text type="secondary">
              Started {new Date(job.startedAt).toLocaleString()} · ran for{" "}
              {duration(job)}
            </Typography.Text>

            {job.error && <Alert type="error" showIcon message={job.error} />}

            <LogNotice job={job} />

            <JobLogViewer logs={job.logs ?? []} height={520} />
          </Flex>
        )}
      </Drawer>
    </Flex>
  );
}
