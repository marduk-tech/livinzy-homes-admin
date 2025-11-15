import { CopyOutlined, EditOutlined, MailOutlined, MessageOutlined } from "@ant-design/icons";
import {
  Button,
  Col,
  Divider,
  Flex,
  Input,
  Modal,
  notification,
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
import { User, UtmEntry } from "../../types/user";
import { ColumnSearch } from "../common/column-search";
import { UserForm } from "./user-form";

export function UsersList() {
  const { data, isLoading, isError } = useGetAllUsers();
  const { data: lvnzyProjects } = useGetAllLvnzyProjects();
  const sendReportEmailMutation = useSendReportEmailMutation();

  const [userToEdit, setUserToEdit] = useState<User | undefined>();
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [msgModalOpen, setMsgModalOpen] = useState(false);
  const [isUtmModalOpen, setIsUtmModalOpen] = useState(false);

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
      render: (name: string, record) => (
        <Space>
          {record.profile?.name || "-"}
          <Typography.Text
            copyable={{
              text: record._id,
              icon: <CopyOutlined />,
              tooltips: false,
            }}
          ></Typography.Text>
        </Space>
      ),
    },
    {
      title: "Updated",
      dataIndex: "updatedAt",
      key: "updatedAt",
      sorter: (a, b) =>
        new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
      render: (updatedAt: string) =>
        new Date(updatedAt).toLocaleDateString("en-US", {
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
      title: "UTM Source",
      key: "utmSource",
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Search UTM Source"
            value={selectedKeys[0] as string}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ marginBottom: 8, display: 'block', width: 188 }}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => confirm()}
              size="small"
              style={{ width: 90 }}
            >
              Search
            </Button>
            <Button onClick={() => clearFilters?.()} size="small" style={{ width: 90 }}>
              Reset
            </Button>
          </Space>
        </div>
      ),
      onFilter: (value, record) => {
        const utmSource = record.metrics?.utm?.[record.metrics.utm.length - 1]?.utm_source;
        return utmSource ? utmSource.toLowerCase().includes(String(value).toLowerCase()) : false;
      },
      sorter: (a, b) => {
        const aSource = a.metrics?.utm?.[a.metrics.utm.length - 1]?.utm_source || "";
        const bSource = b.metrics?.utm?.[b.metrics.utm.length - 1]?.utm_source || "";
        return aSource.localeCompare(bSource);
      },
      render: (_, record) => {
        const mostRecentUtm = record.metrics?.utm?.[record.metrics.utm.length - 1];
        const utmSource = mostRecentUtm?.utm_source;

        if (!utmSource) return "-";

        return (
          <Typography.Link
            onClick={() => {
              setSelectedUser(record);
              setIsUtmModalOpen(true);
            }}
          >
            {utmSource}
          </Typography.Link>
        );
      },
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

    const projectNames = projects
      .map((p: any) => p.meta.projectName)
      .join(", ");
    const projectSlug =
      projects.length === 1 ? `/brick360/${projects[0].slug}` : "";

    return `Hi ${selectedUser?.profile.name?.split(" ")[0]}👋
As per your request, the Brick360 report for *${projectNames}* is ready.

Click below 👇 to login to your account & access the report:
https://brickfi.in/app${projectSlug}

_If you need any kind of assistance with regards to ${
      projects.length > 1 ? `these properties` : `this property`
    } or other projects, please feel free to drop a message here._`;
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
            notification.success({
              message: `Message copied to clipboard!`,
            });
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

      <Modal
        title="UTM Tracking History"
        open={isUtmModalOpen}
        onCancel={() => {
          setIsUtmModalOpen(false);
          setSelectedUser(undefined);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setIsUtmModalOpen(false);
              setSelectedUser(undefined);
            }}
          >
            Close
          </Button>,
        ]}
        width={900}
      >
        <div style={{ marginTop: 20 }}>
          <Typography.Text strong>
            UTM tracking data for {selectedUser?.profile?.name || "user"}
          </Typography.Text>
          <Table
            dataSource={
              selectedUser?.metrics?.utm
                ? [...selectedUser.metrics.utm].reverse()
                : []
            }
            columns={[
              {
                title: "Captured At",
                dataIndex: "capturedAt",
                key: "capturedAt",
                render: (date: string) =>
                  new Date(date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  }),
                width: 160,
              },
              {
                title: "Source",
                dataIndex: "utm_source",
                key: "utm_source",
                render: (source?: string) => source || "-",
              },
              {
                title: "Medium",
                dataIndex: "utm_medium",
                key: "utm_medium",
                render: (medium?: string) => medium || "-",
              },
              {
                title: "Campaign",
                dataIndex: "utm_campaign",
                key: "utm_campaign",
                render: (campaign?: string) => campaign || "-",
              },
              {
                title: "Term",
                dataIndex: "utm_term",
                key: "utm_term",
                render: (term?: string) => term || "-",
              },
              {
                title: "Content",
                dataIndex: "utm_content",
                key: "utm_content",
                render: (content?: string) => content || "-",
              },
              {
                title: "Landing Page",
                dataIndex: "landingPage",
                key: "landingPage",
                render: (page?: string) =>
                  page ? (
                    <Typography.Link href={`${import.meta.env.VITE_BRICKFI_APP_URL}${page}`} target="_blank">
                      {page.length > 30 ? `${page.substring(0, 30)}...` : page}
                    </Typography.Link>
                  ) : (
                    "-"
                  ),
                width: 200,
              },
            ]}
            pagination={{ pageSize: 5 }}
            rowKey={(record, index) => `${record.capturedAt}-${index}`}
            scroll={{ x: true }}
            style={{ marginTop: 16 }}
          />
        </div>
      </Modal>
    </>
  );
}
