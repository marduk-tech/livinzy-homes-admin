import {
  CopyOutlined,
  EditOutlined,
  FilterOutlined,
  MailOutlined,
  MessageOutlined,
  SearchOutlined,
  SendOutlined,
  WhatsAppOutlined,
} from "@ant-design/icons";
import {
  Button,
  Checkbox,
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
  Tabs,
  Tag,
  Typography,
} from "antd";
import { useState } from "react";
import { useGetAllLvnzyProjects } from "../../hooks/lvnzyprojects-hooks";
import {
  useGetAllUsers,
  useSendReportEmailMutation,
} from "../../hooks/user-hooks";
import { RequestedReportRow, User, UtmEntry } from "../../types/user";
import { ColumnSearch } from "../common/column-search";
import { UserForm } from "./user-form";

export function UsersList() {
  const { data, isLoading, isError } = useGetAllUsers();
  const { data: lvnzyProjects } = useGetAllLvnzyProjects();
  const sendReportEmailMutation = useSendReportEmailMutation();

  const [userToEdit, setUserToEdit] = useState<User | undefined>();
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  const [isUtmModalOpen, setIsUtmModalOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState<User | undefined>();
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"users" | "reports">("users");

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
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Search UTM Source"
            value={selectedKeys[0] as string}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() => confirm()}
            style={{ marginBottom: 8, display: "block", width: 188 }}
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
            <Button
              onClick={() => clearFilters?.()}
              size="small"
              style={{ width: 90 }}
            >
              Reset
            </Button>
          </Space>
        </div>
      ),
      onFilter: (value, record) => {
        const utmSource =
          record.metrics?.utm?.[record.metrics.utm.length - 1]?.utm_source;
        return utmSource
          ? utmSource.toLowerCase().includes(String(value).toLowerCase())
          : false;
      },
      sorter: (a, b) => {
        const aSource =
          a.metrics?.utm?.[a.metrics.utm.length - 1]?.utm_source || "";
        const bSource =
          b.metrics?.utm?.[b.metrics.utm.length - 1]?.utm_source || "";
        return aSource.localeCompare(bSource);
      },
      render: (_, record) => {
        const mostRecentUtm =
          record.metrics?.utm?.[record.metrics.utm.length - 1];
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
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Search project name"
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() => confirm()}
            style={{ marginBottom: 8, display: "block" }}
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
            <Button
              onClick={() => {
                clearFilters?.();
                setSelectedKeys([]);
                confirm();
              }}
              size="small"
              style={{ width: 90 }}
            >
              Reset
            </Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered: boolean) => (
        <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
      ),
      onFilter: (value, record) => {
        if (!record.requestedReports || record.requestedReports.length === 0) {
          return false;
        }
        const searchTerm = String(value).toLowerCase();
        return record.requestedReports.some((report) =>
          report.projectName.toLowerCase().includes(searchTerm)
        );
      },
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
            icon={<SendOutlined />}
            disabled={!record.profile?.email}
            title="Send email and WhatsApp notification"
            onClick={() => {
              setSelectedUser(record);
              setIsEmailModalOpen(true);
            }}
          ></Button>
        </Space>
      ),
    },
  ];

  const getFlattenedReports = (): RequestedReportRow[] => {
    if (!data) return [];

    const reports: RequestedReportRow[] = [];
    data.forEach((user) => {
      const reqReports = user.requestedReports
        ? user.requestedReports.filter((r) => !!r)
        : [];
      if (reqReports && reqReports.length > 0) {
        reqReports.forEach((report) => {
          reports.push({
            projectName: report.projectName,
            lvnzyProjectId: report.lvnzyProjectId,
            reraNumber: report.reraNumber,
            requestDate: report.requestDate,
            userId: user._id,
            userName: user.profile?.name || "-",
            userMobile: user.mobile,
            userCountryCode: user.countryCode,
          });
        });
      }
    });

    return reports.sort(
      (a, b) =>
        new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()
    );
  };

  const reportsColumns: TableColumnType<RequestedReportRow>[] = [
    {
      title: "Project Name",
      dataIndex: "projectName",
      key: "projectName",
      ...ColumnSearch("projectName"),
      width: 200,
    },

     {
      title: "Rera Number",
      dataIndex: "reraNumber",
      key: "reraNumber",
      ...ColumnSearch("reraNumber"),
      width: 200,
    },
    {
      title: "Report Link",
      dataIndex: "lvnzyProjectId",
      key: "lvnzyProjectId",
      width: 150,
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => (
        <div style={{ padding: 8 }}>
          <Checkbox
            checked={
              selectedKeys.length > 0 && selectedKeys[0] === "new-requests"
            }
            onChange={(e) => {
              setSelectedKeys(e.target.checked ? ["new-requests"] : []);
            }}
          >
            New Requests
          </Checkbox>

          <Divider style={{ margin: "8px 0" }} />
          <Space>
            <Button
              type="primary"
              onClick={() => confirm()}
              size="small"
              style={{ width: 90 }}
            >
              Apply
            </Button>
            <Button
              onClick={() => {
                clearFilters?.();
                setSelectedKeys([]);
                confirm();
              }}
              size="small"
              style={{ width: 90 }}
            >
              Reset
            </Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered: boolean) => (
        <FilterOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
      ),
      onFilter: (value, record) => {
        if (value === "new-requests") {
          return !record.lvnzyProjectId;
        }
        return true;
      },
      render: (lvnzyProjectId: string | undefined) => {
        if (!lvnzyProjectId) {
          return <Tag color="orange">Pending</Tag>;
        }
        const reportUrl = `https://brickfi.in/app/brick360/${lvnzyProjectId}`;
        return (
          <Typography.Link href={reportUrl} target="_blank">
            View Report
          </Typography.Link>
        );
      },
    },
    {
      title: "Request Date",
      dataIndex: "requestDate",
      key: "requestDate",
      width: 180,
      sorter: (a, b) =>
        new Date(a.requestDate).getTime() - new Date(b.requestDate).getTime(),
      defaultSortOrder: "descend",
      render: (requestDate: string) =>
        new Date(requestDate).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
    },
    {
      title: "User",
      key: "user",
      width: 300,
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Search by name or mobile"
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() => confirm()}
            style={{ marginBottom: 8, display: "block" }}
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
            <Button
              onClick={() => {
                clearFilters?.();
                setSelectedKeys([]);
                confirm();
              }}
              size="small"
              style={{ width: 90 }}
            >
              Reset
            </Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered: boolean) => (
        <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
      ),
      onFilter: (value, record) => {
        const searchTerm = String(value).toLowerCase();
        const nameMatch = record.userName.toLowerCase().includes(searchTerm);
        const mobileMatch = record.userMobile.includes(searchTerm);
        return nameMatch || mobileMatch;
      },
      render: (_, record) => (
        <Space>
          <Typography.Text>
            {record.userName}, {record.userCountryCode} {record.userMobile}
          </Typography.Text>
          <Typography.Text
            copyable={{
              text: record.userId,
              icon: <CopyOutlined />,
              tooltips: ["Copy User ID", "Copied!"],
            }}
          />
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

    return `Hi ${selectedUser?.profile.name?.split(" ")[0]}👋
As per your request, the Brick360 report for *${projectNames}* is ready.

Click below 👇 to login to your account & access the report:
https://brickfi.in/app

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
          <Typography.Title level={4}>Users Management</Typography.Title>
        </Col>
        <Col>
          <UserForm users={data || []} />
        </Col>
      </Row>

      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as "users" | "reports")}
      >
        <Tabs.TabPane tab="All Users" key="users">
          <Table
            dataSource={data}
            columns={columns}
            loading={isLoading}
            rowKey="_id"
            scroll={{ x: true }}
          />
        </Tabs.TabPane>

        <Tabs.TabPane tab="Requested Reports" key="reports">
          <Table
            dataSource={getFlattenedReports()}
            columns={reportsColumns}
            loading={isLoading}
            rowKey={(record) =>
              `${record.userId}-${record.projectName}-${record.requestDate}`
            }
            scroll={{ x: true }}
            pagination={{ pageSize: 10 }}
          />
        </Tabs.TabPane>
      </Tabs>

      {userToEdit && (
        <UserForm
          data={userToEdit}
          users={data || []}
          onClose={() => setUserToEdit(undefined)}
        />
      )}

      <Modal
        title="Send Report Notification (Email & WhatsApp)"
        open={isEmailModalOpen}
        onCancel={() => {
          setIsEmailModalOpen(false);
          setSelectedUser(undefined);
          setSelectedProjectIds([]);
        }}
        onOk={handleSendEmail}
        okText="Send Notification"
        okButtonProps={{
          disabled: selectedProjectIds.length === 0,
          loading: sendReportEmailMutation.isPending,
        }}
      >
        <div style={{ marginTop: 20 }}>
          <Typography.Text>
            Send report notification for selected projects to{" "}
            <strong>{selectedUser?.profile?.name || "user"}</strong>
          </Typography.Text>

          <Space
            direction="vertical"
            style={{ width: "100%", marginTop: 10, marginBottom: 10 }}
          >
            {selectedUser?.profile?.email && (
              <Tag icon={<MailOutlined />} color="blue">
                {selectedUser.profile.email}
              </Tag>
            )}
            {selectedUser?.mobile && (
              <Tag icon={<WhatsAppOutlined />} color="green">
                {selectedUser.countryCode} {selectedUser.mobile}
              </Tag>
            )}
            {!selectedUser?.profile?.email && !selectedUser?.mobile && (
              <Tag color="red">No contact information available</Tag>
            )}
          </Space>

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
                    <Typography.Link
                      href={`${import.meta.env.VITE_BRICKFI_APP_URL}${page}`}
                      target="_blank"
                    >
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
