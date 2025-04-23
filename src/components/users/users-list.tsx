import { EditOutlined } from "@ant-design/icons";
import {
  Button,
  Col,
  Row,
  Table,
  TableColumnType,
  Tag,
  Typography,
} from "antd";
import { useState } from "react";
import { useGetAllUsers } from "../../hooks/user-hooks";
import { User } from "../../types/user";
import { ColumnSearch } from "../common/column-search";
import { UserForm } from "./user-form";

export function UsersList() {
  const { data, isLoading, isError } = useGetAllUsers();
  const [userToEdit, setUserToEdit] = useState<User | undefined>();

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
    {
      title: "Collections",
      key: "collections",
      width: 500,
      render: (_, record) => (
        <>
          {record.savedLvnzyProjects?.length
            ? record.savedLvnzyProjects.map((collection) => (
                <Tag key={collection._id} style={{ margin: "2px" }}>
                  {collection.collectionName || "Unnamed Collection"}
                </Tag>
              ))
            : "-"}
        </>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Button
          type="default"
          shape="default"
          icon={<EditOutlined />}
          onClick={() => setUserToEdit(record)}
        ></Button>
      ),
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
          <UserForm />
        </Col>
      </Row>

      <Table
        dataSource={data}
        columns={columns}
        loading={isLoading}
        rowKey="_id"
      />

      {userToEdit && (
        <UserForm data={userToEdit} onClose={() => setUserToEdit(undefined)} />
      )}
    </>
  );
}
