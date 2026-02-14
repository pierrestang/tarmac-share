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
const DEFAULT_MAX_DETOUR = 10;

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

export function calculateMatchScore(trajet1: Trajet, trajet2: Trajet): number {
  const time1 = parseTime(trajet1.departureTime);
  const time2 = parseTime(trajet2.departureTime);
  const timeDiff = time1 !== null && time2 !== null ? Math.abs(time1 - time2) : 15;
  let distance = calculateDistance(trajet1.destinationCoords, trajet2.destinationCoords);
  if (distance !== null && distance < 0.5) distance = 0;

  let score = 40;
  score += Math.max(0, 15 - timeDiff);
  if (distance === 0) score += 30;
  else if (distance !== null) score += Math.max(0, 30 * (1 - distance / DEFAULT_MAX_DETOUR));
  return Math.round((score / 85) * 100);
}

export function getArchivedTrajet(_id: string): Trajet | null {
  // Archive is no longer needed with Supabase - demandes store snapshots
  return null;
}

export function useTrajets() {
  const [trajets, setTrajets] = useState<Trajet[]>([]);

  const fetchTrajets = useCallback(async () => {
    const { data } = await supabase.from("trajets").select("*").order("created_at", { ascending: true });
    if (data) setTrajets(data.map(mapRow));
  }, []);

  useEffect(() => {
    fetchTrajets();
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
    (trajetId: string): MatchedTraveler[] => {
      const currentTrajet = trajets.find((t) => t.id === trajetId);
      if (!currentTrajet) return [];

      // We need profiles - fetch them from state. For now, load from supabase cache not available here.
      // We'll load profiles separately. For matching, we filter trajets client-side.
      const currentTime = parseTime(currentTrajet.departureTime);
      const currentBaggageVolume = calculateBaggageVolume(currentTrajet.baggage);
      const currentPersons = currentTrajet.companions;
      const currentDateNormalized = normalizeDate(currentTrajet.date);

      const matches: MatchedTraveler[] = [];

      for (const trajet of trajets) {
        if (trajet.id === currentTrajet.id) continue;
        if (trajet.profileId === currentTrajet.profileId) continue;
        if (normalizeDate(trajet.date) !== currentDateNormalized) continue;
        if (trajet.departureStation.toLowerCase() !== currentTrajet.departureStation.toLowerCase()) continue;

        const trajetTime = parseTime(trajet.departureTime);
        if (currentTime === null || trajetTime === null) continue;
        const timeDiff = Math.abs(currentTime - trajetTime);
        if (timeDiff > 15) continue;

        const trajetPersons = trajet.companions;
        if (currentPersons + trajetPersons > 4) continue;

        const trajetBaggageVolume = calculateBaggageVolume(trajet.baggage);
        if (currentBaggageVolume + trajetBaggageVolume > MAX_CAPACITY) continue;

        let distance = calculateDistance(currentTrajet.destinationCoords, trajet.destinationCoords);
        if (distance === null) continue;
        if (distance > DEFAULT_MAX_DETOUR) continue;
        if (distance < 0.5) distance = 0;

        let score = 40;
        score += Math.max(0, 15 - timeDiff);
        if (distance === 0) score += 30;
        else score += Math.max(0, 30 * (1 - distance / DEFAULT_MAX_DETOUR));
        score = Math.round((score / 85) * 100);

        // Profile will be resolved by the caller (Matches page) using useProfiles
        matches.push({
          trajet,
          profile: { id: trajet.profileId, firstName: "", lastName: "", description: "", photo: null, createdAt: 0 },
          distance: Math.round(distance * 10) / 10,
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
    // Not implemented for safety - would delete all trajets
    setTrajets([]);
  }, []);

  return {
    trajets,
    createTrajet,
    updateTrajet,
    deleteTrajet,
    getTrajetById,
    findMatches,
    isDuplicateTrajet,
    resetTrajets,
  };
}
