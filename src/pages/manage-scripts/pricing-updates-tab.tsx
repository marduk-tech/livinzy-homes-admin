import { CopyOutlined, ReloadOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Flex,
  Input,
  Modal,
  Table,
  TableColumnType,
  Tag,
  Typography,
} from "antd";
import { useMemo, useState } from "react";
import ReactJson from "react-json-view";
import { useGetPriceCheckRuns } from "../../hooks/project-hooks";
import { PriceCheckRun } from "../../libs/api/projects";

const OPERATION_TAG: Record<string, { color: string; label: string }> = {
  projectUpdated: { color: "green", label: "Project updated" },
  flagRaised: { color: "orange", label: "Flag raised" },
  none: { color: "default", label: "No change" },
};

interface PricingUpdatesTabProps {
  // opens the run on the Runs tab
  onOpenRun: (runId: string) => void;
}

// Every price check a script-server pricing run wrote (thirdPartyInfo.
// priceChecks entries with a runId), newest first
export function PricingUpdatesTab({ onOpenRun }: PricingUpdatesTabProps) {
  const { data, isLoading, isFetching, error, refetch } =
    useGetPriceCheckRuns();
  const [search, setSearch] = useState("");
  const [perSiteRow, setPerSiteRow] = useState<PriceCheckRun | null>(null);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data || [];
    return (data || []).filter(
      (r) =>
        r.projectName?.toLowerCase().includes(q) ||
        r.projectId.toLowerCase().includes(q) ||
        r.runId.toLowerCase().includes(q),
    );
  }, [data, search]);

  const columns: TableColumnType<PriceCheckRun>[] = [
    {
      title: "Project",
      dataIndex: "projectName",
      sorter: (a, b) => (a.projectName || "").localeCompare(b.projectName || ""),
      render: (name: string | undefined, record) => (
        <Flex gap={4} align="center">
          <Typography.Link
            href={`/projects/${record.projectId}/edit`}
            target="_blank"
          >
            {name || "(unnamed)"}
          </Typography.Link>
          <Typography.Text
            copyable={{
              text: record.projectId,
              icon: <CopyOutlined />,
              tooltips: ["Copy project ID", "Copied"],
            }}
          />
        </Flex>
      ),
    },
    {
      title: "Pricing Run ID",
      dataIndex: "runId",
      width: 160,
      render: (runId: string) => (
        <Flex gap={4} align="center">
          <Typography.Link
            style={{ fontFamily: "monospace", fontSize: 12 }}
            onClick={() => onOpenRun(runId)}
          >
            {runId.slice(0, 8)}
          </Typography.Link>
          <Typography.Text
            copyable={{
              text: runId,
              tooltips: ["Copy run ID", "Copied"],
            }}
          />
        </Flex>
      ),
      filters: [...new Set((data || []).map((r) => r.runId))].map((id) => ({
        text: id.slice(0, 8),
        value: id,
      })),
      onFilter: (value, record) => record.runId === value,
    },
    {
      title: "Date Parsed",
      dataIndex: "dateParsed",
      width: 190,
      sorter: (a, b) =>
        new Date(a.dateParsed || 0).getTime() -
        new Date(b.dateParsed || 0).getTime(),
      defaultSortOrder: "descend",
      render: (date?: string) =>
        date ? new Date(date).toLocaleString() : "—",
    },
    {
      title: "Operation",
      dataIndex: "operation",
      width: 150,
      render: (operation?: string) => {
        if (!operation) return <Tag>—</Tag>;
        const tag = OPERATION_TAG[operation];
        return (
          <Tag color={tag?.color ?? "default"} bordered={false}>
            {tag?.label ?? operation}
          </Tag>
        );
      },
      filters: Object.entries(OPERATION_TAG).map(([value, { label }]) => ({
        text: label,
        value,
      })),
      onFilter: (value, record) => record.operation === value,
    },
    {
      title: "Consensus ₹/sqft",
      dataIndex: "consensusPerSqft",
      width: 150,
      align: "right",
      sorter: (a, b) => (a.consensusPerSqft ?? 0) - (b.consensusPerSqft ?? 0),
      render: (value: number | null | undefined, record) => {
        const text =
          typeof value === "number" ? `₹${value.toLocaleString("en-IN")}` : "—";
        return record.perSite ? (
          <Typography.Link onClick={() => setPerSiteRow(record)}>
            {text}
          </Typography.Link>
        ) : (
          text
        );
      },
    },
    {
      title: "Sqft Price Update",
      key: "sqftPriceUpdate",
      width: 190,
      render: (_, record) => {
        const update = record.sqftPriceUpdate;
        if (!update) return <Typography.Text type="secondary">NA</Typography.Text>;
        const fmt = (v: number | null) =>
          typeof v === "number" ? `₹${v.toLocaleString("en-IN")}` : "NA";
        return (
          <span style={{ whiteSpace: "nowrap" }}>
            {fmt(update.oldPerSqft)} &gt; {fmt(update.newPerSqft)}
          </span>
        );
      },
    },
  ];

  if (error) {
    return (
      <Alert
        type="error"
        showIcon
        message="Could not load pricing updates"
        description={(error as any)?.response?.data?.message || error.message}
      />
    );
  }

  return (
    <Flex vertical gap={12}>
      <Flex justify="space-between" align="center" gap={16} wrap>
        <Typography.Text type="secondary">
          Price checks written by pricing runs on the script server, newest
          first. Runs started outside the script server (e.g. locally) have no
          run ID and aren't listed.
        </Typography.Text>
        <Flex gap={8}>
          <Input.Search
            allowClear
            placeholder="Project name, project ID or run ID"
            style={{ width: 300 }}
            onChange={(e) => setSearch(e.target.value)}
            onSearch={setSearch}
          />
          <Button
            icon={<ReloadOutlined />}
            loading={isFetching && !isLoading}
            onClick={() => refetch()}
          />
        </Flex>
      </Flex>

      <Typography.Text type="secondary">
        {rows.length.toLocaleString()} price check
        {rows.length === 1 ? "" : "s"}
      </Typography.Text>

      <Table
        rowKey={(r) => `${r.projectId}-${r.runId}-${r.dateParsed}`}
        size="small"
        loading={isLoading}
        dataSource={rows}
        columns={columns}
        pagination={{ pageSize: 50, hideOnSinglePage: true }}
      />

      <Modal
        open={!!perSiteRow}
        onCancel={() => setPerSiteRow(null)}
        footer={null}
        width={800}
        title={`Per-site prices — ${perSiteRow?.projectName || perSiteRow?.projectId || ""}`}
      >
        {perSiteRow && (
          <div
            style={{
              maxHeight: "65vh",
              overflow: "auto",
              padding: 10,
              backgroundColor: "#f8f9fa",
            }}
          >
            <ReactJson
              src={perSiteRow.perSite || []}
              name="perSite"
              theme="rjv-default"
              displayDataTypes={false}
              displayObjectSize={true}
              enableClipboard={true}
              collapsed={2}
              indentWidth={4}
            />
          </div>
        )}
      </Modal>
    </Flex>
  );
}
