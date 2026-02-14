import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Notification, NotificationType } from "@/types/notification";

function mapRow(row: any): Notification {
  return {
    id: row.id,
    profileId: row.profile_id,
    type: row.type as NotificationType,
    title: row.title,
    message: row.message,
    demandeId: row.demande_id,
    relatedProfileId: row.related_profile_id,
    read: row.read,
    createdAt: Number(row.created_at),
  };
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = useCallback(async () => {
    const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false });
    if (data) setNotifications(data.map(mapRow));
  }, []);

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchNotifications]);

  const createNotification = useCallback(async (data: {
    profileId: string;
    type: NotificationType;
    title: string;
    message: string;
    demandeId: string;
    relatedProfileId: string;
  }): Promise<Notification> => {
    const { data: inserted, error } = await supabase
      .from("notifications")
      .insert({
        profile_id: data.profileId,
        type: data.type,
        title: data.title,
        message: data.message,
        demande_id: data.demandeId,
        related_profile_id: data.relatedProfileId,
        read: false,
        created_at: Date.now(),
      })
      .select()
      .single();
    if (error) throw error;
    const notification = mapRow(inserted);
    setNotifications((prev) => [notification, ...prev]);
    return notification;
  }, []);

  const getNotifications = useCallback((profileId: string): Notification[] => {
    return notifications.filter((n) => n.profileId === profileId).sort((a, b) => b.createdAt - a.createdAt);
  }, [notifications]);

  const getUnreadCount = useCallback((profileId: string): number => {
    return notifications.filter((n) => n.profileId === profileId && !n.read).length;
  }, [notifications]);

  const markAsRead = useCallback(async (id: string): Promise<void> => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllAsRead = useCallback(async (profileId: string): Promise<void> => {
    await supabase.from("notifications").update({ read: true }).eq("profile_id", profileId).eq("read", false);
    setNotifications((prev) => prev.map((n) => (n.profileId === profileId ? { ...n, read: true } : n)));
  }, []);

  const resetNotifications = useCallback(async (): Promise<void> => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    createNotification,
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    resetNotifications,
  };
}

// Separate hook for just the unread count (used in BottomTabs)
export function useNotificationsUnreadCount(profileId: string | undefined) {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    if (!profileId) {
      setCount(0);
      return;
    }

    const fetchCount = async () => {
      const { count: c } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("profile_id", profileId)
        .eq("read", false);
      setCount(c || 0);
    };

    fetchCount();

    const channel = supabase
      .channel(`notifications-unread-${profileId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        fetchCount();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profileId]);

  return { count };
}
