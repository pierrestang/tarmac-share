import ConversationItem from "./ConversationItem";
import type { Conversation } from "@/types/message";
import type { Profile } from "@/types/profile";
import type { Message } from "@/types/message";

interface ConversationListProps {
  conversations: Conversation[];
  getOtherProfile: (conversation: Conversation) => Profile | undefined;
  getLastMessage: (conversationId: string) => Message | undefined;
  hasUnreadMessages: (conversationId: string) => boolean;
  onSelectConversation: (conversation: Conversation) => void;
  getConversationStatus?: (conversation: Conversation) => "cancelled" | "completed" | null;
  getConversationDate?: (conversation: Conversation) => string | undefined;
}

const ConversationList = ({
  conversations,
  getOtherProfile,
  getLastMessage,
  hasUnreadMessages,
  onSelectConversation,
  getConversationStatus,
  getConversationDate,
}: ConversationListProps) => {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-[16px] text-white">
          Aucune conversation pour le moment
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {conversations.map((conversation) => {
        const otherProfile = getOtherProfile(conversation);
        const lastMessage = getLastMessage(conversation.id);
        const isUnread = hasUnreadMessages(conversation.id);
        const status = getConversationStatus?.(conversation) ?? null;
        const date = getConversationDate?.(conversation);
        
        if (!otherProfile) return null;
        
        return (
          <div key={conversation.id} className="flex flex-col gap-1">
            {date && (
              <p className="text-[16px] font-semibold">{date}</p>
            )}
            <ConversationItem
              conversation={conversation}
              otherProfile={otherProfile}
              lastMessageContent={lastMessage?.content}
              lastMessageTime={lastMessage?.createdAt}
              isUnread={isUnread}
              status={status}
              onClick={() => onSelectConversation(conversation)}
            />
          </div>
        );
      })}
    </div>
  );
};

export default ConversationList;
