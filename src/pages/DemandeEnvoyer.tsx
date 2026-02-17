import { useSearchParams, useNavigate } from "react-router-dom";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { VoyageurCard } from "@/components/VoyageurCard";
import { useTrajets, calculateDistance, calculateMatchScore } from "@/hooks/use-trajets";
import { useProfiles } from "@/hooks/use-profiles";
import { format, parse } from "date-fns";
import { fr } from "date-fns/locale";
import type { Baggage, EnrichedMatchedTraveler } from "@/types/trajet";

function formatBaggage(baggage: Baggage): string {
  const parts: string[] = [];
  if (baggage.small > 0) parts.push(`${baggage.small} petit${baggage.small > 1 ? "s" : ""}`);
  if (baggage.medium > 0) parts.push(`${baggage.medium} moyen${baggage.medium > 1 ? "s" : ""}`);
  if (baggage.large > 0) parts.push(`${baggage.large} grand${baggage.large > 1 ? "s" : ""}`);
  return parts.length > 0 ? parts.join(", ") : "Aucun bagage";
}

const DemandeEnvoyer = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const voyageurId = searchParams.get("voyageurId");
  
  const { trajets, getTrajetById } = useTrajets();
  const { getActiveProfile, getProfileById } = useProfiles();

  // Get voyageur data
  const voyageurTrajet = voyageurId ? getTrajetById(voyageurId) : null;
  const voyageurProfile = voyageurTrajet ? getProfileById(voyageurTrajet.profileId) : null;

  // Get current user data
  const myProfile = getActiveProfile();
  const lastTrajetId = localStorage.getItem("lastPublishedTrajetId");
  let myTrajet = lastTrajetId ? getTrajetById(lastTrajetId) : null;
  
  // Fallback: find user's trajet that matches the voyageur's date & station
  if (!myTrajet && myProfile && voyageurTrajet) {
    myTrajet = trajets.find(
      (t) => t.profileId === myProfile.id && t.date === voyageurTrajet.date && t.departureStation.toLowerCase() === voyageurTrajet.departureStation.toLowerCase()
    ) || null;
  }

  // Calculate distance and score
  const distance = myTrajet && voyageurTrajet 
    ? calculateDistance(myTrajet.destinationCoords, voyageurTrajet.destinationCoords)
    : null;
  
  const compatibilityScore = myTrajet && voyageurTrajet
    ? calculateMatchScore(myTrajet, voyageurTrajet)
    : 0;

  // Build EnrichedMatchedTraveler for VoyageurCard
  const voyageurMatch: EnrichedMatchedTraveler | null = voyageurTrajet && voyageurProfile ? {
    trajet: voyageurTrajet,
    profile: voyageurProfile,
    distance: distance ?? 0,
    compatibilityScore,
    receivedDemandeId: null,
    sentDemandeId: null,
  } : null;

  const handleSendRequest = () => {
    navigate(`/paiement?voyageurId=${voyageurId}&type=envoi`);
  };

  const isLoading = !voyageurTrajet || !voyageurProfile || !myTrajet || !myProfile;

  if (isLoading) {
    return (
      <section className="flex flex-col gap-4 pb-6 items-center px-4">
        <h1 className="text-[24px] font-semibold w-full max-w-[42rem]">Contacter.</h1>
        <Card className="w-full max-w-[42rem]">
          <CardContent className="flex flex-col gap-4 p-4">
            <p className="text-muted-foreground text-center py-8">
              Chargement...
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4 pb-6 items-center px-4">
      <h1 className="text-[24px] font-semibold w-full max-w-[42rem]">Contacter.</h1>

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
          {/* Profile row */}
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              {myProfile.photo ? (
                <AvatarImage src={myProfile.photo} alt={myProfile.firstName} />
              ) : null}
              <AvatarFallback className="text-[14px]">
                {myProfile.firstName.charAt(0)}
                {myProfile.lastName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-[16px] font-medium">
                {myProfile.firstName}
                {myTrajet.companions > 1 && (
                  <span className="text-muted-foreground font-normal">
                    {" "}et {myTrajet.companions === 2 ? "un" : myTrajet.companions === 3 ? "deux" : myTrajet.companions - 1} voyageur{myTrajet.companions > 2 ? "s" : ""}
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Details */}
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

      {/* Voyageur(s) section */}
      {voyageurMatch && (
        <>
          <h2 className="text-[18px] font-semibold text-heading w-full max-w-[42rem]">Voyageur(s)</h2>
          <VoyageurCard 
            match={voyageurMatch} 
            showButton={true} 
            buttonLabel="Contacter"
            onButtonClick={handleSendRequest}
          />
        </>
      )}
    </section>
  );
};

export default DemandeEnvoyer;
