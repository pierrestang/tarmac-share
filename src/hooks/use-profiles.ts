import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { Profile } from "@/types/profile";

interface ProfileWithUserId extends Profile {
  userId: string | null;
}

function mapRow(row: any): ProfileWithUserId {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    description: row.description || "",
    photo: row.photo || null,
    createdAt: Number(row.created_at),
    userId: row.user_id || null,
  };
}

export function useProfiles() {
  const [profiles, setProfiles] = useState<ProfileWithUserId[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { user } = useAuth();

  const fetchProfiles = useCallback(async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: true });
    if (data) setProfiles(data.map(mapRow));
    setIsLoaded(true);
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
    if (!user) return null;
    return profiles.find((p) => p.userId === user.id) || null;
  }, [profiles, user]);

  const getProfileById = useCallback((id: string): Profile | null => {
    return profiles.find((p) => p.id === id) || null;
  }, [profiles]);

  return {
    profiles,
    isLoaded,
    updateProfile,
    getActiveProfile,
    getProfileById,
    refetch: fetchProfiles,
  };
}
