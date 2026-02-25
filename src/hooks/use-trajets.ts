import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Trajet, MatchedTraveler, Baggage, Coordinates } from "@/types/trajet";
import type { Profile } from "@/types/profile";

const BAGGAGE_SIZES = {
  small: 50,
  medium: 70,
  large: 120,
} as const;

const MAX_CAPACITY = 360;
const MAX_DETOUR_MIN = 15;
const MAX_TOTAL_TRIP_MIN = 45;
const HAVERSINE_PRE_FILTER_KM = 30;

function mapRow(row: any): Trajet {
  return {
    id: row.id,
    profileId: row.profile_id,
    date: row.date,
    departureStation: row.departure_station,
    departureStationCoords: row.departure_station_lat != null
      ? { lat: row.departure_station_lat, lng: row.departure_station_lng }
      : undefined,
    departureTime: row.departure_time,
    destination: row.destination,
    destinationCoords: row.destination_lat != null
      ? { lat: row.destination_lat, lng: row.destination_lng }
      : undefined,
    companions: row.companions,
    baggage: {
      small: row.baggage_small,
      medium: row.baggage_medium,
      large: row.baggage_large,
    },
    desiredDeparture: row.desired_departure,
    additionalInfo: row.additional_info,
    createdAt: Number(row.created_at),
    isRepublished: row.is_republished,
  };
}

function toDbRow(data: Omit<Trajet, "id" | "createdAt">) {
  return {
    profile_id: data.profileId,
    date: data.date,
    departure_station: data.departureStation,
    departure_station_lat: data.departureStationCoords?.lat ?? null,
    departure_station_lng: data.departureStationCoords?.lng ?? null,
    departure_time: data.departureTime,
    destination: data.destination,
    destination_lat: data.destinationCoords?.lat ?? null,
    destination_lng: data.destinationCoords?.lng ?? null,
    companions: data.companions,
    baggage_small: data.baggage.small,
    baggage_medium: data.baggage.medium,
    baggage_large: data.baggage.large,
    desired_departure: data.desiredDeparture,
    additional_info: data.additionalInfo,
    is_republished: data.isRepublished || false,
    created_at: Date.now(),
  };
}

function calculateBaggageVolume(baggage: Baggage): number {
  return baggage.small * BAGGAGE_SIZES.small + baggage.medium * BAGGAGE_SIZES.medium + baggage.large * BAGGAGE_SIZES.large;
}

function parseTime(timeStr: string): number | null {
  const slotMatch = timeStr.match(/^(\d{1,2})[h:](\d{2})\s*-/);
  if (slotMatch) {
    return parseInt(slotMatch[1]) * 60 + parseInt(slotMatch[2]);
  }
  const match = timeStr.match(/(\d{1,2})[h:](\d{2})/i);
  if (!match) return null;
  return parseInt(match[1]) * 60 + parseInt(match[2]);
}

function normalizeDate(dateStr: string): string {
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
  return dateStr;
}

export function calculateDistance(coords1?: Coordinates, coords2?: Coordinates): number | null {
  if (!coords1 || !coords2) return null;
  const R = 6371;
  const dLat = (coords2.lat - coords1.lat) * Math.PI / 180;
  const dLng = (coords2.lng - coords1.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(coords1.lat * Math.PI / 180) * Math.cos(coords2.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface DetourResult {
  directMinA: number;
  directMinB: number;
  totalMinAB: number;
  totalMinBA: number;
  detourA: number;
  detourB: number;
  bestOrder: "AB" | "BA";
}

export async function calculateDetourTimes(
  departureStation: Coordinates,
  myDestination: Coordinates,
  candidateDestinations: Coordinates[]
): Promise<(DetourResult | null)[]> {
  try {
    const pairs = candidateDestinations.map((dest) => ({
      destinationA: myDestination,
      destinationB: dest,
    }));

    const { data, error } = await supabase.functions.invoke("driving-distance", {
      body: {
        mode: "detour",
        departureStation,
        pairs,
      },
    });

    if (error || !data?.results) {
      console.warn("Detour API failed:", error);
      return candidateDestinations.map(() => null);
    }

    return data.results;
  } catch (e) {
    console.warn("Detour API error:", e);
    return candidateDestinations.map(() => null);
  }
}

// Keep legacy function for backward compatibility
export async function calculateDrivingDistance(
  origin: Coordinates,
  destinations: Coordinates[]
): Promise<(number | null)[]> {
  try {
    const { data, error } = await supabase.functions.invoke("driving-distance", {
      body: {
        origins: [origin],
        destinations,
      },
    });
    if (error || !data?.results?.[0]) {
      console.warn("Driving distance API failed, falling back to Haversine");
      return destinations.map((d) => calculateDistance(origin, d));
    }
    return data.results[0].map((r: { distanceKm: number | null }) => r.distanceKm);
  } catch (e) {
    console.warn("Driving distance API error:", e);
    return destinations.map((d) => calculateDistance(origin, d));
  }
}

export function getScoreColor(score: number): string {
  if (score < 50) return "#E34454";
  if (score < 65) return "#DD7E58";
  if (score < 80) return "#D9B36A";
  return "#7BA87B";
}

export function calculateMatchScore(trajet1: Trajet, trajet2: Trajet, detourMin?: number | null): number {
  const time1 = parseTime(trajet1.departureTime);
  const time2 = parseTime(trajet2.departureTime);
  const timeDiff = time1 !== null && time2 !== null ? Math.abs(time1 - time2) : 9999;

  // A. Créneau horaire (50 pts max)
  let timeScore = 0;
  if (timeDiff === 0) timeScore = 50;
  else if (timeDiff <= 30) timeScore = 35;
  else if (timeDiff <= 45) timeScore = 20;

  // B. Détour en minutes (50 pts max)
  let detourScore = 0;
  if (detourMin !== null && detourMin !== undefined) {
    if (detourMin <= 5) detourScore = 50;
    else if (detourMin <= 10) detourScore = 35;
    else if (detourMin <= 15) detourScore = 15;
  }

  return Math.min(100, timeScore + detourScore);
}

export function getArchivedTrajet(_id: string): Trajet | null {
  return null;
}

export function useTrajets() {
  const [trajets, setTrajets] = useState<Trajet[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchTrajets = useCallback(async () => {
    const { data } = await supabase.from("trajets").select("*").order("created_at", { ascending: true });
    if (data) setTrajets(data.map(mapRow));
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    fetchTrajets();

    const channel = supabase
      .channel('trajets-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trajets' }, () => {
        fetchTrajets();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchTrajets]);

  const createTrajet = useCallback(async (data: Omit<Trajet, "id" | "createdAt">): Promise<Trajet> => {
    const { data: inserted, error } = await supabase
      .from("trajets")
      .insert(toDbRow(data))
      .select()
      .single();
    if (error) throw error;
    const trajet = mapRow(inserted);
    setTrajets((prev) => [...prev, trajet]);
    return trajet;
  }, []);

  const deleteTrajet = useCallback(async (id: string): Promise<boolean> => {
    const { error } = await supabase.from("trajets").delete().eq("id", id);
    if (error) return false;
    setTrajets((prev) => prev.filter((t) => t.id !== id));
    return true;
  }, []);

  const updateTrajet = useCallback(async (id: string, updates: Partial<Trajet>): Promise<boolean> => {
    const dbUpdates: any = {};
    if (updates.date !== undefined) dbUpdates.date = updates.date;
    if (updates.departureStation !== undefined) dbUpdates.departure_station = updates.departureStation;
    if (updates.departureStationCoords !== undefined) {
      dbUpdates.departure_station_lat = updates.departureStationCoords?.lat ?? null;
      dbUpdates.departure_station_lng = updates.departureStationCoords?.lng ?? null;
    }
    if (updates.departureTime !== undefined) dbUpdates.departure_time = updates.departureTime;
    if (updates.destination !== undefined) dbUpdates.destination = updates.destination;
    if (updates.destinationCoords !== undefined) {
      dbUpdates.destination_lat = updates.destinationCoords?.lat ?? null;
      dbUpdates.destination_lng = updates.destinationCoords?.lng ?? null;
    }
    if (updates.companions !== undefined) dbUpdates.companions = updates.companions;
    if (updates.baggage !== undefined) {
      dbUpdates.baggage_small = updates.baggage.small;
      dbUpdates.baggage_medium = updates.baggage.medium;
      dbUpdates.baggage_large = updates.baggage.large;
    }
    if (updates.desiredDeparture !== undefined) dbUpdates.desired_departure = updates.desiredDeparture;
    if (updates.additionalInfo !== undefined) dbUpdates.additional_info = updates.additionalInfo;
    if (updates.isRepublished !== undefined) dbUpdates.is_republished = updates.isRepublished;

    const { error } = await supabase.from("trajets").update(dbUpdates).eq("id", id);
    if (error) return false;
    setTrajets((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    return true;
  }, []);

  const getTrajetById = useCallback((id: string): Trajet | null => {
    return trajets.find((t) => t.id === id) || null;
  }, [trajets]);

  const findMatches = useCallback(
    async (trajetId: string): Promise<MatchedTraveler[]> => {
      const currentTrajet = trajets.find((t) => t.id === trajetId);
      if (!currentTrajet) return [];

      const currentTime = parseTime(currentTrajet.departureTime);
      const currentBaggageVolume = calculateBaggageVolume(currentTrajet.baggage);
      const currentPersons = currentTrajet.companions;
      const currentDateNormalized = normalizeDate(currentTrajet.date);

      // Pre-filter candidates using basic criteria
      const candidates: Trajet[] = [];

      for (const trajet of trajets) {
        if (trajet.id === currentTrajet.id) continue;
        if (trajet.profileId === currentTrajet.profileId) continue;
        if (normalizeDate(trajet.date) !== currentDateNormalized) continue;
        if (trajet.departureStation.toLowerCase() !== currentTrajet.departureStation.toLowerCase()) continue;

        const trajetTime = parseTime(trajet.departureTime);
        if (currentTime === null || trajetTime === null) continue;
        if (Math.abs(currentTime - trajetTime) >= 60) continue;

        if (currentPersons + trajet.companions > 4) continue;

        const trajetBaggageVolume = calculateBaggageVolume(trajet.baggage);
        if (currentBaggageVolume + trajetBaggageVolume > MAX_CAPACITY) continue;

        if (!trajet.destinationCoords || !currentTrajet.destinationCoords) continue;
        if (!currentTrajet.departureStationCoords) continue;

        // Pre-filter with Haversine (generous 30km threshold)
        const haversine = calculateDistance(currentTrajet.destinationCoords, trajet.destinationCoords);
        if (haversine === null || haversine > HAVERSINE_PRE_FILTER_KM) continue;

        candidates.push(trajet);
      }

      if (candidates.length === 0) return [];

      // Calculate detour times for all candidates via edge function
      const candidateDestinations = candidates.map((t) => t.destinationCoords!);
      const detourResults = await calculateDetourTimes(
        currentTrajet.departureStationCoords!,
        currentTrajet.destinationCoords!,
        candidateDestinations
      );

      const matches: MatchedTraveler[] = [];

      for (let i = 0; i < candidates.length; i++) {
        const trajet = candidates[i];
        const detourResult = detourResults[i];
        
        if (!detourResult) continue;

        // Use the max detour between the two passengers
        const maxDetour = Math.max(detourResult.detourA, detourResult.detourB);
        const bestTotalTrip = detourResult.bestOrder === "AB" 
          ? detourResult.totalMinAB 
          : detourResult.totalMinBA;

        // Exclusion filters
        if (maxDetour > MAX_DETOUR_MIN) continue;
        if (bestTotalTrip > MAX_TOTAL_TRIP_MIN) continue;

        const timeDiff = Math.abs(parseTime(currentTrajet.departureTime)! - parseTime(trajet.departureTime)!);

        // A. Créneau horaire (50 pts max)
        let timeScore = 0;
        if (timeDiff === 0) timeScore = 50;
        else if (timeDiff <= 30) timeScore = 35;
        else if (timeDiff <= 45) timeScore = 20;

        // B. Détour (50 pts max)
        let detourScore = 0;
        if (maxDetour <= 5) detourScore = 50;
        else if (maxDetour <= 10) detourScore = 35;
        else if (maxDetour <= 15) detourScore = 15;

        const score = Math.min(100, timeScore + detourScore);

        matches.push({
          trajet,
          profile: { id: trajet.profileId, firstName: "", lastName: "", description: "", photo: null, createdAt: 0 },
          detourMin: Math.round(maxDetour),
          compatibilityScore: Math.round(score),
        });
      }

      return matches.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    },
    [trajets]
  );
  const isDuplicateTrajet = useCallback(
    (profileId: string, date: string, station: string, time: string): boolean => {
      const myTrajets = trajets.filter((t) => t.profileId === profileId);
      for (const t of myTrajets) {
        if (t.date !== date) continue;
        if (t.departureStation.toLowerCase() === station.toLowerCase()) return true;
        if (t.departureTime === time) return true;
      }
      return false;
    },
    [trajets]
  );

  const resetTrajets = useCallback(async () => {
    await supabase.from("trajets").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await fetchTrajets();
  }, [fetchTrajets]);

  return {
    trajets,
    isLoaded,
    createTrajet,
    updateTrajet,
    deleteTrajet,
    getTrajetById,
    findMatches,
    isDuplicateTrajet,
    resetTrajets,
  };
}
