import { EyeOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Col, DatePicker, Flex, Modal, Row, Table, TableColumnType, Tooltip, Typography } from "antd";
import { useState } from "react";
import ReactJson from "react-json-view";
import {
  useDeleteReraProjectMutation,
  useGetAllReraProjects,
} from "../../hooks/rera-projects-hooks";
import { ReraProject } from "../../types/rera-project";
import { ColumnSearch } from "../common/column-search";
import dayjs, { Dayjs } from "dayjs";
const { RangePicker } = DatePicker;
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

export function ReraProjectsList() {
  const { data, isLoading, isError } = useGetAllReraProjects();
  const [selectedReraProject, setSelectedReraProject] = useState<{
    projectName: string;
    reraData: ReraProject;
  } | undefined>();

    const [selectedRange, setSelectedRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  const parseDateString = (dateStr: string) => {
    const [day, month, year] = dateStr.includes("-")
      ? dateStr.split("-")
      : dateStr.split("/");
    return new Date(Number(year), Number(month) - 1, Number(day));
  };

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
      title: "Completion",
      dataIndex: ["projectDetails", "projectExpectedCompletionDate"],
      sorter: (a: any, b: any) => {
        if (!a.projectDetails.projectExpectedCompletionDate || !b.projectDetails.projectExpectedCompletionDate) return 0;
        return parseDateString(
          a.projectDetails.projectExpectedCompletionDate
        ).getTime() - parseDateString(
          b.projectDetails.projectExpectedCompletionDate
        ).getTime()
       },
      filterDropdown: ({ confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <RangePicker
            onChange={(dates) => setSelectedRange(dates as [Dayjs, Dayjs])}
            style={{ marginBottom: 8, display: "block" }}
          />
          <Button
            type="primary"
            onClick={() => confirm()}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90, marginRight: 8 }}
          >
            Filter
          </Button>
          <Button
            onClick={() => {
              clearFilters?.();
              setSelectedRange(null);
            }}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
        </div>
      ),
      onFilter: (_, record) => {
        if (!selectedRange || selectedRange.length !== 2) return true;
        const recordDate = dayjs(record.projectDetails.projectExpectedCompletionDate);
        return recordDate.isSameOrAfter(selectedRange[0], "day") &&
               recordDate.isSameOrBefore(selectedRange[1], "day");
      },
      filterIcon: (filtered) => (
        <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
      ),
      key: "completionDate",
      render: (completionDate: string) => {
        const compDate = parseDateString(
          completionDate
        );

        const formatDate = (date: Date) => {
          return date.toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          });
        }; 
        return (
          <Typography.Text copyable style={{ width: 100 }} ellipsis={{}}>
            {formatDate(compDate)}
          </Typography.Text>
        );
      },
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
