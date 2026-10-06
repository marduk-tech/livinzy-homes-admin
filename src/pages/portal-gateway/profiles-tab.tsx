import { Alert, Button, Checkbox, Flex, notification, Popconfirm, Space, Table, TableColumnType, Tag, Typography } from "antd";
import { useMemo, useState } from "react";
import { useAbandonedProfiles, useDeleteManagerProfiles } from "../../hooks/portal-gateway-hooks";
import type { AbandonedProfile, AbandonedReason } from "../../libs/api/portal-gateway";
import { errorMessage } from "../../libs/api-error";

const REASONS: { value: AbandonedReason; label: string; color: string; hint: string }[] = [
  { value: "orphan", label: "Orphan", color: "red", hint: "no proxy in the gateway points at it" },
  { value: "retired", label: "Retired", color: "volcano", hint: "replaced after a failed mint or block" },
  { value: "proxy-disabled", label: "Proxy disabled", color: "orange", hint: "its proxy is disabled" },
  { value: "proxy-retired", label: "Proxy retired", color: "gold", hint: "its proxy is retired for this portal" },
];
const REASON = Object.fromEntries(REASONS.map((r) => [r.value, r]));

const date = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : "—");

export function ProfilesTab() {
  const { data, isLoading, isFetching, error, refetch } = useAbandonedProfiles();
  const remove = useDeleteManagerProfiles();

  // the proxy-* ones can come back if the proxy is re-enabled, so they're opt-in
  const [reasons, setReasons] = useState<AbandonedReason[]>(["orphan", "retired"]);
  const [selected, setSelected] = useState<string[]>([]);

  const rows = useMemo(
    () => (data?.profiles ?? []).filter((p) => reasons.includes(p.reason)),
    [data, reasons],
  );

  const counts = useMemo(() => {
    const c: Partial<Record<AbandonedReason, number>> = {};
    for (const p of data?.profiles ?? []) c[p.reason] = (c[p.reason] ?? 0) + 1;
    return c;
  }, [data]);

  const deleteIds = (ids: string[]) =>
    remove.mutate(ids, {
      onSuccess: (res) => {
        setSelected([]);
        const failed = res.failed.length;
        notification[failed ? "warning" : "success"]({
          message: `Deleted ${res.deleted} profile${res.deleted === 1 ? "" : "s"}`,
          description:
            [
              res.skipped ? `${res.skipped} skipped (no longer abandoned)` : "",
              failed ? `${failed} failed: ${res.failed.slice(0, 3).map((f) => f.error).join("; ")}` : "",
            ]
              .filter(Boolean)
              .join(". ") || undefined,
        });
      },
    });

  const columns: TableColumnType<AbandonedProfile>[] = [
    { title: "Name", dataIndex: "name", render: (n: string, p) => <Typography.Text title={p.id}>{n}</Typography.Text> },
    { title: "Portal", dataIndex: "portal", width: 110, render: (p: string | null) => p ?? "—" },
    {
      title: "Why",
      dataIndex: "reason",
      width: 140,
      render: (r: AbandonedReason) => (
        <Tag color={REASON[r].color} title={REASON[r].hint}>
          {REASON[r].label}
        </Tag>
      ),
    },
    { title: "Proxy", dataIndex: "proxy", render: (p: string | null) => p ?? "—" },
    {
      title: "Manager",
      dataIndex: "status",
      width: 100,
      render: (s: string) => <Tag color={s === "running" ? "green" : "default"}>{s}</Tag>,
    },
    { title: "Created", dataIndex: "createdAt", width: 180, render: date },
    { title: "Retired", dataIndex: "retiredAt", width: 180, render: date },
  ];

  if (error) return <Alert type="error" message="Could not list profiles" description={errorMessage(error, "")} />;

  return (
    <Flex vertical gap={12}>
      <Typography.Text type="secondary">
        Camoufox profiles the gateway created on the browser manager but no longer uses. Templates and profiles with a
        live session are never listed.
      </Typography.Text>

      <Flex justify="space-between" wrap gap={8}>
        <Space wrap>
          <Checkbox.Group
            value={reasons}
            onChange={(v) => {
              setReasons(v as AbandonedReason[]);
              setSelected([]);
            }}
            options={REASONS.map((r) => ({ value: r.value, label: `${r.label} (${counts[r.value] ?? 0})` }))}
          />
          <Typography.Text type="secondary">
            {data?.profiles.length ?? 0} of {data?.total ?? 0} gateway profiles look abandoned
          </Typography.Text>
        </Space>
        <Space>
          <Button onClick={() => refetch()} loading={isFetching}>
            Refresh
          </Button>
          {selected.length > 0 && (
            <Popconfirm
              title={`Delete ${selected.length} profiles?`}
              description="Deletes them and their user data on the browser manager. Can't be undone."
              onConfirm={() => deleteIds(selected)}
            >
              <Button danger loading={remove.isPending}>
                Delete selected
              </Button>
            </Popconfirm>
          )}
          <Popconfirm
            title={`Delete all ${rows.length} shown profiles?`}
            description="Deletes them and their user data on the browser manager. Can't be undone."
            onConfirm={() => deleteIds(rows.map((r) => r.id))}
            disabled={!rows.length}
          >
            <Button danger type="primary" disabled={!rows.length} loading={remove.isPending}>
              Delete all shown
            </Button>
          </Popconfirm>
        </Space>
      </Flex>

      <Table
        size="small"
        rowKey="id"
        loading={isLoading}
        dataSource={rows}
        columns={columns}
        rowSelection={{ selectedRowKeys: selected, onChange: (keys) => setSelected(keys as string[]) }}
        pagination={{ pageSize: 50, hideOnSinglePage: true }}
        scroll={{ x: 1100 }}
      />
    </Flex>
  );
}
