import type { Profile } from "./profile";

export interface Baggage {
  small: number;
  medium: number;
  large: number;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Trajet {
  id: string;
  profileId: string;
  date: string;
  departureStation: string;
  departureStationCoords?: Coordinates;
  departureTime: string;
  destination: string;
  destinationCoords?: Coordinates;
  companions: number;
  baggage: Baggage;
  desiredDeparture: string;
  additionalInfo: string;
  createdAt: number;
  isRepublished?: boolean;
}

export interface MatchedTraveler {
  trajet: Trajet;
  profile: Profile;
  detourMin: number; // détour en minutes pour le passager le plus impacté
  compatibilityScore: number; // 40-100%
}

export interface EnrichedMatchedTraveler extends MatchedTraveler {
  receivedDemandeId: string | null;
  sentDemandeId: string | null;
}
