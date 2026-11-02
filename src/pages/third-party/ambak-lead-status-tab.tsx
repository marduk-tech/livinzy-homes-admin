import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Flex,
  Form,
  InputNumber,
  Row,
  Skeleton,
  Table,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import type { ReactNode } from "react";
import { useState } from "react";
import { useAmbakLeadStatus } from "../../hooks/third-party-hooks";
import type { AmbakLeadStatus, AmbakVerificationResult } from "../../libs/api/ambak";
import { errorMessage } from "../../libs/api-error";
import { formatINR } from "./ambak-form-helpers";

type StatusUpdates = NonNullable<AmbakLeadStatus["status_updates"]>;

// Ambak sends UTC; dayjs shows local time, so an IST midnight date
// (e.g. 2026-03-16T18:30:00.000Z) reads as 17 Mar in India.
const formatDate = (iso?: string | null, withTime = false) =>
  iso ? dayjs(iso).format(withTime ? "DD MMM YYYY, h:mm A" : "DD MMM YYYY") : "-";

const text = (value?: string | number | boolean | null) =>
  value === undefined || value === null || value === "" ? "-" : String(value);

const VERIFIED = /^(verified|done|disbursed)$/i;
const statusTag = (value?: string | null) =>
  value ? <Tag color={VERIFIED.test(value) ? "green" : "default"}>{value}</Tag> : "-";

function Section({ title, extra, children }: { title: string; extra?: ReactNode; children: ReactNode }) {
  return (
    <Card size="small" title={title} extra={extra} style={{ height: "100%" }}>
      {children}
    </Card>
  );
}

function Details({ items }: { items: [string, ReactNode][] }) {
  return (
    <Descriptions column={1} size="small">
      {items.map(([label, value]) => (
        <Descriptions.Item key={label} label={label}>
          {value}
        </Descriptions.Item>
      ))}
    </Descriptions>
  );
}

const verificationItems = (v?: AmbakVerificationResult | null): [string, ReactNode][] => [
  ["Date", formatDate(v?.date)],
  ["Verification", statusTag(v?.verification_status)],
  ["Failure reason", text(v?.verification_failed_reason)],
];

function Disbursals({ tranches }: { tranches: StatusUpdates["disbursal"] }) {
  const rows = tranches ?? [];
  const total = rows.reduce((sum, t) => sum + (Number(t.disbursed_amount) || 0), 0);
  return (
    <Section
      title="Disbursal"
      extra={rows.length > 0 && <Typography.Text strong>Total {formatINR(total)}</Typography.Text>}
    >
      <Table
        size="small"
        pagination={false}
        rowKey="tranch_id"
        dataSource={rows}
        locale={{ emptyText: "Not disbursed yet" }}
        columns={[
          { title: "Tranche", dataIndex: "tranch_id" },
          { title: "Lender disbursal ID", dataIndex: "disbursed_id", render: text },
          { title: "Date", dataIndex: "disbursed_date", render: (d) => formatDate(d) },
          { title: "Amount", dataIndex: "disbursed_amount", align: "right", render: formatINR },
        ]}
      />
    </Section>
  );
}

function LeadJourney({ lead }: { lead: AmbakLeadStatus }) {
  const s = lead.status_updates;
  const stage = s?.stage_status;
  const closure = s?.lead_closure;
  const post = s?.post_disbursal_updates;
  const docs = lead.details_updates?.document_collection_status;
  const isClosed = !!(closure?.closure_type || closure?.lost_reason || closure?.new_lead_id);

  return (
    <Flex vertical gap={16}>
      <Card>
        <Flex wrap justify="space-between" gap={16}>
          <div>
            <Typography.Title level={4} style={{ margin: 0 }}>
              Lead #{lead.lead_id} {lead.loan_type && <Tag color="blue">{lead.loan_type}</Tag>}
            </Typography.Title>
            <Typography.Text type="secondary">
              Customer {text(lead.customer_id)} · Last updated {formatDate(lead.last_updated_at, true)}
            </Typography.Text>
          </div>
          <Flex wrap gap={8} align="center">
            {stage?.stage && <Tag color="geekblue">Stage: {stage.stage}</Tag>}
            {stage?.status && <Tag color="purple">Status: {stage.status}</Tag>}
            {stage?.sub_status && <Tag>{stage.sub_status}</Tag>}
          </Flex>
        </Flex>
        {stage?.remarks && (
          <Typography.Paragraph style={{ marginTop: 12, marginBottom: 0 }}>
            Remarks: {stage.remarks}
          </Typography.Paragraph>
        )}
      </Card>

      {isClosed && (
        <Alert
          type="warning"
          showIcon
          message={`Lead closed${closure?.closure_type ? `: ${closure.closure_type}` : ""}`}
          description={[
            closure?.lost_reason && `Lost reason: ${closure.lost_reason}`,
            closure?.new_lead_id && `Continues on lead #${closure.new_lead_id}`,
          ]
            .filter(Boolean)
            .join(" · ")}
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Section title="Login">
            <Details
              items={[
                ["Login ID", text(s?.login?.login_id)],
                ["Date", formatDate(s?.login?.login_date)],
                ["Amount", formatINR(s?.login?.login_amount)],
                ["Verification", statusTag(s?.verification?.status?.login_verification)],
                ["Failure reason", text(s?.verification?.reason?.login_verification)],
              ]}
            />
          </Section>
        </Col>
        <Col xs={24} md={8}>
          <Section title="Sanction">
            <Details
              items={[
                ["Sanction ID", text(s?.sanction?.sanction_id)],
                ["Date", formatDate(s?.sanction?.sanction_date)],
                ["Amount", formatINR(s?.sanction?.sanction_amount)],
                ["Verification", statusTag(s?.verification?.status?.sanction_verification)],
                ["Failure reason", text(s?.verification?.reason?.sanction_verification)],
              ]}
            />
          </Section>
        </Col>
        <Col xs={24} md={8}>
          <Section title="Payout">
            <Details
              items={[
                ["Amount", formatINR(post?.payout?.amount)],
                ["Status", statusTag(post?.payout?.status)],
                ["Paid on", formatDate(post?.payout?.date)],
                ["Expected", formatDate(post?.payout?.expected_date)],
              ]}
            />
          </Section>
        </Col>
      </Row>

      <Disbursals tranches={s?.disbursal ?? null} />

      <Section title="Underwriting">
        <Table
          size="small"
          pagination={false}
          rowKey={(_, i) => String(i)}
          dataSource={s?.underwriting_updates?.checklists ?? []}
          locale={{ emptyText: "No underwriting checklists yet" }}
          columns={[
            { title: "Checklist", dataIndex: "checklist_name", render: text },
            { title: "Status", dataIndex: "checklist_status", render: statusTag },
            {
              title: "Query",
              dataIndex: "query",
              render: (q: { query_type: string | null; raised_at: string | null } | null) =>
                q?.query_type ? `${q.query_type} (raised ${formatDate(q.raised_at)})` : "-",
            },
            { title: "Updated", dataIndex: "last_updated_at", render: (d) => formatDate(d, true) },
          ]}
        />
      </Section>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Section title="Encashment">
            <Details items={verificationItems(post?.encashment)} />
          </Section>
        </Col>
        <Col xs={24} md={12}>
          <Section title="PDD">
            <Details items={verificationItems(post?.pdd)} />
          </Section>
        </Col>
      </Row>

      <Section
        title="Documents"
        extra={
          <Typography.Text type="secondary">
            Employment: {text(lead.details_updates?.employment_type)} · DRE {docs?.dre_run ? "run" : "not run yet"}
          </Typography.Text>
        }
      >
        {!docs?.dre_run ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Document lists appear once Ambak runs DRE" />
        ) : (
          <Flex vertical gap={16}>
            <div>
              <Typography.Text strong>Required</Typography.Text>
              <Flex wrap gap={4} style={{ marginTop: 8 }}>
                {(docs.documents_required ?? []).length === 0
                  ? "-"
                  : docs.documents_required!.map((d, i) => (
                      <Tag key={`${d.document_id}-${i}`}>{text(d.document_name)}</Tag>
                    ))}
              </Flex>
            </div>
            <Table
              size="small"
              pagination={false}
              rowKey="id"
              dataSource={docs.documents_pending ?? []}
              locale={{ emptyText: "No pending documents" }}
              columns={[
                {
                  title: "Document",
                  render: (_, d) => [d.parent_name, d.child_name].filter(Boolean).join(" › ") || text(d.doc_id),
                },
                { title: "Status", dataIndex: "document_status", render: statusTag },
                { title: "Co-applicant", dataIndex: "coapplicant_id", render: (v) => (v ? "Yes" : "-") },
                { title: "Tranche", dataIndex: "tranche_id", render: text },
                { title: "Updated", dataIndex: "updated_date", render: (d) => formatDate(d, true) },
              ]}
            />
          </Flex>
        )}
      </Section>
    </Flex>
  );
}

export function AmbakLeadStatusTab() {
  const [leadId, setLeadId] = useState<number>();
  const status = useAmbakLeadStatus(leadId);
  const error = status.error ? errorMessage(status.error, "Unknown error") : null;

  return (
    <Flex vertical gap={16}>
      <Card>
        <Form layout="inline" onFinish={({ leadId: id }: { leadId: number }) => setLeadId(id)}>
          <Form.Item name="leadId" label="Ambak lead ID" rules={[{ required: true, message: "Enter a lead ID" }]}>
            <InputNumber min={1} precision={0} controls={false} style={{ width: 200 }} placeholder="e.g. 136322" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={status.isLoading}>
              Track
            </Button>
          </Form.Item>
          {status.data && (
            <Form.Item>
              <Button onClick={() => status.refetch()} loading={status.isRefetching}>
                Refresh
              </Button>
            </Form.Item>
          )}
        </Form>
      </Card>

      {!leadId ? (
        <Card>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Enter the lead ID returned by Create Lead" />
        </Card>
      ) : status.isLoading ? (
        <Card>
          <Skeleton active />
        </Card>
      ) : error ? (
        <Alert
          type="error"
          showIcon
          message={`Couldn't fetch lead #${leadId}`}
          description={
            /invalid partner id/i.test(error)
              ? `${error}. Ambak only returns leads tagged to our partner ID - check the lead was created from here.`
              : error
          }
        />
      ) : (
        status.data && <LeadJourney lead={status.data} />
      )}
    </Flex>
  );
}
