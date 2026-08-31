import { useQuery } from "@tanstack/react-query";
import { OptionSource } from "../libs/api/manage-scripts";
import { getDeveloperNames } from "../libs/api/real-estate-developer";
import { getReraProjectNames } from "../libs/api/rera-project";
import { OBJECT_ID } from "../libs/build-script-args";
import { queryKeys } from "../libs/constants";

const asList = (value: unknown): string[] =>
  (Array.isArray(value) ? value : [value])
    .filter((v) => typeof v === "string" && v.trim())
    .map((v) => (v as string).trim());

/**
 * Which of the typed-in values don't exist in the db. Free entry is allowed, so
 * this only warns — it never blocks the run.
 */
export function useUnknownValues(
  source: OptionSource | undefined,
  value: unknown,
  enabled: boolean,
): { unknown: string[]; checking: boolean } {
  const remote = source?.kind === "remote" ? source : undefined;
  const values = enabled ? asList(value) : [];

  const developers = useQuery({
    queryKey: [queryKeys.getDeveloperNames],
    queryFn: getDeveloperNames,
    enabled: remote?.name === "developers" && values.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const reraLookup = useQuery({
    queryKey: [queryKeys.getReraProjectNames, "lookup", values.join(",")],
    queryFn: () => getReraProjectNames({ reraNumbers: values.join(",") }),
    enabled: remote?.name === "reraProjects" && values.length > 0,
  });

  if (!remote || values.length === 0) {
    return { unknown: [], checking: false };
  }

  if (remote.name === "developers") {
    if (!developers.data) {
      return { unknown: [], checking: developers.isFetching };
    }
    const ids = new Set(developers.data.map((d) => d._id));
    const names = new Set(
      developers.data.map((d) => (d.name ?? "").trim().toLowerCase()),
    );
    return {
      unknown: values.filter((v) =>
        OBJECT_ID.test(v) ? !ids.has(v) : !names.has(v.toLowerCase()),
      ),
      checking: developers.isFetching,
    };
  }

  if (remote.name === "reraProjects") {
    if (!reraLookup.data) {
      return { unknown: [], checking: reraLookup.isFetching };
    }
    const found = new Set(
      reraLookup.data
        .map((p) => p.projectReraNumber)
        .filter(Boolean) as string[],
    );
    return {
      unknown: values.filter((v) => !found.has(v)),
      checking: reraLookup.isFetching,
    };
  }

  return { unknown: [], checking: false };
}
