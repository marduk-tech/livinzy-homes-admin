import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import {
  App as AntApp,
  Button,
  Col,
  Flex,
  notification,
  Progress,
  Row,
  Table,
  TableColumnType,
  Tag,
  Typography,
} from "antd";
import React from "react";

import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  useDeleteProjectMutation,
  useProjectForm,
} from "../hooks/project-hooks";
import { useDevice } from "../hooks/use-device";
import { queries } from "../libs/queries";
import { calculateProgress } from "../libs/utils";
import { Project, ProjectStructure } from "../types/Project";
import { ColumnSearch } from "./common/column-search";
import { DeletePopconfirm } from "./common/delete-popconfirm";

export const ProjectsList: React.FC = () => {
  const { isMobile } = useDevice();

  const { data: projects, isLoading: projectIsLoading } = useQuery(
    queries.getAllProjects()
  );
  const deleteProjectMutation = useDeleteProjectMutation();

  const { projectFields } = useProjectForm();

  const handleDelete = async ({
    projectId,
  }: {
    projectId: string;
  }): Promise<void> => {
    deleteProjectMutation.mutate({ projectId: projectId });
  };

  const columns: TableColumnType<Project>[] = [
    {
      title: "Project Name",
      dataIndex: ["metadata", "name"],
      key: "name",
      ...ColumnSearch(["metadata", "name"]),
    },
    {
      title: "Date Added",
      dataIndex: "createdAt",
      key: "createdAt",
      responsive: ["lg", "md", "xl"],
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Date Updated",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (date: string) => new Date(date).toLocaleDateString(),
    },

    {
      title: "Must Have",
      dataIndex: "_id",
      key: "mustHave",
      width: "200px",
      defaultSortOrder: "descend",
      responsive: ["lg", "xl"],
      sorter: (a: any, b: any) =>
        calculateProgress(projectFields, a, true) -
        calculateProgress(projectFields, b, true),
      render: (_id: any, record: any) => {
        return (
          <Progress
            percent={calculateProgress(projectFields, record, true)}
            size="small"
          />
        );
      },
    },

    {
      title: "Good To Have",
      dataIndex: "_id",
      key: "goodToHave",
      width: "200px",
      responsive: ["lg", "xl"],
      render: (_id: any, record: any) => {
        return (
          <Progress
            percent={calculateProgress(projectFields, record, false)}
            size="small"
          />
        );
      },
    },
    {
      title: "",
      align: "right",
      dataIndex: "_id",
      key: "_id",

      render: (id: string, record) => {
        return (
          <Flex gap={isMobile ? 5 : 15} justify="end">
            <Link to={`/projects/${id}/edit`}>
              <Button
                type="default"
                shape="default"
                icon={<EditOutlined />}
              ></Button>
            </Link>

            <DeletePopconfirm
              handleOk={() => handleDelete({ projectId: id })}
              isLoading={deleteProjectMutation.isPending}
              title="Delete"
              description="Are you sure you want to delete this project"
            >
              <Button
                type="default"
                shape="default"
                icon={<DeleteOutlined />}
              ></Button>
            </DeletePopconfirm>
          </Flex>
        );
      },
    },
  ];

  return (
    <>
      <Row
        justify="space-between"
        align="middle"
        style={{ marginBottom: 20, padding: "0 10px" }}
      >
        <Col>
          <Typography.Title level={5} style={{ margin: 0 }}>
            All Projects
          </Typography.Title>
        </Col>
        <Col>
          <Link to="/projects/create">
            <Button type="primary">Create New Project</Button>
          </Link>
        </Col>
      </Row>

      <Table
        dataSource={projects}
        columns={columns}
        rowKey="_id"
        loading={projectIsLoading}
      />
    </>
  );
};
