import { EditOutlined, MailOutlined } from "@ant-design/icons";
import {
  Button,
  Col,
  Modal,
  Row,
  Select,
  Space,
  Table,
  TableColumnType,
  Tag,
  Typography,
} from "antd";
import { useState } from "react";
import { useGetAllLvnzyProjects } from "../../hooks/lvnzyprojects-hooks";
import {
  useGetAllUsers,
  useSendReportEmailMutation,
} from "../../hooks/user-hooks";
import { User } from "../../types/user";
import { ColumnSearch } from "../common/column-search";
import { UserForm } from "./user-form";

export function UsersList() {
  const { data, isLoading, isError } = useGetAllUsers();
  const { data: lvnzyProjects } = useGetAllLvnzyProjects();
  const sendReportEmailMutation = useSendReportEmailMutation();

  const [userToEdit, setUserToEdit] = useState<User | undefined>();
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | undefined>();
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);

  const handleSendEmail = () => {
    if (selectedUser && selectedProjectIds.length > 0) {
      sendReportEmailMutation.mutate(
        {
          userId: selectedUser._id,
          projectIds: selectedProjectIds,
        },
        {
          onSuccess: () => {
            setIsEmailModalOpen(false);
            setSelectedUser(undefined);
            setSelectedProjectIds([]);
          },
        }
      );
    }
  };

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
        <Space>
          <Button
            type="default"
            shape="default"
            icon={<EditOutlined />}
            onClick={() => setUserToEdit(record)}
          ></Button>
          <Button
            type="default"
            shape="default"
            icon={<MailOutlined />}
            disabled={!record.profile?.email}
            onClick={() => {
              setSelectedUser(record);
              setIsEmailModalOpen(true);
            }}
          ></Button>
        </Space>
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
          <UserForm users={data || []} />
        </Col>
      </Row>

      <Table
        dataSource={data}
        columns={columns}
        loading={isLoading}
        rowKey="_id"
      />

      {userToEdit && (
        <UserForm
          data={userToEdit}
          users={data || []}
          onClose={() => setUserToEdit(undefined)}
        />
      )}

      <Modal
        title="Send Report Email"
        open={isEmailModalOpen}
        onCancel={() => {
          setIsEmailModalOpen(false);
          setSelectedUser(undefined);
          setSelectedProjectIds([]);
        }}
        onOk={handleSendEmail}
        okText="Send Email"
        okButtonProps={{
          disabled: selectedProjectIds.length === 0,
          loading: sendReportEmailMutation.isPending,
        }}
      >
        <div style={{ marginTop: 20 }}>
          <Typography.Text>
            Select projects to send report email to{" "}
            <strong>{selectedUser?.profile?.name || "user"}</strong> (
            {selectedUser?.profile?.email})
          </Typography.Text>
          <Select
            mode="multiple"
            showSearch
            style={{ width: "100%", marginTop: 10 }}
            placeholder="Select projects"
            value={selectedProjectIds}
            onChange={setSelectedProjectIds}
            filterOption={(input, option) =>
              String(option?.label ?? "")
                .toLowerCase()
                .includes(input.toLowerCase())
            }
            options={lvnzyProjects?.map((project: any) => ({
              value: project._id,
              label: project.meta?.projectName || project._id,
            }))}
          />
        </div>
      </Modal>
    </>
  );
}
