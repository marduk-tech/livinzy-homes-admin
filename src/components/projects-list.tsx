import {
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import {
  App as AntApp,
  Button,
  Col,
  Dropdown,
  Flex,
  Input,
  MenuProps,
  notification,
  Progress,
  Radio,
  RadioChangeEvent,
  Row,
  Table,
  TableColumnType,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import React, { useEffect, useState } from "react";
import { COLORS } from "../theme/colors";

import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { useFetchCorridors } from "../hooks/corridors-hooks";
import {
  useDeleteProjectMutation,
  useGetAllProjects,
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
import Paragraph from "antd/es/skeleton/Paragraph";
const { Search } = Input;

export const ProjectsList: React.FC = () => {
  const { isMobile } = useDevice();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;
  const { data: corridors, isLoading: isCorridorsDataLoading } =
    useFetchCorridors();

  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [issueSeverity, setIssueSeverity] = useState<string>("");

  const {
    data: projects,
    isFetching: projectsLoading,
    refetch: refetchProjects,
  } = useGetAllProjects({ searchKeyword, issueSeverity });

  const deleteProjectMutation = useDeleteProjectMutation();

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
          style={{
            padding: 2,
          }}
        >
          <Tag
            color={
              record.info.status == "active"
                ? COLORS.greenIdentifier
                : "default"
            }
          >
            <Flex gap={4} align="center">
              <Typography.Text>{name}</Typography.Text>
              {record.info?.location?.lat && record.info?.location?.lng && (
                <span
                  style={{ cursor: "pointer", marginTop: "5px" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(
                      `https://www.google.com/maps?q=${record.info.location.lat},${record.info.location.lng}`,
                      "_blank"
                    );
                  }}
                >
                  <DynamicReactIcon
                    color={COLORS.textColorDark}
                    iconName="IoNavigateCircleSharp"
                    iconSet="io5"
                    size={20}
                  />
                </span>
              )}
            </Flex>
          </Tag>
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
          <Flex style={{ width: 125, flexWrap: "wrap" }} gap={4}>
            {projectCorridors.map((c: any) => {
              const corridorObj = corridors!.find(
                (corr) => corr._id == c.corridorId
              );
              if (corridorObj) {
                return (
                  <Tag
                    style={{
                      fontSize: 10,
                      padding: "4px 2px",
                      height: 18,
                      lineHeight: "70%",
                    }}
                  >
                    {corridorObj.name}
                  </Tag>
                );
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
      title: "Sqft Rate",
      dataIndex: ["info", "rate"],
      key: "averageSqftRate",
      width: "150px",
      responsive: ["lg", "xl"],

      sorter: (a: any, b: any) => {
        if (!a?.minimumUnitCost || !a?.minimumUnitSize) return 0;
        const cost = Number(a.minimumUnitCost);
        const size = Number(a.minimumUnitSize);
        if (isNaN(cost) || isNaN(size) || size <= 0) return 0;
        return Math.round(cost / size);
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
      title: "Timeline",
      dataIndex: [
        "info",
        "reraProjectId",
        "projectDetails",
        "listOfRegistrationsExtensions",
      ],
      key: "timeline",
      width: "200px",
      responsive: ["lg", "xl"],
      sorter: (a: any, b: any) => {
        const aExtensions =
          a.info?.reraProjectId?.projectDetails
            ?.listOfRegistrationsExtensions || [];
        const bExtensions =
          b.info?.reraProjectId?.projectDetails
            ?.listOfRegistrationsExtensions || [];

        const parseDateString = (dateStr: string) => {
          const [day, month, year] = dateStr.split("-");
          return new Date(Number(year), Number(month) - 1, Number(day));
        };

        const aEndDate =
          aExtensions.length > 0
            ? parseDateString(
                aExtensions[aExtensions.length - 1].completionDate
              )
            : new Date(0);
        const bEndDate =
          bExtensions.length > 0
            ? parseDateString(
                bExtensions[bExtensions.length - 1].completionDate
              )
            : new Date(0);

        return aEndDate.getTime() - bEndDate.getTime();
      },
      render: (extensions: any[]) => {
        if (!extensions || extensions.length === 0) return "-";

        const parseDateString = (dateStr: string) => {
          const [day, month, year] = dateStr.split("-");
          return new Date(Number(year), Number(month) - 1, Number(day));
        };

        const startDate = parseDateString(extensions[0].startDate);
        const endDate = parseDateString(
          extensions[extensions.length - 1].completionDate
        );

        const formatDate = (date: Date) => {
          return date.toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          });
        };

        return (
          <Typography.Text>
            {formatDate(startDate)} | {formatDate(endDate)}
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
          let tags =
            media.type === "image" ? media.image?.tags : media.video?.tags;
          tags = tags && tags.length ? tags : ["all"];
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
          <Flex style={{ maxWidth: 200 }} wrap="wrap" gap={2}>
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
                  <Tag
                    style={{
                      fontSize: 8,
                      padding: 2,
                      height: 12,
                      lineHeight: "90%",
                      margin: 0,
                    }}
                  >
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
      title: "Issues",
      dataIndex: "internalChecks",
      key: "internalChecks",
      render: (internalChecks: any) => {
        if (!internalChecks || !internalChecks.lastChecked) {
          return <Tag icon={<SyncOutlined />}></Tag>;
        }
        if (
          !!internalChecks &&
          internalChecks.lastChecked &&
          (!internalChecks.checks.length ||
            !internalChecks.checks.filter((c: any) => c.severity > 2).length)
        ) {
          return (
            <Tag icon={<CheckCircleOutlined />} color="success">
              All Ok
            </Tag>
          );
        }
        const severeIssues = internalChecks.checks.filter(
          (c: any) => c.severity == 5
        );
        const nonSevereIssues = internalChecks.checks.filter(
          (c: any) => c.severity < 5 && c.severity > 2
        );
        const getIssuesLabel = (issues: any[], color: string) => {
          return (
            <Tooltip
              title={
                issues && issues.length ? (
                  <Flex vertical gap={2}>
                    {issues.map((i: any) => {
                      return (
                        <Tag>
                          <Flex vertical gap={0}>
                            <Typography.Text
                              style={{ fontSize: 11, fontWeight: "bold" }}
                            >
                              {i.field}
                            </Typography.Text>
                            <Typography.Text
                              style={{ fontSize: 11, textWrap: "wrap" }}
                            >
                              {i.issue}
                            </Typography.Text>
                          </Flex>
                        </Tag>
                      );
                    })}
                  </Flex>
                ) : null
              }
            >
              <Tag color={color} bordered={false}>
                {issues.length ? issues.length : 0}
              </Tag>
            </Tooltip>
          );
        };
        return (
          <Flex>
            {severeIssues.length ? getIssuesLabel(severeIssues, "error") : null}
            {nonSevereIssues.length
              ? getIssuesLabel(nonSevereIssues, "warning")
              : null}
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

  useEffect(() => {
    if (searchKeyword && !projectsLoading) {
      refetchProjects();
    }
  }, [searchKeyword]);

  useEffect(() => {
    if (issueSeverity && !projectsLoading) {
      refetchProjects();
    }
  }, [issueSeverity]);

  return (
    <>
      <Row
        justify="space-between"
        align="middle"
        style={{ marginBottom: 20, padding: "0 10px" }}
      >
        <Col>
          <Flex gap={8}>
            <Search
              loading={projectsLoading}
              placeholder="Search for a project"
              onSearch={(value: string) => {
                setSearchKeyword(value);
              }}
              enterButton="Search"
              style={{ width: 300 }}
            />
            <Radio.Group
              block
              onChange={({ target: { value } }: RadioChangeEvent) => {
                setIssueSeverity(value);
              }}
              buttonStyle="solid"
              options={[
                {
                  label: (
                    <Typography.Text
                      style={{
                        color:
                          issueSeverity == "ok"
                            ? "white"
                            : COLORS.greenIdentifier,
                      }}
                    >
                      All good
                    </Typography.Text>
                  ),
                  value: "ok",
                },
                {
                  label: (
                    <Typography.Text
                      style={{
                        color:
                          issueSeverity == "blocker"
                            ? "white"
                            : COLORS.redIdentifier,
                      }}
                    >
                      Blocker
                    </Typography.Text>
                  ),
                  value: "blocker",
                },
                {
                  label: (
                    <Typography.Text
                      style={{
                        color:
                          issueSeverity == "review"
                            ? "white"
                            : COLORS.yellowIdentifier,
                      }}
                    >
                      Review
                    </Typography.Text>
                  ),
                  value: "review",
                },
              ]}
              style={{ width: 300 }}
              defaultValue=""
              optionType="button"
            />
          </Flex>
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
        loading={projectsLoading || isCorridorsDataLoading}
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
