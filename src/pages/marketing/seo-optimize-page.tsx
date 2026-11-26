import { PlusOutlined } from "@ant-design/icons";
import { Alert, Badge, Button, Card, Col, Flex, Form, Input, Modal, Row, Statistic, Tabs, Typography } from "antd";
import { useState } from "react";
import {
  SeoHealthTab,
  SeoPagesTab,
  SeoPlaybookTab,
  SeoQuestionsTab,
  SeoSettingsTab,
  SeoTaskList,
} from "../../components/marketing/seo/seo-tabs";
import { useAddSeoIdea, useSeoSummary } from "../../hooks/seo-hooks";
import { SeoMetric } from "../../types/seo";

// Marketing > SEO Optimize - the weekly SEO workflow: triage the Inbox,
// publish drafts that passed QA, check results. How it works and the
// weekly checklist: livinzy-homes-services/src/api/services/seo/README.md

function MetricCard({ title, metric, tooltip }: { title: string; metric?: SeoMetric; tooltip?: string }) {
  const value = metric?.value ?? 0;
  const prev = metric?.previous ?? 0;
  const change = prev ? Math.round(((value - prev) / prev) * 100) : null;
  return (
    <Card size="small" title={undefined}>
      <Statistic
        title={<span title={tooltip}>{title}</span>}
        value={value}
        formatter={(v) => Number(v).toLocaleString("en-IN")}
        suffix={
          change != null && (
            <Typography.Text type={change >= 0 ? "success" : "danger"} style={{ fontSize: 13 }}>
              {change >= 0 ? "+" : ""}
              {change}% vs last week
            </Typography.Text>
          )
        }
      />
    </Card>
  );
}

function AddIdeaButton() {
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const addIdea = useAddSeoIdea();
  return (
    <>
      <Button icon={<PlusOutlined />} onClick={() => setOpen(true)}>
        Add idea
      </Button>
      <Modal
        title="Add an idea"
        open={open}
        okText="Add to Inbox"
        okButtonProps={{ loading: addIdea.isPending }}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
      >
        <Typography.Paragraph type="secondary">
          From a sales call, callback notes or market knowledge. It goes through the same checks as every new-content
          task - if a page already covers it, it becomes a Refresh of that page.
        </Typography.Paragraph>
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) =>
            addIdea.mutate(values, {
              onSuccess: () => {
                form.resetFields();
                setOpen(false);
              },
            })
          }
        >
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input placeholder='e.g. "Is Whitefield or Sarjapur better for families?"' />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="url" label="Reference URL (optional)">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export function SeoOptimizePage() {
  const { data: summary } = useSeoSummary();
  const missing = Object.entries(summary?.integrations || {})
    .filter(([, ok]) => !ok)
    .map(([k]) => k);

  const tabs = [
    { key: "inbox", label: <Badge count={summary?.tasks.inbox} offset={[10, -2]} size="small">Inbox</Badge>, children: <SeoTaskList group="inbox" /> },
    { key: "in_progress", label: <Badge count={summary?.tasks.inProgress} offset={[10, -2]} size="small" color="cyan">In progress</Badge>, children: <SeoTaskList group="in_progress" /> },
    { key: "ready", label: <Badge count={summary?.tasks.ready} offset={[10, -2]} size="small" color="green">Ready to publish</Badge>, children: <SeoTaskList group="ready" /> },
    { key: "measuring", label: "Measuring", children: <SeoTaskList group="measuring" /> },
    { key: "health", label: "Health", children: <SeoHealthTab /> },
    { key: "questions", label: "Questions", children: <SeoQuestionsTab /> },
    { key: "pages", label: "Pages", children: <SeoPagesTab /> },
    { key: "playbook", label: "Playbook", children: <SeoPlaybookTab /> },
    { key: "closed", label: "Closed", children: <SeoTaskList group="closed" /> },
    { key: "settings", label: "Settings", children: <SeoSettingsTab /> },
  ];

  return (
    <Flex vertical gap={12}>
      <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
        <Typography.Text type="secondary">
          {summary ? `Data for the week of ${summary.weekOf}` : "Loading…"}
        </Typography.Text>
        <AddIdeaButton />
      </Flex>
      {missing.length > 0 && (
        <Alert
          type="warning"
          showIcon
          message={`Not configured: ${missing.join(", ")}`}
          description="The jobs skip whatever needs these - see Settings › Integrations and the services README for the env vars."
        />
      )}
      <Row gutter={12}>
        <Col xs={12} md={6}>
          <MetricCard title="Clicks (28 days)" metric={summary?.metrics.clicks} tooltip="Search Console, www + blog" />
        </Col>
        <Col xs={12} md={6}>
          <MetricCard title="Impressions (28 days)" metric={summary?.metrics.impressions} />
        </Col>
        <Col xs={12} md={6}>
          <MetricCard title="Organic leads (7 days)" metric={summary?.metrics.organicLeads} tooltip="PostHog conversions from organic search sessions" />
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic
              title="Health"
              value={summary?.health.failingChecks ?? 0}
              suffix={
                <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                  failing checks · {summary?.health.unindexedPages ?? 0} not indexed
                </Typography.Text>
              }
              valueStyle={{ color: summary?.health.failingChecks ? "#cf1322" : undefined }}
            />
          </Card>
        </Col>
      </Row>
      <Tabs defaultActiveKey="inbox" items={tabs} />
    </Flex>
  );
}
