import axios from "axios";
import { Button, Modal, Space, Spin, Table, TableColumnType, Tag, Tooltip, Typography } from "antd";
import { useEffect, useState } from "react";
import { FileTextOutlined } from "@ant-design/icons";
import { COLORS } from "../../theme/colors";

const POSTHOG_HOST = "https://us.posthog.com";
const POSTHOG_PROJECT_ID = import.meta.env.VITE_POSTHOG_PROJECT_ID;
const POSTHOG_API_KEY = import.meta.env.VITE_POSTHOG_API_KEY;

interface JourneyRow {
  userid: string;
  name: string;
  mobile: string;
  time: string;
  action: string;
  details: string;
  status: string;
  callbackTime: string;
}

interface DetailRow {
  time: string;
  text: string;
}

interface AggregatedLead {
  userid: string;
  name: string;
  mobile: string;
  status: string;
  callbackTime: string;
  actions: { action: string; count: number }[];
  latestActionDate: string;
  projects: string[];
  detailsRows: DetailRow[];
}

function extractProjects(rows: JourneyRow[]): string[] {
  const projects = new Set<string>();
  rows.forEach((row) => {
    if (row.details) {
      const match = String(row.details).match(/Project:\s*(.+)/);
      if (match) projects.add(match[1].trim());
    }
  });
  return Array.from(projects);
}

function aggregateLeads(rows: JourneyRow[]): AggregatedLead[] {
  const byUser = new Map<string, JourneyRow[]>();
  rows.forEach((row) => {
    const existing = byUser.get(row.userid) || [];
    existing.push(row);
    byUser.set(row.userid, existing);
  });

  const leads: AggregatedLead[] = [];

  byUser.forEach((userRows, userid) => {
    const sorted360 = userRows
      .filter((r) => r.action?.startsWith("360:"))
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    if (sorted360.length === 0) return;

    const allSortedDesc = [...userRows].sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
    );

    const detailsRows: DetailRow[] = allSortedDesc.map((r) => ({
      time: r.time,
      text: r.details && r.details !== "–" ? `${r.action} — ${r.details}` : r.action,
    }));

    const firstRow = userRows[0];
    const status = userRows.find((r) => r.status)?.status || "";
    const callbackTime = userRows.find((r) => r.callbackTime)?.callbackTime || "";
    leads.push({
      userid,
      name: firstRow.name || userid,
      mobile: firstRow.mobile || "-",
      status,
      callbackTime,
      actions: (() => {
        const countMap = new Map<string, number>();
        sorted360.forEach((r) => countMap.set(r.action, (countMap.get(r.action) || 0) + 1));
        return Array.from(countMap.entries())
          .slice(0, 10)
          .map(([action, count]) => ({ action, count }));
      })(),
      latestActionDate: sorted360[0].time,
      projects: extractProjects(userRows),
      detailsRows,
    });
  });

  leads.sort(
    (a, b) =>
      new Date(b.latestActionDate).getTime() - new Date(a.latestActionDate).getTime(),
  );

  return leads;
}

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

function renderLineWithLinks(line: string): React.ReactNode {
  const parts = line.split(URL_REGEX);
  return parts.map((part, i) => {
    if (URL_REGEX.test(part)) {
      URL_REGEX.lastIndex = 0;
      const display = part.replace(/^https?:\/\//, "").split("?")[0];
      return (
        <Tooltip key={i} title={part}>
          <Typography.Link href={part} target="_blank" style={{ fontSize: 13 }}>
            {display}
          </Typography.Link>
        </Tooltip>
      );
    }
    return part;
  });
}

export function ActionableLeads() {
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<AggregatedLead[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [detailsUser, setDetailsUser] = useState<AggregatedLead | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const query = {
      kind: "HogQLQuery",
      query: `SELECT * FROM user_journey_2w ORDER BY time DESC LIMIT 1000`,
    };

    axios
      .post(
        `${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/query/`,
        { query },
        {
          headers: {
            Authorization: `Bearer ${POSTHOG_API_KEY}`,
            "Content-Type": "application/json",
          },
        },
      )
      .then((response) => {
        const columns: string[] = response.data.columns || [];
        const results: any[][] = response.data.results || [];
        const mapped: JourneyRow[] = results.map((row) => {
          const obj: Record<string, any> = {};
          columns.forEach((col, j) => {
            obj[col] = row[j];
          });
          return obj as JourneyRow;
        });
        setLeads(aggregateLeads(mapped));
      })
      .catch((err) => {
        setError(err.response?.data?.detail || err.message || "Failed to fetch data");
      })
      .finally(() => setLoading(false));
  }, []);

  const columns: TableColumnType<AggregatedLead>[] = [
    {
      title: "Name/ ID",
      dataIndex: "name",
      key: "name",
      render: (val: string) => val || "-",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      filters: [
        { text: "Callback Request", value: "callback-request" },
        { text: "Active Lead", value: "active-lead" },
        { text: "Dropped Lead", value: "dropped-lead" },
        { text: "New Lead", value: "new-lead" },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status: string, record: AggregatedLead) => {
        if (!status) return "-";

        let callbackLabel: string | undefined;
        if (record.callbackTime) {
          const d = new Date(record.callbackTime);
          if (!isNaN(d.getTime())) {
            callbackLabel = d.toLocaleDateString("en-US", {
              weekday: "long",
              day: "numeric",
              month: "long",
            });
          }
        }

        const tag =
          status === "dropped-lead" ? (
            <Tag style={{ background: "#f0f0f0", color: "#888", borderColor: "#d9d9d9" }}>
              {status}
            </Tag>
          ) : (
            <Tag
              color={
                status === "callback-request"
                  ? "gold"
                  : status === "active-lead"
                  ? "green"
                  : undefined
              }
            >
              {status}
            </Tag>
          );

        return callbackLabel ? (
          <Tooltip title={callbackLabel}>{tag}</Tooltip>
        ) : (
          tag
        );
      },
    },
    {
      title: "Mobile",
      dataIndex: "mobile",
      key: "mobile",
      render: (val: string) => val || "-",
    },
    {
      title: "Actions",
      dataIndex: "actions",
      key: "actions",
      width: 420,
      render: (actions: { action: string; count: number }[]) => (
        <Space wrap size={[4, 4]}>
          {actions.map((a, idx) => (
            <Tag
              key={idx}
              style={{
                backgroundColor: COLORS.bgColor,
                borderColor: COLORS.borderColorDark,
                color: COLORS.textColorDark,
                fontSize: 11,
              }}
            >
              {a.action.replace(/^360:\s*/, "")}
              {a.count > 1 && (
                <Typography.Text
                  style={{ fontSize: 11, marginLeft: 4, color: COLORS.textColorLight }}
                >
                  ×{a.count}
                </Typography.Text>
              )}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: "Latest Action",
      dataIndex: "latestActionDate",
      key: "latestActionDate",
      defaultSortOrder: "descend",
      sorter: (a, b) =>
        new Date(a.latestActionDate).getTime() - new Date(b.latestActionDate).getTime(),
      render: (val: string) =>
        val
          ? new Date(val).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })
          : "-",
    },
    {
      title: "Projects",
      dataIndex: "projects",
      key: "projects",
      render: (projects: string[]) =>
        projects.length > 0 ? (
          <Space wrap size={[4, 4]}>
            {projects.map((p) => (
              <Tag key={p} color="blue" style={{ fontSize: 11 }}>
                {p}
              </Tag>
            ))}
          </Space>
        ) : (
          "-"
        ),
    },
    {
      title: "Details",
      key: "details",
      width: 80,
      align: "center",
      render: (_: any, record: AggregatedLead) => (
        <Button
          type="text"
          icon={<FileTextOutlined style={{ color: COLORS.textColorLight }} />}
          onClick={() => setDetailsUser(record)}
          title="View full journey details"
        />
      ),
    },
  ];

  if (error) return <Typography.Text type="danger">{error}</Typography.Text>;

  return (
    <>
      {loading ? (
        <Spin style={{ display: "block", margin: "40px auto" }} />
      ) : (
        <Table
          dataSource={leads}
          columns={columns}
          rowKey="userid"
          scroll={{ x: true }}
          pagination={{ pageSize: 20 }}
          size="small"
        />
      )}

      <Modal
        title={
          detailsUser
            ? `Journey Details — ${detailsUser.name || detailsUser.userid}`
            : "Journey Details"
        }
        open={!!detailsUser}
        onCancel={() => setDetailsUser(null)}
        footer={null}
        width={800}
      >
        <Table
          dataSource={detailsUser?.detailsRows ?? []}
          rowKey={(_, i) => String(i)}
          size="small"
          pagination={false}
          scroll={{ y: 480 }}
          columns={[
            {
              title: "Timestamp",
              dataIndex: "time",
              key: "time",
              width: 160,
              render: (val: string) =>
                new Date(val).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                }),
            },
            {
              title: "Details",
              dataIndex: "text",
              key: "text",
              render: (val: string) => renderLineWithLinks(val),
            },
          ]}
        />
      </Modal>
    </>
  );
}
