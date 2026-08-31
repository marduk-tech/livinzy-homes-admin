import { useQuery } from "@tanstack/react-query";
import { getAllLivIndexPlaces } from "../libs/api/livindex-places";
import { OptionSource } from "../libs/api/manage-scripts";
import { getDeveloperNames } from "../libs/api/real-estate-developer";
import { getReraProjectNames } from "../libs/api/rera-project";
import { queryKeys } from "../libs/constants";
import { ScriptOption } from "../libs/script-options";
import { useDebouncedValue } from "./use-debounced-value";


const SEARCH_LIMIT = 50;

export function useScriptOptions(
  source: OptionSource | undefined,
  search: string,
  dependsOnValue?: unknown,
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
  }
}
