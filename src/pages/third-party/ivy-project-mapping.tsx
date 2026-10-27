import { EditOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Divider,
  Flex,
  Input,
  message,
  Modal,
  Popconfirm,
  Segmented,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useIvyMappings, useRunIvyMatching, useUpdateIvyMapping } from "../../hooks/third-party-hooks";
import { useDebouncedValue } from "../../hooks/use-debounced-value";
import { errorMessage } from "../../libs/api-error";
import type { IvyMappingOutcome, IvyProjectMapping as IvyMappingRow, IvyProjectMatch } from "../../libs/api/ivy-homes";
import { getAllProjects } from "../../libs/api/projects";
import { queryKeys } from "../../libs/constants";

const OUTCOMES: Record<IvyMappingOutcome, { label: string; color: string }> = {
  mapped: { label: "Mapped", color: "green" },
  matched: { label: "Matched now", color: "blue" },
  suggested: { label: "Suggested", color: "gold" },
  unmatched: { label: "Unmatched", color: "default" },
  error: { label: "Error", color: "red" },
  stale: { label: "No longer on Ivy", color: "volcano" },
};

type Filter = "all" | "mapped" | "suggested" | "unmatched" | "stale" | "error";

// mapped + matched both mean "has a mapping in the DB"
const matchesFilter = (row: IvyMappingRow, filter: Filter) => {
  if (filter === "all") return true;
  if (filter === "mapped") return row.outcome === "mapped" || row.outcome === "matched";
  return row.outcome === filter;
};

function MatchTags({ match }: { match: IvyProjectMatch }) {
  return (
    <>
      {match.score !== null && (
        <Tooltip title="Name similarity">
          <Tag color={match.score >= 0.85 ? "green" : match.score >= 0.7 ? "gold" : "default"}>
            {Math.round(match.score * 100)}%
          </Tag>
        </Tooltip>
      )}
      {match.distanceKm !== null && (
        <Tooltip title="Distance between the two pins">
          <Tag color={match.distanceKm <= 3 ? "default" : "red"}>{match.distanceKm} km</Tag>
        </Tooltip>
      )}
    </>
  );
}

const projectOption = (p: { _id: string; info?: { name?: string } }) => ({
  value: p._id,
  label: `${p.info?.name ?? "(unnamed)"} · …${p._id.slice(-6)}`,
});

function MappingDialog({ row, onClose }: { row: IvyMappingRow; onClose: () => void }) {
  const updateMapping = useUpdateIvyMapping();
  const [projectId, setProjectId] = useState<string | undefined>(row.mappedProject?._id);
  const [search, setSearch] = useState(row.mappedProject ? "" : row.ivyProject.name);
  const debouncedSearch = useDebouncedValue(search);

  const projects = useQuery({
    queryKey: [queryKeys.getProjectOptions, debouncedSearch],
    queryFn: () => getAllProjects({ searchKeyword: debouncedSearch, limit: 50 }),
  });

  // keep the mapped/suggested projects selectable even when the search doesn't return them
  const options = useMemo(() => {
    const found = (projects.data ?? []).map(projectOption);
    const seen = new Set(found.map((o) => o.value));
    const pinned = [row.mappedProject, row.suggestion]
      .filter((m): m is IvyProjectMatch => !!m && !seen.has(m._id))
      .map((m) => projectOption({ _id: m._id, info: { name: m.name } }));
    return [...pinned, ...found];
  }, [projects.data, row.mappedProject, row.suggestion]);

  const save = (nextProjectId: string | null) =>
    updateMapping.mutate(
      { ivyProjectId: row.ivyProject.id, projectId: nextProjectId },
      {
        onSuccess: () => {
          message.success(nextProjectId ? "Mapping saved" : "Mapping removed");
          onClose();
        },
        onError: (error) => message.error(errorMessage(error, "Failed to update mapping")),
      },
    );

  return (
    <Modal
      open
      title={`Map "${row.ivyProject.name}"`}
      onCancel={onClose}
      destroyOnClose
      footer={
        <Flex justify="space-between">
          <div>
            {row.mappedProject && (
              <Popconfirm
                title="Remove this mapping?"
                description="The Ivy inventory status will be removed from the project."
                onConfirm={() => save(null)}
              >
                <Button danger loading={updateMapping.isPending}>
                  Remove mapping
                </Button>
              </Popconfirm>
            )}
          </div>
          <Space>
            <Button onClick={onClose}>Cancel</Button>
            <Button
              type="primary"
              loading={updateMapping.isPending}
              disabled={!projectId || projectId === row.mappedProject?._id}
              onClick={() => projectId && save(projectId)}
            >
              Save
            </Button>
          </Space>
        </Flex>
      }
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        <Typography.Text type="secondary">
          {[row.ivyProject.locality, row.ivyProject.salesArea].filter(Boolean).join(", ") || "-"}
        </Typography.Text>
        {row.mappedProject && (
          <Typography.Text>
            Currently mapped to <strong>{row.mappedProject.name}</strong>
          </Typography.Text>
        )}
        {row.suggestion && row.suggestion._id !== projectId && (
          <>
            <Space size={4} wrap>
              <Typography.Text>
                Suggested: <strong>{row.suggestion.name}</strong>
              </Typography.Text>
              <MatchTags match={row.suggestion} />
            </Space>
            <Button type="primary" ghost block onClick={() => setProjectId(row.suggestion?._id)}>
              Use suggestion
            </Button>
            <Divider plain style={{ margin: "4px 0" }}>
              or search for a project
            </Divider>
          </>
        )}
        <Select
          showSearch
          allowClear
          filterOption={false}
          placeholder="Search Brickfi projects"
          searchValue={search}
          onSearch={setSearch}
          loading={projects.isFetching}
          options={options}
          value={projectId}
          onChange={setProjectId}
          style={{ width: "100%" }}
        />
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          Saving links this Ivy project to the selected Brickfi project and removes the link from any project it was
          mapped to before.
        </Typography.Text>
      </Space>
    </Modal>
  );
}

export function IvyProjectMapping() {
  const { data, isLoading, error, refetch, isFetching } = useIvyMappings();
  const runMatching = useRunIvyMatching();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<IvyMappingRow | null>(null);

  const rows = useMemo(() => data?.rows ?? [], [data]);
  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: rows.length, mapped: 0, suggested: 0, unmatched: 0, stale: 0, error: 0 };
    for (const row of rows) {
      for (const f of ["mapped", "suggested", "unmatched", "stale", "error"] as const) {
        if (matchesFilter(row, f)) c[f]++;
      }
    }
    return c;
  }, [rows]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(
      (row) =>
        matchesFilter(row, filter) &&
        (!q ||
          row.ivyProject.name.toLowerCase().includes(q) ||
          row.mappedProject?.name.toLowerCase().includes(q) ||
          row.suggestion?.name.toLowerCase().includes(q)),
    );
  }, [rows, filter, search]);

  const run = () =>
    runMatching.mutate(undefined, {
      onError: (err) => message.error(errorMessage(err, "Matching failed")),
    });

  const columns: ColumnsType<IvyMappingRow> = [
    {
      title: "Ivy project",
      key: "ivy",
      sorter: (a, b) => a.ivyProject.name.localeCompare(b.ivyProject.name),
      render: (_, row) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{row.ivyProject.name}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {[row.ivyProject.locality, row.ivyProject.salesArea].filter(Boolean).join(", ")}
            {row.ivyProject.listingCount ? ` · ${row.ivyProject.listingCount} listing(s)` : ""}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: "Brickfi project",
      key: "brickfi",
      sorter: (a, b) =>
        (a.mappedProject?.score ?? a.suggestion?.score ?? -1) - (b.mappedProject?.score ?? b.suggestion?.score ?? -1),
      render: (_, row) => {
        if (row.mappedProject)
          return (
            <Space size={4} wrap>
              <Link to={`/projects/${row.mappedProject._id}/edit`} target="_blank">
                {row.mappedProject.name}
              </Link>
              <MatchTags match={row.mappedProject} />
            </Space>
          );
        if (row.suggestion)
          return (
            <Space size={4} wrap>
              <Typography.Text type="secondary">{row.suggestion.name}</Typography.Text>
              <MatchTags match={row.suggestion} />
              {row.suggestion.confident && (
                <Tooltip title="Will be auto-mapped by Run matching">
                  <Tag color="blue">auto</Tag>
                </Tooltip>
              )}
            </Space>
          );
        return <Typography.Text type="secondary">-</Typography.Text>;
      },
    },
    {
      title: "Status",
      key: "outcome",
      width: 160,
      render: (_, row) => (
        <Tooltip title={row.error}>
          <Tag color={OUTCOMES[row.outcome].color}>{OUTCOMES[row.outcome].label}</Tag>
        </Tooltip>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 90,
      render: (_, row) => (
        <Button size="small" icon={<EditOutlined />} onClick={() => setEditing(row)}>
          Edit
        </Button>
      ),
    },
  ];

  if (error)
    return (
      <Alert
        type="error"
        showIcon
        message="Failed to load Ivy Homes project mapping"
        description={errorMessage(error, "Unknown error")}
        action={<Button onClick={() => refetch()}>Retry</Button>}
      />
    );

  const summary = runMatching.data?.summary;

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Flex justify="space-between" align="center" gap={12} wrap="wrap">
        <Space wrap>
          <Segmented<Filter>
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: `All (${counts.all})` },
              { value: "mapped", label: `Mapped (${counts.mapped})` },
              { value: "suggested", label: `Suggested (${counts.suggested})` },
              { value: "unmatched", label: `Unmatched (${counts.unmatched})` },
              ...(counts.stale ? [{ value: "stale" as const, label: `Not on Ivy (${counts.stale})` }] : []),
              ...(counts.error ? [{ value: "error" as const, label: `Errors (${counts.error})` }] : []),
            ]}
          />
          <Input.Search
            allowClear
            placeholder="Search projects"
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 240 }}
          />
        </Space>
        <Popconfirm
          title="Run matching?"
          description="Confident matches get the Ivy inventory status written to the Brickfi project. Existing mappings are kept."
          onConfirm={run}
        >
          <Button type="primary" icon={<ThunderboltOutlined />} loading={runMatching.isPending}>
            Run matching
          </Button>
        </Popconfirm>
      </Flex>

      {summary && (
        <Alert
          type="success"
          showIcon
          closable
          message={`Matching done: ${summary.matched ?? 0} newly mapped, ${summary.mapped ?? 0} already mapped, ${
            summary.suggested ?? 0
          } suggested, ${summary.unmatched ?? 0} unmatched${summary.error ? `, ${summary.error} failed` : ""}`}
        />
      )}

      <Table
        rowKey={(row) => `${row.outcome === "stale" ? "stale" : "ivy"}-${row.ivyProject.id}`}
        size="small"
        loading={isLoading || isFetching || runMatching.isPending}
        columns={columns}
        dataSource={visible}
        pagination={{ defaultPageSize: 50, showSizeChanger: true }}
      />

      {editing && <MappingDialog key={editing.ivyProject.id} row={editing} onClose={() => setEditing(null)} />}
    </Space>
  );
}
