import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/types/message";
import type { Profile } from "@/types/profile";

interface ConversationItemProps {
  conversation: Conversation;
  otherProfile: Profile;
  lastMessageContent?: string;
  lastMessageTime?: number;
  isUnread?: boolean;
  status?: "active" | "cancelled" | "completed" | null;
  onClick: () => void;
}

const ConversationItem = ({
  conversation,
  otherProfile,
  lastMessageContent,
  lastMessageTime,
  isUnread = false,
  status,
  onClick,
}: ConversationItemProps) => {
  const initials = otherProfile.firstName.charAt(0).toUpperCase();
  
  return (
    <Card 
      className="cursor-pointer border-0"
      onClick={onClick}
    >
      <CardContent className="flex items-center gap-3 p-6">
        <div className="relative">
          <Avatar className="h-12 w-12">
            {otherProfile.photo ? (
              <AvatarImage src={otherProfile.photo} alt={otherProfile.firstName} referrerPolicy="no-referrer" />
            ) : null}
            <AvatarFallback className="text-[14px]">{initials}</AvatarFallback>
          </Avatar>
          {isUnread && (
            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary border-2 border-background" />
          )}
        </div>
        
        <span className={cn(
          "text-[16px] text-card-foreground",
          isUnread ? "font-semibold" : "font-medium"
        )}>
          {otherProfile.firstName}
        </span>

        {status === "active" && (
          <Badge className="ml-auto border-0 hover:opacity-100" style={{ backgroundColor: "#E5E5E5", color: "#5F5F5F" }}>
            Trajet en cours
          </Badge>
        )}
        {status === "cancelled" && (
          <Badge className="ml-auto bg-[#e34454]/15 text-[#e34454] border-0 hover:bg-[#e34454]/15">
            Trajet annulé
          </Badge>
        )}
        {status === "completed" && (
          <Badge className="ml-auto bg-success text-success-foreground border-0 hover:bg-success">
            Trajet terminé
          </Badge>
        )}
      </CardContent>
    </Card>
  );
};

export default ConversationItem;
