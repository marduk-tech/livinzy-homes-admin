import { useQuery } from "@tanstack/react-query";
import { getAllLivIndexPlaces } from "../libs/api/livindex-places";
import { OptionSource } from "../libs/api/manage-scripts";
import { getAllProjects } from "../libs/api/projects";
import { getDeveloperNames } from "../libs/api/real-estate-developer";
import { getReraProjectNames } from "../libs/api/rera-project";
import { OBJECT_ID } from "../libs/build-script-args";
import { queryKeys } from "../libs/constants";
import { ScriptOption } from "../libs/script-options";
import { useDebouncedValue } from "./use-debounced-value";

const SEARCH_LIMIT = 50;

const projectOption = (p: { _id: string; info?: { name?: string } }) => ({
  value: p._id,
  label: `${p.info?.name ?? "(unnamed)"} · …${p._id.slice(-6)}`,
});

const asIds = (value: unknown): string[] =>
  (Array.isArray(value) ? value : [value]).filter(
    (v): v is string => typeof v === "string" && OBJECT_ID.test(v.trim()),
  );

// picked projects, looked up by id so their tags keep a name after the search moves on
export const selectedProjectsQuery = (ids: string[]) => ({
  queryKey: [queryKeys.getProjectOptions, "ids", ids.join(",")],
  queryFn: () => getAllProjects({ projectIds: ids }),
  staleTime: 5 * 60 * 1000,
});

export function useScriptOptions(
  source: OptionSource | undefined,
  search: string,
  dependsOnValue?: unknown,
  selected?: unknown,
): { options: ScriptOption[]; loading: boolean; serverSearched: boolean } {
  const debouncedSearch = useDebouncedValue(search);

  const remote = source?.kind === "remote" ? source : undefined;
  const dependsOn = remote?.dependsOn;
  const blockedByDependency = !!dependsOn && !dependsOnValue;

  const developers = useQuery({
    queryKey: [queryKeys.getDeveloperNames],
    queryFn: getDeveloperNames,
    enabled: remote?.name === "developers",
    staleTime: 5 * 60 * 1000,
  });

  const reraProjects = useQuery({
    queryKey: [queryKeys.getReraProjectNames, debouncedSearch],
    queryFn: () =>
      getReraProjectNames({
        keyword: debouncedSearch || undefined,
        limit: SEARCH_LIMIT,
      }),
    enabled: remote?.name === "reraProjects",
  });

  const places = useQuery({
    queryKey: [queryKeys.getAllPlaces, dependsOnValue, debouncedSearch],
    queryFn: () =>
      getAllLivIndexPlaces({
        driverType: dependsOnValue ? String(dependsOnValue) : undefined,
        keyword: debouncedSearch || undefined,
        limit: SEARCH_LIMIT,
      }),
    enabled: remote?.name === "places" && !blockedByDependency,
  });

  const projects = useQuery({
    queryKey: [queryKeys.getProjectOptions, debouncedSearch],
    queryFn: () =>
      getAllProjects({ searchKeyword: debouncedSearch, limit: SEARCH_LIMIT }),
    enabled: remote?.name === "projects",
  });

  const selectedIds = remote?.name === "projects" ? asIds(selected) : [];
  const selectedProjects = useQuery({
    ...selectedProjectsQuery(selectedIds),
    enabled: selectedIds.length > 0,
  });

  if (!source) {
    return { options: [], loading: false, serverSearched: false };
  }

  if (source.kind === "static") {
    return { options: source.options, loading: false, serverSearched: false };
  }

  switch (source.name) {
    case "developers":
      return {
        options: (developers.data ?? []).map((d) => ({
          value: d._id,
          label: d.name,
        })),
        loading: developers.isFetching,
        serverSearched: false,
      };

    case "reraProjects":
      return {
        options: (reraProjects.data ?? [])
          .filter((p) => !!p.projectReraNumber)
          .map((p) => ({
            value: p.projectReraNumber as string,
            label: `${p.projectName} — ${p.projectReraNumber}`,
          })),
        loading: reraProjects.isFetching,
        serverSearched: true,
      };

    case "places":
      return {
        options: (places.data ?? []).map((p) => ({
          value: p.name,
          label: p.name,
        })),
        loading: places.isFetching,
        serverSearched: true,
      };

    case "projects": {
      const found = projects.data ?? [];
      const seen = new Set(found.map((p) => p._id));
      const picked = (selectedProjects.data ?? []).filter(
        (p) => !seen.has(p._id),
      );
      return {
        options: [...found, ...picked].map(projectOption),
        loading: projects.isFetching,
        serverSearched: true,
      };
    }

    // a source this build doesn't know yet (server deployed first): plain free entry
    default:
      return { options: [], loading: false, serverSearched: false };
  }
}
