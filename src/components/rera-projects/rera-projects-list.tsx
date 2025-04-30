import {
  Button,
  Col,
  Flex,
  Row,
  Table,
  TableColumnType,
  Typography,
} from "antd";
import { useState } from "react";
import {
  useDeleteReraProjectMutation,
  useGetAllReraProjects,
} from "../../hooks/rera-projects-hooks";
import { ReraProject } from "../../types/rera-project";
import { ColumnSearch } from "../common/column-search";

export function ReraProjectsList() {
  const { data, isLoading, isError } = useGetAllReraProjects();
  const [projectToEdit, setProjectToEdit] = useState<ReraProject | undefined>();
  const deleteReraProjectMutation = useDeleteReraProjectMutation();

  const handleDelete = async (projectId: string): Promise<void> => {
    deleteReraProjectMutation.mutateAsync(projectId);
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
    </>
  );
}
