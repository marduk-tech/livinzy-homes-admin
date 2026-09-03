import {
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  LinkOutlined,
  LoadingOutlined,
  PlusOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Checkbox,
  Col,
  Drawer,
  Flex,
  Input,
  Modal,
  Row,
  Table,
  TableColumnType,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { useEffect, useState } from "react";
import {
  useDeleteDeveloperMutation,
  useGenerateDeveloperInfoMutation,
  useGetAllDevelopers,
  useUpdateDeveloperMutation,
} from "../../hooks/developer-hooks";
import { useScriptJob, useStopJob } from "../../hooks/manage-scripts-hooks";
import { useAssignDeveloperToProjectMutation } from "../../hooks/project-hooks";
import { queryKeys } from "../../libs/constants";
import { queryClient } from "../../libs/query-client";
import { JobLogViewer } from "../../pages/manage-scripts/job-log-viewer";
import { COLORS } from "../../theme/colors";
import { FONT_SIZES } from "../../theme/font-sizes";
import { Developer } from "../../types/developer";
import { ColumnSearch } from "../common/column-search";
import { DeletePopconfirm } from "../common/delete-popconfirm";
import { ReraDocumentsModal } from "../rera-projects/rera-documents-modal";
import { DeveloperDetailsDrawer } from "./developer-details-drawer";
import { DeveloperForm } from "./developer-form";
import { DeveloperScoreModal } from "./developer-score-modal";
import ProjectForm from "./project-form";

const { Search } = Input;

const JOB_STATUS_COLOR: Record<string, string> = {
  running: "processing",
  done: "success",
  error: "error",
  stopped: "default",
};

export function DevelopersList() {
  const brickfiAppUrl =
    import.meta.env.VITE_BRICKFI_APP_URL || "https://brickfi.in";
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const { data, isLoading, isError } = useGetAllDevelopers({
    keyword: searchKeyword,
  });
  const [developerToEdit, setDeveloperToEdit] = useState<
    Developer | undefined
  >();
  const [selectedDeveloper, setSelectedDeveloper] = useState<
    Developer | undefined
  >();
  const [selectedProjectIndex, setSelectedProjectIndex] = useState<
    number | undefined
  >();
  const [reraDocsModal, setReraDocsModal] = useState<
    { reraNumber: string; projectName?: string } | undefined
  >();
  const [scoreModalDeveloper, setScoreModalDeveloper] = useState<
    Developer | undefined
  >();
  const [assignProjectDeveloper, setAssignProjectDeveloper] = useState<
    Developer | undefined
  >();
  const [assignProjectId, setAssignProjectId] = useState<string>("");
  const [detailsDeveloper, setDetailsDeveloper] = useState<
    Developer | undefined
  >();

  const [generateTarget, setGenerateTarget] = useState<Developer | undefined>();
  const [forceRegenerate, setForceRegenerate] = useState(false);
  const [genJobId, setGenJobId] = useState<string | undefined>();

  const { data: genJob } = useScriptJob(genJobId);
  const stopJobMutation = useStopJob();

  useEffect(() => {
    if (genJob?.status === "done") {
      queryClient.invalidateQueries({ queryKey: [queryKeys.getAllDevelopers] });
    }
  }, [genJob?.status]);

  const deleteDeveloperMutation = useDeleteDeveloperMutation();
  const updateDeveloperMutation = useUpdateDeveloperMutation();
  const generateInfoMutation = useGenerateDeveloperInfoMutation();
  const assignDeveloperToProjectMutation =
    useAssignDeveloperToProjectMutation();

  const handleAssignToProject = async (): Promise<void> => {
    if (!assignProjectDeveloper || !assignProjectId.trim()) return;
    await assignDeveloperToProjectMutation.mutateAsync({
      projectId: assignProjectId.trim(),
      developerId: assignProjectDeveloper._id,
    });
    setAssignProjectDeveloper(undefined);
    setAssignProjectId("");
  };

  const handleDelete = async (developerId: string): Promise<void> => {
    deleteDeveloperMutation.mutateAsync(developerId);
  };

  const projectColumns: TableColumnType<Developer["developerProjects"][0]>[] = [
    {
      title: "Project Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "RERA Number",
      dataIndex: "reraNumber",
      key: "reraNumber",
      render: (reraNumber: string) => reraNumber || "-",
    },
    {
      title: "Promoter",
      dataIndex: "promoterName",
      key: "promoterName",
      render: (promoterName: string) => promoterName || "-",
    },
    {
      title: "Primary Project",
      dataIndex: "primaryProject",
      key: "primaryProject",
      render: (primaryProject: string) => primaryProject || "-",
    },
    {
      title: "Actions",
      key: "projectActions",
      align: "right",
      render: (_, record, index) => (
        <Flex gap={8} justify="end">
          <Tooltip
            title={
              record.reraNumber
                ? "View RERA Documents"
                : "No RERA number on this project"
            }
          >
            <Button
              type="default"
              shape="default"
              icon={<FileTextOutlined />}
              disabled={!record.reraNumber}
              onClick={() =>
                setReraDocsModal({
                  reraNumber: record.reraNumber!,
                  projectName: record.name,
                })
              }
            />
          </Tooltip>
          <Button
            type="default"
            shape="default"
            icon={<EditOutlined />}
            onClick={() => {
              setSelectedDeveloper(
                data?.find((dev) => dev.developerProjects.includes(record)),
              );
              setSelectedProjectIndex(index);
            }}
          />

          <DeletePopconfirm
            handleOk={async () => {
              const parentDeveloper = data?.find((dev) =>
                dev.developerProjects.includes(record),
              );
              if (!parentDeveloper) return;
              const updatedProjects = parentDeveloper.developerProjects.filter(
                (_, i) => i !== index,
              );
              return void updateDeveloperMutation.mutateAsync({
                developerId: parentDeveloper._id,
                developerData: {
                  developerProjects: updatedProjects,
                },
              });
            }}
            isLoading={updateDeveloperMutation.isPending}
            title="Delete Project"
            description="Are you sure you want to delete this project?"
          >
            <Button
              type="default"
              shape="default"
              icon={<DeleteOutlined />}
            ></Button>
          </DeletePopconfirm>
        </Flex>
      ),
    },
  ];

  const columns: TableColumnType<Developer>[] = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      ...ColumnSearch("name"),
    },
    {
      title: "Page",
      key: "page",
      render: (_, record) =>
        record.slug ? (
          <Typography.Link
            href={`${brickfiAppUrl}/real-estate-developer/${record.slug}`}
            target="_blank"
          >
            View
          </Typography.Link>
        ) : (
          "-"
        ),
    },
    {
      title: "Details Generated",
      key: "detailsGenerated",
      render: (_, record) =>
        record.genDetails || record.info ? (
          <Tooltip title="View generated details">
            <Button
              type="text"
              icon={
                <CheckCircleOutlined style={{ color: "green", fontSize: 18 }} />
              }
              onClick={() => setDetailsDeveloper(record)}
            />
          </Tooltip>
        ) : (
          "-"
        ),
    },
    {
      title: "Projects Count",
      key: "projectsCount",
      render: (_, record) => (
        <Tag color="blue">{record.developerProjects.length} Projects</Tag>
      ),
    },
    {
      title: "BrkFi Score",
      key: "brkfiScore",
      sorter: (a, b) =>
        (a.brkfiScore?.score ?? -1) - (b.brkfiScore?.score ?? -1),
      render: (_, record) =>
        record.brkfiScore?.score != null ? (
          <Tag
            color={
              record.brkfiScore.score >= 75
                ? "green"
                : record.brkfiScore.score >= 50
                  ? "gold"
                  : "red"
            }
            style={{ cursor: "pointer" }}
            onClick={() => setScoreModalDeveloper(record)}
          >
            {Math.round(record.brkfiScore.score)}
          </Tag>
        ) : (
          "-"
        ),
    },
    {
      title: "BrkFi Partner",
      key: "brkfiPartner",
      render: (_, record) =>
        record.brkfiStatus?.isPartner ? (
          <CheckCircleOutlined style={{ color: "green", fontSize: 18 }} />
        ) : (
          "-"
        ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "right",
      render: (_, record) => (
        <Flex gap={15} justify="end" align="center">
          <Tooltip title="Generate Developer Info">
            <Button
              type="default"
              shape="default"
              icon={<ThunderboltOutlined />}
              loading={
                generateInfoMutation.isPending &&
                generateInfoMutation.variables?.developerId === record._id
              }
              disabled={
                generateInfoMutation.isPending &&
                generateInfoMutation.variables?.developerId !== record._id
              }
              onClick={() => {
                setGenerateTarget(record);
                setForceRegenerate(false);
              }}
            />
          </Tooltip>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setSelectedDeveloper(record);
              setSelectedProjectIndex(undefined);
            }}
          >
            Add Project
          </Button>
          <Button
            type="default"
            icon={<LinkOutlined />}
            onClick={() => {
              setAssignProjectDeveloper(record);
              setAssignProjectId("");
            }}
          >
            Assign to Project
          </Button>
          <Button
            type="default"
            shape="default"
            icon={<EditOutlined />}
            onClick={() => setDeveloperToEdit(record)}
          />

          <DeletePopconfirm
            handleOk={() => handleDelete(record._id)}
            isLoading={deleteDeveloperMutation.isPending}
            title="Delete Developer"
            description="Are you sure you want to delete this developer and all their projects?"
          >
            <Button type="default" shape="default" icon={<DeleteOutlined />} />
          </DeletePopconfirm>
        </Flex>
      ),
    },
  ];

  if (isError) return <div>Error fetching developers data</div>;

  return (
    <>
      <Row
        justify="space-between"
        align="middle"
        style={{ marginBottom: 20, padding: "0 10px" }}
      >
        <Col>
          <Flex gap={8} align="flex-end">
            <Search
              loading={isLoading}
              placeholder="Search by developer name, project name, or RERA number"
              onSearch={(value: string) => {
                setSearchKeyword(value);
              }}
              enterButton="Search"
              style={{ width: 500 }}
            />
            <Typography.Text
              style={{
                fontSize: FONT_SIZES.SUB_TEXT,
                color: COLORS.textColorLight,
              }}
            >
              Showing 10 recently updated items
            </Typography.Text>
          </Flex>
        </Col>
        <Col>
          <DeveloperForm developers={data || []} />
        </Col>
      </Row>

      <Table
        dataSource={data}
        columns={columns}
        loading={isLoading}
        rowKey="_id"
        expandable={{
          expandedRowRender: (record) => (
            <Table
              dataSource={record.developerProjects}
              columns={projectColumns}
              pagination={false}
              rowKey={(project, index) => `${record._id}-project-${index}`}
            />
          ),
        }}
      />

      {selectedDeveloper && (
        <ProjectForm
          isOpen={true}
          onClose={() => {
            setSelectedDeveloper(undefined);
            setSelectedProjectIndex(undefined);
          }}
          developer={selectedDeveloper}
          projectIndex={selectedProjectIndex}
        />
      )}

      {developerToEdit && (
        <DeveloperForm
          data={developerToEdit}
          developers={data || []}
          onClose={() => setDeveloperToEdit(undefined)}
        />
      )}

      <ReraDocumentsModal
        open={!!reraDocsModal}
        onClose={() => setReraDocsModal(undefined)}
        reraNumber={reraDocsModal?.reraNumber}
        projectName={reraDocsModal?.projectName}
      />

      <DeveloperScoreModal
        open={!!scoreModalDeveloper}
        onClose={() => setScoreModalDeveloper(undefined)}
        developerName={scoreModalDeveloper?.name}
        brkfiScore={scoreModalDeveloper?.brkfiScore}
      />

      <Modal
        title={`Assign "${assignProjectDeveloper?.name}" to Project`}
        open={!!assignProjectDeveloper}
        onCancel={() => setAssignProjectDeveloper(undefined)}
        onOk={handleAssignToProject}
        okText="Submit"
        okButtonProps={{
          loading: assignDeveloperToProjectMutation.isPending,
          disabled: !assignProjectId.trim(),
        }}
      >
        <Input
          placeholder="Enter Project Id"
          value={assignProjectId}
          onChange={(e) => setAssignProjectId(e.target.value)}
          onPressEnter={handleAssignToProject}
        />
      </Modal>

      <Modal
        title="Generate Developer Info"
        open={!!generateTarget}
        onCancel={() => setGenerateTarget(undefined)}
        okText="Generate"
        okButtonProps={{ loading: generateInfoMutation.isPending }}
        onOk={async () => {
          if (!generateTarget) return;
          const job = await generateInfoMutation.mutateAsync({
            developerId: generateTarget._id,
            force: forceRegenerate,
          });
          setGenerateTarget(undefined);
          setGenJobId(job.jobId);
        }}
      >
        <Flex vertical gap={12}>
          <Typography.Text>
            Generate info for "{generateTarget?.name}"? This takes a few
            minutes.
          </Typography.Text>
          <Checkbox
            checked={forceRegenerate}
            onChange={(e) => setForceRegenerate(e.target.checked)}
          >
            Force regenerate (ignore existing data)
          </Checkbox>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Without this, a developer that already has generated details is
            skipped and nothing changes.
          </Typography.Text>
        </Flex>
      </Modal>

      <Drawer
        open={!!genJobId}
        onClose={() => setGenJobId(undefined)}
        width={820}
        title={
          <Flex align="center" gap={12}>
            <Tag
              color={JOB_STATUS_COLOR[genJob?.status ?? "running"]}
              icon={
                genJob?.status === "running" ? (
                  <LoadingOutlined spin />
                ) : undefined
              }
            >
              {genJob?.status ?? "starting"}
            </Tag>
            <Typography.Text>Developer generate</Typography.Text>
          </Flex>
        }
        extra={
          genJob?.status === "running" && (
            <Button
              danger
              size="small"
              onClick={() => stopJobMutation.mutate(genJob.id)}
            >
              Stop
            </Button>
          )
        }
      >
        <Flex vertical gap={12}>
          {genJob?.status === "running" && (
            <Typography.Text type="secondary">
              Closing this drawer won't stop the job — it also shows up under
              Manage Scripts → Runs.
            </Typography.Text>
          )}
          {genJob?.error && (
            <Alert type="error" showIcon message={genJob.error} />
          )}
          <JobLogViewer logs={genJob?.logs ?? []} height={520} />
        </Flex>
      </Drawer>

      <DeveloperDetailsDrawer
        developer={detailsDeveloper}
        onClose={() => setDetailsDeveloper(undefined)}
      />
    </>
  );
}
