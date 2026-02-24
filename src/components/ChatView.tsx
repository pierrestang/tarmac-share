import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, HelpCircle, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ChatBubble from "./ChatBubble";
import QuickMessages from "./QuickMessages";
import type { Message, Conversation } from "@/types/message";
import type { Profile } from "@/types/profile";
import { useGeolocation } from "@/hooks/use-geolocation";
import { calculateDistance } from "@/hooks/use-trajets";

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
  onCancelTrip: () => void;
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
  onCancelTrip,
}: ChatViewProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const { isSharing, startSharing, stopSharing, myLocation, otherLocation, subscribeToOtherUser } = useGeolocation(currentProfileId);

  useEffect(() => {
    if (otherProfile.id) {
      const unsubscribe = subscribeToOtherUser(otherProfile.id);
      return () => unsubscribe();
    }
  }, [otherProfile.id, subscribeToOtherUser]);

  // Detect if both participants sent "Je suis prêt à partir"
  const bothReady = conversation.participants.every(participantId =>
    messages.some(m => m.senderId === participantId && m.content === "Je suis arrivé au point de rencontre")
  );

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
        <button onClick={onBack} className="h-8 w-8 p-0 flex items-center justify-center">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="text-[18px] font-semibold">{otherProfile.firstName}</span>
      </div>

      {/* Meeting point card - always visible */}
      <Card className="border-0 rounded-md mb-4" style={{ backgroundColor: "#F0EEE9" }}>
        <CardContent className="p-4">
          <div className="flex items-center gap-1 mb-1">
            <p className="text-[14px] font-semibold" style={{ color: "#4E657A" }}>
              Point de rencontre : Parking Express 📍
            </p>
            <button type="button" onClick={() => navigate("/retrouvez-vous")}>
              <HelpCircle className="h-4 w-4" style={{ color: "#4E657A" }} />
            </button>
          </div>
          <p className="text-[13px] italic" style={{ color: "#4E657A" }}>
            Au niveau du passage piéton central du Parking Express, face au Hall B.
          </p>
        </CardContent>
      </Card>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto pb-4">
        {messages.length > 0 && (
          <div className="flex flex-col">
            {messages.map((msg, index) => {
              // Transform cancellation system messages for the current user
              let message = msg;
              if (msg.type === "system") {
                const cancelMatch = msg.content.match(/^\[CANCELLED_BY:([^\]]+)\] (.+)/);
                if (cancelMatch) {
                  const cancellerId = cancelMatch[1];
                  message = {
                    ...msg,
                    content: cancellerId === currentProfileId
                      ? "Vous avez annulé le trajet. Le trajet est considéré comme terminé."
                      : cancelMatch[2],
                  };
                }
              }
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
            
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t pt-4">
        {!isFullyClosed && !isClosedByUser && (
          <div className="mb-4">
            {/* Location Sharing */}
            <div className="flex flex-col gap-2 mb-4">
              <Button
                variant={isSharing ? "secondary" : "outline"}
                className={`w-full rounded-full transition-all duration-300 ${isSharing ? "bg-green-100 hover:bg-green-200 border-green-200" : ""}`}
                onClick={isSharing ? stopSharing : startSharing}
              >
                <MapPin className={`mr-2 h-4 w-4 ${isSharing ? "text-green-600 animate-pulse" : ""}`} />
                <span className={isSharing ? "text-green-800" : ""}>
                  {isSharing ? "Arrêter le partage" : "Partager ma position"}
                </span>
              </Button>

              {otherLocation && (
                <Card className="border border-green-200 bg-green-50 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse ring-4 ring-green-500/20" />
                      <span className="text-sm font-medium text-green-900">
                        {otherProfile.firstName} est à {myLocation ? 
                          (calculateDistance(
                            { lat: myLocation.latitude, lng: myLocation.longitude },
                            { lat: otherLocation.latitude, lng: otherLocation.longitude }
                          ) ?? 0).toFixed(1) : "?"
                        }km
                      </span>
                    </div>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${otherLocation.latitude},${otherLocation.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-green-700 hover:text-green-800 hover:underline flex items-center gap-1"
                    >
                      Voir sur la carte
                    </a>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      {!isFullyClosed && !isClosedByUser && (
          <>
            {bothReady ? (
              <div className="flex flex-col gap-3 mt-4">
                <Button
                  className="w-full rounded-full bg-success text-success-foreground border-0 hover:bg-success/80"
                  onClick={() => navigate(`/numero?conversationId=${conversation.id}`)}
                >
                  Afficher le code
                </Button>
                <Button
                  variant="outline"
                  className="w-full rounded-full"
                  onClick={onCloseConversation}
                >
                  Le trajet a-t-il eu lieu ?
                </Button>
              </div>
            ) : (
              <>
                <QuickMessages
                  onSend={(msg) => {
                    if (msg === "Je dois annuler") {
                      setShowCancelDialog(true);
                    } else {
                      onSendMessage(msg);
                    if (msg === "Je suis arrivé au point de rencontre") {
                        const otherAlreadyArrived = messages.some(
                          m => m.senderId !== currentProfileId && m.content === "Je suis arrivé au point de rencontre"
                        );
                        toast({
                          description: otherAlreadyArrived
                            ? "Tout le monde est là ! Cliquez sur 'Afficher le code' pour vous retrouver."
                            : "C'est noté ! Nous attendons que votre partenaire signale aussi son arrivée pour générer votre code de rencontre.",
                          style: { backgroundColor: "#7BA87B", color: "#F0EEE9" },
                        });
                      }
                    }
                  }}
                />
                
                <div className="mt-4">
                  <Button
                    variant="outline"
                    className="w-full rounded-full"
                    onClick={onCloseConversation}
                  >
                    Le trajet a-t-il eu lieu ?
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </div>
      {/* Cancel Trip Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="rounded-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer l'annulation ?</AlertDialogTitle>
            <AlertDialogDescription className="text-white">
              Êtes-vous sûr de vouloir annuler ce trajet ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col gap-2 sm:flex-col">
            <AlertDialogAction onClick={onCancelTrip} className="rounded-md">
              Oui
            </AlertDialogAction>
            <AlertDialogCancel className="rounded-md">Non</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ChatView;
