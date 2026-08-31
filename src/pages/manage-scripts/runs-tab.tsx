import { LoadingOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Drawer,
  Flex,
  Popconfirm,
  Table,
  TableColumnType,
  Tag,
  Typography,
} from "antd";
import {
  useScriptJob,
  useScriptJobs,
  useStopJob,
} from "../../hooks/manage-scripts-hooks";
import { JobSummary } from "../../libs/api/manage-scripts";
import { JobLogViewer } from "./job-log-viewer";

const STATUS_COLOR: Record<string, string> = {
  running: "processing",
  done: "success",
  error: "error",
  stopped: "default",
};

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

interface RunsTabProps {
  selectedJobId?: string;
  onSelectJob: (jobId?: string) => void;
}

export function RunsTab({ selectedJobId, onSelectJob }: RunsTabProps) {
  const { data: jobs, isLoading, error } = useScriptJobs();
  const { data: job } = useScriptJob(selectedJobId);
  const stopJob = useStopJob();

  const columns: TableColumnType<JobSummary>[] = [
    {
      title: "Status",
      dataIndex: "status",
      width: 120,
      render: (status: string) => (
        <Tag
          color={STATUS_COLOR[status] ?? "default"}
          icon={status === "running" ? <LoadingOutlined spin /> : undefined}
        >
          {status}
        </Tag>
      ),
      filters: ["running", "done", "error", "stopped"].map((s) => ({
        text: s,
        value: s,
      })),
      onFilter: (value, record) => record.status === value,
    },
    { title: "Kind", dataIndex: "kind", width: 130 },
    {
      title: "Run",
      key: "summary",
      render: (_, record) => (
        <Typography.Text style={{ fontFamily: "monospace", fontSize: 12 }}>
          {summarize(record)}
        </Typography.Text>
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
      <Typography.Text type="secondary">
        Run history lives in the script server's memory — it resets on every
        redeploy, keeps the last 200 runs, and logs keep the last 500 lines.
      </Typography.Text>

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

            <JobLogViewer logs={job.logs ?? []} height={520} />
          </Flex>
        )}
      </Drawer>
    </Flex>
  );
}
