export type DataProvenanceKind = "real_api" | "mock" | "fallback";

export const DEV_DATA_LABEL: Record<DataProvenanceKind, string> = {
  real_api: "Real API Data",
  mock: "Mock Data",
  fallback: "Fallback Used",
};

export function devDataLabelsEnabled(): boolean {
  return process.env.NODE_ENV === "development";
}
