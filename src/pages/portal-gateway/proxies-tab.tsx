import {
  Alert,
  Button,
  Checkbox,
  Drawer,
  Flex,
  Input,
  List,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  TableColumnType,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { useMemo, useState } from "react";
import {
  useAddProxies,
  useBulkProxyAction,
  useDeleteProxies,
  usePortalProxies,
  usePortalIds,
  useProxyAction,
  useProxyProfiles,
  useSetProxyPortals,
} from "../../hooks/portal-gateway-hooks";
import type { AddProxiesResult, HealthStatus, PortalProxy, ProxyHealth } from "../../libs/api/portal-gateway";
import { errorMessage } from "../../libs/api-error";
import { ms } from "./format";

const STATUS_COLOR: Record<HealthStatus, string> = {
  fresh: "blue",
  active: "green",
  cooldown: "orange",
  retired: "red",
};

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
const countryName = (code: string) => regionNames.of(code) ?? code;
// regional indicator letters render as the flag emoji
const flag = (code: string) =>
  /^[A-Z]{2}$/.test(code) ? String.fromCodePoint(...[...code].map((c) => 0x1f1a5 + c.charCodeAt(0))) : "";

// An expired cooldown is back in rotation, so show it as such
const liveStatus = (h: ProxyHealth): HealthStatus =>
  h.status === "cooldown" && h.eligible ? (h.goodFetches ? "active" : "fresh") : h.status;

function HealthLine({ h, onReset }: { h: ProxyHealth; onReset: () => void }) {
  const status = liveStatus(h);
  return (
    <Flex gap={6} align="center" wrap>
      <Tooltip title={h.lastError ?? undefined}>
        <Tag color={STATUS_COLOR[status]} style={{ marginInlineEnd: 0 }}>
          {h.portal}: {status}
        </Tag>
      </Tooltip>
      <Typography.Text style={{ fontSize: 12 }}>
        <Tooltip title="good / blocked / mint fails / timeouts">
          <Typography.Text type="success">{h.goodFetches}</Typography.Text> /{" "}
          <Typography.Text type="danger">{h.blockedFetches}</Typography.Text> / {h.mintFailures} / {h.transportErrors}
        </Tooltip>
        {h.strikes > 0 && ` · ${h.strikes} strike${h.strikes > 1 ? "s" : ""}`}
      </Typography.Text>
      {h.cooldownRemainingMs > 0 && (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          back in {ms(h.cooldownRemainingMs)}
        </Typography.Text>
      )}
      {(h.strikes > 0 || h.status === "retired") && (
        <Typography.Link style={{ fontSize: 12 }} onClick={onReset}>
          reset
        </Typography.Link>
      )}
    </Flex>
  );
}

function AddProxiesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [text, setText] = useState("");
  const [tag, setTag] = useState("");
  const [portals, setPortals] = useState<string[]>(["housing"]);
  const [test, setTest] = useState(true);
  const [result, setResult] = useState<AddProxiesResult>();
  const add = useAddProxies();
  const portalIds = usePortalIds();

  const urls = text
    .split(/\n|,/)
    .map((l) => l.trim())
    .filter(Boolean);

  const close = () => {
    setResult(undefined);
    setText("");
    onClose();
  };

  const submit = () =>
    add.mutate({ urls, tag: tag || undefined, test, portals }, { onSuccess: (r) => setResult(r) });

  const issues = result
    ? [
        ...result.duplicates.map((d) => ({ ...d, kind: "duplicate" })),
        ...result.invalid.map((d) => ({ ...d, kind: "invalid" })),
        ...result.warnings.map((d) => ({ ...d, kind: "warning" })),
        ...result.unreachable.map((d) => ({ ...d, kind: "unreachable" })),
      ]
    : [];

  return (
    <Modal
      title="Add proxies"
      open={open}
      onCancel={close}
      width={640}
      footer={
        result ? (
          <Button onClick={close}>Done</Button>
        ) : (
          <Button type="primary" disabled={!urls.length} loading={add.isPending} onClick={submit}>
            Add {urls.length || ""} proxies
          </Button>
        )
      }
    >
      {result ? (
        <Flex vertical gap={12}>
          <Alert type="success" showIcon message={`${result.added} added`} />
          {issues.length > 0 && (
            <List
              size="small"
              bordered
              dataSource={issues}
              renderItem={(i) => (
                <List.Item>
                  <Tag color={i.kind === "warning" ? "orange" : i.kind === "unreachable" ? "gold" : "red"}>
                    {i.kind}
                  </Tag>
                  <Typography.Text code>{i.url}</Typography.Text> {i.reason}
                </List.Item>
              )}
            />
          )}
        </Flex>
      ) : (
        <Flex vertical gap={12}>
          <Typography.Text type="secondary">
            One per line. Use sticky proxies — each line should be one exit IP. Accepts URLs, host:port and
            host:port:user:pass.
          </Typography.Text>
          <Input.TextArea
            rows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"http://user:pass@gate.example.com:7000\nhost.example.com:8000:user:pass"}
            style={{ fontFamily: "monospace" }}
          />
          <Space wrap>
            <Input placeholder="Tag (e.g. provider-batch-1)" value={tag} onChange={(e) => setTag(e.target.value)} />
            <Select
              mode="multiple"
              style={{ minWidth: 220 }}
              value={portals}
              onChange={setPortals}
              options={portalIds.map((p) => ({ value: p, label: p }))}
            />
            <Checkbox checked={test} onChange={(e) => setTest(e.target.checked)}>
              Test through the manager (resolves exit IPs)
            </Checkbox>
          </Space>
          {add.error && <Alert type="error" message={errorMessage(add.error, "Could not add proxies")} />}
        </Flex>
      )}
    </Modal>
  );
}

function ProfilesDrawer({ proxy, onClose }: { proxy?: PortalProxy; onClose: () => void }) {
  const { data, isLoading } = useProxyProfiles(proxy?.id);
  return (
    <Drawer title={`Profiles for ${proxy?.exitIp ?? proxy?.proxy ?? ""}`} open={!!proxy} onClose={onClose} width={640}>
      <Table
        size="small"
        rowKey="id"
        loading={isLoading}
        dataSource={data ?? []}
        pagination={false}
        columns={[
          { title: "Portal", dataIndex: "portal" },
          { title: "Gen", dataIndex: "generation", width: 60 },
          {
            title: "Status",
            dataIndex: "status",
            render: (s: string) => <Tag color={s === "active" ? "green" : "default"}>{s}</Tag>,
          },
          { title: "Mints", dataIndex: "mints", width: 70 },
          { title: "Seed", dataIndex: "fingerprintSeed", width: 80 },
          {
            title: "Last error",
            dataIndex: "lastError",
            render: (e: string | null) => (e ? <Typography.Text type="danger">{e}</Typography.Text> : "—"),
          },
        ]}
      />
    </Drawer>
  );
}

export function ProxiesTab() {
  const { data, isLoading, error } = usePortalProxies();
  const action = useProxyAction();
  const setPortals = useSetProxyPortals();
  const remove = useDeleteProxies();
  const bulk = useBulkProxyAction();
  const portalIds = usePortalIds();

  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [drawer, setDrawer] = useState<PortalProxy>();
  const [tag, setTag] = useState<string>();

  // older script servers don't send per-portal health yet
  const rows = useMemo(
    () => (data?.proxies ?? []).map((p) => ({ ...p, health: p.health ?? [] })).filter((p) => !tag || p.tag === tag),
    [data, tag],
  );

  const countryFilters = useMemo(
    () =>
      [...new Set((data?.proxies ?? []).map((p) => p.exitCountry).filter((c): c is string => !!c))]
        .sort()
        .map((c) => ({ text: `${flag(c)} ${countryName(c)}`, value: c })),
    [data],
  );

  const columns: TableColumnType<PortalProxy>[] = [
    {
      title: "Exit IP",
      dataIndex: "exitIp",
      width: 140,
      render: (ip: string | null) => (ip ? <Typography.Text code>{ip}</Typography.Text> : <Typography.Text type="secondary">unknown</Typography.Text>),
    },
    {
      title: "Country",
      dataIndex: "exitCountry",
      width: 110,
      filters: countryFilters,
      onFilter: (v, r) => r.exitCountry === v,
      sorter: (a, b) => (a.exitCountry ?? "").localeCompare(b.exitCountry ?? ""),
      render: (code?: string | null) =>
        code ? (
          <Tooltip title={countryName(code)}>
            {flag(code)} {code}
          </Tooltip>
        ) : (
          <Typography.Text type="secondary">—</Typography.Text>
        ),
    },
    {
      title: "Proxy",
      dataIndex: "proxy",
      render: (p: string, r) => (
        <Flex vertical>
          <Typography.Text style={{ fontFamily: "monospace", fontSize: 12 }}>{p}</Typography.Text>
          <Flex gap={4}>
            {r.tag && <Tag>{r.tag}</Tag>}
            {r.source === "config" && <Tag color="purple">config</Tag>}
          </Flex>
        </Flex>
      ),
    },
    {
      title: "Health by portal",
      key: "health",
      width: 360,
      filters: [
        { text: "leasable somewhere", value: "eligible" },
        { text: "benched everywhere", value: "benched" },
        { text: "disabled", value: "disabled" },
        ...Object.keys(STATUS_COLOR).map((s) => ({ text: `any ${s}`, value: s })),
      ],
      onFilter: (v, r) =>
        v === "disabled"
          ? r.disabled
          : v === "eligible"
            ? r.eligible
            : v === "benched"
              ? !r.disabled && !r.eligible
              : r.health.some((h) => liveStatus(h) === v),
      sorter: (a, b) =>
        a.health.reduce((n, h) => n + h.strikes, 0) - b.health.reduce((n, h) => n + h.strikes, 0),
      render: (_, r) =>
        r.disabled ? (
          <Tag>disabled</Tag>
        ) : r.health.length ? (
          <Flex vertical gap={4}>
            {r.health.map((h) => (
              <HealthLine key={h.portal} h={h} onReset={() => action.mutate({ id: r.id, action: "reset", portal: h.portal })} />
            ))}
          </Flex>
        ) : (
          <Typography.Text type="secondary">no portals</Typography.Text>
        ),
    },
    {
      title: "Portals",
      dataIndex: "portals",
      width: 200,
      render: (portals: string[], r) => (
        <Select
          mode="multiple"
          size="small"
          style={{ width: "100%" }}
          value={portals}
          onChange={(v) => setPortals.mutate({ id: r.id, portals: v })}
          options={portalIds.map((p) => ({ value: p, label: p }))}
        />
      ),
    },
    {
      title: "Profiles",
      key: "profiles",
      width: 110,
      render: (_, r) => (
        <Typography.Link onClick={() => setDrawer(r)}>
          {r.profiles.length ? r.profiles.map((p) => `${p.portal} g${p.generation}`).join(", ") : "none yet"}
        </Typography.Link>
      ),
    },
    {
      title: "Last error",
      dataIndex: "lastError",
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
    {
      title: "",
      key: "actions",
      width: 250,
      render: (_, r) => (
        <Space size={4} wrap>
          <Button size="small" onClick={() => action.mutate({ id: r.id, action: "test" })}>
            Test
          </Button>
          {r.health.some((h) => h.strikes > 0 || h.status === "retired") ? (
            <Tooltip title="Reset strikes on every portal">
              <Button size="small" onClick={() => action.mutate({ id: r.id, action: "reset" })}>
                Reset all
              </Button>
            </Tooltip>
          ) : null}
          <Button size="small" onClick={() => action.mutate({ id: r.id, action: r.disabled ? "enable" : "disable" })}>
            {r.disabled ? "Enable" : "Disable"}
          </Button>
          <Popconfirm
            title="Delete this proxy?"
            description="Its Camoufox profiles are deleted from the browser manager too."
            onConfirm={() => remove.mutate([r.id])}
          >
            <Button size="small" danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (error) return <Alert type="error" showIcon message={errorMessage(error, "Could not load proxies")} />;

  return (
    <Flex vertical gap={12}>
      <Flex justify="space-between" wrap gap={8}>
        <Space wrap>
          <Button type="primary" onClick={() => setAdding(true)}>
            Add proxies
          </Button>
          <Select
            allowClear
            placeholder="Filter by tag"
            style={{ width: 200 }}
            value={tag}
            onChange={setTag}
            options={(data?.tags ?? []).map((t) => ({ value: t, label: t }))}
          />
          <Typography.Text type="secondary">
            {data?.eligible ?? 0} leasable of {data?.proxies.length ?? 0}
          </Typography.Text>
        </Space>
        {selected.length > 0 && (
          <Space>
            <Typography.Text>{selected.length} selected</Typography.Text>
            <Button onClick={() => bulk.mutate({ ids: selected, action: "enable" })}>Enable</Button>
            <Button onClick={() => bulk.mutate({ ids: selected, action: "disable" })}>Disable</Button>
            <Popconfirm
              title={`Delete ${selected.length} proxies?`}
              onConfirm={() => remove.mutate(selected, { onSuccess: () => setSelected([]) })}
            >
              <Button danger>Delete</Button>
            </Popconfirm>
          </Space>
        )}
      </Flex>

      <Table
        size="small"
        rowKey="id"
        loading={isLoading}
        dataSource={rows}
        columns={columns}
        rowSelection={{ selectedRowKeys: selected, onChange: (keys) => setSelected(keys as string[]) }}
        pagination={{ pageSize: 50, hideOnSinglePage: true }}
        scroll={{ x: 1410 }}
      />

      <AddProxiesModal open={adding} onClose={() => setAdding(false)} />
      <ProfilesDrawer proxy={drawer} onClose={() => setDrawer(undefined)} />
    </Flex>
  );
}
