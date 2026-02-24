import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, HelpCircle, MoreVertical, SendHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle } from
"@/components/ui/alert-dialog";
import ChatBubble from "./ChatBubble";
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
  onCancelTrip
}: ChatViewProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [inputText, setInputText] = useState("");

  // Detect if both participants sent "Je suis prêt à partir"
  const bothReady = conversation.participants.every((participantId) =>
  messages.some((m) => m.senderId === participantId && m.content === "Je suis arrivé au point de rencontre")
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
      <div className="flex items-center gap-3 px-4 py-3" style={{ backgroundColor: "#4E657A" }}>
        <button onClick={onBack} className="h-8 w-8 p-0 flex items-center justify-center" style={{ color: "#F0EEE9" }}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="text-[18px] font-semibold flex-1" style={{ color: "#F0EEE9" }}>{otherProfile.firstName}</span>
        {!isFullyClosed && !isClosedByUser &&
        <button
          type="button"
          onClick={() => navigate(`/gestion-trajet?conversationId=${conversation.id}&demandeId=${conversation.demandeId}`)}
          className="h-8 w-8 p-0 flex items-center justify-center"
          style={{ color: "#F0EEE9" }}>

            <MoreVertical className="h-5 w-5" />
          </button>
        }
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 bg-background">
      {/* Meeting point card - always visible */}
      <Card className="border-0 rounded-md mb-4 relative" style={{ backgroundColor: "#F0EEE9" }}>
        <button type="button" onClick={() => navigate("/retrouvez-vous")} className="absolute top-3 right-3">
          <HelpCircle className="h-4 w-4" style={{ color: "#4E657A" }} />
        </button>
        <CardContent className="p-4 pr-8">
          <p className="text-[14px] font-semibold mb-1" style={{ color: "#4E657A" }}>
            Point de rencontre recommandé :
          </p>
          <p className="text-[14px] italic" style={{ color: "#4E657A" }}>
            Au niveau du passage piéton central du Parking Express, face au Hall B.
          </p>
        </CardContent>
      </Card>




      {/* Messages */}
      <div className="pb-4">
        {messages.length > 0 &&
          <div className="flex flex-col">
            {messages.map((msg, index) => {
              // Transform cancellation system messages for the current user
              let message = msg;
              let isCancellationSystem = false;
              if (msg.type === "system") {
                const cancelMatch = msg.content.match(/^\[CANCELLED_BY:([^\]]+)\] (.+)/);
                if (cancelMatch) {
                  isCancellationSystem = true;
                  const cancellerId = cancelMatch[1];
                  message = {
                    ...msg,
                    content: cancellerId === currentProfileId ?
                    "Vous avez annulé le trajet. Le trajet est considéré comme terminé." :
                    cancelMatch[2]
                  };
                }
              }
              const isOwn = message.senderId === currentProfileId;
              const next = messages[index + 1];
              const isLastInGroup = !next || next.senderId !== message.senderId || next.type === "system";
              const isArrivalMessage = message.content === "Je suis arrivé au point de rencontre" && message.type !== "system";
              const currentArrived = messages.some((m) => m.senderId === currentProfileId && m.content === "Je suis arrivé au point de rencontre" && m.type !== "system");
              const otherArrived = messages.some((m) => m.senderId !== currentProfileId && m.type !== "system" && m.content === "Je suis arrivé au point de rencontre");

              let arrivalStatus: string | null = null;
              if (isArrivalMessage) {
                if (isOwn && currentArrived && !otherArrived) {
                  arrivalStatus = "Vous êtes arrivé au point de rencontre ! En attente de votre partenaire pour générer le code.";
                } else if (!isOwn && otherArrived && !currentArrived) {
                  arrivalStatus = `${otherProfile.firstName} est arrivé au point de rencontre ! Confirmez votre présence pour générer le code.`;
                }
              }

              const isBothReadySystem = message.type === "system" && message.content.includes("Vous êtes tous les deux arrivés au point de rencontre");
              const isCompletedSystem = message.type === "system" && message.content === "Le trajet est terminé";

              return (
                <div key={message.id}>
                  {isCancellationSystem ?
                  <div className="flex justify-center my-2">
                      <div className="w-full rounded-md overflow-hidden" style={{ backgroundColor: "#E34454" }}>
                        <div className="px-4 py-3 text-center">
                          <p className="text-[14px] font-semibold" style={{ color: "#F0EEE9" }}>
                            {message.content}
                          </p>
                        </div>
                      </div>
                    </div> :
                  isBothReadySystem ?
                  <div className="flex justify-center my-2">
                      <div className="w-full rounded-md overflow-hidden" style={{ backgroundColor: "#F0EEE9" }}>
                        <div className="px-4 py-3">
                          <p className="text-[14px] italic text-left" style={{ color: "#4E657A" }}>
                            {message.content}
                          </p>
                        </div>
                        <button
                        onClick={() => navigate(`/numero?conversationId=${conversation.id}`)}
                        className="w-full py-3 text-[14px] font-semibold border-0"
                        style={{ backgroundColor: "#7BA87B", color: "#F0EEE9" }}>

                          Afficher le code
                        </button>
                      </div>
                    </div> :
                  isCompletedSystem ?
                  <div className="flex justify-center my-2">
                      <div className="w-full rounded-md overflow-hidden" style={{ backgroundColor: "#7BA87B" }}>
                        <div className="px-4 py-3">
                          <p className="text-[14px] font-semibold text-center" style={{ color: "#F0EEE9" }}>
                            Le trajet est terminé
                          </p>
                        </div>
                      </div>
                    </div> :

                  <>
                      <ChatBubble
                      message={message}
                      isOwn={isOwn}
                      showAvatar={showAvatar(index)}
                      showTimestamp={isLastInGroup}
                      senderProfile={isOwn ? undefined : otherProfile} />

                      {arrivalStatus &&
                    <div className="flex justify-center my-2">
                          <div className="px-4 py-2 rounded-md" style={{ backgroundColor: "#F0EEE9" }}>
                            <p className="text-[14px] italic text-left" style={{ color: "#4E657A" }}>
                              {arrivalStatus}
                            </p>
                          </div>
                        </div>
                    }
                    </>
                  }
                </div>);

            })}
            
          </div>
          }
      </div>
      </div>

      {/* Input - fixed at bottom */}
      <div className="px-4 py-3" style={{ backgroundColor: "#4E657A" }}>
        {!isFullyClosed && !isClosedByUser &&
        <>
            {!messages.some((m) => m.senderId === currentProfileId && m.content === "Je suis arrivé au point de rencontre" && m.type !== "system") &&
          <div className="px-4 py-3" style={{ backgroundColor: "#89B1D6" }}>
          <button
            onClick={() => {
              onSendMessage("Je suis arrivé au point de rencontre");
              const otherAlreadyArrived = messages.some(
                (m) => m.senderId !== currentProfileId && m.content === "Je suis arrivé au point de rencontre"
              );
              toast({
                description: otherAlreadyArrived ?
                "Tout le monde est là ! Cliquez sur 'Afficher le code' pour vous retrouver." :
                "C'est noté ! Nous attendons que votre partenaire signale aussi son arrivée pour générer votre code de rencontre.",
                style: { backgroundColor: "#7BA87B", color: "#F0EEE9" }
              });
            }}
            className="w-full rounded-full px-4 py-3 text-[14px] font-semibold border-0"
            style={{ backgroundColor: "#7BA87B", color: "#F0EEE9" }}>

                Je suis arrivé au point de rencontre 📍
              </button>
          </div>
           }
            {
          <>
                {/* Free text input */}
                <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const text = inputText.trim();
                if (!text) return;
                onSendMessage(text);
                setInputText("");
                if (text === "Je suis arrivé au point de rencontre") {
                  const otherAlreadyArrived = messages.some(
                    (m) => m.senderId !== currentProfileId && m.content === "Je suis arrivé au point de rencontre"
                  );
                  toast({
                    description: otherAlreadyArrived ?
                    "Tout le monde est là ! Cliquez sur 'Afficher le code' pour vous retrouver." :
                    "C'est noté ! Nous attendons que votre partenaire signale aussi son arrivée pour générer votre code de rencontre.",
                    style: { backgroundColor: "#7BA87B", color: "#F0EEE9" }
                  });
                }
              }}>

                  <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Écrire un message..."
                className="flex-1 rounded-full border-0 text-[14px] placeholder:text-[#F0EEE9]"
                style={{ backgroundColor: "#4E657A", color: "#F0EEE9" }} />

                  <button
                type="submit"
                disabled={!inputText.trim()}
                className="h-10 w-10 flex items-center justify-center rounded-full disabled:opacity-40"
                style={{ backgroundColor: "#4E657A", color: "#F0EEE9" }}>

                    <SendHorizontal className="h-4 w-4" />
                  </button>
                </form>

              </>
          }
          </>
        }
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
    </div>);

};

export default ChatView;