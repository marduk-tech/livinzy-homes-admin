import { EyeOutlined } from "@ant-design/icons";
import { Button, Col, Flex, Modal, Row, Table, TableColumnType, Tooltip, Typography } from "antd";
import { useState } from "react";
import ReactJson from "react-json-view";
import {
  useDeleteReraProjectMutation,
  useGetAllReraProjects,
} from "../../hooks/rera-projects-hooks";
import { ReraProject } from "../../types/rera-project";
import { ColumnSearch } from "../common/column-search";

export function ReraProjectsList() {
  const { data, isLoading, isError } = useGetAllReraProjects();
  const [selectedReraProject, setSelectedReraProject] = useState<{
    projectName: string;
    reraData: ReraProject;
  } | undefined>();

  const columns: TableColumnType<ReraProject>[] = [
    {
      title: "Project Name",
      dataIndex: ["projectDetails", "projectName"],
      key: "projectName",
      ...ColumnSearch(["projectDetails", "projectName"]),
    },
    {
      title: "Registration Number",
      dataIndex: ["projectDetails", "projectRegistrationNumber"],
      key: "projectRegistrationNumber",
      ...ColumnSearch(["projectDetails", "projectRegistrationNumber"]),
    },
    {
      title: "RERA Number",
      dataIndex: ["projectDetails", "projectRegistrationNumber"],
      key: "reraNumber",
      width: "50px",
      responsive: ["lg", "xl"],
      sorter: (a, b) => {
        if (!a.projectDetails.projectRegistrationNumber && !b.projectDetails.projectRegistrationNumber) return 0;
        if (!a.projectDetails.projectRegistrationNumber) return -1;
        if (!b.projectDetails.projectRegistrationNumber) return 1;
        return a.projectDetails.projectRegistrationNumber.localeCompare(b.projectDetails.projectRegistrationNumber);
      },
      sortDirections: ["ascend", "descend"],
      ...ColumnSearch(["projectDetails", "projectRegistrationNumber"]),
      render: (reraNumber: string) => {
        return (
          <Typography.Text copyable style={{ width: 100 }} ellipsis={{}}>
            {reraNumber || "-"}
          </Typography.Text>
        );
      },
    },
    {
      title: "",
      align: "right",
      dataIndex: "_id",
      key: "_id",
      render: (id: string, record: ReraProject) => {
        return (
          <Flex gap={15} justify="end">
            <Tooltip title="View RERA Project Details">
              <Button
                type="default"
                shape="default"
                icon={<EyeOutlined />}
                onClick={() => setSelectedReraProject({
                  projectName: record.projectDetails.projectName,
                  reraData: record
                })}
              />
            </Tooltip>
          </Flex>
        );
      },
    },
  ];

  if (isError) return <div>Error fetching RERA projects data</div>;

  return (
    <>
      <Row
        justify="space-between"
        align="middle"
        style={{ marginBottom: 20, padding: "0 10px" }}
      >
        <Col>
          <Typography.Title level={4}>RERA Projects</Typography.Title>
        </Col>
      </Row>

      <Table
        dataSource={data}
        columns={columns}
        loading={isLoading}
        rowKey="id"
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
            height: "calc(80vh - 108px)", // Subtract header and padding
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
    </>
  );
}
