import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import type { Demande } from "@/types/demande";
import type { Profile } from "@/types/profile";
import type { Trajet } from "@/types/trajet";
import { useNotifications } from "@/hooks/use-notifications";

interface DemandeCardProps {
  demande: Demande;
  otherProfile: Profile | null;
  trajet: Trajet | null;
  currentProfileId: string;
  compatibilityScore?: number;
  distance?: number;
  onAccept?: (id: string) => void;
  onRefuse?: (id: string) => void;
}

function getScoreColor(score: number): string {
  if (score >= 90) return "#10B981";
  if (score >= 70) return "#22C55E";
  if (score >= 40) return "#F4A261";
  return "#E63946";
}

export function DemandeCard({
  demande,
  otherProfile,
  trajet,
  currentProfileId,
  compatibilityScore = 100,
  distance = 0,
  onAccept,
  onRefuse,
}: DemandeCardProps) {
  const navigate = useNavigate();
  const { notifications } = useNotifications();
  
  const isReceived = demande.toProfileId === currentProfileId;
  const isPending = demande.status === "pending";
  const isAccepted = demande.status === "accepted";
  const isRefused = demande.status === "refused";
  const isCompleted = demande.status === "completed";
  
  // Check if this completed demande was a cancellation
  const isCancelled = isCompleted && notifications.some(
    (n) => n.type === "cancellation" && n.demandeId === demande.id
  );

  
  const scoreColor = getScoreColor(compatibilityScore);

  const getStatusBadge = () => {
    if (isReceived) {
      return (
        <Badge className="bg-green-100 text-green-700 border-green-300 text-[10px] px-1.5 py-0.5 hover:bg-green-100">
          Demande reçue
        </Badge>
      );
    }
    return (
      <Badge className="bg-green-100 text-green-700 border-green-300 text-[10px] px-1.5 py-0.5 hover:bg-green-100">
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
    if (isAccepted) return "Voir messages";
    if (isCompleted) return "Voir les détails";
    return "Voir le trajet";
  };

  // Determine button action
  const getButtonAction = () => {
    if (isAccepted) return handleViewMessages;
    return handleViewDemande;
  };

  return (
    <div className="rounded-md bg-card overflow-hidden flex flex-col">
      <div className="p-4 flex flex-col gap-3">
        {/* Top section: Avatar, info, and score */}
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <Avatar className="h-12 w-12 shrink-0">
            <AvatarImage src={otherProfile?.photo || undefined} alt={otherProfile?.firstName} />
            <AvatarFallback className="text-sm">
              {otherProfile?.firstName?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>

          {/* Info section */}
          <div className="flex-1 flex flex-col gap-1 min-w-0">
            {/* Name, companions and badge */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[16px] font-medium text-card-foreground">
                {otherProfile?.firstName || "Utilisateur"}
              </span>
              {trajet && trajet.companions > 1 && (
                <span className="text-[12px] text-muted-foreground">
                  et {trajet.companions - 1} voyageur{trajet.companions > 2 ? "s" : ""}
                </span>
              )}
              {isCompleted && isCancelled ? (
                <Badge className="bg-red-100 text-red-700 border-red-300 text-[10px] px-1.5 py-0.5 hover:bg-red-100">
                  Trajet annulé
                </Badge>
              ) : isCompleted ? (
                <Badge className="bg-green-100 text-green-700 border-green-300 text-[10px] px-1.5 py-0.5 hover:bg-green-100">
                  Trajet terminé
                </Badge>
              ) : !isAccepted ? (
                getStatusBadge()
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[12px] text-muted-foreground">
                à {Math.round(distance * 10) / 10}km
              </span>
            </div>
          </div>

          {/* Compatibility score - hidden for completed and accepted */}
          {!isCompleted && !isAccepted && (
            <div 
              className="h-12 w-12 rounded-full border-[3px] flex items-center justify-center flex-shrink-0"
              style={{ borderColor: scoreColor }}
            >
              <span className="text-[14px] font-semibold" style={{ color: scoreColor }}>
                {compatibilityScore}%
              </span>
            </div>
          )}
        </div>

        {/* Status badges for refused */}
        {isRefused && !isReceived && (
          <span className="text-[12px] text-muted-foreground">
            Remboursement effectué
          </span>
        )}
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
