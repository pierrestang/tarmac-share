import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/types/profile";

const ACTIVE_PROFILE_KEY = "activeProfileId";

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

  const createProfile = useCallback(async (data: Omit<Profile, "id" | "createdAt">): Promise<Profile> => {
    // Check for existing profile with same name
    const { data: existing } = await supabase
      .from("profiles")
      .select("*")
      .ilike("first_name", data.firstName.trim())
      .ilike("last_name", data.lastName.trim())
      .limit(1);

    if (existing && existing.length > 0) {
      return mapRow(existing[0]);
    }

    const { data: inserted, error } = await supabase
      .from("profiles")
      .insert({
        first_name: data.firstName.trim(),
        last_name: data.lastName.trim(),
        description: data.description,
        photo: data.photo,
        created_at: Date.now(),
      })
      .select()
      .single();

    if (error) throw error;
    const profile = mapRow(inserted);
    setProfiles((prev) => [...prev, profile]);
    return profile;
  }, []);

  const updateProfile = useCallback(async (id: string, data: Partial<Omit<Profile, "id" | "createdAt">>): Promise<void> => {
    const updates: any = {};
    if (data.firstName !== undefined) updates.first_name = data.firstName;
    if (data.lastName !== undefined) updates.last_name = data.lastName;
    if (data.description !== undefined) updates.description = data.description;
    if (data.photo !== undefined) updates.photo = data.photo;

    await supabase.from("profiles").update(updates).eq("id", id);
    setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
  }, []);

  const deleteProfile = useCallback(async (id: string): Promise<void> => {
    await supabase.from("profiles").delete().eq("id", id);
    setProfiles((prev) => prev.filter((p) => p.id !== id));
    if (localStorage.getItem(ACTIVE_PROFILE_KEY) === id) {
      localStorage.removeItem(ACTIVE_PROFILE_KEY);
    }
  }, []);

  const setActiveProfile = useCallback((id: string): void => {
    localStorage.setItem(ACTIVE_PROFILE_KEY, id);
    // Force re-render
    setProfiles((prev) => [...prev]);
  }, []);

  const getActiveProfile = useCallback((): Profile | null => {
    const id = localStorage.getItem(ACTIVE_PROFILE_KEY);
    if (!id) return null;
    return profiles.find((p) => p.id === id) || null;
  }, [profiles]);

  const getProfileById = useCallback((id: string): Profile | null => {
    return profiles.find((p) => p.id === id) || null;
  }, [profiles]);

  return {
    profiles,
    createProfile,
    updateProfile,
    deleteProfile,
    setActiveProfile,
    getActiveProfile,
    getProfileById,
  };
}
