export type MissionStatus = "PENDING" | "ASSIGNED" | "IN_PROGRESS" | "RESOLVED" | "REJECTED";
export type MissionPriority = "LOW" | "MEDIUM" | "HIGH";
export type ReportCategory =
  | "WASTE_DUMP"
  | "BIN_OVERFLOW"
  | "DRAIN_BLOCKED"
  | "FLOOD_RISK"
  | "ROAD_DAMAGE"
  | "BURNING_WASTE"
  | "INDUSTRIAL_WASTE"
  | "OTHER";

// ─── Hiérarchie géographique ───────────────────────────────────────────────────

export interface CommunauteUrbaine {
  id: number;
  name: string;
  createdAt?: string;
}

export interface Commune {
  id: number;
  name: string;
  communauteUrbaineId: number;
  communauteUrbaine?: CommunauteUrbaine;
  districts?: District[];
  createdAt?: string;
}

export interface District {
  id: number;
  name: string;
  communeId: number;
  commune?: Pick<Commune, "id" | "name" | "communauteUrbaine">;
  latitude?: number;
  longitude?: number;
  createdAt?: string;
}

// ─── Statistiques de zone ──────────────────────────────────────────────────────

export interface DistrictStats {
  district: District;
  collectionsCount: number;
  resolvedMissions: number;
  pendingMissions: number;
  tonnage: number;          // en kg
  collectionRate: number;   // 0–100
  binsCount: number;
  lastCollectionAt?: string;
}

export interface CommuneStats {
  commune: Commune;
  districts: DistrictStats[];
  totalCollections: number;
  totalTonnage: number;     // en kg
  avgCollectionRate: number;
  totalBins: number;
  resolvedMissions: number;
  pendingMissions: number;
}

export interface CUStats {
  cu: CommunauteUrbaine;
  communes: CommuneStats[];
  totalCollections: number;
  totalTonnage: number;
  avgCollectionRate: number;
}

// ─── User & auth ───────────────────────────────────────────────────────────────

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  phone?: string;
  /** @deprecated préférer district/commune */
  quartier?: string;
  districtId?: number;
  communeId?: number;
  district?: Pick<District, "id" | "name">;
  commune?: Pick<Commune, "id" | "name">;
}

export interface Mission {
  id: number;
  title?: string;
  description?: string;
  status: MissionStatus;
  priority: MissionPriority;
  category: ReportCategory;
  location?: string;
  latitude?: number;
  longitude?: number;
  photoUrl?: string;
  proofPhotoUrl?: string;
  proofLatitude?: number;
  proofLongitude?: number;
  createdAt: string;
  updatedAt: string;
  assignedTo?: number;
  reporter?: { id: number; name: string; phone?: string };
  districtId?: number;
  district?: {
    id: number;
    name: string;
    commune?: { id: number; name: string; communauteUrbaine?: { id: number; name: string } };
  };
}

export interface Message {
  id: number;
  content: string;
  createdAt: string;
  senderId: number;
  sender: { id: number; name: string };
  conversationId: number;
}

export interface Conversation {
  id: number;
  listingId?: number;
  buyerId: number;
  createdAt: string;
  updatedAt: string;
  buyer?: { id: number; name: string };
  messages: Message[];
}

export interface AuthState {
  token: string | null;
  user: User | null;
}
