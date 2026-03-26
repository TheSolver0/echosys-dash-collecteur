import type { MissionStatus, MissionPriority } from "../types";

export const STATUS_LABEL: Record<MissionStatus, string> = {
  PENDING:     "En attente",
  ASSIGNED:    "Assignée",
  IN_PROGRESS: "En cours",
  RESOLVED:    "Terminée",
  REJECTED:    "Rejetée",
};

export const STATUS_STYLE: Record<MissionStatus, string> = {
  PENDING:     "bg-blue-50 text-blue-600",
  ASSIGNED:    "bg-purple-50 text-purple-600",
  IN_PROGRESS: "bg-orange-50 text-orange-500",
  RESOLVED:    "bg-green-50 text-green-600",
  REJECTED:    "bg-red-50 text-red-500",
};

export const PRIORITY_COLOR: Record<MissionPriority, string> = {
  HIGH:   "bg-red-400",
  MEDIUM: "bg-orange-400",
  LOW:    "bg-gray-300",
};

export const CATEGORY_LABEL: Record<string, string> = {
  WASTE_DUMP:       "Dépôt sauvage",
  BIN_OVERFLOW:     "Bac débordé",
  DRAIN_BLOCKED:    "Caniveau bouché",
  FLOOD_RISK:       "Risque inondation",
  ROAD_DAMAGE:      "Route dégradée",
  BURNING_WASTE:    "Brûlage déchets",
  INDUSTRIAL_WASTE: "Rejets industriels",
  OTHER:            "Autre",
};

export function MissionBadge({ status }: { status: MissionStatus }) {
  return (
    <span className={`text-[10px] font-bold px-2 py-[3px] rounded-md flex-shrink-0 ${STATUS_STYLE[status]}`}>
      {STATUS_LABEL[status].toUpperCase()}
    </span>
  );
}

export function PriorityBar({ priority }: { priority: MissionPriority }) {
  return <div className={`w-[3px] h-9 rounded-full flex-shrink-0 ${PRIORITY_COLOR[priority]}`} />;
}
