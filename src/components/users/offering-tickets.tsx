import {
  Button,
  Empty,
  Flex,
  Input,
  Modal,
  Select,
  Table,
  TableColumnType,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import {
  useGetBrickfiOfferingTickets,
  useUpdateBrickfiOfferingTicketMutation,
} from "../../hooks/brickfi-offering-hooks";
import { errorMessage } from "../../libs/api-error";
import {
  BrickfiOfferingTicket,
  BrickfiOfferingTicketStatus,
} from "../../types/brickfi-offering";
import { ThreadIdLink } from "../traces/thread-id-link";
import { TicketDataDrawer } from "./ticket-data-drawer";

const { Search } = Input;

const STATUS_COLORS: Record<BrickfiOfferingTicketStatus, string> = {
  open: "orange",
  "in-progress": "blue",
  closed: "default",
};

const STATUSES: BrickfiOfferingTicketStatus[] = ["open", "in-progress", "closed"];

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

// What the user asked for - the query their CTA's flow collected (see
// offerings/*-flow.tsx in brickfi-app). The cell opens everything the flow
// collected (TicketDataDrawer), so the full query is read there.
function TicketRequest({ data }: { data: Record<string, unknown> }) {
  const hasQuery = typeof data.query === "string" && !!data.query.trim();
  return (
    <Flex vertical gap={2}>
      {hasQuery ? (
        <Typography.Paragraph
          style={{ marginBottom: 0, whiteSpace: "pre-wrap", maxWidth: 420 }}
          ellipsis={{ rows: 3 }}
        >
          {data.query as string}
        </Typography.Paragraph>
      ) : (
        <Typography.Text type="secondary">—</Typography.Text>
      )}
      <Typography.Link style={{ fontSize: 12 }}>View all details</Typography.Link>
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
  const updateTicket = useUpdateBrickfiOfferingTicketMutation();
  const [searchKeyword, setSearchKeyword] = useState("");
  const [shownCount, setShownCount] = useState<number | null>(null);
  // by ticketId, so the modal shows the refetched replies after sending
  const [replyTicketId, setReplyTicketId] = useState<string | null>(null);
  const setReplyTicket = (ticket: BrickfiOfferingTicket) =>
    setReplyTicketId(ticket.ticketId);
  const replyTicket =
    (data || []).find((t) => t.ticketId === replyTicketId) || null;
  // the ticket whose full collected data is open (TicketDataDrawer)
  const [dataTicket, setDataTicket] = useState<BrickfiOfferingTicket | null>(null);

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
      onCell: (ticket) => ({
        onClick: () => setDataTicket(ticket),
        style: { cursor: "pointer" },
      }),
      render: (_, ticket) => <TicketRequest data={ticket.data || {}} />,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 150,
      filters: STATUSES.map((s) => ({ text: s, value: s })),
      onFilter: (value, ticket) => ticket.status === value,
      render: (status: BrickfiOfferingTicketStatus, ticket) => (
        <Select<BrickfiOfferingTicketStatus>
          value={status}
          size="small"
          style={{ width: 130 }}
          loading={
            updateTicket.isPending &&
            updateTicket.variables?.ticketId === ticket.ticketId &&
            !!updateTicket.variables?.update.status
          }
          onChange={(next) =>
            updateTicket.mutate({
              ticketId: ticket.ticketId,
              update: { status: next },
            })
          }
          options={STATUSES.map((s) => ({
            value: s,
            label: <Tag color={STATUS_COLORS[s]} bordered={false}>{s}</Tag>,
          }))}
        />
      ),
    },
    {
      title: "Reply",
      key: "reply",
      width: 110,
      render: (_, ticket) => {
        const count = ticket.replies?.length || 0;
        return (
          <Button size="small" onClick={() => setReplyTicket(ticket)}>
            {count ? `Reply (${count})` : "Reply"}
          </Button>
        );
      },
    },
    {
      title: "Thread",
      dataIndex: "threadId",
      key: "threadId",
      width: 90,
      render: (threadId?: string) =>
        threadId ? <ThreadIdLink threadId={threadId} /> : "No thread",
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
      <TicketReplyModal
        ticket={replyTicket}
        sending={updateTicket.isPending && !!updateTicket.variables?.update.reply}
        onSend={(reply) =>
          replyTicket &&
          updateTicket.mutateAsync({
            ticketId: replyTicket.ticketId,
            update: { reply },
          })
        }
        onClose={() => setReplyTicketId(null)}
      />
      <TicketDataDrawer ticket={dataTicket} onClose={() => setDataTicket(null)} />
    </>
  );
}

// Earlier replies, and a box for a new one - each is posted to the user's
// brickchat thread as it's sent, as written
function TicketReplyModal({
  ticket,
  sending,
  onSend,
  onClose,
}: {
  ticket: BrickfiOfferingTicket | null;
  sending: boolean;
  onSend: (reply: string) => Promise<unknown> | null;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const replies = ticket?.replies || [];

  const send = async () => {
    const reply = text.trim();
    if (!reply) return;
    try {
      await onSend(reply);
      setText("");
    } catch (_) {
      // the mutation's onError already showed it - keep the text to retry
    }
  };

  return (
    <Modal
      open={!!ticket}
      onCancel={() => !sending && onClose()}
      afterClose={() => setText("")}
      title={
        ticket ? `Reply · ${ticket.ticketId} · ${ticket.offeringTitle || ticket.offeringKey}` : ""
      }
      okText={ticket?.status === "closed" ? "Send reply" : "Save reply"}
      onOk={send}
      okButtonProps={{ disabled: !text.trim(), loading: sending }}
      cancelButtonProps={{ disabled: sending }}
      width={560}
    >
      {ticket && (
        <Flex vertical gap={12}>
          {typeof ticket.data?.query === "string" && ticket.data.query && (
            <Typography.Paragraph
              style={{ marginBottom: 0, whiteSpace: "pre-wrap" }}
              ellipsis={{ rows: 3, expandable: true, symbol: "more" }}
            >
              <Typography.Text type="secondary">Query: </Typography.Text>
              {ticket.data.query}
            </Typography.Paragraph>
          )}
          {replies.length > 0 && (
            <Flex vertical gap={8}>
              {replies.map((r) => (
                <Flex
                  key={r._id}
                  vertical
                  gap={2}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    background: "rgba(0, 0, 0, 0.03)",
                  }}
                >
                  <Typography.Text style={{ whiteSpace: "pre-wrap" }}>
                    {r.text}
                  </Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {formatDate(r.createdAt)} ·{" "}
                    {r.notified ? "posted to chat" : "not posted yet"}
                  </Typography.Text>
                </Flex>
              ))}
            </Flex>
          )}
          <Input.TextArea
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoSize={{ minRows: 3, maxRows: 8 }}
            maxLength={2000}
            showCount
            placeholder="Write a reply to the user"
            disabled={sending}
          />
        </Flex>
      )}
    </Modal>
  );
}
