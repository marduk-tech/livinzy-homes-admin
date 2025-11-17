import { EyeOutlined, LinkOutlined } from "@ant-design/icons";
import {
  Button,
  Col,
  Modal,
  Row,
  Table,
  TableColumnType,
  Typography,
} from "antd";
import { useState } from "react";
import { useGetAllTraces } from "../../hooks/traces-hooks";
import { Trace } from "../../types/trace";
import { ColumnSearch } from "../common/column-search";

export function TracesList() {
  const { data, isLoading, isError } = useGetAllTraces();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTrace, setSelectedTrace] = useState<{
    input: string;
    output: string;
  } | null>(null);

  const handleViewDetails = (input: string, output: string) => {
    setSelectedTrace({ input, output });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTrace(null);
  };

  const columns: TableColumnType<Trace>[] = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: 180,
      sorter: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      render: (date: string) =>
        new Date(date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
    },
    {
      title: "Input",
      dataIndex: "input",
      key: "input",
      ...ColumnSearch("input"),
      width: 300,
      render: (input: string) => (
        <div
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {input}
        </div>
      ),
    },
    {
      title: "Output",
      dataIndex: "output",
      key: "output",
      width: 400,
      render: (output: string, record: Trace) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            dangerouslySetInnerHTML={{ __html: output }}
            style={{
              flex: 1,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          />
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record.input, record.output)}
          ></Button>
        </div>
      ),
    },
    {
      title: "User ID",
      dataIndex: "userId",
      key: "userId",
      ...ColumnSearch("userId"),
      width: 150,
    },
    {
      title: "Project ID",
      dataIndex: "projectId",
      key: "projectId",
      ...ColumnSearch("projectId"),
      width: 150,
    },
    {
      title: "Trace Link",
      dataIndex: "traceLink",
      key: "traceLink",
      width: 120,
      render: (traceLink: string) => (
        <Button
          type="link"
          icon={<LinkOutlined />}
          href={traceLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          View
        </Button>
      ),
    },
  ];

  if (isError) return <div>Error fetching traces data</div>;

  return (
    <>
      <Row
        justify="space-between"
        align="middle"
        style={{ marginBottom: 20, padding: "0 10px" }}
      >
        <Col>
          <Typography.Title level={4}>All Traces</Typography.Title>
        </Col>
      </Row>

      <Table
        dataSource={data}
        columns={columns}
        loading={isLoading}
        rowKey="id"
        scroll={{ x: 1400 }}
      />

      <Modal
        title="Trace Details"
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={[
          <Button key="close" type="primary" onClick={handleCloseModal}>
            Close
          </Button>,
        ]}
        width={800}
        styles={{
          body: {
            maxHeight: "650px",
            overflowY: "auto",
          },
        }}
      >
        {selectedTrace && (
          <div>
            <Typography.Title level={5}>Input</Typography.Title>
            <div
              style={{
                padding: 12,
                backgroundColor: "#f5f5f5",
                borderRadius: 4,
                marginBottom: 16,
                maxHeight: "200px",
                overflowY: "auto",
              }}
            >
              {selectedTrace.input}
            </div>

            <Typography.Title level={5}>Output</Typography.Title>
            <div
              dangerouslySetInnerHTML={{ __html: selectedTrace.output }}
              style={{
                padding: 12,
                backgroundColor: "#f5f5f5",
                borderRadius: 4,
                maxHeight: "400px",
                overflowY: "auto",
              }}
            />
          </div>
        )}
      </Modal>
    </>
  );
}
