export type NotificationType = "demande_received" | "demande_accepted" | "demande_refused" | "demande_withdrawn" | "conversation_closing" | "cancellation";

export interface Notification {
  id: string;
  profileId: string;           // Recipient of the notification
  type: NotificationType;
  title: string;
  message: string;
  demandeId: string;
  relatedProfileId: string;    // The other person involved
  read: boolean;
  createdAt: number;
}
