import { Descriptions, Drawer, Empty, Flex, Typography } from "antd";
import { ReactNode } from "react";
import { BrickfiOfferingTicket } from "../../types/brickfi-offering";

// A ticket's full data, as whatever its CTA's flow collected (see
// offerings/*-flow.tsx in brickfi-app) - rendered generically as field/value
// rows, so a new flow's fields show up here without changes

// visitDate / is_property_decided -> "Visit date" / "Is property decided"
const fieldLabel = (key: string) => {
  const words = key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim()
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

const isEmpty = (value: unknown) =>
  value === undefined ||
  value === null ||
  value === "" ||
  (Array.isArray(value) && value.length === 0) ||
  (typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value as object).length === 0);

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function FieldValue({ value }: { value: unknown }): ReactNode {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string" || typeof value === "number") {
    return (
      <Typography.Text style={{ whiteSpace: "pre-wrap" }}>{String(value)}</Typography.Text>
    );
  }
  if (Array.isArray(value)) {
    // a list of plain values reads as one line; a list of records as
    // numbered blocks
    if (value.every((v) => !isPlainObject(v) && !Array.isArray(v))) {
      return value.map((v) => (typeof v === "boolean" ? (v ? "Yes" : "No") : String(v))).join(", ");
    }
    return (
      <Flex vertical gap={8} style={{ width: "100%" }}>
        {value.map((item, i) => (
          <Flex key={i} vertical gap={4}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              #{i + 1}
            </Typography.Text>
            <FieldValue value={item} />
          </Flex>
        ))}
      </Flex>
    );
  }
  if (isPlainObject(value)) return <FieldList data={value} />;
  return String(value);
}

function FieldList({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data).filter(([, v]) => !isEmpty(v));
  if (!entries.length) return <Typography.Text type="secondary">—</Typography.Text>;
  return (
    <Descriptions
      bordered
      size="small"
      column={1}
      style={{ width: "100%" }}
      labelStyle={{ width: 180, verticalAlign: "top" }}
      items={entries.map(([key, value]) => ({
        key,
        label: fieldLabel(key),
        children: <FieldValue value={value} />,
      }))}
    />
  );
}

export function TicketDataDrawer({
  ticket,
  onClose,
}: {
  ticket: BrickfiOfferingTicket | null;
  onClose: () => void;
}) {
  const data = ticket?.data || {};
  return (
    <Drawer
      open={!!ticket}
      onClose={onClose}
      width={640}
      title={
        ticket
          ? `${ticket.ticketId} · ${ticket.offeringTitle || ticket.offeringKey}`
          : ""
      }
    >
      {ticket &&
        (Object.keys(data).length ? (
          <FieldList data={data} />
        ) : (
          <Empty description="No data collected for this request" />
        ))}
    </Drawer>
  );
}
