import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Message } from "@/types/message";
import type { Profile } from "@/types/profile";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface ChatBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  showTimestamp: boolean;
  senderProfile?: Profile;
}

const ChatBubble = ({ message, isOwn, showAvatar, showTimestamp, senderProfile }: ChatBubbleProps) => {
  // System message
  if (message.type === "system") {
    const isCancellation = message.content.includes("a annulé le trajet") || message.content.includes("Vous avez annulé le trajet");
    const isCompleted = message.content === "Le trajet est terminé";
    const isBothReady = message.content.includes("Vous êtes tous les deux arrivés au point de rencontre");
    return (
      <div className="flex justify-center my-2">
        <div className={cn(
          "px-4 py-2 rounded-md",
          isBothReady ? "" : isCancellation ? "bg-[#f0d0d0]" : isCompleted ? "bg-success" : "bg-muted"
        )} style={isBothReady ? { backgroundColor: "#F0EEE9" } : undefined}>
          <p className={cn(
            "text-[14px] font-normal",
            isBothReady ? "text-left italic" : "text-center",
            isBothReady ? "text-left" : isCancellation ? "text-[#A25B5B]" : isCompleted ? "text-success-foreground" : "text-muted-foreground"
          )} style={isBothReady ? { color: "#4E657A" } : undefined}>
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  const initials = senderProfile?.firstName?.charAt(0).toUpperCase() || "?";
  const timestamp = format(new Date(message.createdAt), "HH:mm");

  // Own message (right) - white bubble
  if (isOwn) {
    return (
      <div className="flex flex-col items-end mb-1">
        <div className="max-w-[85%] px-4 py-2 rounded-md" style={{ backgroundColor: "#F0EEE9" }}>
          <p className="text-[14px]" style={{ color: "#4E657A" }}>{message.content}</p>
        </div>
        {showTimestamp && (
          <p className="text-[11px] mt-0.5 mr-1" style={{ color: "#F0EEE9" }}>{timestamp}</p>
        )}
      </div>
    );
  }

  // Received message (left)
  return (
    <div className="flex flex-col items-start mb-1">
      <div className="flex items-end gap-2">
        {showAvatar ? (
          <Avatar className="h-8 w-8 flex-shrink-0">
            {senderProfile?.photo ? (
              <AvatarImage src={senderProfile.photo} alt={senderProfile.firstName} referrerPolicy="no-referrer" />
            ) : null}
            <AvatarFallback className="text-[12px]">{initials}</AvatarFallback>
          </Avatar>
        ) : (
          <div className="w-8 flex-shrink-0" />
        )}
        <div className="max-w-[85%] w-fit px-4 py-2 rounded-2xl" style={{ backgroundColor: "#F0EEE9" }}>
          <p className="text-[14px] whitespace-pre-wrap" style={{ color: "#4E657A" }}>{message.content}</p>
        </div>
      </div>
      {showTimestamp && (
        <p className="text-[11px] mt-0.5 ml-10" style={{ color: "#F0EEE9" }}>{timestamp}</p>
      )}
    </div>
  );
};

export default ChatBubble;
