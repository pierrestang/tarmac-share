import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Demande, DemandeStatus, DemandeSnapshot } from "@/types/demande";
import type { Profile } from "@/types/profile";

function mapRow(row: any): Demande {
  return {
    id: row.id,
    type: row.type,
    status: row.status,
    fromProfileId: row.from_profile_id,
    toProfileId: row.to_profile_id,
    fromTrajetId: row.from_trajet_id,
    toTrajetId: row.to_trajet_id,
    snapshot: row.snapshot || undefined,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  };
}

export function useDemandes() {
  const [demandes, setDemandes] = useState<Demande[]>([]);

  const fetchDemandes = useCallback(async () => {
    const { data } = await supabase.from("demandes").select("*").order("created_at", { ascending: false });
    if (data) setDemandes(data.map(mapRow));
  }, []);

  useEffect(() => {
    fetchDemandes();
  }, [fetchDemandes]);

  const createDemande = useCallback(
    async (data: Omit<Demande, "id" | "createdAt" | "updatedAt" | "status">): Promise<Demande> => {
      const now = Date.now();
      const { data: inserted, error } = await supabase
        .from("demandes")
        .insert({
          type: data.type,
          status: "pending",
          from_profile_id: data.fromProfileId,
          to_profile_id: data.toProfileId,
          from_trajet_id: data.fromTrajetId,
          to_trajet_id: data.toTrajetId,
          snapshot: data.snapshot ? (data.snapshot as any) : null,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();
      if (error) throw error;
      const demande = mapRow(inserted);
      setDemandes((prev) => [demande, ...prev]);
      return demande;
    },
    []
  );

  const updateDemandeStatus = useCallback(
    async (id: string, status: DemandeStatus): Promise<Demande | null> => {
      const now = Date.now();
      const { data, error } = await supabase
        .from("demandes")
        .update({ status, updated_at: now })
        .eq("id", id)
        .select()
        .single();
      if (error || !data) return null;
      const updated = mapRow(data);
      setDemandes((prev) => prev.map((d) => (d.id === id ? updated : d)));
      return updated;
    },
    []
  );

  const acceptDemande = useCallback(
    async (id: string, getProfileById?: (id: string) => Profile | null): Promise<Demande | null> => {
      const demande = demandes.find((d) => d.id === id);
      if (!demande) return null;

      const result = await updateDemandeStatus(id, "accepted");
      if (!result) return null;

      // Save snapshot at acceptance time
      await saveDemandeSnapshotInternal(id);

      // Withdraw other pending demands from same sender for same trajet
      const otherPending = demandes.filter(
        (d) => d.id !== id && d.status === "pending" && d.fromProfileId === demande.fromProfileId && d.fromTrajetId === demande.fromTrajetId
      );

      if (otherPending.length > 0) {
        const senderName = getProfileById?.(demande.fromProfileId)?.firstName || "Un voyageur";
        
        for (const d of otherPending) {
          // Create withdrawn notification
          await supabase.from("notifications").insert({
            profile_id: d.toProfileId,
            type: "demande_withdrawn",
            title: "Demande retirée",
            message: `${senderName} a retiré sa demande`,
            demande_id: d.id,
            related_profile_id: demande.fromProfileId,
            read: false,
            created_at: Date.now(),
          });
        }

        // Delete the other pending demands
        const ids = otherPending.map((d) => d.id);
        await supabase.from("demandes").delete().in("id", ids);
        setDemandes((prev) => prev.filter((d) => !ids.includes(d.id)));
      }

      return result;
    },
    [demandes, updateDemandeStatus]
  );

  const saveDemandeSnapshotInternal = async (id: string) => {
    // Fetch fresh data from DB
    const { data: demandeRow } = await supabase.from("demandes").select("*").eq("id", id).single();
    if (!demandeRow || demandeRow.snapshot) return;

    const { data: fromTrajet } = await supabase.from("trajets").select("*").eq("id", demandeRow.from_trajet_id).single();
    const { data: toTrajet } = await supabase.from("trajets").select("*").eq("id", demandeRow.to_trajet_id).single();
    const { data: fromProfile } = await supabase.from("profiles").select("*").eq("id", demandeRow.from_profile_id).single();
    const { data: toProfile } = await supabase.from("profiles").select("*").eq("id", demandeRow.to_profile_id).single();

    if (!fromTrajet || !toTrajet || !fromProfile || !toProfile) return;

    // Import mapRow from use-trajets would cause circular dep, inline the mapping
    const snapshot: DemandeSnapshot = {
      fromTrajet: {
        id: fromTrajet.id, profileId: fromTrajet.profile_id, date: fromTrajet.date,
        departureStation: fromTrajet.departure_station,
        departureStationCoords: fromTrajet.departure_station_lat != null ? { lat: fromTrajet.departure_station_lat, lng: fromTrajet.departure_station_lng } : undefined,
        departureTime: fromTrajet.departure_time, destination: fromTrajet.destination,
        destinationCoords: fromTrajet.destination_lat != null ? { lat: fromTrajet.destination_lat, lng: fromTrajet.destination_lng } : undefined,
        companions: fromTrajet.companions, baggage: { small: fromTrajet.baggage_small, medium: fromTrajet.baggage_medium, large: fromTrajet.baggage_large },
        desiredDeparture: fromTrajet.desired_departure, additionalInfo: fromTrajet.additional_info,
        createdAt: Number(fromTrajet.created_at), isRepublished: fromTrajet.is_republished,
      },
      toTrajet: {
        id: toTrajet.id, profileId: toTrajet.profile_id, date: toTrajet.date,
        departureStation: toTrajet.departure_station,
        departureStationCoords: toTrajet.departure_station_lat != null ? { lat: toTrajet.departure_station_lat, lng: toTrajet.departure_station_lng } : undefined,
        departureTime: toTrajet.departure_time, destination: toTrajet.destination,
        destinationCoords: toTrajet.destination_lat != null ? { lat: toTrajet.destination_lat, lng: toTrajet.destination_lng } : undefined,
        companions: toTrajet.companions, baggage: { small: toTrajet.baggage_small, medium: toTrajet.baggage_medium, large: toTrajet.baggage_large },
        desiredDeparture: toTrajet.desired_departure, additionalInfo: toTrajet.additional_info,
        createdAt: Number(toTrajet.created_at), isRepublished: toTrajet.is_republished,
      },
      fromProfile: { id: fromProfile.id, firstName: fromProfile.first_name, lastName: fromProfile.last_name, description: fromProfile.description, photo: fromProfile.photo },
      toProfile: { id: toProfile.id, firstName: toProfile.first_name, lastName: toProfile.last_name, description: toProfile.description, photo: toProfile.photo },
    };

    await supabase.from("demandes").update({ snapshot: snapshot as any }).eq("id", id);
    setDemandes((prev) => prev.map((d) => (d.id === id ? { ...d, snapshot } : d)));
  };

  const refuseDemande = useCallback(
    async (id: string): Promise<Demande | null> => {
      return updateDemandeStatus(id, "refused");
    },
    [updateDemandeStatus]
  );

  const saveDemandeSnapshot = useCallback(async (id: string): Promise<boolean> => {
    try {
      await saveDemandeSnapshotInternal(id);
      return true;
    } catch {
      return false;
    }
  }, []);

  const completeDemande = useCallback(
    async (id: string): Promise<Demande | null> => {
      // Try to save snapshot first if not already saved
      await saveDemandeSnapshotInternal(id);
      return updateDemandeStatus(id, "completed");
    },
    [updateDemandeStatus]
  );

  const withdrawDemande = useCallback(
    async (id: string): Promise<boolean> => {
      const { error } = await supabase.from("demandes").delete().eq("id", id);
      if (error) return false;
      setDemandes((prev) => prev.filter((d) => d.id !== id));
      return true;
    },
    []
  );

  const getDemandesByProfile = useCallback(
    (profileId: string): Demande[] => {
      return demandes.filter((d) => d.fromProfileId === profileId || d.toProfileId === profileId);
    },
    [demandes]
  );

  const getDemandeById = useCallback(
    (id: string): Demande | null => {
      return demandes.find((d) => d.id === id) || null;
    },
    [demandes]
  );

  const getPendingDemandeByTrajetIds = useCallback(
    (fromTrajetId: string, toTrajetId: string): Demande | null => {
      return demandes.find((d) => d.status === "pending" && d.fromTrajetId === fromTrajetId && d.toTrajetId === toTrajetId) || null;
    },
    [demandes]
  );

  const hasDemandesForTrajet = useCallback(
    (trajetId: string): boolean => {
      return demandes.some(
        (d) => (d.status === "pending" || d.status === "accepted") && (d.fromTrajetId === trajetId || d.toTrajetId === trajetId)
      );
    },
    [demandes]
  );

  const resetDemandes = useCallback(async () => {
    setDemandes([]);
  }, []);

  return {
    demandes,
    createDemande,
    acceptDemande,
    refuseDemande,
    completeDemande,
    saveDemandeSnapshot,
    withdrawDemande,
    updateDemandeStatus,
    getDemandesByProfile,
    getDemandeById,
    getPendingDemandeByTrajetIds,
    hasDemandesForTrajet,
    resetDemandes,
  };
}
