import { EditOutlined } from "@ant-design/icons";
import { Button, Flex, Table, TableColumnType } from "antd";
import { Link } from "react-router-dom";

import { useGetAllLvnzyProjects } from "../../hooks/lvnzyprojects-hooks";
import { LvnzyProject } from "../../types/lvnzy-project";
import { ColumnSearch } from "../common/column-search";

export const Brick360ProjectsList: React.FC = () => {
  const { data: projects, isFetching: projectsLoading } =
    useGetAllLvnzyProjects();

  console.log(projects);

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
