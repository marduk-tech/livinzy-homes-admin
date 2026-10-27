import {
  Empty,
  Flex,
  Input,
  Table,
  TableColumnType,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { useGetBrickfiOfferingTickets } from "../../hooks/brickfi-offering-hooks";
import { errorMessage } from "../../libs/api-error";
import {
  BrickfiOfferingTicket,
  BrickfiOfferingTicketStatus,
} from "../../types/brickfi-offering";
import { ThreadIdLink } from "../traces/thread-id-link";

const { Search } = Input;

const STATUS_COLORS: Record<BrickfiOfferingTicketStatus, string> = {
  open: "orange",
  "in-progress": "blue",
  closed: "default",
};

const STATUSES: BrickfiOfferingTicketStatus[] = ["open", "in-progress", "closed"];

const PROPERTY_STAGE_LABELS: Record<string, string> = {
  "under-construction": "Under construction",
  resale: "Resale",
};

const formatDate = (date?: string) =>
  // @ant-design/pro-chat sets dayjs's global locale to zh-cn, so pin English
  date ? dayjs(date).locale("en").format("DD MMM YYYY, hh:mm A") : "";

type TicketContact = { name?: string; mobile?: string; countryCode?: string };

const formatMobile = (mobile?: string, countryCode?: string) =>
  mobile ? `+${countryCode || "91"} ${mobile}` : "";

// The number to call back on: the one the flow collected (a guest types it
// in), else the signed-in user's own
const contactOf = (ticket: BrickfiOfferingTicket) => {
  const fromData = (ticket.data?.contact || {}) as TicketContact;
  return {
    name: ticket.user?.name || fromData.name,
    mobile: formatMobile(
      fromData.mobile || ticket.user?.mobile,
      fromData.countryCode || ticket.user?.countryCode,
    ),
    email: ticket.user?.email,
  };
};

// data keys shown as their own lines/tags below - everything else falls
// through to a generic "key: value" line, so a new flow's fields still show
const KNOWN_DATA_KEYS = new Set([
  "propertyStage",
  "query",
  "details",
  "services",
  "askExpertToContact",
  "callbackOnly",
  "scheduleVisit",
  "projects",
  "visitDate",
  "consentToContact",
  "contact",
]);

const prettyKey = (key: string) =>
  key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

// What the user asked for, from whatever the CTA's flow collected (see
// offering-flows.tsx in brickfi-app)
function TicketRequest({ data }: { data: Record<string, unknown> }) {
  const projects = (data.projects as { projectName?: string }[]) || [];
  const tags = [
    data.askExpertToContact || data.callbackOnly ? "Expert callback" : null,
    data.scheduleVisit ? "Site visit" : null,
  ].filter(Boolean) as string[];
  const otherEntries = Object.entries(data).filter(
    ([key, value]) =>
      !KNOWN_DATA_KEYS.has(key) && value !== undefined && value !== null,
  );

  return (
    <Flex vertical gap={4} style={{ maxWidth: 420 }}>
      {tags.length > 0 && (
        <Flex gap={4} wrap>
          {tags.map((t) => (
            <Tag key={t} color="purple" bordered={false}>
              {t}
            </Tag>
          ))}
        </Flex>
      )}
      {typeof data.propertyStage === "string" && (
        <Typography.Text>
          <Typography.Text type="secondary">Property: </Typography.Text>
          {PROPERTY_STAGE_LABELS[data.propertyStage] || data.propertyStage}
        </Typography.Text>
      )}
      {data.scheduleVisit === true && (
        <Typography.Text>
          <Typography.Text type="secondary">Visit: </Typography.Text>
          {projects.map((p) => p.projectName).filter(Boolean).join(", ") ||
            "no project picked"}
          {typeof data.visitDate === "string" &&
            ` on ${dayjs(data.visitDate).locale("en").format("DD MMM YYYY")}`}
        </Typography.Text>
      )}
      {Array.isArray(data.services) && data.services.length > 0 && (
        <Typography.Text>
          <Typography.Text type="secondary">Services: </Typography.Text>
          {data.services.join(", ")}
        </Typography.Text>
      )}
      {typeof data.query === "string" && data.query && (
        <Typography.Paragraph
          style={{ marginBottom: 0, whiteSpace: "pre-wrap" }}
          ellipsis={{ rows: 3, expandable: true, symbol: "more" }}
        >
          <Typography.Text type="secondary">Query: </Typography.Text>
          {data.query}
        </Typography.Paragraph>
      )}
      {typeof data.details === "string" && data.details && (
        <Typography.Paragraph
          style={{ marginBottom: 0, whiteSpace: "pre-wrap" }}
          ellipsis={{ rows: 3, expandable: true, symbol: "more" }}
        >
          <Typography.Text type="secondary">Details: </Typography.Text>
          {data.details}
        </Typography.Paragraph>
      )}
      {otherEntries.map(([key, value]) => (
        <Typography.Text key={key}>
          <Typography.Text type="secondary">{prettyKey(key)}: </Typography.Text>
          {typeof value === "string" ? value : JSON.stringify(value)}
        </Typography.Text>
      ))}
    </Flex>
  );
}

const matchesSearch = (ticket: BrickfiOfferingTicket, keyword: string) => {
  if (!keyword) return true;
  const contact = contactOf(ticket);
  const haystack = [
    ticket.ticketId,
    ticket.threadId,
    ticket.offeringTitle,
    ticket.ctaLabel,
    contact.name,
    contact.mobile,
    contact.email,
    JSON.stringify(ticket.data || {}),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(keyword.toLowerCase());
};

// Requests users raised from Brickfi offerings in brickchat (legal assist,
// site visits, callbacks ...) - one row per ticket, newest first
export function OfferingTickets() {
  const { data, isLoading, isError, error } = useGetBrickfiOfferingTickets();
  const [searchKeyword, setSearchKeyword] = useState("");
  const [shownCount, setShownCount] = useState<number | null>(null);

  const tickets = useMemo(
    () => (data || []).filter((t) => matchesSearch(t, searchKeyword)),
    [data, searchKeyword],
  );

  const offeringFilters = useMemo(() => {
    const titles = new Map<string, string>();
    (data || []).forEach((t) =>
      titles.set(t.offeringKey, t.offeringTitle || t.offeringKey),
    );
    return [...titles].map(([value, text]) => ({ text, value }));
  }, [data]);

  if (isError) {
    return <Empty description={errorMessage(error, "Failed to fetch tickets")} />;
  }

  const columns: TableColumnType<BrickfiOfferingTicket>[] = [
    {
      title: "Ticket",
      dataIndex: "ticketId",
      key: "ticketId",
      width: 130,
      render: (ticketId: string) => (
        <Typography.Text copyable strong>
          {ticketId}
        </Typography.Text>
      ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      defaultSortOrder: "descend",
      sorter: (a, b) => dayjs(a.createdAt).diff(dayjs(b.createdAt)),
      render: (date: string) => (
        <Typography.Text type="secondary">{formatDate(date)}</Typography.Text>
      ),
    },
    {
      title: "Contact",
      key: "contact",
      width: 220,
      render: (_, ticket) => {
        const contact = contactOf(ticket);
        return (
          <Flex vertical>
            <Flex gap={4} align="center">
              <Typography.Text strong>{contact.name || "No name"}</Typography.Text>
              {!ticket.user && (
                <Tag bordered={false} style={{ marginInlineEnd: 0 }}>
                  guest
                </Tag>
              )}
            </Flex>
            {contact.mobile && (
              <Typography.Text copyable={{ text: contact.mobile.replace(/\s/g, "") }}>
                {contact.mobile}
              </Typography.Text>
            )}
            {contact.email && (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {contact.email}
              </Typography.Text>
            )}
          </Flex>
        );
      },
    },
    {
      title: "Offering",
      key: "offering",
      width: 220,
      filters: offeringFilters,
      onFilter: (value, ticket) => ticket.offeringKey === value,
      render: (_, ticket) => (
        <Flex vertical gap={2}>
          <Typography.Text>{ticket.offeringTitle || ticket.offeringKey}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {ticket.ctaLabel || ticket.ctaId}
          </Typography.Text>
        </Flex>
      ),
    },
    {
      title: "Request",
      key: "request",
      render: (_, ticket) => <TicketRequest data={ticket.data || {}} />,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      filters: STATUSES.map((s) => ({ text: s, value: s })),
      onFilter: (value, ticket) => ticket.status === value,
      render: (status: BrickfiOfferingTicketStatus) => (
        <Tag color={STATUS_COLORS[status]}>{status}</Tag>
      ),
    },
    {
      title: "Thread",
      dataIndex: "threadId",
      key: "threadId",
      width: 90,
      render: (threadId: string) => <ThreadIdLink threadId={threadId} />,
    },
  ];

  return (
    <>
      <Search
        loading={isLoading}
        placeholder="Search by ticket, name, mobile, email or request"
        allowClear
        onChange={(e) => {
          if (e.target.value === "") {
            setSearchKeyword("");
            setShownCount(null);
          }
        }}
        onSearch={(value: string) => {
          setSearchKeyword(value.trim());
          // the table's column filters re-apply on the new rows, and report
          // their count again on the next filter change
          setShownCount(null);
        }}
        enterButton="Search"
        style={{ width: 400, marginBottom: 8 }}
      />
      <Typography.Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
        {shownCount ?? tickets.length}/{data?.length ?? 0} tickets
      </Typography.Text>
      <Table
        dataSource={tickets}
        columns={columns}
        loading={isLoading}
        rowKey="_id"
        scroll={{ x: true }}
        pagination={{ pageSize: 20 }}
        onChange={(_, __, ___, extra) => setShownCount(extra.currentDataSource.length)}
      />
    </>
  );
}
