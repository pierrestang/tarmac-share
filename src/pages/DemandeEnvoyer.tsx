import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { VoyageurCard } from "@/components/VoyageurCard";
import { useTrajets, calculateMatchScore, calculateDetourTimes, calculateDistance } from "@/hooks/use-trajets";
import { useProfiles } from "@/hooks/use-profiles";
import { useDemandes } from "@/hooks/use-demandes";
import { useNotifications } from "@/hooks/use-notifications";
import { useAppSettings } from "@/hooks/use-app-settings";
import { toast } from "@/hooks/use-toast";
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
  const { createDemande, getPendingDemandeByTrajetIds } = useDemandes();
  const { createNotification } = useNotifications();
  const { isFreeMode } = useAppSettings();

  // Get voyageur data
  const voyageurTrajet = voyageurId ? getTrajetById(voyageurId) : null;
  const voyageurProfile = voyageurTrajet ? getProfileById(voyageurTrajet.profileId) : null;

  // Get current user data
  const myProfile = getActiveProfile();
  const myTrajetIdParam = searchParams.get("myTrajetId");
  const lastTrajetId = myTrajetIdParam || localStorage.getItem("lastPublishedTrajetId");
  let myTrajet = lastTrajetId ? getTrajetById(lastTrajetId) : null;
  
  // Fallback: find user's trajet that matches the voyageur's date & station
  if (!myTrajet && myProfile && voyageurTrajet) {
    myTrajet = trajets.find(
      (t) => t.profileId === myProfile.id && t.date === voyageurTrajet.date && t.departureStation.toLowerCase() === voyageurTrajet.departureStation.toLowerCase()
    ) || null;
  }

  // Use detour times for consistency with /matches
  const [detourMin, setDetourMin] = useState<number | null>(null);
  const [detourLoaded, setDetourLoaded] = useState(false);

  useEffect(() => {
    setDetourLoaded(false);
    if (myTrajet?.destinationCoords && voyageurTrajet?.destinationCoords && myTrajet?.departureStationCoords) {
      calculateDetourTimes(myTrajet.departureStationCoords, myTrajet.destinationCoords, [voyageurTrajet.destinationCoords])
        .then((results) => {
          const result = results[0];
          if (result) {
            const maxDetour = Math.max(result.detourA, result.detourB);
            setDetourMin(Math.round(maxDetour));
          } else {
            setDetourMin(0);
          }
          setDetourLoaded(true);
        });
    }
  }, [myTrajet?.destinationCoords?.lat, myTrajet?.destinationCoords?.lng, voyageurTrajet?.destinationCoords?.lat, voyageurTrajet?.destinationCoords?.lng, myTrajet?.departureStationCoords?.lat, myTrajet?.departureStationCoords?.lng]);

  const compatibilityScore = myTrajet && voyageurTrajet && detourLoaded
    ? calculateMatchScore(myTrajet, voyageurTrajet, detourMin) 
    : null;

  // Build EnrichedMatchedTraveler for VoyageurCard
  const voyageurMatch: EnrichedMatchedTraveler | null = voyageurTrajet && voyageurProfile ? {
    trajet: voyageurTrajet,
    profile: voyageurProfile,
    detourMin: detourMin ?? 0,
    compatibilityScore: compatibilityScore ?? 0,
    receivedDemandeId: null,
    sentDemandeId: null,
  } : null;

  const [isSending, setIsSending] = useState(false);

  const handleSendRequest = async () => {
    if (isFreeMode) {
      if (isSending) return;
      setIsSending(true);
      try {
        if (!myTrajet || !myProfile || !voyageurTrajet || !voyageurProfile) return;
        const existingDemande = getPendingDemandeByTrajetIds(myTrajet.id, voyageurTrajet.id);
        if (existingDemande) {
          toast({ title: "Demande déjà envoyée !" });
          navigate("/trajets");
          return;
        }
        const newDemande = await createDemande({
          type: "sent",
          fromProfileId: myProfile.id,
          toProfileId: voyageurTrajet.profileId,
          fromTrajetId: myTrajet.id,
          toTrajetId: voyageurTrajet.id,
        });
        try {
          await createNotification({
            profileId: voyageurTrajet.profileId,
            type: "demande_received",
            title: "Nouvelle demande",
            message: `${myProfile.firstName} souhaite voyager avec vous`,
            demandeId: newDemande.id,
            relatedProfileId: myProfile.id,
          });
        } catch (e) {
          console.error("Erreur notification:", e);
        }
        toast({
          title: `Demande envoyée ! ${voyageurProfile.firstName} a été notifié.`,
          className: "bg-transparent border-0 shadow-none",
          style: { backgroundColor: '#7BA87B', color: '#F0EEE9' },
        });
        navigate("/trajets");
      } catch (error: any) {
        toast({ title: error?.message || "Une erreur est survenue.", variant: "destructive" });
      } finally {
        setIsSending(false);
      }
    } else {
      navigate(`/paiement?voyageurId=${voyageurId}&type=envoi${myTrajetIdParam ? `&myTrajetId=${myTrajetIdParam}` : ''}`);
    }
  };

  const isLoading = !voyageurTrajet || !voyageurProfile || !myTrajet || !myProfile || !detourLoaded;

  if (isLoading) {
    return (
      <section className="flex flex-col gap-4 pb-6 items-center">
        <div className="w-full max-w-[42rem] flex flex-col gap-2">
          <button onClick={() => navigate(-1)} className="text-foreground self-start">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-[24px] font-semibold w-full">Envoyer la demande.</h1>
        </div>
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
    <section className="flex flex-col gap-4 pb-6 items-center">
      <div className="w-full max-w-[42rem] flex flex-col gap-2">
        <button onClick={() => navigate(-1)} className="text-foreground self-start">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-[24px] font-semibold w-full">Envoyer la demande.</h1>
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
          {/* Profile row */}
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
