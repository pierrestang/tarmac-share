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
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import type { Notification } from "@/types/notification";

export function NotificationList() {
  const navigate = useNavigate();
  const { getNotifications, markAsRead, isLoaded: notificationsLoaded } = useNotifications();
  const { getActiveProfile, isLoaded: profilesLoaded } = useProfiles();
  const { getConversationByDemandeId } = useMessages();
  const { getDemandeById, saveDemandeSnapshot } = useDemandes();
  const { getTrajetById, createTrajet } = useTrajets();
  const { isFreeMode } = useAppSettings();
  const [expandedCancellationId, setExpandedCancellationId] = useState<string | null>(null);

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
        setExpandedCancellationId(
          expandedCancellationId === notification.id ? null : notification.id
        );
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

    const handleRepublish = async (demandeId: string) => {
      if (!profileId) return;
      const demande = getDemandeById(demandeId);
      if (!demande) return;

      const isFromUser = demande.fromProfileId === profileId;
      const trajetId = isFromUser ? demande.fromTrajetId : demande.toTrajetId;
      const originalTrajet = getTrajetById(trajetId);
      if (!originalTrajet) return;

      await saveDemandeSnapshot(demandeId);

      const { id: _oldId, createdAt: _oldCreatedAt, ...trajetData } = originalTrajet;
      const newTrajet = await createTrajet({
        ...trajetData,
        isRepublished: true,
      });
      localStorage.setItem("lastPublishedTrajetId", newTrajet.id);

      const republished = JSON.parse(localStorage.getItem("republishedDemandeIds") || "[]");
      if (!republished.includes(demandeId)) {
        republished.push(demandeId);
        localStorage.setItem("republishedDemandeIds", JSON.stringify(republished));
      }

      setExpandedCancellationId(null);
      toast({
        title: "Trajet republié ! Votre annonce est de nouveau visible.",
        className: "bg-transparent border-0 shadow-none",
        style: { backgroundColor: '#7BA87B', color: '#F0EEE9' },
      });
    };

    const handleDeclineRepublish = (demandeId: string) => {
      const declined = JSON.parse(localStorage.getItem("declinedRepublishDemandeIds") || "[]");
      if (!declined.includes(demandeId)) {
        declined.push(demandeId);
        localStorage.setItem("declinedRepublishDemandeIds", JSON.stringify(declined));
      }
      setExpandedCancellationId(null);
    };

    const expandedNotification = notifications.find(n => n.id === expandedCancellationId && n.type === "cancellation");

    return (
      <>
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

        <AlertDialog open={!!expandedNotification} onOpenChange={(open) => { if (!open) setExpandedCancellationId(null); }}>
          <AlertDialogContent className="rounded-md" style={{ backgroundColor: "#89B1D6" }}>
            <AlertDialogHeader className="text-left">
              <AlertDialogTitle className="text-left" style={{ color: "#F0EEE9" }}>
                Republier cette annonce ?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-[14px] text-left" style={{ color: "#F0EEE9" }}>
                Vous pouvez republier immédiatement pour retrouver un partenaire.
                {!isFreeMode && (
                  <> Nous vous offrons <span className="font-bold">2 actions gratuites</span> valables sur ce trajet.</>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex !flex-col gap-3 mt-2 w-full">
              <AlertDialogAction
                onClick={() => expandedNotification && handleRepublish(expandedNotification.demandeId)}
                className="w-full rounded-md border-0 text-[16px] font-semibold py-3"
                style={{ backgroundColor: "#7BA87B", color: "#F0EEE9" }}>
                Republier
              </AlertDialogAction>
              <AlertDialogCancel
                onClick={() => expandedNotification && handleDeclineRepublish(expandedNotification.demandeId)}
                className="w-full rounded-md border-0 text-[16px] font-semibold py-3 mt-0"
                style={{ backgroundColor: "#E34454", color: "#F0EEE9" }}>
                Non merci
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
}
