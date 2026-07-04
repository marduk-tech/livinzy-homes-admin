import {
  CalendarOutlined,
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  FilterOutlined,
  LineChartOutlined,
  MailOutlined,
  MessageOutlined,
  SearchOutlined,
  SendOutlined,
  SolutionOutlined,
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
  Tooltip,
  Typography,
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { useAuth0 } from "@auth0/auth0-react";
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
import { useNavigate } from "react-router-dom";
import { ColumnSearch } from "../common/column-search";
import { UserConversationsModal } from "./user-conversations-modal";
import { UserJourneyModal } from "./user-journey-modal";
import { UserForm } from "./user-form";
import { SetCallbackModal } from "./set-callback-modal";
import { COLORS } from "../../theme/colors";
import DynamicReactIcon from "../common/dynamic-react-icon";
import { ActionableLeads } from "./actionable-leads";

const { RangePicker } = DatePicker;
const { Search } = Input;

// Initialize dayjs plugins
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

export function UsersList() {
  const { user: authUser } = useAuth0();
  const [searchKeyword, setSearchKeyword] = useState<string>("");

  const { data, isLoading, isError } = useGetAllUsers({
    limit: 1000,
    sortBy: "updatedAt:desc",
    search: searchKeyword,
  });
  const { data: aggregatedReports, isLoading: isReportsLoading } =
    useGetAggregatedReports();
  const { data: leadsData, isLoading: isLeadsLoading } = useGetAllUsers({
    limit: 500,
    sortBy: "updatedAt:desc",
    status: "callback-request,active-lead,dropped-lead",
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
  const [activeTab, setActiveTab] = useState<"users" | "reports" | "leads" | "actionable-leads">(
    "users",
  );

  const [isLeadTrailModalOpen, setIsLeadTrailModalOpen] = useState(false);
  const [leadTrailUser, setLeadTrailUser] = useState<User | undefined>();
  const [newComment, setNewComment] = useState("");
  const [selectedOriginalDate, setSelectedOriginalDate] =
    useState<Dayjs | null>(null);

  const [conversationsUser, setConversationsUser] = useState<User | null>(null);
  const [isConversationsModalOpen, setIsConversationsModalOpen] =
    useState(false);
  const [journeyUser, setJourneyUser] = useState<User | null>(null);
  const [isJourneyModalOpen, setIsJourneyModalOpen] = useState(false);
  const [callbackUser, setCallbackUser] = useState<User | null>(null);
  const [isCallbackModalOpen, setIsCallbackModalOpen] = useState(false);

  const navigate = useNavigate();

  const [createdDateRange, setCreatedDateRange] = useState<
    [dayjs.Dayjs, dayjs.Dayjs] | null
  >(null);
  const [updatedDateRange, setUpdatedDateRange] = useState<
    [dayjs.Dayjs, dayjs.Dayjs] | null
  >(null);

  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<User[]>([]);
  const [filteredReports, setFilteredReports] = useState<AggregatedReportRow[]>([]);

  useEffect(() => {
    if (data) setFilteredUsers(data);
  }, [data]);

  useEffect(() => {
    if (leadsData) setFilteredLeads(leadsData);
  }, [leadsData]);

  useEffect(() => {
    if (aggregatedReports) setFilteredReports(aggregatedReports);
  }, [aggregatedReports]);

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
          {record.profile?.callbackCategory && (
            <Tag
              style={{
                backgroundColor: COLORS.bgColor,
                borderColor: COLORS.borderColor,
                color: COLORS.textColorDark,
              }}
            >
              {record.profile.callbackCategory}
            </Tag>
          )}
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
        }),
    },
    {
      title: "Mobile",
      key: "mobile",
      ...ColumnSearch("mobile"),
      render: (_, record) => `${record.countryCode} ${record.mobile}`,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      filters: [
        { text: "New Lead", value: "new-lead" },
        { text: "Callback Request", value: "callback-request" },
        { text: "Active Lead", value: "active-lead" },
        { text: "Dropped Lead", value: "dropped-lead" },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status: string) => status ? <Tag>{status}</Tag> : "-",
    },
    {
      title: "Source",
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
      title: "Medium",
      key: "utmMedium",
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Search UTM Medium"
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
        const utm =
          record.metrics?.utm?.[record.metrics.utm.length - 1]?.utm_medium;
        return utm
          ? utm.toLowerCase().includes(String(value).toLowerCase())
          : false;
      },
      render: (_, record) => {
        const mostRecentUtm =
          record.metrics?.utm?.[record.metrics.utm.length - 1];
        return mostRecentUtm?.utm_medium || "-";
      },
    },
    {
      title: "Campaign",
      key: "utmCampaign",
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Search UTM Campaign"
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
        const utm =
          record.metrics?.utm?.[record.metrics.utm.length - 1]?.utm_campaign;
        return utm
          ? utm.toLowerCase().includes(String(value).toLowerCase())
          : false;
      },
      render: (_, record) => {
        const mostRecentUtm =
          record.metrics?.utm?.[record.metrics.utm.length - 1];
        return mostRecentUtm?.utm_campaign || "-";
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
          <div style={{ marginBottom: 8 }}>
            <Checkbox
              checked={selectedKeys.includes("__empty__")}
              onChange={(e) => {
                setSelectedKeys(e.target.checked ? ["__empty__"] : []);
              }}
            >
              Has reports
            </Checkbox>
          </div>
          <Input
            placeholder="Search project name"
            value={selectedKeys.includes("__empty__") ? "" : selectedKeys[0]}
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
        if (value === "__empty__") {
          return !!record.requestedReports && record.requestedReports.length > 0;
        }
        if (!record.requestedReports || record.requestedReports.length === 0) {
          return false;
        }
        const searchTerm = String(value).toLowerCase();
        return record.requestedReports.some(
          (report) =>
            report && report.projectName.toLowerCase().includes(searchTerm),
        );
      },
      width: 300,
      render: (_, record) =>
        record.requestedReports && record.requestedReports.length > 0
          ? record.requestedReports
              .filter((r) => r && r.projectName)
              .map((r) => r.projectName)
              .join(", ")
          : "-",
    },
    {
      title: "Shared Reports",
      key: "sharedReports",
      width: 250,
      filters: [
        { text: "Reports shared", value: "non-empty" },
        { text: "Reports NOT shared", value: "empty" },
      ],
      onFilter: (value, record) => {
        const hasReports = !!record.savedLvnzyProjects?.[0]?.projects?.length;
        if (value === "non-empty") return hasReports;
        if (value === "empty") return !hasReports;
        return true;
      },
      filterIcon: (filtered: boolean) => (
        <FilterOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
      ),
      render: (_, record) => {
        const firstCollection = record.savedLvnzyProjects?.[0];
        if (!firstCollection?.projects?.length) return "-";
        const idToName = new Map<string, string>();
        lvnzyProjects?.forEach((p: any) => {
          idToName.set(p._id, p.meta?.projectName || "Unknown Project");
        });
        return firstCollection.projects
          .map((id) => idToName.get(id) || id)
          .join(", ");
      },
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
          <Button
            type="default"
            shape="default"
            title="View user journey"
            icon={<SolutionOutlined />}
            onClick={() => {
              setJourneyUser(record);
              setIsJourneyModalOpen(true);
            }}
          />
          <Button
            type="default"
            shape="default"
            title="Set preferred callback"
            icon={<CalendarOutlined />}
            onClick={() => {
              setCallbackUser(record);
              setIsCallbackModalOpen(true);
            }}
          />
        </Space>
      ),
    },
  ];

  const handleCSVExport = () => {
    const today = new Date().toISOString().split("T")[0];

    if (activeTab === "reports") {
      const dataToExport = aggregatedReports || [];
      if (dataToExport.length === 0) {
        notification.warning({ message: "No Data to Export", description: "There are no reports to export." });
        return;
      }
      const headers = ["Project Name", "RERA Number", "Brick360 Report ID", "Total Requests", "Latest Request", "All Request Dates"];
      const rows = dataToExport.map((row) => [
        row.projectName,
        row.reraNumber || "",
        row.lvnzyProjectId || "",
        String(row.totalRequests),
        formatDateForCSV(row.latestRequestDate),
        row.allRequestDates.map((d) => formatDateForCSV(d)).join("; "),
      ]);
      downloadCSV(convertToCSV(headers, rows), `reports-export-${today}.csv`);
      notification.success({ message: "Export Successful", description: `Exported ${dataToExport.length} report(s).` });
      return;
    }

    if (activeTab === "leads") {
      const dataToExport = leadsData || [];
      if (dataToExport.length === 0) {
        notification.warning({ message: "No Data to Export", description: "There are no leads to export." });
        return;
      }
      const headers = ["Name", "Mobile", "Status", "Preferred Callback", "Shared Reports", "Requested Reports", "Last Contact", "Date Updated"];
      const rows = dataToExport.map((user) => {
        const preferredCallback = user.profile?.preferredCallbackTimestamp
          ? new Date(user.profile.preferredCallbackTimestamp).toLocaleString()
          : user.profile?.preferredCallbackTime || "";
        const firstCollection = user.savedLvnzyProjects?.[0];
        const sharedReports = firstCollection?.projects?.length
          ? firstCollection.projects.map((id) => projectIdToNameMap.get(id) || id).join(", ")
          : "";
        const requestedReports = user.requestedReports?.length
          ? user.requestedReports.filter((r) => r?.projectName).map((r) => r.projectName).join(", ")
          : "";
        const comments = user.leadTrail?.comments;
        const lastContact = comments?.length
          ? formatDateForCSV(comments[comments.length - 1].dateOriginal || comments[comments.length - 1].dateAdded)
          : "";
        return [
          user.profile?.name || "",
          `${user.countryCode} ${user.mobile}`,
          user.status || "",
          preferredCallback,
          sharedReports,
          requestedReports,
          lastContact,
          formatDateForCSV(user.updatedAt),
        ];
      });
      downloadCSV(convertToCSV(headers, rows), `leads-export-${today}.csv`);
      notification.success({ message: "Export Successful", description: `Exported ${dataToExport.length} lead(s).` });
      return;
    }

    // activeTab === "users"
    const dataToExport = filteredUsers.length > 0 ? filteredUsers : data || [];
    if (dataToExport.length === 0) {
      notification.warning({ message: "No Data to Export", description: "There are no users to export." });
      return;
    }
    const headers = ["Name", "Created Date", "Last Updated", "Mobile", "Email", "Status", "UTM Source", "UTM Medium", "UTM Campaign", "Requested Reports", "Collections"];
    const rows = dataToExport.map((user) => {
      const mostRecentUtm = user.metrics?.utm?.[user.metrics.utm.length - 1];
      const requestedReports = user.requestedReports?.length
        ? user.requestedReports.filter((r) => r?.projectName).map((r) => r.projectName).join(", ")
        : "";
      const collections = user.savedLvnzyProjects?.length
        ? user.savedLvnzyProjects.map((c) => c.collectionName || "Unnamed").join(", ")
        : "";
      return [
        user.profile?.name || "",
        formatDateForCSV(user.createdAt),
        formatDateForCSV(user.updatedAt),
        `${user.countryCode} ${user.mobile}`,
        user.profile?.email || "",
        user.status || "",
        mostRecentUtm?.utm_source || "",
        mostRecentUtm?.utm_medium || "",
        mostRecentUtm?.utm_campaign || "",
        requestedReports,
        collections,
      ];
    });
    downloadCSV(convertToCSV(headers, rows), `users-export-${today}.csv`);
    notification.success({ message: "Export Successful", description: `Exported ${dataToExport.length} user(s).` });
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
      title: "Status",
      dataIndex: "status",
      key: "status",
      filters: [
        { text: "Callback Request", value: "callback-request" },
        { text: "Active Lead", value: "active-lead" },
        { text: "Dropped Lead", value: "dropped-lead" },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status: string) => {
        if (status === "dropped-lead") {
          return (
            <Tag
              style={{
                background: "#f0f0f0",
                color: "#888",
                borderColor: "#d9d9d9",
              }}
            >
              {status}
            </Tag>
          );
        }
        const color = status === "callback-request" ? "gold" : "green";
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: "Preferred Callback",
      key: "preferredCallback",
      defaultSortOrder: "descend",
      filters: [
        { text: "Has Callback Request", value: "non-empty" },
        { text: "No Callback Request", value: "empty" },
      ],
      onFilter: (value, record) => {
        const hasCallback = !!(
          record.profile?.preferredCallbackTimestamp ||
          record.profile?.preferredCallbackTime
        );
        if (value === "non-empty") return hasCallback;
        if (value === "empty") return !hasCallback;
        return true;
      },
      filterIcon: (filtered: boolean) => (
        <FilterOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
      ),
      sorter: (a, b) => {
        const getTimestamp = (record: any): number => {
          if (record.profile?.preferredCallbackTimestamp) {
            return new Date(record.profile.preferredCallbackTimestamp).getTime();
          }
          const value = record.profile?.preferredCallbackTime;
          if (!value) return -1;
          const splits = value.split(",");
          if (splits.length < 2) return -1;
          const t = new Date(splits[1].trim() + " 2026").getTime();
          return isNaN(t) ? -1 : t;
        };
        return getTimestamp(a) - getTimestamp(b);
      },
      render: (_, record) => {
        let label: string | undefined;
        if (record.profile?.preferredCallbackTimestamp) {
          const start = new Date(record.profile.preferredCallbackTimestamp);
          const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
          const day = start.getDate();
          const month = start.toLocaleString("en-US", { month: "short" });
          const fmt = (d: Date) => {
            const h = d.getHours();
            return `${h % 12 || 12}${h < 12 ? "am" : "pm"}`;
          };
          label = `${day} ${month}, ${fmt(start)} - ${fmt(end)}`;
        } else {
          const raw = record.profile?.preferredCallbackTime;
          if (raw) {
            const splits = raw.split(",");
            label = splits.length >= 2 ? splits.slice(1).join(",").trim() : raw;
          }
        }
        const category = record.profile?.callbackCategory;
        const intent = record.profile?.sourceIntent;
        const tooltipContent =
          category || intent ? (
            <div>
              {category && <div>Callback Category: {category}</div>}
              {intent && <div>Source: {intent}</div>}
            </div>
          ) : undefined;
        return (
          <Tooltip title={tooltipContent}>
                <Flex>
                <Tag
                  style={{
                    backgroundColor: COLORS.bgColor,
                    borderColor: COLORS.borderColor,
                    color: COLORS.textColorDark,
                    minWidth: "unset",
                  }}
                >{label}</Tag>
                </Flex>
             
          </Tooltip>
        );
      },
    },
    {
      title: "Shared Reports",
      key: "sharedReports",
      filters: [
        { text: "Reports shared", value: "non-empty" },
        { text: "Reports NOT shared", value: "empty" },
      ],
      onFilter: (value, record) => {
        const hasReports = !!record.savedLvnzyProjects?.[0]?.projects?.length;
        if (value === "non-empty") return hasReports;
        if (value === "empty") return !hasReports;
        return true;
      },
      filterIcon: (filtered: boolean) => (
        <FilterOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
      ),
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
      filters: [
        { text: "Has Requested Reports", value: "non-empty" },
        { text: "No Requested Reports", value: "empty" },
      ],
      onFilter: (value, record) => {
        const hasReports = !!record.requestedReports?.filter((r) => r?.projectName).length;
        if (value === "non-empty") return hasReports;
        if (value === "empty") return !hasReports;
        return true;
      },
      filterIcon: (filtered: boolean) => (
        <FilterOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
      ),
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
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Search comments"
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
      filterIcon: (filtered: boolean) => (
        <FilterOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
      ),
      onFilter: (value, record) => {
        const comments = record.leadTrail?.comments;
        if (!comments?.length) return false;
        const search = String(value).toLowerCase();
        return comments.some((c: any) =>
          c.comment?.toLowerCase().includes(search)
        );
      },
      render: (_, record) => {
        return (
          <Typography.Link
            onClick={() => {
              setLeadTrailUser(record);
              setIsLeadTrailModalOpen(true);
              setNewComment("");
            }}
          >
            {record.leadTrail?.comments && record.leadTrail?.comments.length ? (
              <DynamicReactIcon
                color={COLORS.textColorLight}
                iconName="MdOutlineInsertComment"
                iconSet="md"
              ></DynamicReactIcon>
            ) : (
              <DynamicReactIcon
                color={COLORS.textColorLight}
                iconName="MdAddComment"
                iconSet="md"
              ></DynamicReactIcon>
            )}
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
          const latest = comments[0];
          return new Date(latest.dateOriginal || latest.dateAdded).getTime();
        };
        return getLatestDate(aComments) - getLatestDate(bComments);
      },
      render: (_, record) => {
        const comments = record.leadTrail?.comments;
        if (!comments?.length) return "-";
        const latest = comments[comments.length - 1];
        return new Date(
          latest.dateOriginal || latest.dateAdded,
        ).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour12: false,
        });
      },
    },
    {
      title: "Date Updated",
      dataIndex: "updatedAt",
      key: "updatedAt",
      sorter: (a, b) =>
        new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
      render: (updatedAt: string) =>
        new Date(updatedAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
    },
    {
      title: "Actions",
      key: "actions",
      width: 140,
      render: (_, record) => (
        <Space>
          <Button
            type="default"
            icon={<EditOutlined />}
            title="Edit user"
            onClick={() => setUserToEdit(record)}
          />
          <Button
            type="default"
            title="View conversations"
            icon={
              <DynamicReactIcon
                iconName="IoMdChatbubbles"
                iconSet="io"
                size={16}
                color="#000"
              />
            }
            onClick={() => {
              setConversationsUser(record);
              setIsConversationsModalOpen(true);
            }}
          />
          <Button
            type="default"
            title="View user journey"
            icon={<SolutionOutlined />}
            onClick={() => {
              setJourneyUser(record);
              setIsJourneyModalOpen(true);
            }}
          />
          <Button
            type="default"
            title="Set preferred callback"
            icon={<CalendarOutlined />}
            onClick={() => {
              setCallbackUser(record);
              setIsCallbackModalOpen(true);
            }}
          />
        </Space>
      ),
    },
  ];

  const handleAddComment = () => {
    if (!leadTrailUser || !newComment.trim()) return;
    addLeadTrailCommentMutation.mutate(
      {
        userId: leadTrailUser._id,
        comment: newComment.trim(),
        dateOriginal: selectedOriginalDate?.toISOString(),
        addedBy: authUser?.email,
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
        onChange={(key) => setActiveTab(key as "users" | "reports" | "leads" | "actionable-leads")}
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
            style={{ width: 350, marginBottom: 8 }}
          />
          <Typography.Text type="secondary" style={{ display: "block", marginBottom: 8 }}>{filteredUsers.length}/{data?.length ?? 0} rows</Typography.Text>
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
          <Typography.Text type="secondary" style={{ display: "block", marginBottom: 8 }}>{filteredReports.length}/{aggregatedReports?.length ?? 0} rows</Typography.Text>
          <Table
            dataSource={aggregatedReports}
            columns={reportsColumns}
            loading={isReportsLoading}
            rowKey={(record) => record.projectId}
            scroll={{ x: true }}
            pagination={{ pageSize: 10 }}
            onChange={(pagination, filters, sorter, extra) => {
              setFilteredReports(extra.currentDataSource);
            }}
          />
        </Tabs.TabPane>

        <Tabs.TabPane tab="Leads" key="leads">
          <Typography.Text type="secondary" style={{ display: "block", marginBottom: 8 }}>{filteredLeads.length}/{leadsData?.length ?? 0} rows</Typography.Text>
          <Table
            dataSource={leadsData}
            columns={leadsColumns}
            loading={isLeadsLoading}
            rowKey="_id"
            scroll={{ x: true }}
            pagination={{ pageSize: 20 }}
            onChange={(pagination, filters, sorter, extra) => {
              setFilteredLeads(extra.currentDataSource);
            }}
          />
        </Tabs.TabPane>

        <Tabs.TabPane tab="Actionable Leads" key="actionable-leads">
          {activeTab === "actionable-leads" && <ActionableLeads />}
        </Tabs.TabPane>
      </Tabs>

      {userToEdit && (
        <UserForm
          data={userToEdit}
          users={data || []}
          onClose={() => setUserToEdit(undefined)}
        />
      )}

      <UserConversationsModal
        user={conversationsUser}
        open={isConversationsModalOpen}
        onClose={() => {
          setIsConversationsModalOpen(false);
          setConversationsUser(null);
        }}
      />

      <UserJourneyModal
        user={journeyUser}
        open={isJourneyModalOpen}
        onClose={() => {
          setIsJourneyModalOpen(false);
          setJourneyUser(null);
        }}
      />

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
                .sort(
                  (a, b) =>
                    new Date(b.dateOriginal || b.dateAdded).getTime() -
                    new Date(a.dateOriginal || a.dateAdded).getTime(),
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
                        <Typography.Text
                          type="secondary"
                          style={{ fontSize: 12 }}
                        >
                          {new Date(
                            c.dateOriginal || c.dateAdded,
                          ).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                          {c.addedBy && ` · ${c.addedBy}`}
                        </Typography.Text>
                      </div>
                      {c._id && Date.now() - new Date(c.dateAdded).getTime() <= 3 * 60 * 60 * 1000 && (
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

          <Flex
            vertical
            gap={12}
            align="flex-end"
            style={{
              padding: 8,
              backgroundColor: COLORS.bgColor,
              borderRadius: 8,
              border: `1px solid ${COLORS.borderColor}`,
            }}
          >
            <Input.TextArea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add comment..."
              rows={2}
            />
            <DatePicker
              value={selectedOriginalDate}
              onChange={(date) => setSelectedOriginalDate(date)}
              placeholder="Original date (required)"
              style={{ marginTop: 8, width: "100%" }}
            />

            <Button
              type="primary"
              onClick={handleAddComment}
              loading={addLeadTrailCommentMutation.isPending}
              disabled={!newComment.trim() || !selectedOriginalDate}
            >
              Add
            </Button>
          </Flex>
        </div>
      </Modal>

      <SetCallbackModal
        user={callbackUser}
        open={isCallbackModalOpen}
        onClose={() => {
          setIsCallbackModalOpen(false);
          setCallbackUser(null);
        }}
      />

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
