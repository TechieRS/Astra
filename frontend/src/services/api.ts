import type {
  Command,
  LearningReport,
  MediaResult,
  Mission,
  MissionState,
  SourceCatalog,
} from "../types";

const base = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${base}/api${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new ApiError(
      "Mission control is unreachable. Check your connection and try again. Your saved progress is safe on the server.",
      0,
    );
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(
      typeof body.detail === "string"
        ? body.detail
        : "Mission control could not accept that request. Please try again.",
      response.status,
    );
  }
  return response.json() as Promise<T>;
}
export const api = {
  mission: () => request<Mission>("/missions/lunar-outpost"),
  create: (callsign: string, seed = 42) =>
    request<MissionState>("/sessions", {
      method: "POST",
      body: JSON.stringify({ callsign, seed }),
    }),
  state: (id: string) => request<MissionState>(`/sessions/${id}`),
  action: (id: string, command: Command, version: number, actionId: string) =>
    request<MissionState>(`/sessions/${id}/actions`, {
      method: "POST",
      body: JSON.stringify({ ...command, version, action_id: actionId }),
    }),
  report: (id: string) => request<LearningReport>(`/sessions/${id}/report`),
  sources: () => request<SourceCatalog>("/nasa/sources"),
  images: () => request<MediaResult>("/nasa/images"),
  explain: (topic: string) =>
    request<{ explanation: string }>("/education/explain", {
      method: "POST",
      body: JSON.stringify({ topic }),
    }),
};
