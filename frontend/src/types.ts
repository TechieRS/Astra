export type Status =
  | "BRIEFING"
  | "PREPARATION"
  | "ACTIVE"
  | "PAUSED"
  | "COMPLETED"
  | "FAILED";
export type EquipmentId =
  | "oxygen_tank"
  | "solar_tools"
  | "rover_battery"
  | "radiation_shield";
export type SiteId = "habitat" | "solar" | "ridge" | "crater" | "shelter";
export type ActionKind =
  | "prepare"
  | "launch"
  | "move"
  | "travel"
  | "inspect"
  | "repair"
  | "bypass"
  | "sample"
  | "shelter"
  | "wait"
  | "return"
  | "abort"
  | "pause"
  | "resume";
export interface Command {
  kind: ActionKind;
  target?: SiteId;
  x?: number;
  y?: number;
  equipment?: EquipmentId[];
}
export interface LogEntry {
  id: string;
  kind: string;
  title: string;
  explanation: string;
  time: number;
  delta: Record<string, number>;
}
export interface AvailableAction extends Command {
  label: string;
  cost: string;
}
export interface MissionState {
  id: string;
  version: number;
  mission_id: string;
  callsign: string;
  seed: number;
  status: Status;
  equipment: EquipmentId[];
  oxygen: number;
  oxygen_capacity: number;
  power: number;
  power_capacity: number;
  risk: number;
  elapsed: number;
  position: { x: number; y: number };
  inspected: boolean;
  array_status: "unknown" | "broken" | "repaired" | "bypassed";
  samples: SiteId[];
  storm_at: number;
  storm: boolean;
  sheltered: boolean;
  outcome: string | null;
  log: LogEntry[];
  objectives: { id: string; title: string; done: boolean }[];
  available_actions: AvailableAction[];
  last_path: number[][];
}
export interface Mission {
  id: string;
  title: string;
  number: string;
  description: string;
  duration: string;
  difficulty: string;
  location: string;
  equipment: {
    id: EquipmentId;
    name: string;
    description: string;
    benefit: string;
    icon: string;
  }[];
  map: {
    width: number;
    height: number;
    sites: Record<SiteId, { x: number; y: number; name: string; hint: string }>;
    blocked: number[][];
  };
}
export interface Source {
  id: string;
  title: string;
  url: string;
  organization: string;
  kind: string;
  observation_date: string | null;
  retrieved_at: string;
  summary: string;
  gameplay_use: string;
  limitations: string;
  credit: string;
  license_url: string;
}
export interface SourceCatalog {
  notice: string;
  retrieved_at: string;
  sources: Source[];
}
export interface MediaResult {
  mode: "nasa_api" | "offline_reference";
  retrieved_at: string;
  note: string;
  items: {
    nasa_id: string;
    title: string;
    catalog_date: string;
    thumbnail: string;
    credit: string;
  }[];
}
export interface LearningReport {
  outcome: string;
  minutes: number;
  samples: number;
  resources: { oxygen: number; power: number; risk: number };
  badges: string[];
  lessons: string[];
  decisions: LogEntry[];
  next_tip: string;
  source_ids: string[];
}
