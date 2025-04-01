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
  Tooltip,
  Typography,
} from "antd";
import React, { useState } from "react";
import { COLORS } from "../theme/colors";

import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { useFetchCorridors } from "../hooks/corridors-hooks";
import {
  useDeleteProjectMutation,
  useProjectForm,
} from "../hooks/project-hooks";
import { useDevice } from "../hooks/use-device";
import { queries } from "../libs/queries";
import { calculateProgress } from "../libs/utils";
import { IMedia, Project, ProjectStructure } from "../types/Project";
import { AVGSQFTRateDisplay } from "./common/avg-sqft-rate-display";
import { ColumnSearch } from "./common/column-search";
import { DeletePopconfirm } from "./common/delete-popconfirm";
import DynamicReactIcon from "./common/dynamic-react-icon";
import { JsonProjectImport } from "./json-project-import";

export const ProjectsList: React.FC = () => {
  const { isMobile } = useDevice();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;
  const { data: corridors, isLoading: isCorridorsDataLoading } =
    useFetchCorridors();

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
      dataIndex: ["info", "name"],
      key: "name",
      sorter: (a, b) => a.info.name.localeCompare(b.info.name),
      sortDirections: ["descend"],
      showSorterTooltip: false,
      ...ColumnSearch(["info", "name"]),
      render: (name: string, record: Project) => (
        <Flex
          align="center"
          gap={8}
          style={{
            padding: 2,
            backgroundColor:
              record.info.status === "active"
                ? COLORS.greenIdentifier
                : COLORS.borderColorDark,
          }}
        >
          <span>{name}</span>
        </Flex>
      ),
    },

    {
      title: "Corridors",
      dataIndex: ["info", "corridors"],
      render: (projectCorridors: any) => {
        if (!projectCorridors || !projectCorridors.length) {
          return "-";
        }
        return (
          <Flex style={{ width: 150, flexWrap: "wrap" }} gap={8}>
            {projectCorridors.map((c: any) => {
              const corridorObj = corridors!.find(
                (corr) => corr._id == c.corridorId
              );
              if (corridorObj) {
                return <Tag>{corridorObj.name}</Tag>;
              }
            })}
          </Flex>
        );
      },
      filters: corridors?.map((c) => {
        return {
          text: c.name,
          value: c._id,
        };
      }),
      onFilter: (value, record) => {
        const corrs = ((record.info.corridors || []) as any).map(
          (c: any) => c.corridorId
        );
        return corrs.includes(value);
      },
    },

    {
      title: "Avg Sqft Rate",
      dataIndex: ["ui", "costingDetails"],
      key: "averageSqftRate",
      width: "150px",
      responsive: ["lg", "xl"],

      sorter: (a: any, b: any) => {
        const calculateRate = (details: any) => {
          if (!details?.singleUnitCost || !details?.singleUnitSize) return 0;
          const cost = Number(details.singleUnitCost);
          const size = Number(details.singleUnitSize);
          if (isNaN(cost) || isNaN(size) || size <= 0) return 0;
          return Math.round(cost / size);
        };
        const aRate = calculateRate(a.ui?.costingDetails);
        const bRate = calculateRate(b.ui?.costingDetails);
        return aRate - bRate;
      },

      render: (details: any, record: Project) => {
        return (
          <AVGSQFTRateDisplay
            details={details}
            record={record}
            projects={projects}
          />
        );
      },
    },
    {
      title: "RERA",
      dataIndex: ["info", "reraNumber"],
      key: "reraNumber",
      width: "50px",
      responsive: ["lg", "xl"],
      sorter: (a, b) => {
        if (!a.info.reraNumber && !b.info.reraNumber) return 0;
        if (!a.info.reraNumber) return -1;
        if (!b.info.reraNumber) return 1;
        return a.info.reraNumber.localeCompare(b.info.reraNumber);
      },
      sortDirections: ["ascend", "descend"],
      ...ColumnSearch(["info", "reraNumber"]),
      render: (reraNumber: string) => {
        return (
          <Typography.Text copyable style={{ width: 100 }} ellipsis={{}}>
            {reraNumber || "-"}
          </Typography.Text>
        );
      },
    },
    {
      title: "Media",
      dataIndex: "media",
      key: "media",
      width: "200px",
      responsive: ["lg", "xl"],

      render: (record: IMedia[]) => {
        const mediaByTag: {
          [key: string]: { images: IMedia[]; videos: number };
        } = {};

        record.forEach((media) => {
          const tags =
            media.type === "image" ? media.image?.tags : media.video?.tags;
          tags?.forEach((tag: string) => {
            if (!mediaByTag[tag]) {
              mediaByTag[tag] = { images: [], videos: 0 };
            }
            if (media.type === "image") {
              mediaByTag[tag].images.push(media);
            } else if (media.type === "video") {
              mediaByTag[tag].videos++;
            }
          });
        });

        return (
          <Flex style={{ maxWidth: 200 }} wrap="wrap" gap={4}>
            {Object.entries(mediaByTag)
              .filter(
                ([_, counts]) => counts.images.length > 0 || counts.videos > 0
              )
              .map(([tag, counts]) => (
                <Tooltip
                  key={tag}
                  title={
                    <Flex
                      wrap="wrap"
                      gap={8}
                      style={{ height: 200, overflowY: "scroll" }}
                    >
                      {counts.images.map((image, index) => (
                        <img
                          key={index}
                          src={image.image?.url}
                          alt={tag}
                          style={{
                            height: 125,
                            objectFit: "cover",
                            borderRadius: 4,
                          }}
                        />
                      ))}
                    </Flex>
                  }
                >
                  <Tag>
                    {tag} ({counts.images.length + counts.videos})
                  </Tag>
                </Tooltip>
              ))}
          </Flex>
        );
      },
      sorter: (a: any, b: any) => {
        const aTotalCount = a.media.length;
        const bTotalCount = b.media.length;
        return aTotalCount - bTotalCount;
      },
    },

    {
      title: "Home Types",
      dataIndex: ["info", "homeType"],
      key: "homeType",
      width: "200px",
      responsive: ["lg", "xl"],
      sorter: (a, b) => {
        const aTypes = a.info.homeType || [];
        const bTypes = b.info.homeType || [];
        return aTypes.join(",").localeCompare(bTypes.join(","));
      },
      sortDirections: ["ascend", "descend"],
      render: (homeType: string[]) => {
        if (!homeType || !homeType.length) return "-";
        return (
          <Flex gap={4} wrap="wrap">
            {homeType.map((type, index) => (
              <Tag key={index}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Tag>
            ))}
          </Flex>
        );
      },
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
      onFilter: (value, record) => {
        const types = record.info.homeType || [];
        return types.includes(
          value as
            | "farmland"
            | "plot"
            | "villa"
            | "rowhouse"
            | "villament"
            | "apartment"
            | "penthouse"
        );
      },
    },

    {
      title: "Location",
      dataIndex: ["info", "location"],
      key: "location",
      width: "30px",
      responsive: ["lg", "xl"],
      sorter: (a, b) => {
        const aHasLocation =
          a.info?.location?.lat && a.info?.location?.lng;
        const bHasLocation =
          b.info?.location?.lat && b.info?.location?.lng;

        if (!aHasLocation && !bHasLocation) return 0;
        if (!aHasLocation) return -1;
        if (!bHasLocation) return 1;

        // if  have locations sort by latitude
        return a.info.location.lat - b.info.location.lat;
      },
      render: (location: any) => {
        if (!location?.lat || !location?.lng) return "-";

        const { lat, lng } = location;
        return (
          <Flex
            style={{ cursor: "pointer" }}
            onClick={() =>
              window.open(
                `https://www.google.com/maps?q=${lat},${lng}`,
                "_blank"
              )
            }
          >
            <DynamicReactIcon
              color={COLORS.textColorDark}
              iconName="IoNavigateCircleSharp"
              iconSet="io5"
            ></DynamicReactIcon>
          </Flex>
        );
      },
    },
    {
      title: "Date Updated",
      dataIndex: "updatedAt",
      sorter: (a, b) =>
        new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
      key: "updatedAt",
      defaultSortOrder: "descend",
      render: (date: string) => new Date(date).toLocaleDateString(),
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
      disabled: true,
      onClick: () => {
        setIsJsonImportModalOpen(true);
      },
      label: "Create From JSON",
    },
  ];

  const sortedProjects = projects
    // fix old project doc dosn't have name which causes undefined errors
    ?.filter((project) => project.info?.name)
    ?.sort((a, b) => {
      const nameA = a.info?.name?.toLowerCase();
      const nameB = b.info?.name?.toLowerCase();

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
        loading={projectIsLoading || isCorridorsDataLoading}
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
