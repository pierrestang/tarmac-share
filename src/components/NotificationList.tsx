import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "@/hooks/use-notifications";
import { useProfiles } from "@/hooks/use-profiles";
import { useMessages } from "@/hooks/use-messages";
import { useDemandes } from "@/hooks/use-demandes";
import { useTrajets } from "@/hooks/use-trajets";
import { useRepublications } from "@/hooks/use-republications";
import { useAppSettings } from "@/hooks/use-app-settings";
import { NotificationItem } from "@/components/NotificationItem";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import type { Notification } from "@/types/notification";

export function NotificationList() {
  const navigate = useNavigate();
  const { getNotifications, markAsRead, isLoaded: notificationsLoaded } = useNotifications();
  const { getActiveProfile, isLoaded: profilesLoaded } = useProfiles();
  const { getConversationByDemandeId } = useMessages();
  const { getDemandeById } = useDemandes();

  const activeProfile = getActiveProfile();
  const profileId = activeProfile?.id;

  const notifications = profileId && notificationsLoaded && profilesLoaded ? getNotifications(profileId) : [];

  // Check if a notification is still actionable
  const isNotificationActionable = useCallback((notification: Notification): boolean => {
    if (notification.type === "demande_withdrawn" || notification.type === "demande_refused") {
      return false;
    }
    if (notification.type === "conversation_closing") {
      const conversation = getConversationByDemandeId(notification.demandeId);
      return conversation !== null;
    }
    if (notification.type === "cancellation") {
      const demande = getDemandeById(notification.demandeId);
      if (!demande) return false;
      const republished: string[] = JSON.parse(localStorage.getItem("republishedDemandeIds") || "[]");
      const declined: string[] = JSON.parse(localStorage.getItem("declinedRepublishDemandeIds") || "[]");
      return !republished.includes(notification.demandeId) && !declined.includes(notification.demandeId);
    }
    if (notification.type === "demande_received") {
      const demande = getDemandeById(notification.demandeId);
      return demande !== null && demande.status === "pending";
    }
    if (notification.type === "demande_accepted") {
      const demande = getDemandeById(notification.demandeId);
      if (!demande || demande.status !== "accepted") return false;
      const conversation = getConversationByDemandeId(notification.demandeId);
      return conversation !== null;
    }
    const demande = getDemandeById(notification.demandeId);
    return demande !== null;
  }, [getConversationByDemandeId, getDemandeById]);

  // Auto-mark muted (non-actionable) unread notifications as read
  useEffect(() => {
    notifications.forEach((n) => {
      if (!n.read && !isNotificationActionable(n)) {
        markAsRead(n.id);
      }
    });
  }, [notifications, isNotificationActionable, markAsRead]);

  if (!notificationsLoaded || !profilesLoaded) return null;

  const handleClick = async (notification: Notification) => {
    // Mark as read
    await markAsRead(notification.id);

    // Check if actionable
    if (!isNotificationActionable(notification)) {
      return; // Just mark as read, don't navigate
    }

    // Navigate based on type
    switch (notification.type) {
      case "demande_received":
        navigate(`/demande-accepter?demandeId=${notification.demandeId}`);
        break;
      case "demande_accepted":
      case "conversation_closing":
        // Navigate to messages with conversationId param to open directly
        const conversation = getConversationByDemandeId(notification.demandeId);
        if (conversation) {
          navigate(`/messages?conversationId=${conversation.id}`);
        } else {
          navigate("/messages");
        }
        break;
      case "cancellation":
        navigate(`/republier-annonce?demandeId=${notification.demandeId}`);
        break;
    }
  };

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-[16px] text-foreground">
          Aucune notification pour le moment
        </p>
      </div>
    );
  }

  // Check if a cancellation notification was declined (user chose "Non")
  const isDeclinedRepublish = (notification: Notification): boolean => {
    if (notification.type !== "cancellation") return false;
    const declined: string[] = JSON.parse(localStorage.getItem("declinedRepublishDemandeIds") || "[]");
    return declined.includes(notification.demandeId);
  };

  // Check if a cancellation notification was already republished
  const isAlreadyRepublished = (notification: Notification): boolean => {
    if (notification.type !== "cancellation") return false;
    const republished: string[] = JSON.parse(localStorage.getItem("republishedDemandeIds") || "[]");
    return republished.includes(notification.demandeId);
  };

    const getBadge = (notification: Notification): { text: string; variant: "default" | "green" | "red" } | undefined => {
      if (isAlreadyRepublished(notification)) return { text: "Trajet republié", variant: "green" };
      if (isDeclinedRepublish(notification)) return { text: "Trajet non republié", variant: "red" };
      if (notification.type === "demande_received") {
        const demande = getDemandeById(notification.demandeId);
        if (demande && demande.status === "accepted") return { text: "Demande acceptée", variant: "green" };
        if (demande && demande.status === "refused") return { text: "Demande refusée", variant: "red" };
      }
      if (notification.type === "demande_accepted") {
        const demande = getDemandeById(notification.demandeId);
        if (demande && demande.status === "completed") return { text: "Trajet annulé", variant: "red" };
      }
      return undefined;
    };

    const badgeData = (n: Notification) => getBadge(n);

    return (
      <div className="flex flex-col divide-y bg-card rounded-md">
        {notifications.map((notification) => {
          const b = badgeData(notification);
          return (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onClick={handleClick}
              muted={!isNotificationActionable(notification)}
              badge={b?.text}
              badgeVariant={b?.variant}
            />
          );
        })}
      </div>
    );
}
