import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ChatBubble from "./ChatBubble";
import QuickMessages from "./QuickMessages";
import type { Message, Conversation } from "@/types/message";
import type { Profile } from "@/types/profile";

interface ChatViewProps {
  conversation: Conversation;
  messages: Message[];
  currentProfileId: string;
  otherProfile: Profile;
  isClosedByUser: boolean;
  isFullyClosed: boolean;
  onBack: () => void;
  onSendMessage: (content: string) => void;
  onCloseConversation: () => void;
}

const ChatView = ({
  conversation,
  messages,
  currentProfileId,
  otherProfile,
  isClosedByUser,
  isFullyClosed,
  onBack,
  onSendMessage,
  onCloseConversation,
}: ChatViewProps) => {
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Detect if both participants sent "Je suis prêt à partir"
  const bothReady = conversation.participants.every(participantId =>
    messages.some(m => m.senderId === participantId && m.content === "Je suis prêt à partir")
  );

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, refreshKey]);

  // Refresh messages periodically to get new ones
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey((k) => k + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const showAvatar = (index: number): boolean => {
    const current = messages[index];
    const next = messages[index + 1];
    
    // Don't show avatar for own messages or system messages
    if (current.senderId === currentProfileId || current.type === "system") {
      return false;
    }
    
    // Show avatar if it's the last message or next message is from different sender
    return !next || next.senderId !== current.senderId || next.type === "system";
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b mb-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 p-0 border-0 hover:bg-transparent rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <span className="text-[18px] font-semibold">{otherProfile.firstName}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto pb-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-[16px] text-white">
              Coordonnez-vous rapidement !
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {messages.map((message, index) => {
              const isOwn = message.senderId === currentProfileId;
              const next = messages[index + 1];
              const isLastInGroup = !next || next.senderId !== message.senderId || next.type === "system";
              return (
                <ChatBubble
                  key={message.id}
                  message={message}
                  isOwn={isOwn}
                  showAvatar={showAvatar(index)}
                  showTimestamp={isLastInGroup}
                  senderProfile={isOwn ? undefined : otherProfile}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t pt-4">
        {!isFullyClosed && (
          <>
            {bothReady ? (
              <div className="flex flex-col gap-3 mt-4">
                <Button
                  className="w-full rounded-full bg-[#00C853] text-white border-[#00C853] hover:opacity-90"
                  onClick={() => navigate(`/numero?conversationId=${conversation.id}`)}
                >
                  Afficher le code
                </Button>
                {!isClosedByUser && (
                  <Button
                    variant="outline"
                    className="w-full rounded-full"
                    onClick={onCloseConversation}
                  >
                    Le trajet a-t-il eu lieu ?
                  </Button>
                )}
              </div>
            ) : (
              <>
                <QuickMessages
                  onSend={(msg) => {
                    if (msg === "Je dois annuler") {
                      navigate(`/confirm-annulation?conversationId=${conversation.id}`);
                    } else {
                      onSendMessage(msg);
                    }
                  }}
                  disabled={isClosedByUser}
                />
                
                {isClosedByUser ? (
                  <p className="text-[14px] text-muted-foreground text-center mt-4">
                    Vous avez clôturé cette conversation
                  </p>
                ) : (
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      className="w-full rounded-full"
                      onClick={onCloseConversation}
                    >
                      Le trajet a-t-il eu lieu ?
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ChatView;
