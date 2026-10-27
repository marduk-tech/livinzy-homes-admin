import { ContainerOutlined, DatabaseOutlined, EditOutlined, FileTextOutlined, LinkOutlined } from "@ant-design/icons";
import { useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Flex,
  Spin,
  Table,
  TableColumnType,
  Tabs,
  Typography,
} from "antd";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useGetAllLvnzyProjects } from "../../hooks/lvnzyprojects-hooks";
import { LvnzyProject } from "../../types/lvnzy-project";
import { ColumnSearch } from "../common/column-search";
import {
  generateScoresStreamed,
  ScoreCardBatchResult,
  ScoreCardProgress,
} from "../../libs/api/projects";
import { brickfiAppUrl, queryKeys } from "../../libs/constants";
import { Loader } from "../common/loader";
import { STATUS_OPTIONS } from "../projects-list";
import { GenerateScoreCardModal } from "./generate-score-card-modal";

type ReportTabKey = "verified" | "unverified" | "notPrepared" | "invalidStatus";

const REPORT_TABS: { key: ReportTabKey; label: string }[] = [
  { key: "verified", label: "Verified Reports" },
  { key: "unverified", label: "Unverified Reports" },
  { key: "notPrepared", label: "Report Not Prepared" },
  { key: "invalidStatus", label: "Invalid Status" },
];

// the only statuses a project with a Brick360 entry should be in - anything
// else goes to the Invalid Status tab
const VALID_REPORT_STATUSES = ["data-verified", "report-ready", "report-verified"];

// the tabs whose projects can have reports generated - Invalid Status
// projects would be rejected by the generate-score endpoint
const GENERATABLE_TABS: ReportTabKey[] = ["verified", "unverified", "notPrepared"];

// most projects one report request can take - each one runs its own data
// processing and LLM scoring on the server
const MAX_REPORT_SELECTION = 10;

// One line describing where a streamed report request has got to
const describeProgress = ({
  stage,
  total,
  passed,
  failed,
  attempt,
}: ScoreCardProgress) => {
  if (stage === "data-processing") {
    return `Processing data: ${passed + failed}/${total} done - ${passed} passed, ${failed} failed`;
  }
  if (stage === "report-processing") {
    const toScore = total - failed;
    return `Generating reports${attempt && attempt > 1 ? ` (retry ${attempt - 1})` : ""}: ${passed}/${toScore} done${failed ? ` - ${failed} failed in data processing` : ""}`;
  }
  return `Reports processed: ${passed} passed, ${failed} failed`;
};

interface ReportRun {
  running: boolean;
  projectNames: Record<string, string>;
  progress?: ScoreCardProgress;
  result?: ScoreCardBatchResult;
  error?: string;
}

export const Brick360ProjectsList: React.FC = () => {
  const { data: projects, isFetching: projectsLoading } =
    useGetAllLvnzyProjects(false);

  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ReportTabKey>("verified");
  // LvnzyProject ids of the rows ticked in the current tab
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  // the score card dialog the Generate Reports button opens
  const [scoreCardModalOpen, setScoreCardModalOpen] = useState(false);
  const [reportRun, setReportRun] = useState<ReportRun>();

  const changeTab = (key: ReportTabKey) => {
    setActiveTab(key);
    setSelectedRowKeys([]);
  };

  // `pillars` from the score card dialog - empty generates only the parts a
  // project hasn't been scored on yet
  const generateReports = async (pillars: string[]) => {
    const selected = projectsByTab[activeTab].filter((p) =>
      selectedRowKeys.includes(p._id),
    );
    // the endpoint takes the original Project ids, not the LvnzyProject ones
    const projectNames: Record<string, string> = {};
    selected.forEach((p) => {
      const id = p.originalProjectId?._id;
      if (id) projectNames[id] = p.meta.projectName;
    });
    const projectIds = Object.keys(projectNames);
    if (!projectIds.length) return;

    setReportRun({ running: true, projectNames });
    try {
      const result = await generateScoresStreamed(
        projectIds,
        (progress) =>
          setReportRun((run) => run && { ...run, progress }),
        pillars.length ? pillars : undefined,
      );
      setReportRun((run) => run && { ...run, running: false, result });
      setSelectedRowKeys([]);
    } catch (err) {
      setReportRun(
        (run) =>
          run && {
            ...run,
            running: false,
            error: err instanceof Error ? err.message : String(err),
          },
      );
    } finally {
      // statuses and scoreExists changed for whatever got processed
      queryClient.invalidateQueries({ queryKey: [queryKeys.lvnzyProjects] });
    }
  };

  const canGenerate = GENERATABLE_TABS.includes(activeTab);

  // one bucket per tab - an invalid status wins over everything else; then a
  // project without a score is "not prepared" even if its status says
  // verified, since there's no report to show for it
  const projectsByTab = useMemo(() => {
    const buckets: Record<ReportTabKey, LvnzyProject[]> = {
      verified: [],
      unverified: [],
      notPrepared: [],
      invalidStatus: [],
    };
    (projects || []).forEach((p: LvnzyProject) => {
      const status = p.originalProjectId?.info?.status;
      if (!VALID_REPORT_STATUSES.includes(status))
        buckets.invalidStatus.push(p);
      else if (!p.scoreExists) buckets.notPrepared.push(p);
      else if (status === "report-verified")
        buckets.verified.push(p);
      else buckets.unverified.push(p);
    });
    return buckets;
  }, [projects]);

  const columns: TableColumnType<LvnzyProject>[] = [
    {
      title: "Project Name",
      dataIndex: ["meta", "projectName"],
      key: "name",
      sorter: (a, b) => a.meta.projectName.localeCompare(b.meta.projectName),
      sortDirections: ["descend"],
      ...ColumnSearch(["meta", "projectName"]),
    },
    {
      title: "Developer Name",
      dataIndex: ["originalProjectId", "info", "developerId", "name"],
      key: "developerName",
      sorter: (a, b) =>
        (a.originalProjectId?.info?.developerId?.name || "").localeCompare(
          b.originalProjectId?.info?.developerId?.name || "",
        ),
      ...ColumnSearch(["originalProjectId", "info", "developerId", "name"]),
      render: (_: unknown, record: LvnzyProject) =>
        record.originalProjectId?.info?.developerId?.name || "-",
    },
    {
      title: "Brickfi Status",
      dataIndex: ["originalProjectId", "info", "status"],
      key: "status",
      // Invalid Status lists only the statuses outside the valid three; every
      // other tab only ever holds those three
      filters: STATUS_OPTIONS.filter(
        ({ value }) =>
          VALID_REPORT_STATUSES.includes(value) !==
          (activeTab === "invalidStatus"),
      ).map(({ label, value }) => ({ text: label, value })),
      onFilter: (value, record) =>
        record.originalProjectId?.info?.status === value,
      sorter: (a, b) =>
        (a.originalProjectId?.info?.status || "").localeCompare(
          b.originalProjectId?.info?.status || "",
        ),
      render: (status?: string) =>
        STATUS_OPTIONS.find((o) => o.value === status)?.label || status || "-",
    },
    {
      title: "Date Created",
      dataIndex: "createdAt",
      defaultSortOrder: "descend",
      key: "createdAt",
      sorter: (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      sortDirections: ["descend", "ascend"],
      render: (createdAt: string) => new Date(createdAt).toLocaleDateString(),
    },
    {
      title: "Date Updated",
      dataIndex: "updatedAt",
      key: "updatedAt",
    sorter: (a, b) =>
        new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
      sortDirections: ["descend", "ascend"],
      render: (updatedAt: string) => new Date(updatedAt).toLocaleDateString(),
    },
    {
      title: "Brick360 Report Link",
      dataIndex: "slug",
      key: "slug",
      ...ColumnSearch(["slug"]),
      render: (slug: string, record: LvnzyProject) => {
        if (!slug) return "-";
        const reportUrl = `${brickfiAppUrl}/app/brick360/${slug}`;
        if (!record.scoreExists) {
          return "Report Missing";
        }
        return (
          <a href={reportUrl} target="_blank" rel="noopener noreferrer">
            <Button type="link" icon={<LinkOutlined />}>
              {slug}
            </Button>
          </a>
        );
      },
    },
    {
      title: "",
      align: "right",
      dataIndex: "_id",
      key: "_id",
      render: (id: string) => {
        return (
          <Flex gap={15} justify="end">
            <Link to={`/brick360/${id}`} target="_blank">
              <Button
                type="default"
                shape="default"
                icon={<EditOutlined />}
              ></Button>
            </Link>
             <Link to={`/brick360Data/${id}`} target="_blank">
              <Button
                type="default"
                shape="default"
                icon={<FileTextOutlined />}
              ></Button>
            </Link>
          </Flex>
        );
      },
    },
  ];


  const failedResults = (reportRun?.result?.results || []).filter(
    (r) => !r.success,
  );

  return !projects || !projects.length ? <Loader></Loader> :
    <>
      <Tabs
        activeKey={activeTab}
        onChange={(key) => changeTab(key as ReportTabKey)}
        items={REPORT_TABS.map(({ key, label }) => ({
          key,
          label: `${label} (${projectsByTab[key].length})`,
        }))}
      />
      {reportRun ? (
        <Alert
          style={{ marginBottom: 12 }}
          showIcon
          icon={reportRun.running ? <Spin size="small" /> : undefined}
          closable={!reportRun.running}
          onClose={() => setReportRun(undefined)}
          type={
            reportRun.running
              ? "info"
              : reportRun.error || !reportRun.result?.success
                ? failedResults.length < (reportRun.result?.results.length ?? 0)
                  ? "warning"
                  : "error"
                : "success"
          }
          message={
            reportRun.error
              ? `Report request failed: ${reportRun.error}`
              : reportRun.progress
                ? describeProgress(reportRun.progress)
                : `Starting report generation for ${Object.keys(reportRun.projectNames).length} project(s)...`
          }
          description={
            failedResults.length ? (
              <Flex vertical gap={2}>
                {failedResults.map((r) => (
                  <Typography.Text key={r.projectId} type="danger">
                    {reportRun.projectNames[r.projectId] || r.projectId}:{" "}
                    {r.error}
                  </Typography.Text>
                ))}
              </Flex>
            ) : undefined
          }
        />
      ) : null}
      {canGenerate ? (
        <Flex align="center" gap={12} style={{ marginBottom: 12 }}>
          <Button
            type="primary"
            disabled={!selectedRowKeys.length || !!reportRun?.running}
            loading={!!reportRun?.running}
            onClick={() => setScoreCardModalOpen(true)}
          >
            Generate Reports ({selectedRowKeys.length}/{MAX_REPORT_SELECTION})
          </Button>
        </Flex>
      ) : null}
      <GenerateScoreCardModal
        open={scoreCardModalOpen}
        subject={`${selectedRowKeys.length} project${selectedRowKeys.length === 1 ? "" : "s"}`}
        multiple={selectedRowKeys.length > 1}
        onGenerate={(pillars) => {
          setScoreCardModalOpen(false);
          generateReports(pillars);
        }}
        onCancel={() => setScoreCardModalOpen(false)}
      />
      {/* keyed by tab so a status filter picked in one tab doesn't carry over
          to another, where its values don't exist */}
      <Table
        key={activeTab}
        dataSource={projectsByTab[activeTab]}
        columns={columns}
        rowKey="_id"
        loading={projectsLoading}
        rowSelection={
          canGenerate
            ? {
                selectedRowKeys,
                onChange: setSelectedRowKeys,
                // select-all would blow past MAX_REPORT_SELECTION
                hideSelectAll: true,
                getCheckboxProps: (record) => ({
                  disabled:
                    !!reportRun?.running ||
                    !record.originalProjectId?._id ||
                    (selectedRowKeys.length >= MAX_REPORT_SELECTION &&
                      !selectedRowKeys.includes(record._id)),
                }),
              }
            : undefined
        }
      />
    </>
};
