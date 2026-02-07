import {
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
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
  DatePicker,
  Divider,
  Flex,
  Input,
  Modal,
  notification,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  TableColumnType,
  Tabs,
  Tag,
  Typography,
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { useEffect, useState } from "react";
import { useGetAllLvnzyProjects } from "../../hooks/lvnzyprojects-hooks";
import {
  useAddLeadTrailCommentMutation,
  useDeleteLeadTrailCommentMutation,
  useGetAggregatedReports,
  useGetAllUsers,
  useSendReportEmailMutation,
} from "../../hooks/user-hooks";
import { convertToCSV, downloadCSV, formatDateForCSV } from "../../libs/utils";
import { AggregatedReportRow, User } from "../../types/user";
import { ColumnSearch } from "../common/column-search";
import { UserForm } from "./user-form";

const { RangePicker } = DatePicker;
const { Search } = Input;

// Initialize dayjs plugins
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

export function UsersList() {
  const [searchKeyword, setSearchKeyword] = useState<string>("");

  const { data, isLoading, isError } = useGetAllUsers({
    limit: 100,
    sortBy: "createdAt:desc",
    search: searchKeyword,
  });
  const { data: aggregatedReports, isLoading: isReportsLoading } =
    useGetAggregatedReports();
  const { data: leadsData, isLoading: isLeadsLoading } = useGetAllUsers({
    limit: 500,
    sortBy: "createdAt:desc",
    status: "callback-request,active-lead",
  });
  const { data: lvnzyProjects } = useGetAllLvnzyProjects();
  const sendReportEmailMutation = useSendReportEmailMutation();
  const addLeadTrailCommentMutation = useAddLeadTrailCommentMutation();
  const deleteLeadTrailCommentMutation = useDeleteLeadTrailCommentMutation();

  const [userToEdit, setUserToEdit] = useState<User | undefined>();
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  const [isUtmModalOpen, setIsUtmModalOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState<User | undefined>();
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"users" | "reports" | "leads">(
    "users",
  );

  const [isLeadTrailModalOpen, setIsLeadTrailModalOpen] = useState(false);
  const [leadTrailUser, setLeadTrailUser] = useState<User | undefined>();
  const [newComment, setNewComment] = useState("");
  const [selectedOriginalDate, setSelectedOriginalDate] = useState<Dayjs | null>(null);

  const [createdDateRange, setCreatedDateRange] = useState<
    [dayjs.Dayjs, dayjs.Dayjs] | null
  >(null);
  const [updatedDateRange, setUpdatedDateRange] = useState<
    [dayjs.Dayjs, dayjs.Dayjs] | null
  >(null);

  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

  useEffect(() => {
    if (data) {
      setFilteredUsers(data);
    }
  }, [data]);

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
        },
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
      filterDropdown: ({ confirm, clearFilters, setSelectedKeys }) => (
        <div style={{ padding: 8 }}>
          <RangePicker
            value={createdDateRange}
            onChange={(dates) => {
              setCreatedDateRange(dates as [Dayjs, Dayjs] | null);
              setSelectedKeys(dates && dates.length === 2 ? ["filtered"] : []);
            }}
            style={{ marginBottom: 8, display: "block", width: "100%" }}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => confirm()}
              size="small"
              style={{ width: 90 }}
            >
              Filter
            </Button>
            <Button
              onClick={() => {
                clearFilters?.();
                setCreatedDateRange(null);
                setSelectedKeys([]);
              }}
              size="small"
              style={{ width: 90 }}
            >
              Reset
            </Button>
          </Space>
        </div>
      ),
      onFilter: (_, record) => {
        if (!createdDateRange || createdDateRange.length !== 2) return true;
        const recordDate = dayjs(record.createdAt);
        return (
          recordDate.isSameOrAfter(createdDateRange[0], "day") &&
          recordDate.isSameOrBefore(createdDateRange[1], "day")
        );
      },
      filterIcon: (filtered: boolean) => (
        <FilterOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
      ),
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
      filterDropdown: ({ confirm, clearFilters, setSelectedKeys }) => (
        <div style={{ padding: 8 }}>
          <RangePicker
            value={updatedDateRange}
            onChange={(dates) => {
              setUpdatedDateRange(dates as [Dayjs, Dayjs] | null);
              setSelectedKeys(dates && dates.length === 2 ? ["filtered"] : []);
            }}
            style={{ marginBottom: 8, display: "block", width: "100%" }}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => confirm()}
              size="small"
              style={{ width: 90 }}
            >
              Filter
            </Button>
            <Button
              onClick={() => {
                clearFilters?.();
                setUpdatedDateRange(null);
                setSelectedKeys([]);
              }}
              size="small"
              style={{ width: 90 }}
            >
              Reset
            </Button>
          </Space>
        </div>
      ),
      onFilter: (value, record) => {
        if (!updatedDateRange || updatedDateRange.length !== 2) return true;
        const recordDate = dayjs(record.updatedAt);
        return (
          recordDate.isSameOrAfter(updatedDateRange[0], "day") &&
          recordDate.isSameOrBefore(updatedDateRange[1], "day")
        );
      },
      filterIcon: (filtered: boolean) => (
        <FilterOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
      ),
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
        return record.requestedReports.some(
          (report) =>
            report && report.projectName.toLowerCase().includes(searchTerm),
        );
      },
      render: (_, record) =>
        record.requestedReports && record.requestedReports.length > 0
          ? record.requestedReports
              .filter((r) => r && r.projectName)
              .map((r) => r.projectName)
              .join(", ")
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
            disabled={!record.profile?.email && !record.mobile}
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

  const handleCSVExport = () => {
    // Use filtered data if available, otherwise use all data
    const dataToExport = filteredUsers.length > 0 ? filteredUsers : data || [];

    if (dataToExport.length === 0) {
      notification.warning({
        message: "No Data to Export",
        description: "There are no users to export.",
      });
      return;
    }

    // Create a map of project IDs to project names
    const projectIdToNameMap = new Map<string, string>();
    lvnzyProjects?.forEach((project: any) => {
      projectIdToNameMap.set(
        project._id,
        project.meta?.projectName || "Unknown Project",
      );
    });

    const headers = [
      "Name",
      "Created Date",
      "Last Updated",
      "Mobile",
      "Email",
      "UTM Source",
      "UTM Campaign",
      "UTM Medium",
      "Requested Reports",
      "Shared Reports",
    ];

    const rows = dataToExport.map((user) => {
      const mostRecentUtm = user.metrics?.utm?.[user.metrics.utm.length - 1];

      // Get requested reports as comma-separated string
      const requestedReports =
        user.requestedReports && user.requestedReports.length > 0
          ? user.requestedReports
              .filter((r) => r && r.projectName)
              .map((r) => r.projectName)
              .join(", ")
          : "";

      // Get shared reports from first collection
      const firstCollection = user.savedLvnzyProjects?.[0];
      const sharedReports =
        firstCollection?.projects && firstCollection.projects.length > 0
          ? firstCollection.projects
              .map(
                (projectId) => projectIdToNameMap.get(projectId) || projectId,
              )
              .join(", ")
          : "";

      return [
        user.profile?.name || "",
        formatDateForCSV(user.createdAt),
        formatDateForCSV(user.updatedAt),
        `${user.countryCode} ${user.mobile}`,
        user.profile?.email || "",
        mostRecentUtm?.utm_source || "",
        mostRecentUtm?.utm_campaign || "",
        mostRecentUtm?.utm_medium || "",
        requestedReports,
        sharedReports,
      ];
    });

    const csvContent = convertToCSV(headers, rows);

    const today = new Date().toISOString().split("T")[0];
    const filename = `users-export-${today}.csv`;

    downloadCSV(csvContent, filename);

    notification.success({
      message: "Export Successful",
      description: `Exported ${dataToExport.length} user(s) to ${filename}`,
    });
  };

  const reportsColumns: TableColumnType<AggregatedReportRow>[] = [
    {
      title: "Project Name",
      dataIndex: "projectName",
      key: "projectName",
      ...ColumnSearch("projectName"),
      width: 250,
    },
    {
      title: "Project ID",
      key: "projectId",
      width: 300,
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => (
        <div style={{ padding: 8 }}>
          <Checkbox
            checked={selectedKeys.includes("new-requests")}
            onChange={(e) => {
              const keys = selectedKeys.filter((k) => k !== "new-requests");
              setSelectedKeys(
                e.target.checked ? [...keys, "new-requests"] : keys,
              );
            }}
          >
            New Requests (No Report Link)
          </Checkbox>
          <Divider style={{ margin: "8px 0" }} />
          <Checkbox
            checked={selectedKeys.includes("has-rera")}
            onChange={(e) => {
              const keys = selectedKeys.filter((k) => k !== "has-rera");
              setSelectedKeys(e.target.checked ? [...keys, "has-rera"] : keys);
            }}
          >
            Has RERA Number
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
          return !record.hasLvnzyProjectId;
        }
        if (value === "has-rera") {
          return record.hasReraNumber;
        }
        return true;
      },
      render: (_, record) => {
        const items = [];

        if (record.reraNumber) {
          items.push(
            <Typography.Text key="rera" copyable={{ text: record.reraNumber }}>
              RERA: {record.reraNumber}
            </Typography.Text>,
          );
        }

        if (record.lvnzyProjectId) {
          const reportUrl = `https://brickfi.in/app/brick360/${record.lvnzyProjectId}`;
          items.push(
            <Typography.Link key="link" href={reportUrl} target="_blank">
              View Report
            </Typography.Link>,
          );
        } else {
          items.push(
            <Tag key="pending" color="orange">
              Pending
            </Tag>,
          );
        }

        return (
          <Space direction="vertical" size="small">
            {items}
          </Space>
        );
      },
    },
    {
      title: "Total Requests",
      dataIndex: "totalRequests",
      key: "totalRequests",
      width: 150,
      align: "center",
      sorter: (a, b) => a.totalRequests - b.totalRequests,
      render: (count: number) => (
        <Tag color={count > 1 ? "blue" : "default"}>
          {count} {count === 1 ? "request" : "requests"}
        </Tag>
      ),
    },
    {
      title: "Latest Request",
      dataIndex: "latestRequestDate",
      key: "latestRequestDate",
      width: 200,
      sorter: (a, b) =>
        new Date(a.latestRequestDate).getTime() -
        new Date(b.latestRequestDate).getTime(),
      defaultSortOrder: "descend",
      render: (date: string, record) => {
        const formatted = new Date(date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });

        if (record.totalRequests > 1) {
          const allDatesFormatted = record.allRequestDates
            .map((d) =>
              new Date(d).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              }),
            )
            .join("\n");

          return (
            <Typography.Text
              title={`All request dates:\n${allDatesFormatted}`}
              style={{ cursor: "help" }}
            >
              {formatted}
              <Typography.Text
                type="secondary"
                style={{ fontSize: 12, marginLeft: 4 }}
              >
                (+{record.totalRequests - 1} more)
              </Typography.Text>
            </Typography.Text>
          );
        }

        return formatted;
      },
    },
  ];

  const projectIdToNameMap = new Map<string, string>();
  lvnzyProjects?.forEach((project: any) => {
    projectIdToNameMap.set(
      project._id,
      project.meta?.projectName || "Unknown Project",
    );
  });

  const leadsColumns: TableColumnType<User>[] = [
    {
      title: "Name",
      dataIndex: ["profile", "name"],
      key: "name",
      ...ColumnSearch(["profile", "name"]),
      render: (_: string, record) => record.profile?.name || "-",
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
      render: (_, record) => record.profile?.email || "-",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      filters: [
        { text: "Callback Request", value: "callback-request" },
        { text: "Active Lead", value: "active-lead" },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status: string) => {
        const color = status === "callback-request" ? "gold" : "green";
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: "Shared Reports",
      key: "sharedReports",
      render: (_, record) => {
        const firstCollection = record.savedLvnzyProjects?.[0];
        if (!firstCollection?.projects?.length) return "-";
        return firstCollection.projects
          .map((id) => projectIdToNameMap.get(id) || id)
          .join(", ");
      },
    },
    {
      title: "Requested Reports",
      key: "requestedReports",
      render: (_, record) =>
        record.requestedReports?.length
          ? record.requestedReports
              .filter((r) => r?.projectName)
              .map((r) => r.projectName)
              .join(", ")
          : "-",
    },
    {
      title: "Lead Trail",
      key: "leadTrail",
      render: (_, record) => {
        const comments = record.leadTrail?.comments;
        const latest = comments?.length ? comments[comments.length - 1] : null;
        return (
          <Typography.Link
            onClick={() => {
              setLeadTrailUser(record);
              setIsLeadTrailModalOpen(true);
              setNewComment("");
            }}
          >
            {latest
              ? latest.comment.length > 30
                ? `${latest.comment.substring(0, 30)}...`
                : latest.comment
              : "Add comment"}
          </Typography.Link>
        );
      },
    },
    {
      title: "Last Contact",
      key: "lastContact",
      sorter: (a, b) => {
        const aComments = a.leadTrail?.comments;
        const bComments = b.leadTrail?.comments;
        const getLatestDate = (comments: typeof aComments) => {
          if (!comments?.length) return 0;
          const latest = comments[comments.length - 1];
          return new Date(latest.dateOriginal || latest.dateAdded).getTime();
        };
        return getLatestDate(aComments) - getLatestDate(bComments);
      },
      render: (_, record) => {
        const comments = record.leadTrail?.comments;
        if (!comments?.length) return "-";
        const latest = comments[comments.length - 1];
        return new Date(latest.dateOriginal || latest.dateAdded).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
      },
    },
    {
      title: "Date Added",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      defaultSortOrder: "descend",
      render: (createdAt: string) =>
        new Date(createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
    },
  ];

  const handleAddComment = () => {
    if (!leadTrailUser || !newComment.trim()) return;
    addLeadTrailCommentMutation.mutate(
      {
        userId: leadTrailUser._id,
        comment: newComment.trim(),
        dateOriginal: selectedOriginalDate?.toISOString(),
      },
      {
        onSuccess: (updatedUser) => {
          setLeadTrailUser(updatedUser);
          setNewComment("");
          setSelectedOriginalDate(null);
        },
      },
    );
  };

  function getMsgText() {
    const projects = lvnzyProjects?.filter((p: any) =>
      selectedProjectIds.includes(p._id),
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
          <Space>
            <Button
              type="default"
              icon={<DownloadOutlined />}
              onClick={handleCSVExport}
            >
              CSV Export
            </Button>
            <UserForm users={data || []} />
          </Space>
        </Col>
      </Row>

      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as "users" | "reports" | "leads")}
      >
        <Tabs.TabPane tab="All Users" key="users">
          <Search
            loading={isLoading}
            placeholder="Search by name, mobile, email or project"
            allowClear
            onChange={(e) => {
              if (e.target.value === "") setSearchKeyword("");
            }}
            onSearch={(value: string) => setSearchKeyword(value)}
            enterButton="Search"
            style={{ width: 350, marginBottom: 16 }}
          />
          <Table
            dataSource={data}
            columns={columns}
            loading={isLoading}
            rowKey="_id"
            scroll={{ x: true }}
            onChange={(pagination, filters, sorter, extra) => {
              setFilteredUsers(extra.currentDataSource);
            }}
          />
        </Tabs.TabPane>

        <Tabs.TabPane tab="Requested Reports" key="reports">
          <Table
            dataSource={aggregatedReports}
            columns={reportsColumns}
            loading={isReportsLoading}
            rowKey={(record) => record.projectId}
            scroll={{ x: true }}
            pagination={{ pageSize: 10 }}
          />
        </Tabs.TabPane>

        <Tabs.TabPane tab="Leads" key="leads">
          <Table
            dataSource={leadsData}
            columns={leadsColumns}
            loading={isLeadsLoading}
            rowKey="_id"
            scroll={{ x: true }}
            pagination={{ pageSize: 20 }}
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
        title={`Lead Trail - ${leadTrailUser?.profile?.name || "User"}`}
        open={isLeadTrailModalOpen}
        onCancel={() => {
          setIsLeadTrailModalOpen(false);
          setLeadTrailUser(undefined);
          setNewComment("");
          setSelectedOriginalDate(null);
        }}
        footer={null}
        width={600}
      >
        <div style={{ marginTop: 16 }}>
          <div
            style={{
              maxHeight: 300,
              overflowY: "auto",
              marginBottom: 16,
            }}
          >
            {leadTrailUser?.leadTrail?.comments?.length ? (
              [...leadTrailUser.leadTrail.comments]
                .sort((a, b) =>
                  new Date(b.dateOriginal || b.dateAdded).getTime() -
                  new Date(a.dateOriginal || a.dateAdded).getTime()
                )
                .map((c, idx) => (
                <div
                  key={c._id || idx}
                  style={{
                    padding: "8px 12px",
                    marginBottom: 8,
                    background: "#f5f5f5",
                    borderRadius: 6,
                  }}
                >
                  <Flex justify="space-between" align="start">
                    <div>
                      <Typography.Text>{c.comment}</Typography.Text>
                      <br />
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {new Date(c.dateOriginal || c.dateAdded).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </Typography.Text>
                    </div>
                    {c._id && (
                      <Popconfirm
                        title="Delete this comment?"
                        onConfirm={() => {
                          deleteLeadTrailCommentMutation.mutate(
                            { userId: leadTrailUser._id, commentId: c._id! },
                            {
                              onSuccess: (updatedUser) => {
                                setLeadTrailUser(updatedUser);
                              },
                            },
                          );
                        }}
                        okText="Yes"
                        cancelText="No"
                      >
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                        />
                      </Popconfirm>
                    )}
                  </Flex>
                </div>
              ))
            ) : (
              <Typography.Text type="secondary">
                No comments yet
              </Typography.Text>
            )}
          </div>

          <Flex gap={8} align="end">
            <div style={{ flex: 1 }}>
              <Input.TextArea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                rows={2}
              />
              <DatePicker
                value={selectedOriginalDate}
                onChange={(date) => setSelectedOriginalDate(date)}
                placeholder="Backdate (optional)"
                style={{ marginTop: 8, width: "100%" }}
              />
            </div>
            <Button
              type="primary"
              icon={<MessageOutlined />}
              onClick={handleAddComment}
              loading={addLeadTrailCommentMutation.isPending}
              disabled={!newComment.trim()}
            >
              Add
            </Button>
          </Flex>
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
