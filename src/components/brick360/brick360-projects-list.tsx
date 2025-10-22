import { EditOutlined, LinkOutlined } from "@ant-design/icons";
import { Button, Flex, Table, TableColumnType } from "antd";
import { Link } from "react-router-dom";

import { useGetAllLvnzyProjects } from "../../hooks/lvnzyprojects-hooks";
import { LvnzyProject } from "../../types/lvnzy-project";
import { ColumnSearch } from "../common/column-search";

export const Brick360ProjectsList: React.FC = () => {
  const { data: projects, isFetching: projectsLoading } =
    useGetAllLvnzyProjects();

  console.log(projects);

  const brickfiAppUrl =
    import.meta.env.VITE_BRICKFI_APP_URL || "https://brickfi.in";

  const columns: TableColumnType<LvnzyProject>[] = [
    {
      title: "Project Name",
      dataIndex: ["meta", "projectName"],
      key: "name",
      sorter: (a, b) => a.meta.projectName.localeCompare(b.meta.projectName),
      sortDirections: ["descend"],
      ...ColumnSearch(["meta", "projectName"]),
    },
    {
      title: "Date Created",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      sortDirections: ["descend", "ascend"],
      render: (createdAt: string) => new Date(createdAt).toLocaleDateString(),
    },
    {
      title: "Date Updated",
      dataIndex: "updatedAt",
      key: "updatedAt",
      sorter: (a, b) =>
        new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
      sortDirections: ["descend", "ascend"],
      render: (updatedAt: string) => new Date(updatedAt).toLocaleDateString(),
    },
    {
      title: "Brick360 Report Link",
      dataIndex: "slug",
      key: "slug",
      ...ColumnSearch(["slug"]),
      render: (slug: string) => {
        if (!slug) return "-";
        const reportUrl = `${brickfiAppUrl}/app/brick360/${slug}`;
        return (
          <a href={reportUrl} target="_blank" rel="noopener noreferrer">
            <Button type="link" icon={<LinkOutlined />}>
              {slug}
            </Button>
          </a>
        );
      },
    },
    {
      title: "",
      align: "right",
      dataIndex: "_id",
      key: "_id",
      render: (id: string) => {
        return (
          <Flex gap={15} justify="end">
            <Link to={`/brick360/${id}`}>
              <Button
                type="default"
                shape="default"
                icon={<EditOutlined />}
              ></Button>
            </Link>
          </Flex>
        );
      },
    },
  ];

  return (
    <Table
      dataSource={projects}
      columns={columns}
      rowKey="_id"
      loading={projectsLoading}
    />
  );
};
