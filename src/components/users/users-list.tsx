import { EditOutlined, MailOutlined, MessageOutlined } from "@ant-design/icons";
import {
  Button,
  Col,
  Divider,
  Flex,
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
  const [msgModalOpen, setMsgModalOpen] = useState(false);

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
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      render: (createdAt: string) =>
        new Date(createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
    },
    {
      title: "Mobile",
      key: "mobile",
      ...ColumnSearch("mobile"),
      render: (_, record) => `${record.countryCode} ${record.mobile}`,
    },
    {
      title: "Email",
      dataIndex: ["profile", "email"],
      key: "email",
      ...ColumnSearch(["profile", "email"]),
      render: (_, record) => record.profile?.email || "-",
    },
    {
      title: "Requested Reports",
      key: "requestedReports",
      render: (_, record) =>
        record.requestedReports && record.requestedReports.length > 0
          ? record.requestedReports.map((r) => r.projectName).join(", ")
          : "-",
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
          <Button
            type="default"
            shape="default"
            icon={<MessageOutlined />}
            disabled={!record.profile?.email}
            onClick={() => {
              setSelectedUser(record);
              setMsgModalOpen(true);
            }}
          ></Button>
        </Space>
      ),
    },
  ];

  function getMsgText() {
  const projects = lvnzyProjects?.filter((p: any) =>
    selectedProjectIds.includes(p._id)
  );
  if (!projects || !projects.length) {
    return "";
  }

  const projectNames = projects.map((p: any) => p.meta.projectName).join(", ");
  const projectSlug =
    projects.length === 1 ? `/brick360/${projects[0].slug}` : "";

  return `Hi ${selectedUser?.profile.name?.split(" ")[0]}👋
As per your request, the Brick360 report for *${projectNames}* is ready.

Click below 👇 to login to your account & access the report:
https://brickfi.in/app${projectSlug}

_If you need any kind of assistance with regards to ${projectNames.length > 1 ? `these properties`: `this property` } or other projects, please feel free to drop a message here._`;
}

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
        open={msgModalOpen}
        onCancel={() => {
          setMsgModalOpen(false);
          setSelectedUser(undefined);
          setSelectedProjectIds([]);
        }}
        onOk={() => {
          const txt = getMsgText();
          if (txt) {
            navigator.clipboard.writeText(getMsgText());
          }
        }}
        okText="Copy Message"
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
          <Divider></Divider>
           <Flex style={{ padding: 2 }}>
        <Typography.Text style={{ whiteSpace: "pre-line" }}>
          {getMsgText()}
        </Typography.Text>
        </Flex>
          
        </div>
      </Modal>

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
