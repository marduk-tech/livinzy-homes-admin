import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import {
  Button,
  Col,
  Flex,
  Row,
  Table,
  TableColumnType,
  Tag,
  Typography,
} from "antd";
import { useState } from "react";
import {
  useDeleteDeveloperMutation,
  useGetAllDevelopers,
} from "../../hooks/developer-hooks";
import { Developer } from "../../types/developer";
import { ColumnSearch } from "../common/column-search";
import { DeletePopconfirm } from "../common/delete-popconfirm";
import { DeveloperForm } from "./developer-form";

export function DevelopersList() {
  const { data, isLoading, isError } = useGetAllDevelopers();
  const [developerToEdit, setDeveloperToEdit] = useState<
    Developer | undefined
  >();
  const deleteDeveloperMutation = useDeleteDeveloperMutation();

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
  ];

  const columns: TableColumnType<Developer>[] = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      ...ColumnSearch("name"),
    },
    {
      title: "Projects Count",
      key: "projectsCount",
      render: (_, record) => (
        <Tag color="blue">{record.developerProjects.length} Projects</Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "right",
      render: (_, record) => (
        <Flex gap={15} justify="end">
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
          <Typography.Title level={4}>All Developers</Typography.Title>
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

      {developerToEdit && (
        <DeveloperForm
          data={developerToEdit}
          developers={data || []}
          onClose={() => setDeveloperToEdit(undefined)}
        />
      )}
    </>
  );
}
