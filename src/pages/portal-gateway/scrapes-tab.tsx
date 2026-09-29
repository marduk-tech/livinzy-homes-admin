import { Alert, Button, Flex, Popconfirm, Select, Table, Tag, Tooltip, Typography } from "antd";
import { useState } from "react";
import { useClearScrapeCache, usePortalIds, usePortalScrapes } from "../../hooks/portal-gateway-hooks";
import type { ScrapeLogRow } from "../../libs/api/portal-gateway";
import { errorMessage } from "../../libs/api-error";

const STATUS_COLOR: Record<string, string> = {
  ok: "green",
  blocked: "red",
  no_identity: "orange",
  error: "volcano",
  disabled: "default",
  unsupported: "default",
};

export function ScrapesTab() {
  const [portal, setPortal] = useState<string>();
  const [status, setStatus] = useState<string>();
  const { data, isLoading, error } = usePortalScrapes({ limit: 300, portal, status });
  const clearCache = useClearScrapeCache();
  const portalIds = usePortalIds();

  if (error) return <Alert type="error" showIcon message={errorMessage(error, "Could not load scrapes")} />;

  return (
    <Flex vertical gap={12}>
      <Flex justify="space-between" wrap gap={8}>
        <Flex gap={8}>
          <Select
            allowClear
            placeholder="Portal"
            style={{ width: 160 }}
            value={portal}
            onChange={setPortal}
            options={portalIds.map((p) => ({ value: p, label: p }))}
          />
          <Select
            allowClear
            placeholder="Status"
            style={{ width: 160 }}
            value={status}
            onChange={setStatus}
            options={Object.keys(STATUS_COLOR).map((s) => ({ value: s, label: s }))}
          />
        </Flex>
        <Popconfirm title="Clear the whole scrape cache?" onConfirm={() => clearCache.mutate(undefined)}>
          <Button>Clear cache</Button>
        </Popconfirm>
      </Flex>

      <Table<ScrapeLogRow>
        size="small"
        rowKey="id"
        loading={isLoading}
        dataSource={data ?? []}
        pagination={{ pageSize: 50, hideOnSinglePage: true }}
        columns={[
          { title: "When", dataIndex: "at", width: 170, render: (v: string) => new Date(v).toLocaleString() },
          {
            title: "Status",
            dataIndex: "status",
            width: 130,
            render: (s: string, r) => (
              <Flex gap={4}>
                <Tag color={STATUS_COLOR[s] ?? "default"}>{s}</Tag>
                {r.cached && <Tag color="cyan">cached</Tag>}
              </Flex>
            ),
          },
          { title: "Portal", dataIndex: "portal", width: 100 },
          { title: "Kind", dataIndex: "kind", width: 90 },
          {
            title: "URL",
            dataIndex: "url",
            ellipsis: true,
            render: (u: string) => (
              <Typography.Link href={u} target="_blank" rel="noreferrer">
                {u}
              </Typography.Link>
            ),
          },
          { title: "Identity", dataIndex: "identity", width: 130, render: (v: string | null) => v ?? "—" },
          { title: "Time", dataIndex: "ms", width: 80, render: (v: number) => `${(v / 1000).toFixed(1)}s` },
          {
            title: "Error",
            dataIndex: "error",
            ellipsis: true,
            render: (e: string | null) =>
              e ? (
                <Tooltip title={e}>
                  <Typography.Text type="danger">{e}</Typography.Text>
                </Tooltip>
              ) : (
                "—"
              ),
          },
        ]}
      />
    </Flex>
  );
}
