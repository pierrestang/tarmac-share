import { useNavigate } from "react-router-dom";
import { useNotifications } from "@/hooks/use-notifications";
import { useProfiles } from "@/hooks/use-profiles";
import { useMessages } from "@/hooks/use-messages";
import { useDemandes } from "@/hooks/use-demandes";
import { NotificationItem } from "@/components/NotificationItem";
import type { Notification } from "@/types/notification";

export function NotificationList() {
  const navigate = useNavigate();
  const { getNotifications, markAsRead } = useNotifications();
  const { getActiveProfile } = useProfiles();
  const { getConversationByDemandeId } = useMessages();
  const { getDemandeById } = useDemandes();

  const activeProfile = getActiveProfile();
  const profileId = activeProfile?.id;

  const notifications = profileId ? getNotifications(profileId) : [];

  // Check if a notification is still actionable
  const isNotificationActionable = (notification: Notification): boolean => {
    // Withdrawn and refused notifications are never actionable
    if (notification.type === "demande_withdrawn" || notification.type === "demande_refused") {
      return false;
    }
    // For conversation_closing, check if the conversation exists
    if (notification.type === "conversation_closing") {
      const conversation = getConversationByDemandeId(notification.demandeId);
      return conversation !== null;
    }
    // For cancellation, actionable only if demande exists AND not already republished
    if (notification.type === "cancellation") {
      const demande = getDemandeById(notification.demandeId);
      if (!demande) return false;
      const republished: string[] = JSON.parse(localStorage.getItem("republishedDemandeIds") || "[]");
      return !republished.includes(notification.demandeId);
    }
    // For other types, check if the demande still exists
    const demande = getDemandeById(notification.demandeId);
    return demande !== null;
  };

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
        <p className="text-[16px] text-white">
          Aucune notification pour le moment
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y bg-card rounded-md">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClick={handleClick}
          muted={!isNotificationActionable(notification)}
        />
      ))}
    </div>
  );
}
