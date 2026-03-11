import { useNavigate } from "react-router-dom";
import { HelpCircle } from "lucide-react";
import { useMessages } from "@/hooks/use-messages";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getScoreColor } from "@/hooks/use-trajets";
import type { EnrichedMatchedTraveler } from "@/types/trajet";

interface VoyageurCardProps {
  match: EnrichedMatchedTraveler;
  showButton?: boolean;
  title?: string;
  buttonLabel?: string;
  onButtonClick?: () => void;
  showDualButtons?: boolean;
  onAccept?: () => void;
  onRefuse?: () => void;
  myTrajetId?: string;
  messagesDemandeId?: string;
  customBadge?: React.ReactNode;
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function formatBaggage(baggage: { small: number; medium: number; large: number }): string {
  const parts: string[] = [];
  if (baggage.small > 0) parts.push(`${baggage.small} petit${baggage.small > 1 ? "s" : ""}`);
  if (baggage.medium > 0) parts.push(`${baggage.medium} moyen${baggage.medium > 1 ? "s" : ""}`);
  if (baggage.large > 0) parts.push(`${baggage.large} grand${baggage.large > 1 ? "s" : ""}`);
  return parts.length > 0 ? parts.join(", ") : "Aucun bagage";
}

export function VoyageurCard({ match, showButton = true, title, buttonLabel, onButtonClick, showDualButtons = false, onAccept, onRefuse, myTrajetId, messagesDemandeId, customBadge }: VoyageurCardProps) {
  const navigate = useNavigate();
  const { getConversationByDemandeId } = useMessages();
  const { trajet, profile, detourMin, compatibilityScore, receivedDemandeId, sentDemandeId } = match;

  const scoreColor = getScoreColor(compatibilityScore);

  return (
    <Card className="w-full max-w-[42rem] border-0 overflow-hidden relative">
      <button type="button" onClick={() => navigate("/score-de-matching")} className="absolute top-3 right-3 z-10">
        <HelpCircle className="h-4 w-4 text-muted-foreground" />
      </button>
      <CardContent className="flex flex-col gap-3 p-4 pr-8">
        {/* Optional title */}
        {title && <h2 className="text-[18px] font-semibold">{title}</h2>}

      {/* Top section: Avatar, info, and score */}
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <Avatar className="h-12 w-12">
          {profile.photo && <AvatarImage src={profile.photo} alt={profile.firstName} referrerPolicy="no-referrer" />}
          <AvatarFallback className="text-sm">
            {getInitials(profile.firstName, profile.lastName)}
          </AvatarFallback>
        </Avatar>

        {/* Info section */}
        <div className="flex-1 flex flex-col gap-1">
          {/* Name, companions and badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[16px] font-medium">{profile.firstName}</span>
            {trajet.companions > 1 && (
              <span className="text-[12px] text-muted-foreground">
                et {trajet.companions - 1} voyageur{trajet.companions > 2 ? "s" : ""}
              </span>
            )}
            {customBadge ? customBadge : (
              <>
                {receivedDemandeId && (
                  <Badge className="bg-success text-success-foreground border-success-foreground/20 text-[10px] px-1.5 py-0.5 hover:bg-success">
                    Demande reçue
                  </Badge>
                )}
                {sentDemandeId && !receivedDemandeId && (
                  <Badge className="bg-success text-success-foreground border-success-foreground/20 text-[10px] px-1.5 py-0.5 hover:bg-success">
                    Demande envoyée
                  </Badge>
                )}
              </>
            )}
          </div>

          {/* Détour */}
          <span className="text-[12px] text-muted-foreground">
            +{Math.round(detourMin)} min de détour
          </span>
        </div>

        {/* Compatibility score */}
        <div className="flex-shrink-0">
          <div 
            className="h-12 w-12 rounded-full border-[3px] flex items-center justify-center"
            style={{ borderColor: scoreColor }}
          >
            <span className="text-[14px] font-semibold" style={{ color: scoreColor }}>
              {Math.round(compatibilityScore)}%
            </span>
          </div>
        </div>
      </div>

      {/* Details section */}
      <div className="flex flex-col gap-1 text-[14px]">
        <p>
          <span className="text-muted-foreground">Départ : </span>
          {trajet.departureStation}, {trajet.departureTime}
        </p>
        <p>
          <span className="text-muted-foreground">Arrivée : </span>
          {trajet.destination}
        </p>
        <p>
          <span className="text-muted-foreground">Bagages : </span>
          {formatBaggage(trajet.baggage)}
        </p>
      </div>

      </CardContent>

      {/* Dual buttons for accept/refuse */}
      {showDualButtons && (
        <div className="flex gap-3 px-4 pb-4">
          <button onClick={onAccept} className="flex-1 rounded-md px-4 py-3 text-[16px] font-semibold border-0" style={{ backgroundColor: "#7BA87B", color: "#F0EEE9" }}>
            Accepter
          </button>
          <button onClick={onRefuse} className="flex-1 rounded-md px-4 py-3 text-[16px] font-semibold border-0" style={{ backgroundColor: "#E34454", color: "#F0EEE9" }}>
            Refuser
          </button>
        </div>
      )}

      {/* Single button - attached to bottom of card */}
      {showButton && !showDualButtons && (
        <Button
          onClick={onButtonClick ?? (() => navigate(
            receivedDemandeId 
              ? `/demande-accepter?demandeId=${receivedDemandeId}`
              : sentDemandeId
                ? `/demande-consulter?demandeId=${sentDemandeId}`
                : `/demande-envoyer?voyageurId=${trajet.id}${myTrajetId ? `&myTrajetId=${myTrajetId}` : ''}`
          ))}
          className="w-full rounded-t-none rounded-b-md h-12 text-[16px]"
        >
          {buttonLabel ?? "Voir le trajet"}
        </Button>
      )}

      {/* Messages button */}
      {messagesDemandeId && (
        <button
          onClick={() => {
            const conversation = getConversationByDemandeId(messagesDemandeId);
            if (conversation) {
              navigate(`/messages?conversationId=${conversation.id}`);
            }
          }}
          className="w-full py-3 text-center text-[16px] font-semibold rounded-b-xl border-t border-border/40"
          style={{ backgroundColor: "#4E657A", color: "#F0EEE9" }}
        >
          Voir les messages
        </button>
      )}
    </Card>
  );
}
