import { EyeOutlined, FileTextOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Col,
  Flex,
  Modal,
  Row,
  Switch,
  Table,
  TableColumnType,
  Tooltip,
  Typography,
} from "antd";
import React, { useState } from "react";
import ReactJson from "react-json-view";
import { useFetchNewReraProjects } from "../../hooks/rera-projects-hooks";
import { ReraProject } from "../../types/rera-project";
import { ColumnSearch } from "../common/column-search";
import { AssignToDeveloperModal } from "./assign-to-developer-modal";
import { ReraDocumentsModal } from "./rera-documents-modal";

export function NewProjects() {
  const { data, isLoading, isError } = useFetchNewReraProjects();

  const [selectedReraProject, setSelectedReraProject] = useState<
    { projectName: string; reraData: ReraProject } | undefined
  >();

  const [reraDocsModal, setReraDocsModal] = useState<
    { reraProjectId: string; projectName?: string } | undefined
  >();

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [filterKnown, setFilterKnown] = useState(false);

  const selectedProjects = (data ?? [])
    .filter((p) => selectedRowKeys.includes(p._id))
    .map((p) => ({
      id: p._id,
      name: p.projectDetails.projectName,
      reraNumber: p.projectDetails.projectRegistrationNumber ?? "",
    }));

  const parseDateString = (dateStr: string | undefined | null) => {
    if (!dateStr || typeof dateStr !== "string") return new Date();
    const [day, month, year] = dateStr.includes("-")
      ? dateStr.split("-")
      : dateStr.split("/");
    return new Date(Number(year), Number(month) - 1, Number(day));
  };

  const knownDeveloperKeywords = [
    'sobha', 'prestige', 'century', 'sumadhura', 'purva', 'provident',
    'godrej', 'orchid', 'brigade', 'assetz', 'adarsh', 'mana', 'bhartiya', 'sattva', 'nikoo', 'embassy',
    'aratt', 'ajmera', 'shriram'
  ];

  const tableData = filterKnown
    ? (data ?? []).filter((p) => {
        const name = (p.projectDetails.promoterName ?? "").toLowerCase();
        const project = (p.projectDetails.projectName ?? "").toLowerCase();
        return knownDeveloperKeywords.some((kw) => name.includes(kw) || project.includes(kw));
      })
    : data;

  const columns: TableColumnType<ReraProject>[] = [
    {
      title: "Project Name",
      dataIndex: ["projectDetails", "projectName"],
      key: "projectName",
      ...ColumnSearch(["projectDetails", "projectName"]),
    },
    {
      title: "Promoter Name",
      dataIndex: ["projectDetails", "promoterName"],
      key: "promoterName",
      render: (value: string) => (
        <Typography.Text>{value || "-"}</Typography.Text>
      ),
    },
    {
      title: "Registration Number",
      dataIndex: ["projectDetails", "projectRegistrationNumber"],
      key: "projectRegistrationNumber",
      ...ColumnSearch(["projectDetails", "projectRegistrationNumber"]),
    },
    {
      title: "Completion Date",
      dataIndex: ["projectDetails", "projectExpectedCompletionDate"],
      key: "completionDate",
      sorter: (a, b) => {
        const aDate = parseDateString(
          a.projectDetails.projectExpectedCompletionDate
        );
        const bDate = parseDateString(
          b.projectDetails.projectExpectedCompletionDate
        );
        return aDate.getTime() - bDate.getTime();
      },
      render: (dateStr: string) => (
        <Typography.Text>{dateStr || "-"}</Typography.Text>
      ),
    },
    {
      title: "RERA Number",
      dataIndex: ["projectDetails", "projectRegistrationNumber"],
      key: "reraNumber",
      width: "50px",
      responsive: ["lg", "xl"],
      ...ColumnSearch(["projectDetails", "projectRegistrationNumber"]),
      render: (reraNumber: string) => (
        <Typography.Text copyable style={{ width: 100 }} ellipsis={{}}>
          {reraNumber || "-"}
        </Typography.Text>
      ),
    },
    {
      title: "",
      align: "right",
      dataIndex: "_id",
      key: "_id",
      render: (id: string, record: ReraProject) => (
        <Flex gap={15} justify="end">
          <Tooltip title="View RERA Documents">
            <Button
              type="default"
              shape="default"
              icon={<FileTextOutlined />}
              onClick={() =>
                setReraDocsModal({
                  reraProjectId: id,
                  projectName: record.projectDetails.projectName,
                })
              }
            />
          </Tooltip>
          <Tooltip title="View RERA Project Details">
            <Button
              type="default"
              shape="default"
              icon={<EyeOutlined />}
              onClick={() =>
                setSelectedReraProject({
                  projectName: record.projectDetails.projectName,
                  reraData: record,
                })
              }
            />
          </Tooltip>
        </Flex>
      ),
    },
  ];

  if (isError) return <div>Error fetching new RERA projects</div>;

  return (
    <>
      <Row justify="space-between" align="middle" style={{ marginBottom: 12 }}>
        <Col>
          <Flex align="center" gap={8}>
            <Switch checked={filterKnown} onChange={setFilterKnown} />
            <Typography.Text>Known Developers</Typography.Text>
          </Flex>
        </Col>
        {selectedRowKeys.length > 0 && (
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setAssignModalOpen(true)}
            >
              Assign to Developer ({selectedRowKeys.length})
            </Button>
          </Col>
        )}
      </Row>

      <Table
        dataSource={tableData}
        columns={columns}
        loading={isLoading}
        rowKey="_id"
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
      />

      <Modal
        title={
          selectedReraProject?.projectName
            ? `RERA Project Details - ${selectedReraProject.projectName}`
            : "RERA Project Details"
        }
        open={!!selectedReraProject}
        onCancel={() => setSelectedReraProject(undefined)}
        footer={null}
        width="90%"
        style={{ maxWidth: "1200px", height: "80vh" }}
        styles={{
          body: {
            height: "calc(80vh - 108px)",
            overflow: "hidden",
            padding: 0,
          },
        }}
      >
        {selectedReraProject?.reraData ? (
          <div
            style={{
              height: "100%",
              overflow: "auto",
              padding: "10px",
              backgroundColor: "#f8f9fa",
            }}
          >
            <ReactJson
              src={selectedReraProject.reraData}
              theme="rjv-default"
              displayDataTypes={true}
              displayObjectSize={true}
              enableClipboard={true}
              collapsed={1}
              sortKeys={true}
              name="reraProject"
              indentWidth={4}
              style={{ fontSize: "14px" }}
            />
          </div>
        ) : (
          <div
            style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography.Text type="secondary">
              No RERA project data available.
            </Typography.Text>
          </div>
        )}
      </Modal>

      <ReraDocumentsModal
        open={!!reraDocsModal}
        onClose={() => setReraDocsModal(undefined)}
        reraProjectId={reraDocsModal?.reraProjectId}
        projectName={reraDocsModal?.projectName}
      />

      <AssignToDeveloperModal
        open={assignModalOpen}
        onClose={() => {
          setAssignModalOpen(false);
          setSelectedRowKeys([]);
        }}
        projects={selectedProjects}
      />
    </>
  );
}
