import {
  DeleteOutlined,
  EditOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
} from "@ant-design/icons";
import {
  App as AntApp,
  Button,
  Col,
  Dropdown,
  Flex,
  MenuProps,
  notification,
  Progress,
  Row,
  Table,
  TableColumnType,
  Tag,
  Typography,
} from "antd";
import React, { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import {
  useDeleteProjectMutation,
  useProjectForm,
} from "../hooks/project-hooks";
import { useDevice } from "../hooks/use-device";
import { queries } from "../libs/queries";
import { calculateProgress } from "../libs/utils";
import { IMedia, Project, ProjectStructure } from "../types/Project";
import { ColumnSearch } from "./common/column-search";
import { DeletePopconfirm } from "./common/delete-popconfirm";
import { JsonProjectImport } from "./json-project-import";

export const ProjectsList: React.FC = () => {
  const { isMobile } = useDevice();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;

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

  const [sortOrder, setSortOrder] = useState<
    "ascend" | "descend" | undefined
  >();

  const handleSorterChange = (order: "ascend" | "descend" | undefined) => {
    if (order === "ascend") {
      setSortOrder("descend");
    } else if (order === "descend") {
      setSortOrder(undefined);
    } else {
      setSortOrder("descend");
    }
  };

  const columns: TableColumnType<Project>[] = [
    {
      title: "Project Name",
      dataIndex: ["metadata", "name"],
      key: "name",
      sorter: (a, b) => a.metadata.name.localeCompare(b.metadata.name),
      sortDirections: ["descend"],
      defaultSortOrder: "ascend",
      showSorterTooltip: false,
      ...ColumnSearch(["metadata", "name"]),
    },
    {
      title: "Livinzy Area",
      dataIndex: ["metadata", "livinzyArea"],
      key: "livinzyArea",
      sorter: (a, b) => {
        const getAreaString = (area: any) => {
          if (!area) return "";
          if (!area.key && !area.subArea) return "";
          if (!area.key) return area.subArea;
          if (!area.subArea) return area.key;
          return `${area.key} - ${area.subArea}`;
        };

        const areaA = getAreaString(a.metadata.livinzyArea);
        const areaB = getAreaString(b.metadata.livinzyArea);
        return areaA.localeCompare(areaB);
      },
      render: (livinzyArea: any) => {
        if (!livinzyArea) return "-";
        if (!livinzyArea.key && !livinzyArea.subArea) return "-";
        if (!livinzyArea.key) return livinzyArea.subArea;
        if (!livinzyArea.subArea) return livinzyArea.key;
        return `${livinzyArea.key} - ${livinzyArea.subArea}`;
      },
      ...ColumnSearch(["metadata", "livinzyArea"]),
      onFilter: (value: boolean | React.Key, record: Project) => {
        const area = record.metadata.livinzyArea;
        if (!area) return false;
        if (!area.key && !area.subArea) return false;

        let areaString: string;
        if (!area.key) areaString = area.subArea!;
        else if (!area.subArea) areaString = area.key;
        else areaString = `${area.key} - ${area.subArea}`;

        return areaString.toLowerCase().includes(String(value).toLowerCase());
      },
    },
    {
      title: "Date Updated",
      dataIndex: "updatedAt",
      sorter: (a, b) =>
        new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
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
      title: "Media",
      dataIndex: "media",
      key: "media",
      width: "200px",
      responsive: ["lg", "xl"],

      render: (record: any) => {
        const imagesCount = record.filter(
          (media: IMedia) => media.type === "image"
        ).length;

        const videosCount = record.filter(
          (media: IMedia) => media.type === "video"
        ).length;

        return (
          <>
            <Tag>Images: {imagesCount} </Tag>
            <Tag>Videos: {videosCount} </Tag>
          </>
        );
      },
      sorter: (a: any, b: any) => {
        const aTotalCount = a.media.length;
        const bTotalCount = b.media.length;
        return aTotalCount - bTotalCount;
      },
    },

    {
      title: "Home Type",
      dataIndex: ["metadata", "homeType"],
      key: "homeType",
      width: "200px",
      responsive: ["lg", "xl"],
      sorter: (a, b) =>
        (a.metadata.homeType || "").toString().localeCompare(b.metadata.homeType.toString() || ""),
      sortDirections: ["ascend", "descend"],

      filters: [
        { text: "Apartment", value: "apartment" },
        { text: "Farmland", value: "farmland" },
        { text: "House", value: "house" },
        { text: "Penthouse", value: "penthouse" },
        { text: "Plot", value: "plot" },
        { text: "Rowhouse", value: "rowhouse" },
        { text: "Villa", value: "villa" },
        { text: "Villament", value: "villament" },
      ],

      onFilter: (value, record) => record.metadata.homeType.toString() === value,
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

  const [isJsonImportModalOpen, setIsJsonImportModalOpen] = useState(false);

  const items: MenuProps["items"] = [
    {
      key: "1",
      label: <Link to="/projects/create">Create From Scratch</Link>,
    },
    {
      key: "2",
      onClick: () => {
        setIsJsonImportModalOpen(true);
      },
      label: "Create From JSON",
    },
  ];

  const sortedProjects = projects
    // fix old project doc dosn't have name which causes undefined errors
    ?.filter((project) => project.metadata?.name)
    ?.sort((a, b) => {
      const nameA = a.metadata?.name?.toLowerCase();
      const nameB = b.metadata?.name?.toLowerCase();

      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;
      return 0;
    });

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
          <Dropdown menu={{ items }} placement="bottomRight" arrow>
            <Button type="primary">Create New Project</Button>
          </Dropdown>
        </Col>
      </Row>

      <Table
        dataSource={sortedProjects}
        columns={columns}
        rowKey="_id"
        loading={projectIsLoading}
        pagination={{
          current: currentPage,
          onChange: (page) => {
            const newParams = new URLSearchParams(searchParams);
            newParams.set("page", page.toString());
            setSearchParams(newParams);
          },
        }}
      />
      <JsonProjectImport
        isModalOpen={isJsonImportModalOpen}
        setIsModalOpen={setIsJsonImportModalOpen}
      />
    </>
  );
};
