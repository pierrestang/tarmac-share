import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useTrajets, calculateDistance, calculateMatchScore, getArchivedTrajet } from "@/hooks/use-trajets";
import { useNotifications } from "@/hooks/use-notifications";
import { useProfiles } from "@/hooks/use-profiles";
import { useDemandes } from "@/hooks/use-demandes";
import { useMessages } from "@/hooks/use-messages";
import { format, parse } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import type { Baggage } from "@/types/trajet";

function formatBaggage(baggage: Baggage): string {
  const parts: string[] = [];
  if (baggage.small > 0) parts.push(`${baggage.small} petit${baggage.small > 1 ? "s" : ""}`);
  if (baggage.medium > 0) parts.push(`${baggage.medium} moyen${baggage.medium > 1 ? "s" : ""}`);
  if (baggage.large > 0) parts.push(`${baggage.large} grand${baggage.large > 1 ? "s" : ""}`);
  return parts.length > 0 ? parts.join(", ") : "Aucun bagage";
}

const DemandeHistorique = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const demandeId = searchParams.get("demandeId");
  
  const { getTrajetById, isLoaded: trajetsLoaded } = useTrajets();
  const { getActiveProfile, getProfileById, isLoaded: profilesLoaded } = useProfiles();
  const { getDemandeById, isLoaded: demandesLoaded } = useDemandes();
  const { notifications } = useNotifications();
  const { getConversationByDemandeId } = useMessages();

  // Ratings state: map of raterId -> wasUseful
  const [ratings, setRatings] = useState<Record<string, boolean>>({});

  const isLoaded = trajetsLoaded && profilesLoaded && demandesLoaded;

  // Get demande data
  const demande = demandeId ? getDemandeById(demandeId) : null;
  const activeProfile = getActiveProfile();
  const currentProfileId = activeProfile?.id || "";

  // Fetch ratings for this demande's conversation
  useEffect(() => {
    if (!demandeId) return;
    const conversation = getConversationByDemandeId(demandeId);
    if (!conversation) return;
    supabase
      .from("conversation_ratings")
      .select("rater_id, was_useful")
      .eq("conversation_id", conversation.id)
      .then(({ data }) => {
        if (data) {
          const map: Record<string, boolean> = {};
          data.forEach((r: any) => { map[r.rater_id] = r.was_useful; });
          setRatings(map);
        }
      });
  }, [demandeId, getConversationByDemandeId]);

  // Determine if current user is sender or recipient
  const isSender = demande?.fromProfileId === currentProfileId;

  const hasSnapshot = demande?.snapshot != null;

  // Helper to try loading trajet from localStorage or archive as fallback
  const getFallbackTrajet = (trajetId: string) => {
    const hookResult = getTrajetById(trajetId);
    if (hookResult) return hookResult;
    const archivedResult = getArchivedTrajet(trajetId);
    if (archivedResult) return archivedResult;
    try {
      const trajets = JSON.parse(localStorage.getItem("trajets") || "[]");
      const found = trajets.find((t: { id: string }) => t.id === trajetId);
      if (found) return found;
      const archive = JSON.parse(localStorage.getItem("trajetsArchive") || "[]");
      return archive.find((t: { id: string }) => t.id === trajetId) || null;
    } catch {
      return null;
    }
  };

  const getFallbackProfile = (profileId: string) => {
    const hookResult = getProfileById(profileId);
    if (hookResult) return hookResult;
    try {
      const profiles = JSON.parse(localStorage.getItem("profiles") || "[]");
      return profiles.find((p: { id: string }) => p.id === profileId) || null;
    } catch {
      return null;
    }
  };

  const myTrajetId = demande ? (isSender ? demande.fromTrajetId : demande.toTrajetId) : null;
  const myTrajet = hasSnapshot
    ? (isSender ? demande.snapshot!.fromTrajet : demande.snapshot!.toTrajet)
    : myTrajetId ? getFallbackTrajet(myTrajetId) : null;
  const myProfile = hasSnapshot
    ? (isSender ? demande.snapshot!.fromProfile : demande.snapshot!.toProfile)
    : activeProfile;

  const voyageurTrajetId = demande ? (isSender ? demande.toTrajetId : demande.fromTrajetId) : null;
  const voyageurProfileId = demande ? (isSender ? demande.toProfileId : demande.fromProfileId) : null;
  
  const voyageurTrajet = hasSnapshot
    ? (isSender ? demande.snapshot!.toTrajet : demande.snapshot!.fromTrajet)
    : voyageurTrajetId ? getFallbackTrajet(voyageurTrajetId) : null;
  const voyageurProfile = hasSnapshot
    ? (isSender ? demande.snapshot!.toProfile : demande.snapshot!.fromProfile)
    : voyageurProfileId ? getFallbackProfile(voyageurProfileId) : null;

  const distance = myTrajet && voyageurTrajet 
    ? calculateDistance(myTrajet.destinationCoords, voyageurTrajet.destinationCoords)
    : null;
  
  const compatibilityScore = myTrajet && voyageurTrajet
    ? calculateMatchScore(myTrajet, voyageurTrajet)
    : 0;

  const handleBack = () => {
    navigate("/trajets");
  };

  // Determine who cancelled by checking cancellation notification
  const cancellerProfileId = (() => {
    if (!demande) return null;
    const cancellationNotif = notifications.find(
      (n) => n.type === "cancellation" && n.demandeId === demande.id
    );
    return cancellationNotif?.relatedProfileId || null;
  })();

  if (!isLoaded || !demande || !voyageurTrajet || !voyageurProfile || !myTrajet || !myProfile) {
    return null;
  }

  return (
    <section className="flex flex-col gap-4 pb-6 items-center">
      <div className="w-full max-w-[42rem] flex flex-col gap-2">
        <button onClick={handleBack} className="text-foreground self-start">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-[24px] font-semibold">Historique.</h1>
      </div>

      {/* Date */}
      <p className="text-[16px] font-semibold w-full max-w-[42rem]">
        {(() => {
          try {
            const parsed = parse(myTrajet.date, "dd/MM/yyyy", new Date());
            return format(parsed, "EEE d MMMM", { locale: fr }).replace(/^\w/, c => c.toUpperCase());
          } catch {
            return myTrajet.date;
          }
        })()}
      </p>

      <Card className="w-full max-w-[42rem] border-0">
        <CardContent className="flex flex-col gap-3 p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              {myProfile.photo ? (
                <AvatarImage src={myProfile.photo} alt={myProfile.firstName} referrerPolicy="no-referrer" />
              ) : null}
              <AvatarFallback className="text-[14px]">
                {myProfile.firstName.charAt(0)}
                {myProfile.lastName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-[16px] font-medium">
                  {myProfile.firstName}
                </span>
                {cancellerProfileId === currentProfileId && (
                  <Badge className="bg-[#e34454]/15 text-[#e34454] border-[#e34454]/30 text-[10px] px-1.5 py-0.5 hover:bg-[#e34454]/15">
                    Trajet annulé
                  </Badge>
                )}
                {!cancellerProfileId && demande.status === "completed" && currentProfileId in ratings && (
                  ratings[currentProfileId] ? (
                    <Badge className="bg-success text-success-foreground border-success-foreground/20 text-[10px] px-1.5 py-0.5 hover:bg-success">
                      Trajet réalisé
                    </Badge>
                  ) : (
                    <Badge className="bg-[#e34454]/15 text-[#e34454] border-[#e34454]/30 text-[10px] px-1.5 py-0.5 hover:bg-[#e34454]/15">
                      Trajet non réalisé
                    </Badge>
                  )
                )}
                {!cancellerProfileId && demande.status === "completed" && !(currentProfileId in ratings) && (
                  <Badge className="bg-success text-success-foreground border-success-foreground/20 text-[10px] px-1.5 py-0.5 hover:bg-success">
                    Trajet terminé
                  </Badge>
                )}
              </div>
              {myTrajet.companions > 1 && (
                <span className="text-[12px] text-muted-foreground">
                  et {myTrajet.companions === 2 ? "un" : myTrajet.companions === 3 ? "deux" : myTrajet.companions - 1} voyageur{myTrajet.companions > 2 ? "s" : ""}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1 text-[14px]">
            <p>
              <span className="text-muted-foreground">Départ : </span>
              {myTrajet.departureStation}, {myTrajet.departureTime}
            </p>
            <p>
              <span className="text-muted-foreground">Arrivée : </span>
              {myTrajet.destination}
            </p>
            <p>
              <span className="text-muted-foreground">Bagages : </span>
              {formatBaggage(myTrajet.baggage)}
            </p>
            {myTrajet.additionalInfo && (
              <p>
                <span className="text-muted-foreground">Infos complémentaires : </span>
                "{myTrajet.additionalInfo}"
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Voyageur Card */}
      <h2 className="text-[18px] font-semibold text-white w-full max-w-[42rem]">Voyageur(s)</h2>
      <Card className="w-full max-w-[42rem] border-0">
        <CardContent className="flex flex-col gap-3 p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              {voyageurProfile.photo ? (
                <AvatarImage src={voyageurProfile.photo} alt={voyageurProfile.firstName} referrerPolicy="no-referrer" />
              ) : null}
              <AvatarFallback className="text-[14px]">
                {voyageurProfile.firstName.charAt(0)}
                {voyageurProfile.lastName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[16px] font-medium">
                  {voyageurProfile.firstName}
                </span>
                {cancellerProfileId === voyageurProfileId && (
                  <Badge className="bg-[#e34454]/15 text-[#e34454] border-[#e34454]/30 text-[10px] px-1.5 py-0.5 hover:bg-[#e34454]/15">
                    Trajet annulé
                  </Badge>
                )}
                {!cancellerProfileId && demande.status === "completed" && voyageurProfileId && voyageurProfileId in ratings && (
                  ratings[voyageurProfileId] ? (
                    <Badge className="bg-success text-success-foreground border-success-foreground/20 text-[10px] px-1.5 py-0.5 hover:bg-success">
                      Trajet réalisé
                    </Badge>
                  ) : (
                    <Badge className="bg-[#e34454]/15 text-[#e34454] border-[#e34454]/30 text-[10px] px-1.5 py-0.5 hover:bg-[#e34454]/15">
                      Trajet non réalisé
                    </Badge>
                  )
                )}
                {!cancellerProfileId && demande.status === "completed" && (!voyageurProfileId || !(voyageurProfileId in ratings)) && (
                  <Badge className="bg-success text-success-foreground border-success-foreground/20 text-[10px] px-1.5 py-0.5 hover:bg-success">
                    Trajet terminé
                  </Badge>
                )}
              </div>
              {voyageurTrajet.companions > 1 && (
                <span className="text-[12px] text-muted-foreground">
                  et {voyageurTrajet.companions === 2 ? "un" : voyageurTrajet.companions === 3 ? "deux" : voyageurTrajet.companions - 1} voyageur{voyageurTrajet.companions > 2 ? "s" : ""}
                </span>
              )}
              <div className="flex items-center gap-2">
                {distance !== null && (
                  <span className="text-[12px] text-muted-foreground">
                    à {Math.round(distance * 10) / 10}km
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1 text-[14px]">
            <p>
              <span className="text-muted-foreground">Départ : </span>
              {voyageurTrajet.departureStation}, {voyageurTrajet.departureTime}
            </p>
            <p>
              <span className="text-muted-foreground">Arrivée : </span>
              {voyageurTrajet.destination}
            </p>
            <p>
              <span className="text-muted-foreground">Bagages : </span>
              {formatBaggage(voyageurTrajet.baggage)}
            </p>
            {voyageurTrajet.additionalInfo && (
              <p>
                <span className="text-muted-foreground">Infos complémentaires : </span>
                "{voyageurTrajet.additionalInfo}"
              </p>
            )}
          </div>
        </CardContent>
        <button 
          onClick={() => {
            const conversation = getConversationByDemandeId(demandeId!);
            if (conversation) {
              navigate(`/messages?conversationId=${conversation.id}`);
            }
          }}
          className="w-full py-3 text-center text-[16px] font-semibold rounded-b-xl border-t border-border/40" style={{ backgroundColor: "#4E657A", color: "#F0EEE9" }}
        >
          Voir les messages
        </button>
      </Card>

    </section>
  );
};

export default DemandeHistorique;