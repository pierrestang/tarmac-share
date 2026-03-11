import { useNavigate } from "react-router-dom";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import type { Demande } from "@/types/demande";
import type { Profile } from "@/types/profile";
import type { Trajet } from "@/types/trajet";
import { getScoreColor } from "@/hooks/use-trajets";

interface DemandeCardProps {
  demande: Demande;
  otherProfile: Profile | null;
  trajet: Trajet | null;
  currentProfileId: string;
  compatibilityScore?: number;
  detourMin?: number;
  /** Rating result for completed demandes: true = both said yes, false = at least one said no, undefined = no ratings yet */
  tripRealized?: boolean;
  onAccept?: (id: string) => void;
  onRefuse?: (id: string) => void;
}


export function DemandeCard({
  demande,
  otherProfile,
  trajet,
  currentProfileId,
  compatibilityScore = 100,
  detourMin = 0,
  tripRealized,
  onAccept,
  onRefuse,
}: DemandeCardProps) {
  const navigate = useNavigate();
  
  const isReceived = demande.toProfileId === currentProfileId;
  const isPending = demande.status === "pending";
  const isAccepted = demande.status === "accepted";
  const isRefused = demande.status === "refused";
  const isCompleted = demande.status === "completed";
  
  // Use the wasCancelled flag directly from the demande
  const isCancelled = isCompleted && !!demande.wasCancelled;

  
  const scoreColor = getScoreColor(compatibilityScore);

  const getStatusBadge = () => {
    if (isReceived) {
      return (
        <Badge className="bg-success text-success-foreground border-success-foreground/20 text-[10px] px-1.5 py-0.5 hover:bg-success">
          Demande reçue
        </Badge>
      );
    }
    return (
      <Badge className="bg-success text-success-foreground border-success-foreground/20 text-[10px] px-1.5 py-0.5 hover:bg-success">
        Demande envoyée
      </Badge>
    );
  };

  const handleViewDemande = () => {
    if (isReceived && isPending) {
      navigate(`/demande-accepter?demandeId=${demande.id}`);
    } else if (isCompleted) {
      navigate(`/demande-historique?demandeId=${demande.id}`);
    } else {
      navigate(`/demande-consulter?demandeId=${demande.id}`);
    }
  };

  const handleViewMessages = () => {
    navigate("/messages");
  };

  // Determine button label
  const getButtonLabel = () => {
    if (isAccepted) return "Voir le trajet";
    if (isCompleted) return "Voir le trajet";
    return "Voir le trajet";
  };

  // Determine button action
  const getButtonAction = () => {
    if (isAccepted) return handleViewDemande;
    return handleViewDemande;
  };

  return (
    <div className="rounded-md bg-card overflow-hidden flex flex-col">
      <div className="p-4 flex flex-col gap-3">
        {/* Top section: Avatar, info, and score */}
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <Avatar className="h-12 w-12 shrink-0">
            <AvatarImage src={otherProfile?.photo || undefined} alt={otherProfile?.firstName} referrerPolicy="no-referrer" />
            <AvatarFallback className="text-sm">
              {otherProfile?.firstName?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>

          {/* Info section */}
          <div className="flex-1 flex flex-col gap-1 min-w-0">
            {/* Name, companions and badge */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[16px] font-semibold text-card-foreground">
                {otherProfile?.firstName || "Utilisateur"}
              </span>
              {trajet && trajet.companions > 1 && (
                <span className="text-[12px] text-muted-foreground">
                  et {trajet.companions - 1} voyageur{trajet.companions > 2 ? "s" : ""}
                </span>
              )}
              {isCompleted && isCancelled ? (
                <Badge className="bg-[#e34454]/15 text-[#e34454] border-[#e34454]/30 text-[10px] px-1.5 py-0.5 hover:bg-[#e34454]/15">
                  Trajet annulé
                </Badge>
              ) : isCompleted && tripRealized === true ? (
                <Badge className="bg-success text-success-foreground border-success-foreground/20 text-[10px] px-1.5 py-0.5 hover:bg-success">
                  Trajet réalisé
                </Badge>
              ) : isCompleted && tripRealized === false ? (
                <Badge className="bg-[#e34454]/15 text-[#e34454] border-[#e34454]/30 text-[10px] px-1.5 py-0.5 hover:bg-[#e34454]/15">
                  Trajet non réalisé
                </Badge>
              ) : isCompleted ? (
                <Badge className="bg-success text-success-foreground border-success-foreground/20 text-[10px] px-1.5 py-0.5 hover:bg-success">
                  Trajet terminé
                </Badge>
              ) : isRefused ? (
                <Badge className="bg-[#e34454]/15 text-[#e34454] border-[#e34454]/30 text-[10px] px-1.5 py-0.5 hover:bg-[#e34454]/15">
                  Demande refusée
                </Badge>
              ) : !isAccepted ? (
                getStatusBadge()
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[12px] text-muted-foreground">
                +{Math.round(detourMin)} min de détour
              </span>
            </div>
          </div>

          {/* Compatibility score - hidden for completed and accepted */}
          {!isCompleted && !isAccepted && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <div 
                className="h-12 w-12 rounded-full border-[3px] flex items-center justify-center"
                style={{ borderColor: scoreColor }}
              >
                <span className="text-[14px] font-semibold" style={{ color: scoreColor }}>
                  {Math.round(compatibilityScore)}%
                </span>
              </div>
              <button type="button" onClick={() => navigate("/score-de-matching")} className="flex-shrink-0">
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Button attached to bottom */}
      <Button
        onClick={getButtonAction()}
        className="w-full rounded-t-none rounded-b-md h-12 text-[16px]"
      >
        {getButtonLabel()}
      </Button>
    </div>
  );
}
