import { Descriptions, Flex, Table, Tag, Typography } from "antd";

// Renders a task's evidence: the known shapes (query lists, affected URLs,
// buyer questions, gate result) as tables / lists, anything else as JSON.

const pct = (v?: number) => (v == null ? "-" : `${(v * 100).toFixed(1)}%`);
const num = (v?: number) => (v == null ? "-" : Math.round(v).toLocaleString("en-IN"));

function QueryTable({ rows, title }: { rows: any[]; title: string }) {
  return (
    <div>
      <Typography.Text strong>{title}</Typography.Text>
      <Table
        size="small"
        rowKey="query"
        pagination={false}
        dataSource={rows}
        columns={[
          { title: "Query", dataIndex: "query" },
          { title: "Impr.", dataIndex: "impressions", render: num, width: 80 },
          { title: "Clicks", dataIndex: "clicks", render: num, width: 70 },
          { title: "CTR", dataIndex: "ctr", render: pct, width: 70 },
          { title: "Pos.", dataIndex: "position", render: (v) => v?.toFixed?.(1), width: 60 },
        ]}
      />
    </div>
  );
}

const KNOWN = [
  "topQueries",
  "nearPageOneQueries",
  "urls",
  "exampleQuestions",
  "gate",
  "pages",
  "sharedQueries",
  "also",
  "checks",
];

export function SeoEvidence({ evidence }: { evidence: any }) {
  if (!evidence) return null;
  const scalars = Object.entries(evidence).filter(
    ([k, v]) => !KNOWN.includes(k) && v != null && typeof v !== "object"
  );
  return (
    <Flex vertical gap={12}>
      {scalars.length > 0 && (
        <Descriptions size="small" column={{ xs: 1, md: 3 }} bordered>
          {scalars.map(([k, v]) => (
            <Descriptions.Item key={k} label={k}>
              {k.toLowerCase().includes("ctr") && typeof v === "number" ? pct(v) : String(v)}
            </Descriptions.Item>
          ))}
        </Descriptions>
      )}
      {evidence.nearPageOneQueries?.length > 0 && (
        <QueryTable rows={evidence.nearPageOneQueries} title="Queries on page 2 (position 8-20)" />
      )}
      {evidence.topQueries?.length > 0 && <QueryTable rows={evidence.topQueries} title="Top queries (28 days)" />}
      {evidence.urls?.length > 0 && (
        <div>
          <Typography.Text strong>Affected URLs</Typography.Text>
          <Table
            size="small"
            rowKey="url"
            pagination={{ pageSize: 10, hideOnSinglePage: true }}
            dataSource={evidence.urls}
            columns={[
              { title: "URL", dataIndex: "url", render: (u) => <a href={u} target="_blank" rel="noreferrer">{u}</a> },
              { title: "Expected", dataIndex: "expected", width: 160 },
              { title: "Actual", dataIndex: "actual" },
            ]}
          />
        </div>
      )}
      {evidence.exampleQuestions?.length > 0 && (
        <div>
          <Typography.Text strong>Buyer questions</Typography.Text>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {evidence.exampleQuestions.map((q: string, i: number) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </div>
      )}
      {evidence.pages?.length > 0 && (
        <div>
          <Typography.Text strong>Overlapping pages</Typography.Text>
          <Table
            size="small"
            rowKey="url"
            pagination={false}
            dataSource={evidence.pages}
            columns={[
              { title: "URL", dataIndex: "url" },
              { title: "Clicks", dataIndex: "clicks", render: num },
              { title: "Impr.", dataIndex: "impressions", render: num },
            ]}
          />
          {evidence.sharedQueries?.length > 0 && (
            <Flex wrap="wrap" gap={4} style={{ marginTop: 6 }}>
              {evidence.sharedQueries.map((q: string) => (
                <Tag key={q}>{q}</Tag>
              ))}
            </Flex>
          )}
        </div>
      )}
      {evidence.gate && (
        <Descriptions size="small" column={1} bordered title="Gate for new content">
          {evidence.gate.existingPage && (
            <Descriptions.Item label="Existing page">{evidence.gate.existingPage}</Descriptions.Item>
          )}
          {evidence.gate.format && <Descriptions.Item label="Format">{evidence.gate.format}</Descriptions.Item>}
          <Descriptions.Item label="Commercial next step">
            {evidence.gate.commercialTarget || <Typography.Text type="warning">none - priority lowered</Typography.Text>}
          </Descriptions.Item>
          <Descriptions.Item label="Brickfi data to use">
            {evidence.gate.brickfiData?.length
              ? evidence.gate.brickfiData.map((m: any) => `${m.name} (${m.path})`).join(", ")
              : <Typography.Text type="warning">none found - priority lowered</Typography.Text>}
          </Descriptions.Item>
        </Descriptions>
      )}
      {evidence.checks && (
        <Descriptions size="small" column={1} bordered title="Indexing checks">
          <Descriptions.Item label="Result">
            {evidence.checks.passed ? <Tag color="green">passed</Tag> : <Tag color="red">failed</Tag>} status {evidence.checks.status}
          </Descriptions.Item>
          {(evidence.checks.checks || []).map((c: any, i: number) => (
            <Descriptions.Item key={i} label={c.cause}>
              expected {c.expected}, found {c.actual}
            </Descriptions.Item>
          ))}
        </Descriptions>
      )}
      {evidence.also?.length > 0 && (
        <div>
          <Typography.Text strong>Also triggered by</Typography.Text>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {evidence.also.map((a: any, i: number) => (
              <li key={i}>{a.title}</li>
            ))}
          </ul>
        </div>
      )}
    </Flex>
  );
}
