import { en, type Dictionary } from "./locales/en";
import { id } from "./locales/id";

export type { Dictionary };
export type Lang = "id" | "en";

export const dictionaries: Record<Lang, Dictionary> = { en, id };

/** Fill {name} placeholders: fmt("Based on {n} workloads", { n: 3 }) */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}
