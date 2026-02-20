import { useNavigate } from "react-router-dom";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getScoreColor } from "@/hooks/use-trajets";
import type { EnrichedMatchedTraveler } from "@/types/trajet";

interface VoyageurCardSmallProps {
  match: EnrichedMatchedTraveler;
  showButton?: boolean;
  title?: string;
  myTrajetId?: string;
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

// Use centralized getScoreColor from use-trajets

export function VoyageurCardSmall({ match, showButton = true, title, myTrajetId }: VoyageurCardSmallProps) {
  const navigate = useNavigate();
  const { trajet, profile, distance, compatibilityScore, receivedDemandeId, sentDemandeId } = match;

  const scoreColor = getScoreColor(compatibilityScore);

  return (
    <div className="rounded-md overflow-hidden flex flex-col">
      <div className="p-4 flex flex-col gap-3 bg-card rounded-t-md">
        {/* Optional title */}
        {title && <h2 className="text-[18px] font-semibold text-card-foreground">{title}</h2>}
        
        {/* Top section: Avatar, info, and score */}
        <div className="flex items-start gap-3">
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
              <span className="text-[16px] font-medium text-card-foreground">{profile.firstName}</span>
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
              à {distance}km
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
      </div>

      {/* Button */}
      {showButton && (
        <Button
          onClick={() => navigate(
            receivedDemandeId 
              ? `/demande-accepter?demandeId=${receivedDemandeId}`
              : sentDemandeId
                ? `/demande-consulter?demandeId=${sentDemandeId}`
                : `/demande-envoyer?voyageurId=${trajet.id}${myTrajetId ? `&myTrajetId=${myTrajetId}` : ''}`
          )}
          className="w-full rounded-t-none rounded-b-md h-12 text-[16px]"
        >
          Voir le trajet
        </Button>
      )}
    </div>
  );
}
