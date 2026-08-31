import { ScriptParam, ScriptSpec } from "./api/manage-scripts";

export type ParamValues = Record<string, unknown>;

export const OBJECT_ID = /^[0-9a-f]{24}$/i;

const isEmpty = (v: unknown) =>
  v === undefined ||
  v === null ||
  v === "" ||
  (Array.isArray(v) && v.length === 0);

export function activeParams(
  spec: ScriptSpec,
  modeKey?: string,
): ScriptParam[] {
  const mode = spec.modes?.find((m) => m.key === modeKey);
  return [...(mode?.params ?? []), ...spec.params];
}

function toArgv(param: ScriptParam, value: unknown): string[] {
  switch (param.arg.style) {
    case "bool":
      return value === true ? [param.arg.flag] : [];
    case "flag":
      return [`${param.arg.flag}=${String(value).trim()}`];
    case "flag-repeat": {
      const flag = param.arg.flag;
      return (Array.isArray(value) ? value : [value])
        .map((v) => String(v).trim())
        .filter(Boolean)
        .map((v) => `${flag}=${v}`);
    }
    case "positional":
      return [String(value).trim()];
    case "positional-csv": {
      const list = (Array.isArray(value) ? value : [value])
        .map((v) => String(v).trim())
        .filter(Boolean);
      return list.length ? [list.join(",")] : [];
    }
  }
}

export function buildArgs(
  spec: ScriptSpec,
  modeKey: string | undefined,
  values: ParamValues,
): string[] {
  const params = activeParams(spec, modeKey).filter(
    (p) => !isEmpty(values[p.name]),
  );

  const positional = params.filter((p) => p.arg.style.startsWith("positional"));
  const flags = params.filter((p) => !p.arg.style.startsWith("positional"));

  return [...positional, ...flags].flatMap((p) => toArgv(p, values[p.name]));
}

export function missingRequired(
  spec: ScriptSpec,
  modeKey: string | undefined,
  values: ParamValues,
): string[] {
  return activeParams(spec, modeKey)
    .filter((p) => p.required && isEmpty(values[p.name]))
    .map((p) => p.label);
}
