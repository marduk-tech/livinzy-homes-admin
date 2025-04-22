import { Col, Row, Table, TableColumnType, Typography } from "antd";
import { useGetAllUsers } from "../../hooks/user-hooks";
import { User } from "../../types/user";
import { ColumnSearch } from "../common/column-search";
import { CreateUser } from "./create-user";

export function UsersList() {
  const { data, isLoading, isError } = useGetAllUsers();

  const columns: TableColumnType<User>[] = [
    {
      title: "Name",
      dataIndex: ["profile", "name"],
      key: "name",
      ...ColumnSearch("name"),
      render: (name: string, record) => record.profile?.name || "-",
    },

    {
      title: "Mobile",
      key: "mobile",
      render: (_, record) => `${record.mobile}`,
    },
  ];

  if (isError) return <div>Error fetching users data</div>;

  return (
    <>
      <Row
        justify="space-between"
        align="middle"
        style={{ marginBottom: 20, padding: "0 10px" }}
      >
        <Col>
          <Typography.Title level={4}>All Users</Typography.Title>
        </Col>
        <Col>
          <CreateUser />
        </Col>
      </Row>

      <Table
        dataSource={data}
        columns={columns}
        loading={isLoading}
        rowKey="_id"
      />
    </>
  );
}
