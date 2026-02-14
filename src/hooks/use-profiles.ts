import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/types/profile";

function mapRow(row: any): Profile {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    description: row.description || "",
    photo: row.photo || null,
    createdAt: Number(row.created_at),
  };
}

export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);

  const fetchProfiles = useCallback(async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: true });
    if (data) setProfiles(data.map(mapRow));
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const updateProfile = useCallback(async (id: string, data: Partial<Omit<Profile, "id" | "createdAt">>): Promise<void> => {
    const updates: any = {};
    if (data.firstName !== undefined) updates.first_name = data.firstName;
    if (data.lastName !== undefined) updates.last_name = data.lastName;
    if (data.description !== undefined) updates.description = data.description;
    if (data.photo !== undefined) updates.photo = data.photo;

    await supabase.from("profiles").update(updates).eq("id", id);
    setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
  }, []);

  const getActiveProfile = useCallback((): Profile | null => {
    // With auth, there's only one profile per user (the first one)
    return profiles[0] || null;
  }, [profiles]);

  const getProfileById = useCallback((id: string): Profile | null => {
    return profiles.find((p) => p.id === id) || null;
  }, [profiles]);

  return {
    profiles,
    updateProfile,
    getActiveProfile,
    getProfileById,
    refetch: fetchProfiles,
  };
}
