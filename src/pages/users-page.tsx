import { Table, TableColumnType, Typography } from "antd";
import { ColumnSearch } from "../components/common/column-search";
import { useGetAllUsers } from "../hooks/user-hooks";
import { User } from "../types/user";

export function UsersPage() {
  const { data, isLoading, isError } = useGetAllUsers();

  const columns: TableColumnType<User>[] = [
    {
      title: "Name",
      dataIndex: ["profile", "name"],
      key: "name",
      ...ColumnSearch(["profile", "name"]),
      render: (name: string, record) => record.profile?.name || "-",
    },

    {
      title: "Mobile",
      key: "mobile",
      ...ColumnSearch("mobile"),
      render: (_, record) => `${record.countryCode} ${record.mobile}`,
    },
  ];

  if (isError) return <div>Error fetching users data</div>;

  return (
    <>
      <Typography.Title level={4}>All Users</Typography.Title>
      <Table
        dataSource={data}
        columns={columns}
        loading={isLoading}
        rowKey="_id"
      />
    </>
  );
}
