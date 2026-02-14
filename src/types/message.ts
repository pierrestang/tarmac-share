export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: "user" | "system";
  createdAt: number;
}

export interface Conversation {
  id: string;
  demandeId: string;
  participants: [string, string]; // [profileId1, profileId2]
  closedBy: string[];             // profileIds who closed
  createdAt: number;
  updatedAt: number;
}

export interface ConversationRating {
  conversationId: string;
  raterId: string;
  ratedProfileId: string;
  score: number;                  // 1-5
  wasUseful: boolean;
  comment: string;
}
