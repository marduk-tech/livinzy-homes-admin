import { ContainerOutlined, DatabaseOutlined, EditOutlined, FileTextOutlined, LinkOutlined } from "@ant-design/icons";
import { useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Flex,
  Modal,
  notification,
  Popover,
  Spin,
  Table,
  TableColumnType,
  Tabs,
  Tag,
  Typography,
} from "antd";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useGetAllLvnzyProjects } from "../../hooks/lvnzyprojects-hooks";
import { LvnzyProject } from "../../types/lvnzy-project";
import { Project } from "../../types/Project";
import { ColumnDateRange } from "../common/column-date-range";
import { ColumnSearch } from "../common/column-search";
import {
  generateScoresStreamed,
  ScoreCardBatchResult,
  ScoreCardProgress,
  updateProject,
} from "../../libs/api/projects";
import { brickfiAppUrl, queryKeys } from "../../libs/constants";
import { Loader } from "../common/loader";
import { STATUS_OPTIONS } from "../projects-list";
import { GenerateScoreCardModal } from "./generate-score-card-modal";

type ReportTabKey = "reports" | "reportNotReady" | "invalidStatus";

const REPORT_TABS: { key: ReportTabKey; label: string }[] = [
  { key: "reports", label: "Reports" },
  { key: "reportNotReady", label: "Report Not Ready" },
  { key: "invalidStatus", label: "Invalid Status" },
];

// the only statuses a project with a Brick360 entry should be in - anything
// else goes to the Invalid Status tab
const VALID_REPORT_STATUSES = ["data-verified", "report-ready", "report-verified"];

// the tabs whose projects can have reports generated - Invalid Status
// projects would be rejected by the generate-score endpoint
const GENERATABLE_TABS: ReportTabKey[] = ["reports", "reportNotReady"];

const totalChecks = (p: LvnzyProject) =>
  Object.values(p.checkCountsByField || {}).reduce((sum, n) => sum + n, 0);

// the Report Issues filter's option for complete reports - not a real pillar
// or criteria
const NO_REPORT_ISSUES_FILTER = "__no_report_issues__";

// the Checks filter's option for projects with no unresolved checks - not a
// real check field name
const NO_CHECKS_FILTER = "__no_checks__";

// most projects one report request can take - each one runs its own data
// processing and LLM scoring on the server
const MAX_REPORT_SELECTION = 50;

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
  const [activeTab, setActiveTab] = useState<ReportTabKey>("reports");
  // LvnzyProject ids of the rows ticked in the current tab
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  // the score card dialog the Generate Reports button opens
  const [scoreCardModalOpen, setScoreCardModalOpen] = useState(false);
  const [reportRun, setReportRun] = useState<ReportRun>();
  const [movingToReportReady, setMovingToReportReady] = useState(false);
  // what's picked in the Report Issues filter - see visibleProjects
  const [reportIssueFilters, setReportIssueFilters] = useState<string[]>([]);

  const changeTab = (key: ReportTabKey) => {
    setActiveTab(key);
    setSelectedRowKeys([]);
    setReportIssueFilters([]);
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

  // an invalid status wins over everything else; any other project without
  // a score has no report to show, so it's "report not ready" rather than a report
  const projectsByTab = useMemo(() => {
    const buckets: Record<ReportTabKey, LvnzyProject[]> = {
      reports: [],
      reportNotReady: [],
      invalidStatus: [],
    };
    (projects || []).forEach((p: LvnzyProject) => {
      const status = p.originalProjectId?.info?.status;
      if (!VALID_REPORT_STATUSES.includes(status)) buckets.invalidStatus.push(p);
      else if (!p.scoreExists) buckets.reportNotReady.push(p);
      else buckets.reports.push(p);
    });
    return buckets;
  }, [projects]);

  // A project has to match every picked Report Issues option - the table's own
  // onFilter keeps a row matching any of them, so the column has no onFilter
  // and it's applied here instead
  const visibleProjects = useMemo(
    () =>
      projectsByTab[activeTab].filter((p) =>
        reportIssueFilters.every((value) =>
          value === NO_REPORT_ISSUES_FILTER
            ? !p.reportIssues?.length
            : p.reportIssues?.includes(value),
        ),
      ),
    [projectsByTab, activeTab, reportIssueFilters],
  );

  // the ticked rows Move to Report Ready acts on - only data-verified ones:
  // report-ready already is, and report-verified would be a step back
  const movableToReportReady = projectsByTab[activeTab].filter(
    (p) =>
      selectedRowKeys.includes(p._id) &&
      p.originalProjectId?._id &&
      p.originalProjectId.info?.status === "data-verified",
  );

  const moveToReportReady = async () => {
    const toMove = movableToReportReady;
    setMovingToReportReady(true);
    const results = await Promise.allSettled(
      toMove.map((p) =>
        updateProject(p.originalProjectId._id, {
          info: { status: "report-ready" },
        } as Partial<Project>),
      ),
    );
    setMovingToReportReady(false);

    const moved = toMove.filter((_, i) => results[i].status === "fulfilled");
    const failed = toMove.filter((_, i) => results[i].status === "rejected");
    const movedIds = new Set(moved.map((p) => p._id));
    // patched here rather than refetched - the server refreshes the list's
    // cache in the background, so a refetch can still return the old status
    queryClient.setQueryData<LvnzyProject[]>(
      [queryKeys.lvnzyProjects, false],
      (list) =>
        list?.map((p) =>
          movedIds.has(p._id)
            ? {
                ...p,
                originalProjectId: {
                  ...p.originalProjectId,
                  info: { ...p.originalProjectId.info, status: "report-ready" },
                },
              }
            : p,
        ),
    );
    queryClient.invalidateQueries({ queryKey: [queryKeys.projectStatusCounts] });
    // failed ones stay ticked, to retry
    setSelectedRowKeys((keys) => keys.filter((k) => !movedIds.has(String(k))));

    if (moved.length) {
      notification.success({
        message: `${moved.length} project${moved.length === 1 ? "" : "s"} moved to Report Ready`,
      });
    }
    if (failed.length) {
      notification.error({
        message: `Couldn't move ${failed.length} project${failed.length === 1 ? "" : "s"}`,
        description: failed.map((p) => p.meta.projectName).join(", "),
      });
    }
  };

  const confirmMoveToReportReady = () => {
    const count = movableToReportReady.length;
    const leftAlone = selectedRowKeys.length - count;
    Modal.confirm({
      title: "Move to Report Ready",
      content: `Move ${count} project${count === 1 ? "" : "s"} to Report Ready?${
        leftAlone
          ? ` ${leftAlone} other selected project${leftAlone === 1 ? " is" : "s are"} not data-verified and will be left as is.`
          : ""
      }`,
      okText: "Move",
      onOk: moveToReportReady,
    });
  };

  const columns: TableColumnType<LvnzyProject>[] = [
    {
      title: "Project Name",
      dataIndex: ["meta", "projectName"],
      key: "name",
      sorter: (a, b) => a.meta.projectName.localeCompare(b.meta.projectName),
      sortDirections: ["descend"],
      ...ColumnSearch(["meta", "projectName"]),
      render: (projectName: string, record: LvnzyProject) => (
        <Flex wrap align="center" gap={8}>
          {projectName}
          {/* without a score there's no report to call verified */}
          {record.scoreExists &&
          record.originalProjectId?.info?.status === "report-verified" ? (
            <Tag color="green" style={{ marginInlineEnd: 0 }}>
              verified
            </Tag>
          ) : null}
        </Flex>
      ),
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
      // only the statuses the tab can hold - outside the valid three for
      // Invalid Status, else the three
      filters: STATUS_OPTIONS.filter(
        ({ value }) =>
          VALID_REPORT_STATUSES.includes(value) === (activeTab !== "invalidStatus"),
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
    ...(activeTab === "reports" || activeTab === "reportNotReady"
      ? [
          {
            title: "Checks",
            dataIndex: "checkCountsByField",
            key: "checks",
            // by total unresolved checks
            sorter: (a: LvnzyProject, b: LvnzyProject) => totalChecks(a) - totalChecks(b),
            // the check fields present in this tab, plus projects with none
            filters: [
              { text: "No checks", value: NO_CHECKS_FILTER },
              ...Array.from(
                new Set(
                  projectsByTab[activeTab].flatMap((p) =>
                    Object.keys(p.checkCountsByField || {}),
                  ),
                ),
              )
                .sort()
                .map((field) => ({ text: field, value: field })),
            ],
            filterSearch: true,
            onFilter: (value: React.Key | boolean, record: LvnzyProject) =>
              value === NO_CHECKS_FILTER
                ? !totalChecks(record)
                : !!record.checkCountsByField?.[String(value)],
            render: (counts: Record<string, number> | undefined, record: LvnzyProject) => {
              const entries = Object.entries(counts || {}).sort(
                ([fieldA, countA], [fieldB, countB]) => countB - countA || fieldA.localeCompare(fieldB),
              );
              return entries.length ? (
                <Flex wrap gap={4}>
                  {entries.map(([field, count]) => (
                    <Tag
                      key={field}
                      // by the field's worst unresolved check
                      color={record.checkSeverityByField?.[field] === 5 ? "error" : "warning"}
                      style={{ marginInlineEnd: 0 }}
                    >
                      {field}: {count}
                    </Tag>
                  ))}
                </Flex>
              ) : (
                "-"
              );
            },
          },
        ]
      : []),
    ...(activeTab === "reports"
      ? [
          {
            title: "Report Issues",
            dataIndex: "reportIssues",
            key: "reportIssues",
            // the pillars and criteria missing in this tab, plus complete reports
            filters: [
              { text: "No issues", value: NO_REPORT_ISSUES_FILTER },
              ...Array.from(
                new Set(projectsByTab.reports.flatMap((p) => p.reportIssues || [])),
              )
                .sort()
                .map((part) => ({ text: part, value: part })),
            ],
            filterSearch: true,
            render: (reportIssues?: string[]) => {
              if (!reportIssues) return "-";
              return reportIssues.length ? (
                <Flex wrap gap={4}>
                  {reportIssues.map((part) => (
                    <Tag key={part} color="error" style={{ marginInlineEnd: 0 }}>
                      {part}
                    </Tag>
                  ))}
                </Flex>
              ) : (
                <Tag color="green" style={{ marginInlineEnd: 0 }}>
                  No issues
                </Tag>
              );
            },
          },
        ]
      : []),
    ...(activeTab === "reportNotReady"
      ? [
          {
            title: "Report Status",
            dataIndex: ["originalProjectId", "info", "reportStatus"],
            key: "reportStatus",
            filters: Array.from(
              new Set(
                projectsByTab.reportNotReady
                  .map((p) => p.originalProjectId?.info?.reportStatus?.status)
                  .filter(Boolean),
              ),
            ).map((status) => ({ text: status, value: status })),
            onFilter: (value: React.Key | boolean, record: LvnzyProject) =>
              record.originalProjectId?.info?.reportStatus?.status === value,
            // click shows the comments and when the status last changed
            render: (reportStatus?: Project["info"]["reportStatus"]) =>
              reportStatus?.status ? (
                <Popover
                  trigger="click"
                  title={reportStatus.status}
                  content={
                    <Flex vertical gap={4} style={{ maxWidth: 400 }}>
                      <Typography.Text style={{ whiteSpace: "pre-wrap" }}>
                        {reportStatus.comments || "No comments"}
                      </Typography.Text>
                      <Typography.Text type="secondary">
                        Last updated:{" "}
                        {reportStatus.lastUpdated
                          ? new Date(reportStatus.lastUpdated).toLocaleString()
                          : "-"}
                      </Typography.Text>
                    </Flex>
                  }
                >
                  <Tag
                    color={reportStatus.status.endsWith("-error") ? "red" : "blue"}
                    style={{ cursor: "pointer" }}
                  >
                    {reportStatus.status}
                  </Tag>
                </Popover>
              ) : (
                "-"
              ),
          },
        ]
      : []),
    {
      title: "Date Created",
      dataIndex: "createdAt",
      defaultSortOrder: "descend",
      key: "createdAt",
      sorter: (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      sortDirections: ["descend", "ascend"],
      ...ColumnDateRange("createdAt"),
      render: (createdAt: string) => new Date(createdAt).toLocaleDateString(),
    },
    {
      title: "Date Updated",
      dataIndex: "updatedAt",
      key: "updatedAt",
    sorter: (a, b) =>
        new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
      sortDirections: ["descend", "ascend"],
      ...ColumnDateRange("updatedAt"),
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
          <Button
            disabled={!movableToReportReady.length || !!reportRun?.running}
            loading={movingToReportReady}
            onClick={confirmMoveToReportReady}
          >
            Move to Report Ready
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
        dataSource={visibleProjects}
        columns={columns}
        rowKey="_id"
        loading={projectsLoading}
        onChange={(_pagination, filters) =>
          setReportIssueFilters((filters.reportIssues as string[]) || [])
        }
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
