import { useNavigate } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { format, parse } from "date-fns";
import { fr } from "date-fns/locale";
import type { Trajet } from "@/types/trajet";
import type { Profile } from "@/types/profile";

function formatBaggage(baggage: { small: number; medium: number; large: number }): string {
  const parts: string[] = [];
  if (baggage.small > 0) parts.push(`${baggage.small} petit${baggage.small > 1 ? "s" : ""}`);
  if (baggage.medium > 0) parts.push(`${baggage.medium} moyen${baggage.medium > 1 ? "s" : ""}`);
  if (baggage.large > 0) parts.push(`${baggage.large} grand${baggage.large > 1 ? "s" : ""}`);
  return parts.length > 0 ? parts.join(", ") : "Aucun bagage";
}

interface MonTrajetCardProps {
  trajet: Trajet;
  profile: Profile;
  canEditOrDelete?: boolean;
  onDelete?: (id: string) => void;
}

export function MonTrajetCard({ trajet, profile, canEditOrDelete = true, onDelete }: MonTrajetCardProps) {
  const navigate = useNavigate();

  const formattedDate = (() => {
    try {
      const parsed = parse(trajet.date, "dd/MM/yyyy", new Date());
      return format(parsed, "EEE d MMMM", { locale: fr }).replace(/^\w/, c => c.toUpperCase());
    } catch {
      return trajet.date;
    }
  })();

  return (
    <div className="flex flex-col gap-4">

      <Card className="w-full border-0 overflow-hidden">
        <CardContent className="flex flex-col gap-3 p-4 relative">
          {/* Edit/Delete buttons - top right */}
          {canEditOrDelete && (
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                type="button"
                aria-label="Modifier"
                onClick={() => navigate(`/publier?edit=${trajet.id}`)}
                className="p-1 text-muted-foreground hover:text-card-foreground"
              >
                <Pencil className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="Supprimer"
                onClick={() => onDelete?.(trajet.id)}
                className="p-1 text-destructive hover:text-destructive/80"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          )}
          
          {/* Profile row */}
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              {profile.photo ? (
                <AvatarImage src={profile.photo} alt={profile.firstName} />
              ) : null}
              <AvatarFallback className="text-[14px]">
                {profile.firstName.charAt(0)}
                {profile.lastName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-[16px] font-medium">
                {profile.firstName}
                {trajet.companions > 1 && (
                  <span className="text-muted-foreground font-normal">
                    {" "}et {trajet.companions === 2 ? "un" : trajet.companions === 3 ? "deux" : trajet.companions - 1} voyageur{trajet.companions > 2 ? "s" : ""}
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Details */}
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
            {trajet.additionalInfo && (
              <p>
                <span className="text-muted-foreground">Infos complémentaires : </span>
                "{trajet.additionalInfo}"
              </p>
            )}
          </div>
        </CardContent>
        
        <Button
          className="w-full rounded-t-none rounded-b-md h-12 text-[16px]"
          onClick={() => navigate(`/matches?trajetId=${trajet.id}`)}
        >
          Voir les matches
        </Button>
      </Card>
    </div>
  );
}
