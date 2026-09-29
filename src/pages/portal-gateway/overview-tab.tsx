import {
  Alert,
  Button,
  Card,
  Col,
  Collapse,
  Descriptions,
  Flex,
  notification,
  Popconfirm,
  Progress,
  Row,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { useGatewayStatus, useHealthCheck, useMintBroker, useRetireIdentity } from "../../hooks/portal-gateway-hooks";
import type { PoolIdentity, PortalStatus } from "../../libs/api/portal-gateway";
import { errorMessage } from "../../libs/api-error";
import { ms, pct } from "./format";

function PortalCard({ portal }: { portal: PortalStatus }) {
  const pool = portal.pool;
  const statusTags = Object.entries(portal.last24h.byStatus);
  const mint = useMintBroker();
  const health = useHealthCheck();
  const target = portal.warmTarget ?? portal.minWarm;

  const startMint = (proxyId?: string) =>
    mint.mutate(
      { portal: portal.id, proxyId },
      {
        onSuccess: (r) =>
          notification.info({ message: `Minting ${portal.id} on ${r.label}`, description: "Takes about a minute — watch Minting." }),
      },
    );

  return (
    <Card
      size="small"
      title={
        <Flex gap={8} align="center" wrap>
          {portal.id}
          <Tag color={portal.enabled ? "green" : "default"}>{portal.enabled ? "enabled" : "disabled"}</Tag>
          <Tag>{portal.hasParser ? "parser: structured" : "parser: html → md"}</Tag>
          {pool && portal.health && (
            <Tag>{portal.health.enabled ? `health every ${ms(portal.health.intervalMs)}` : "health checks off"}</Tag>
          )}
          {portal.resultQuota != null && <Tag>quota {portal.resultQuota}</Tag>}
        </Flex>
      }
      extra={
        pool && (
          <Space>
            <Button
              size="small"
              loading={health.isPending}
              disabled={!portal.enabled || pool.warm === 0}
              onClick={() =>
                health.mutate(
                  { portal: portal.id },
                  {
                    onSuccess: (r) =>
                      notification[r.failed ? "warning" : "success"]({
                        message: `Checked ${r.checked} session(s), ${r.failed} failed`,
                      }),
                  },
                )
              }
            >
              Check health now
            </Button>
            <Button size="small" type="primary" loading={mint.isPending} disabled={!portal.enabled} onClick={() => startMint()}>
              Mint now
            </Button>
          </Space>
        )
      }
    >
      {pool ? (
        <Flex vertical gap={8}>
          <Flex gap={24} wrap>
            <Statistic title="Warm" value={pool.warm} suffix={`/ ${target} target`} />
            <Statistic title="Minting" value={pool.minting} />
            <Statistic title="In use" value={pool.leased} />
            <Statistic title="Eligible proxies" value={pool.eligibleProxies} />
          </Flex>
          <Progress percent={target ? Math.min(100, (pool.warm / target) * 100) : 100} showInfo={false} size="small" />
          {portal.breakerOpenForMs > 0 && (
            <Alert type="warning" showIcon message={`Breaker open — standing down for ${ms(portal.breakerOpenForMs)}`} />
          )}
          {portal.warmer.lastError && (
            <Alert
              type="error"
              showIcon
              message={`Warmer failing (${portal.warmer.failures}×), next try in ${ms(portal.warmer.nextTryInMs)}`}
              description={portal.warmer.lastError}
            />
          )}
          {pool.identities.length > 0 && (
            <IdentityTable portal={portal.id} identities={pool.identities} onRemint={startMint} />
          )}
        </Flex>
      ) : (
        <Typography.Text type="secondary">
          No minted session needed — plain fetches through proxies tagged for {portal.id} (direct from the server if none are).
        </Typography.Text>
      )}

      <Descriptions size="small" column={3} style={{ marginTop: 12 }}>
        <Descriptions.Item label="Block rate (last 10)">{pct(portal.blockRate)}</Descriptions.Item>
        <Descriptions.Item label="Scrapes 24h">{portal.last24h.total}</Descriptions.Item>
        <Descriptions.Item label="Cache hits">{pct(portal.last24h.cacheHitRate)}</Descriptions.Item>
      </Descriptions>
      {statusTags.length > 0 && (
        <Flex gap={4} wrap>
          {statusTags.map(([status, n]) => (
            <Tag key={status} color={status === "ok" ? "green" : status === "blocked" ? "red" : "orange"}>
              {status}: {n}
            </Tag>
          ))}
        </Flex>
      )}
      {portal.queries?.length > 0 && (
        <Collapse
          size="small"
          ghost
          style={{ marginTop: 8 }}
          items={[
            {
              key: "q",
              label: `Search queries (${portal.queries.length}) — {name}, {core}, {city} filled per run`,
              children: (
                <Flex vertical gap={2}>
                  {portal.queries.map((q) => (
                    <Typography.Text key={q} code>
                      {q}
                    </Typography.Text>
                  ))}
                </Flex>
              ),
            },
          ]}
        />
      )}
    </Card>
  );
}

const ago = (at: number | null | undefined) => (at ? `${ms(Date.now() - at)} ago` : "—");

function IdentityTable({
  portal,
  identities,
  onRemint,
}: {
  portal: string;
  identities: PoolIdentity[];
  onRemint: (proxyId: string) => void;
}) {
  const retire = useRetireIdentity();
  return (
    <Table
      size="small"
      rowKey="profileId"
      pagination={false}
      dataSource={identities}
      scroll={{ x: true }}
      columns={[
        { title: "Exit", dataIndex: "label" },
        {
          title: "State",
          key: "state",
          render: (_, i) =>
            i.leased ? <Tag color="blue">in use</Tag> : i.warm ? <Tag color="green">warm</Tag> : <Tag>stale</Tag>,
        },
        { title: "Uses", dataIndex: "uses", width: 60 },
        { title: "Minted", dataIndex: "mintedAt", render: (v: number | null) => ago(v) },
        {
          title: "Last check",
          key: "check",
          render: (_, i) =>
            i.lastCheck ? (
              <Tooltip title={i.lastCheck.detail}>
                <Tag color={i.lastCheck.ok ? "green" : "red"}>{i.lastCheck.ok ? "ok" : "failed"}</Tag>
                {ago(i.lastCheck.at)}
              </Tooltip>
            ) : (
              "—"
            ),
        },
        { title: "Next check", dataIndex: "nextCheckInMs", render: (v: number | null) => (v == null ? "—" : `in ${ms(v)}`) },
        {
          title: "",
          key: "actions",
          render: (_, i) => (
            <Space size={4}>
              <Button size="small" disabled={i.leased} onClick={() => onRemint(i.proxyId)}>
                Re-mint
              </Button>
              <Popconfirm
                title="Retire this session?"
                description="The warmer mints a replacement. The proxy isn't struck."
                onConfirm={() => retire.mutate({ portal, proxyId: i.proxyId })}
              >
                <Button size="small" danger disabled={!i.warm}>
                  Retire
                </Button>
              </Popconfirm>
            </Space>
          ),
        },
      ]}
    />
  );
}

export function OverviewTab() {
  const { data, isLoading, error } = useGatewayStatus();

  if (isLoading) return <Spin />;
  if (error || !data) {
    return <Alert type="error" showIcon message="Could not load gateway status" description={errorMessage(error, "")} />;
  }

  const p = data.proxies;
  return (
    <Flex vertical gap={16}>
      {!data.enabled && (
        <Alert
          type="info"
          showIcon
          message="Gateway is disabled"
          description="Set PORTAL_GATEWAY_ENABLED=true on the script server and restart. Proxies and config can be set up before that."
        />
      )}
      {!data.managerConfigured && (
        <Alert type="warning" showIcon message="Browser manager isn't configured (ASTRA_BROWSER_URL / ASTRA_AUTH_TOKEN)" />
      )}
      {data.enabled && !data.templateProfileId && (
        <Alert type="warning" showIcon message="PORTAL_TEMPLATE_PROFILE_ID isn't set — new Camoufox profiles can't be created" />
      )}

      <Card size="small" title="Proxies">
        <Flex vertical gap={12}>
          <Flex gap={32} wrap>
            <Statistic title="All" value={p.all} />
            <Statistic title="Leasable by some portal" value={p.eligible} valueStyle={{ color: "#3f8600" }} />
            <Statistic title="Disabled" value={p.disabled} />
          </Flex>
          {/* health is per portal: a proxy benched on one broker can still serve the others.
              "—" means the script server predates per-portal health and needs a redeploy */}
          <Table
            size="small"
            rowKey="id"
            pagination={false}
            dataSource={data.portals}
            columns={[
              { title: "Portal", dataIndex: "id" },
              { title: "Tagged", render: (_, r) => r.proxies?.tagged ?? "—" },
              {
                title: "Leasable now",
                render: (_, r) => <Typography.Text type="success">{r.proxies?.eligible ?? "—"}</Typography.Text>,
              },
              { title: "Fresh", render: (_, r) => r.proxies?.fresh ?? "—" },
              { title: "Active", render: (_, r) => r.proxies?.active ?? "—" },
              {
                title: "Cooling down",
                render: (_, r) => <Typography.Text type="warning">{r.proxies?.cooldown ?? "—"}</Typography.Text>,
              },
              {
                title: "Retired",
                render: (_, r) => <Typography.Text type="danger">{r.proxies?.retired ?? "—"}</Typography.Text>,
              },
            ]}
          />
        </Flex>
      </Card>

      <Row gutter={[16, 16]}>
        {data.portals.map((portal) => (
          <Col key={portal.id} xs={24} xl={12}>
            <PortalCard portal={portal} />
          </Col>
        ))}
      </Row>
    </Flex>
  );
}
