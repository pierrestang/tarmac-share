import type { Trajet } from "./trajet";
import type { Profile } from "./profile";

export type DemandeStatus = "pending" | "accepted" | "refused" | "completed";
export type DemandeType = "sent" | "received";

// Snapshots stored when demande is completed for historical records
export interface DemandeSnapshot {
  fromTrajet: Trajet;
  toTrajet: Trajet;
  fromProfile: Omit<Profile, "createdAt">;
  toProfile: Omit<Profile, "createdAt">;
}

export interface Demande {
  id: string;
  type: DemandeType;
  status: DemandeStatus;
  fromProfileId: string;
  toProfileId: string;
  fromTrajetId: string;
  toTrajetId: string;
  createdAt: number;
  updatedAt: number;
  wasCancelled?: boolean;
  // Optional snapshot for completed demandes
  snapshot?: DemandeSnapshot;
}
