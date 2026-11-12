import { LoadingOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Checkbox,
  Drawer,
  Flex,
  Modal,
  Tag,
  Typography,
} from "antd";
import { useState } from "react";
import { useExtractDeveloperReraProjectsMutation } from "../../hooks/developer-hooks";
import { useScriptJob, useStopJob } from "../../hooks/manage-scripts-hooks";
import { RERA_REFETCH_OPTIONS } from "../../libs/api/developer";
import { JobLogViewer } from "../../pages/manage-scripts/job-log-viewer";

const JOB_STATUS_COLOR: Record<string, string> = {
  running: "processing",
  done: "success",
  error: "error",
  stopped: "default",
  interrupted: "warning",
  skipped: "default",
};

export interface ExtractReraTarget {
  reraNumber: string;
  projectName?: string;
}

interface ExtractReraInfoProps {
  /** Projects to extract. The confirm modal is open while this is non-empty. */
  targets: ExtractReraTarget[] | undefined;
  onClose: () => void;
  /** Called after the job has been started successfully. */
  onStarted?: (jobId: string) => void;
}

/**
 * Confirm modal + live job drawer for the `extract-developer-rera-projects`
 * script. Handles one or many RERA numbers in a single job.
 */
export function ExtractReraInfo({
  targets,
  onClose,
  onStarted,
}: ExtractReraInfoProps) {
  const [refetchSections, setRefetchSections] = useState<string[]>([]);
  const [jobId, setJobId] = useState<string | undefined>();

  const extractMutation = useExtractDeveloperReraProjectsMutation();
  const { data: job } = useScriptJob(jobId);
  const stopJobMutation = useStopJob();

  const valid = (targets ?? []).filter((t) => t.reraNumber?.trim());
  const skipped = (targets?.length ?? 0) - valid.length;
  const reraNumbers = [...new Set(valid.map((t) => t.reraNumber.trim()))];

  const label =
    valid.length === 1
      ? `"${valid[0].projectName ?? valid[0].reraNumber}"`
      : `${reraNumbers.length} projects`;

  return (
    <>
      <Modal
        title="Extract RERA Information"
        open={!!targets?.length}
        onCancel={onClose}
        afterClose={() => setRefetchSections([])}
        okText="Extract"
        okButtonProps={{
          loading: extractMutation.isPending,
          disabled: reraNumbers.length === 0,
        }}
        onOk={async () => {
          if (!reraNumbers.length) return;
          const res = await extractMutation.mutateAsync({
            reraNumbers: reraNumbers.join(","),
            refetch: refetchSections.length ? refetchSections : undefined,
          });
          setJobId(res.jobId);
          onStarted?.(res.jobId);
          onClose();
        }}
      >
        <Typography.Text>
          Extract RERA information for {label}? This takes a few minutes
          {reraNumbers.length > 1 ? " per project" : ""}.
        </Typography.Text>

        {valid.length > 1 && (
          <div
            style={{
              marginTop: 12,
              maxHeight: 160,
              overflow: "auto",
              padding: "6px 10px",
              background: "#fafafa",
              borderRadius: 6,
            }}
          >
            {valid.map((t) => (
              <div key={t.reraNumber}>
                <Typography.Text style={{ fontSize: 12 }}>
                  {t.projectName ?? "-"}{" "}
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    ({t.reraNumber})
                  </Typography.Text>
                </Typography.Text>
              </div>
            ))}
          </div>
        )}

        {skipped > 0 && (
          <Alert
            style={{ marginTop: 12 }}
            type="warning"
            showIcon
            message={`${skipped} selected project${
              skipped > 1 ? "s have" : " has"
            } no RERA number and will be skipped.`}
          />
        )}

        <Flex vertical gap={8} style={{ marginTop: 16 }}>
          <Typography.Text type="secondary">
            Pick sections to re-scrape. Leave empty to only fill what's missing.
          </Typography.Text>
          <Checkbox.Group
            options={RERA_REFETCH_OPTIONS}
            value={refetchSections}
            onChange={(v) => setRefetchSections(v as string[])}
          />
        </Flex>
      </Modal>

      <Drawer
        open={!!jobId}
        onClose={() => setJobId(undefined)}
        width={820}
        title={
          <Flex align="center" gap={12}>
            <Tag
              color={JOB_STATUS_COLOR[job?.status ?? "running"]}
              icon={
                job?.status === "running" ? <LoadingOutlined spin /> : undefined
              }
            >
              {job?.status ?? "starting"}
            </Tag>
            <Typography.Text>RERA project extract</Typography.Text>
          </Flex>
        }
        extra={
          job?.status === "running" && (
            <Button
              danger
              size="small"
              onClick={() => stopJobMutation.mutate(job.id)}
            >
              Stop
            </Button>
          )
        }
      >
        <Flex vertical gap={12}>
          {job?.status === "running" && (
            <Typography.Text type="secondary">
              Closing this drawer won't stop the job — it also shows up under
              Manage Scripts → Runs.
            </Typography.Text>
          )}
          {job?.error && <Alert type="error" showIcon message={job.error} />}
          <JobLogViewer logs={job?.logs ?? []} height={520} />
        </Flex>
      </Drawer>
    </>
  );
}
