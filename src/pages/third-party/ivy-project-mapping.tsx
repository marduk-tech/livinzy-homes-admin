import { EditOutlined, LinkOutlined, ThunderboltOutlined } from "@ant-design/icons";
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
import type {
  IvyListingSummary,
  IvyMappingOutcome,
  IvyProjectMappedTo,
  IvyProjectMapping as IvyMappingRow,
  IvyProjectMatch,
} from "../../libs/api/ivy-homes";
import { getAllProjects } from "../../libs/api/projects";
import { queryKeys } from "../../libs/constants";

const OUTCOMES: Record<IvyMappingOutcome, { label: string; color: string }> = {
  mapped: { label: "Mapped", color: "green" },
  matched: { label: "Matched now", color: "blue" },
  partial: { label: "Partially mapped", color: "cyan" },
  suggested: { label: "Suggested", color: "gold" },
  unmatched: { label: "Unmatched", color: "default" },
  error: { label: "Error", color: "red" },
  stale: { label: "No longer on Ivy", color: "volcano" },
};

type Filter = "all" | "mapped" | "partial" | "suggested" | "unmatched" | "stale" | "error";

// mapped + matched both mean "fully mapped in the DB"
const matchesFilter = (row: IvyMappingRow, filter: Filter) => {
  if (filter === "all") return true;
  if (filter === "mapped") return row.outcome === "mapped" || row.outcome === "matched";
  return row.outcome === filter;
};

const formatPrice = (price?: number) => (price ? `₹${price.toLocaleString("en-IN")}` : "-");

// listing id -> the Brickfi project it's mapped to (a whole-project mapping covers every listing)
const listingOwners = (row: IvyMappingRow) => {
  const owners = new Map<number, IvyProjectMappedTo>();
  const whole = row.mappings.find((m) => m.listingIds === null);
  if (whole) for (const l of row.ivyProject.listings ?? []) owners.set(l.id, whole);
  for (const m of row.mappings) for (const id of m.listingIds ?? []) owners.set(id, m);
  return owners;
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

// stops a click on a link inside a row from also expanding/collapsing it
const ProjectLink = ({ match }: { match: IvyProjectMatch }) => (
  <Link to={`/projects/${match._id}/edit`} target="_blank" onClick={(e) => e.stopPropagation()}>
    {match.name}
  </Link>
);

const projectOption = (p: { _id: string; info?: { name?: string } }) => ({
  value: p._id,
  label: `${p.info?.name ?? "(unnamed)"} · …${p._id.slice(-6)}`,
});

// listingIds undefined maps the whole Ivy project; otherwise just those listings
function MappingDialog({
  row,
  listingIds,
  onClose,
}: {
  row: IvyMappingRow;
  listingIds?: number[];
  onClose: () => void;
}) {
  const updateMapping = useUpdateIvyMapping();
  const owners = useMemo(() => listingOwners(row), [row]);
  const wholeMapping = row.mappings.find((m) => m.listingIds === null);

  // preselect the project these listings (or the whole Ivy project) are already on, if there's just one
  const initialProjectId = useMemo(() => {
    if (!listingIds) return wholeMapping?._id ?? (row.mappings.length === 1 ? row.mappings[0]._id : undefined);
    const current = new Set(listingIds.map((id) => owners.get(id)?._id));
    return current.size === 1 ? [...current][0] : undefined;
  }, [listingIds, owners, row.mappings, wholeMapping]);
  const mappedSelected = listingIds ? listingIds.filter((id) => owners.has(id)).length : row.mappings.length;

  const [projectId, setProjectId] = useState<string | undefined>(initialProjectId);
  const [search, setSearch] = useState(initialProjectId ? "" : row.ivyProject.name);
  const debouncedSearch = useDebouncedValue(search);

  const projects = useQuery({
    queryKey: [queryKeys.getProjectOptions, debouncedSearch],
    queryFn: () => getAllProjects({ searchKeyword: debouncedSearch, limit: 50 }),
  });

  // keep the mapped/suggested projects selectable even when the search doesn't return them
  const options = useMemo(() => {
    const found = (projects.data ?? []).map(projectOption);
    const seen = new Set(found.map((o) => o.value));
    const pinned = [...row.mappings, row.suggestion]
      .filter((m): m is IvyProjectMatch => !!m && !seen.has(m._id) && !!seen.add(m._id))
      .map((m) => projectOption({ _id: m._id, info: { name: m.name } }));
    return [...pinned, ...found];
  }, [projects.data, row.mappings, row.suggestion]);

  const save = (nextProjectId: string | null) =>
    updateMapping.mutate(
      { ivyProjectId: row.ivyProject.id, projectId: nextProjectId, ivyListingIds: listingIds },
      {
        onSuccess: () => {
          message.success(nextProjectId ? "Mapping saved" : "Mapping removed");
          onClose();
        },
        onError: (error) => message.error(errorMessage(error, "Failed to update mapping")),
      },
    );

  const unchanged = listingIds
    ? listingIds.every((id) => owners.get(id)?._id === projectId)
    : row.mappings.length === 1 && wholeMapping?._id === projectId;

  return (
    <Modal
      open
      title={
        listingIds
          ? `Map ${listingIds.length} listing(s) of "${row.ivyProject.name}"`
          : `Map "${row.ivyProject.name}"`
      }
      onCancel={onClose}
      destroyOnClose
      footer={
        <Flex justify="space-between">
          <div>
            {mappedSelected > 0 && (
              <Popconfirm
                title={listingIds ? "Unmap these listings?" : "Remove every mapping of this Ivy project?"}
                description="The Ivy inventory status will be removed from the project(s) left without listings."
                onConfirm={() => save(null)}
              >
                <Button danger loading={updateMapping.isPending}>
                  {listingIds ? "Unmap listings" : "Remove mapping"}
                </Button>
              </Popconfirm>
            )}
          </div>
          <Space>
            <Button onClick={onClose}>Cancel</Button>
            <Button
              type="primary"
              loading={updateMapping.isPending}
              disabled={!projectId || unchanged}
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
        {listingIds && (
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {(row.ivyProject.listings ?? [])
              .filter((l) => listingIds.includes(l.id))
              .map((l) => (
                <li key={l.id}>
                  <Typography.Text>{l.title}</Typography.Text>
                  {owners.get(l.id) && (
                    <Typography.Text type="secondary"> · on {owners.get(l.id)?.name}</Typography.Text>
                  )}
                </li>
              ))}
          </ul>
        )}
        {!listingIds && row.mappings.length > 0 && (
          <Typography.Text>
            Currently mapped to{" "}
            {row.mappings.map((m, i) => (
              <span key={m._id}>
                {i > 0 && ", "}
                <strong>{m.name}</strong>
                {m.listingIds && ` (${m.listingIds.length} listing(s))`}
              </span>
            ))}
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
          {listingIds
            ? "Saving maps the selected listings to this Brickfi project and takes them off any project they were on. Other listings keep their mapping."
            : "Saving maps every listing of this Ivy project to the selected Brickfi project and removes it from any other project."}
        </Typography.Text>
      </Space>
    </Modal>
  );
}

function ListingsPanel({ row, onMap }: { row: IvyMappingRow; onMap: (listingIds: number[]) => void }) {
  const updateMapping = useUpdateIvyMapping();
  const [selected, setSelected] = useState<number[]>([]);
  const owners = useMemo(() => listingOwners(row), [row]);
  const listings = row.ivyProject.listings ?? [];
  const selectedMapped = selected.filter((id) => owners.has(id));

  const unmap = () =>
    updateMapping.mutate(
      { ivyProjectId: row.ivyProject.id, projectId: null, ivyListingIds: selectedMapped },
      {
        onSuccess: () => {
          message.success("Listings unmapped");
          setSelected([]);
        },
        onError: (error) => message.error(errorMessage(error, "Failed to unmap listings")),
      },
    );

  const columns: ColumnsType<IvyListingSummary> = [
    {
      title: "Listing",
      key: "title",
      render: (_, l) => (
        <Space size={4}>
          <Typography.Text>{l.title}</Typography.Text>
          {l.url && (
            <a href={l.url} target="_blank" rel="noopener noreferrer">
              <LinkOutlined />
            </a>
          )}
        </Space>
      ),
    },
    { title: "Config", key: "config", render: (_, l) => l.config || (l.bedrooms ? `${l.bedrooms} BHK` : "-") },
    { title: "Floor", dataIndex: "floor", width: 70 },
    { title: "Area", key: "area", render: (_, l) => (l.area ? `${l.area} sqft` : "-") },
    { title: "Price", key: "price", render: (_, l) => formatPrice(l.price) },
    { title: "Status", key: "status", render: (_, l) => (l.status ? <Tag>{l.status}</Tag> : "-") },
    {
      title: "Mapped to",
      key: "mapped",
      render: (_, l) => {
        const owner = owners.get(l.id);
        return owner ? <ProjectLink match={owner} /> : <Typography.Text type="secondary">-</Typography.Text>;
      },
    },
  ];

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Space>
        <Button type="primary" size="small" disabled={!selected.length} onClick={() => onMap(selected)}>
          Map selected{selected.length ? ` (${selected.length})` : ""}
        </Button>
        <Popconfirm
          title={`Unmap ${selectedMapped.length} listing(s)?`}
          disabled={!selectedMapped.length}
          onConfirm={unmap}
        >
          <Button size="small" danger disabled={!selectedMapped.length} loading={updateMapping.isPending}>
            Unmap selected{selectedMapped.length ? ` (${selectedMapped.length})` : ""}
          </Button>
        </Popconfirm>
      </Space>
      <Table
        rowKey="id"
        size="small"
        columns={columns}
        dataSource={listings}
        pagination={false}
        rowSelection={{ selectedRowKeys: selected, onChange: (keys) => setSelected(keys as number[]) }}
      />
    </Space>
  );
}

export function IvyProjectMapping() {
  const { data, isLoading, error, refetch, isFetching } = useIvyMappings();
  const runMatching = useRunIvyMatching();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<{ row: IvyMappingRow; listingIds?: number[] } | null>(null);

  const rows = useMemo(() => data?.rows ?? [], [data]);
  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      all: rows.length,
      mapped: 0,
      partial: 0,
      suggested: 0,
      unmatched: 0,
      stale: 0,
      error: 0,
    };
    for (const row of rows) {
      for (const f of ["mapped", "partial", "suggested", "unmatched", "stale", "error"] as const) {
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
          row.mappings.some((m) => m.name.toLowerCase().includes(q)) ||
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
        (a.mappings[0]?.score ?? a.suggestion?.score ?? -1) - (b.mappings[0]?.score ?? b.suggestion?.score ?? -1),
      render: (_, row) => {
        if (row.mappings.length)
          return (
            <Space direction="vertical" size={2}>
              {row.mappings.map((m) => (
                <Space key={m._id} size={4} wrap>
                  <ProjectLink match={m} />
                  <MatchTags match={m} />
                  {m.listingIds && <Tag color="cyan">{m.listingIds.length} listing(s)</Tag>}
                </Space>
              ))}
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
        <Tooltip title="Map the whole Ivy project">
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              setEditing({ row });
            }}
          >
            Edit
          </Button>
        </Tooltip>
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
              { value: "partial", label: `Partially mapped (${counts.partial})` },
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
          description="Confident matches get the Ivy inventory status written to the Brickfi project. Existing (and partial) mappings are kept."
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
            summary.partial ?? 0
          } partially mapped, ${summary.suggested ?? 0} suggested, ${summary.unmatched ?? 0} unmatched${
            summary.error ? `, ${summary.error} failed` : ""
          }`}
        />
      )}

      <Table
        rowKey={(row) => `${row.outcome === "stale" ? "stale" : "ivy"}-${row.ivyProject.id}`}
        size="small"
        loading={isLoading || isFetching || runMatching.isPending}
        columns={columns}
        dataSource={visible}
        pagination={{ defaultPageSize: 50, showSizeChanger: true }}
        expandable={{
          expandRowByClick: true,
          rowExpandable: (row) => !!row.ivyProject.listings?.length,
          expandedRowRender: (row) => (
            <ListingsPanel row={row} onMap={(listingIds) => setEditing({ row, listingIds })} />
          ),
        }}
      />

      {editing && (
        <MappingDialog
          key={`${editing.row.ivyProject.id}-${editing.listingIds?.join(",") ?? "all"}`}
          row={editing.row}
          listingIds={editing.listingIds}
          onClose={() => setEditing(null)}
        />
      )}
    </Space>
  );
}
