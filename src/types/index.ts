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

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  phone?: string;
  quartier?: string;
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
