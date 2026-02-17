import { useNavigate } from "react-router-dom";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
function getScoreColor(_score: number): string {
  return "#7BA87B";
}

export function VoyageurCard({ match, showButton = true, title, buttonLabel, onButtonClick, showDualButtons = false, onAccept, onRefuse }: VoyageurCardProps) {
  const navigate = useNavigate();
  const { trajet, profile, distance, compatibilityScore, receivedDemandeId, sentDemandeId } = match;

  const scoreColor = getScoreColor(compatibilityScore);

  return (
    <Card className="w-full max-w-[42rem] border-0 overflow-hidden">
      <CardContent className="flex flex-col gap-3 p-4">
        {/* Optional title */}
        {title && <h2 className="text-[18px] font-semibold">{title}</h2>}

      {/* Top section: Avatar, info, and score */}
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <Avatar className="h-12 w-12">
          {profile.photo && <AvatarImage src={profile.photo} alt={profile.firstName} />}
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
          </div>

          {/* Distance */}
          <span className="text-[12px] text-muted-foreground">
            à {Math.round(distance * 10) / 10}km
          </span>
        </div>

        {/* Compatibility score */}
        <div 
          className="h-12 w-12 rounded-full border-[3px] flex items-center justify-center flex-shrink-0"
          style={{ borderColor: scoreColor }}
        >
          <span className="text-[14px] font-semibold" style={{ color: scoreColor }}>
            {Math.round(compatibilityScore)}%
          </span>
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

      {/* Dual buttons for accept/refuse */}
      {showDualButtons && (
        <div className="flex gap-3">
          <Button onClick={onAccept} className="flex-1 rounded-full">
            Accepter
          </Button>
          <Button onClick={onRefuse} variant="outline" className="flex-1 rounded-full">
            Refuser
          </Button>
        </div>
      )}
      </CardContent>

      {/* Single button - attached to bottom of card */}
      {showButton && !showDualButtons && (
        <Button
          onClick={onButtonClick ?? (() => navigate(
            receivedDemandeId 
              ? `/demande-accepter?demandeId=${receivedDemandeId}`
              : sentDemandeId
                ? `/demande-consulter?demandeId=${sentDemandeId}`
                : `/demande-envoyer?voyageurId=${trajet.id}`
          ))}
          className="w-full rounded-t-none rounded-b-md h-12 text-[16px]"
        >
          {buttonLabel ?? "Voir le trajet"}
        </Button>
      )}
    </Card>
  );
}
