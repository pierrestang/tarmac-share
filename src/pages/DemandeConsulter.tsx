import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { VoyageurCard } from "@/components/VoyageurCard";
import { useTrajets, calculateDistance, calculateMatchScore } from "@/hooks/use-trajets";
import { useProfiles } from "@/hooks/use-profiles";
import { useDemandes } from "@/hooks/use-demandes";
import { useNotifications } from "@/hooks/use-notifications";
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
function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-600 border-green-600";
  if (score >= 60) return "text-yellow-600 border-yellow-600";
  return "text-orange-600 border-orange-600";
}

const DemandeConsulter = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const demandeId = searchParams.get("demandeId");
  
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  
  const { getTrajetById } = useTrajets();
  const { getActiveProfile, getProfileById } = useProfiles();
  const { getDemandeById, withdrawDemande } = useDemandes();
  const { createNotification } = useNotifications();

  // Get demande data
  const demande = demandeId ? getDemandeById(demandeId) : null;
  const activeProfile = getActiveProfile();
  const currentProfileId = activeProfile?.id || "";

  // Determine if current user is sender or recipient
  const isSender = demande?.fromProfileId === currentProfileId;

  // Get my data (current user's perspective)
  const myTrajet = demande 
    ? getTrajetById(isSender ? demande.fromTrajetId : demande.toTrajetId) 
    : null;
  const myProfile = activeProfile;

  // Get voyageur data (the other person)
  const voyageurTrajet = demande 
    ? getTrajetById(isSender ? demande.toTrajetId : demande.fromTrajetId) 
    : null;
  const voyageurProfile = demande 
    ? getProfileById(isSender ? demande.toProfileId : demande.fromProfileId) 
    : null;

  // Calculate distance and score
  const distance = myTrajet && voyageurTrajet 
    ? calculateDistance(myTrajet.destinationCoords, voyageurTrajet.destinationCoords)
    : null;
  
  const compatibilityScore = myTrajet && voyageurTrajet
    ? calculateMatchScore(myTrajet, voyageurTrajet)
    : 0;

  const handleBack = () => {
    navigate("/trajets");
  };

  const handleWithdraw = async () => {
    if (!demande || !myProfile) return;
    const success = await withdrawDemande(demande.id);
    if (success) {
      try {
        await createNotification({
          profileId: demande.toProfileId,
          type: "demande_withdrawn",
          title: "Demande retirée",
          message: `${myProfile.firstName} a retiré sa demande`,
          demandeId: demande.id,
          relatedProfileId: myProfile.id,
        });
      } catch (e) {
        console.error("Erreur notification:", e);
      }
    }
    // Always redirect to /trajets after withdraw attempt
    navigate("/trajets");
  };

  if (!demande || !voyageurTrajet || !voyageurProfile || !myTrajet || !myProfile) {
    return (
      <section className="flex flex-col gap-4 pb-6 items-center px-4">
        <h1 className="text-[24px] font-semibold w-full max-w-[42rem]">Ma demande</h1>
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

  // Build EnrichedMatchedTraveler for VoyageurCard
  const voyageurMatch: EnrichedMatchedTraveler = {
    trajet: voyageurTrajet,
    profile: voyageurProfile,
    distance: distance ?? 0,
    compatibilityScore,
    receivedDemandeId: null,
    sentDemandeId: demande.id,
  };

  return (
    <section className="flex flex-col gap-4 pb-6 items-center px-4">
      {/* Titre = Date */}
      <h1 className="text-[24px] font-semibold text-heading w-full max-w-[42rem]">
        {(() => {
          try {
            const parsed = parse(myTrajet.date, "dd/MM/yyyy", new Date());
            return format(parsed, "EEE d MMMM", { locale: fr }).replace(/^\w/, c => c.toUpperCase());
          } catch {
            return myTrajet.date;
          }
        })()}
      </h1>


      {/* Carte Mon trajet */}
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
      <h2 className="text-[18px] font-semibold text-white w-full max-w-[42rem]">Voyageur(s)</h2>
      <VoyageurCard 
        match={voyageurMatch} 
        showButton={demande.status === "pending"}
        buttonLabel="Retirer ma demande"
        onButtonClick={() => setShowWithdrawDialog(true)}
      />

      {/* Withdraw Confirmation Dialog */}
      <AlertDialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <AlertDialogContent className="rounded-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer ma demande ?</AlertDialogTitle>
            <AlertDialogDescription className="text-white">
              Êtes-vous sûr de vouloir retirer votre demande ? Aucun montant ne sera prélevé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col gap-2 sm:flex-col">
            <AlertDialogAction onClick={handleWithdraw} className="rounded-md">
              Confirmer
            </AlertDialogAction>
            <AlertDialogCancel className="rounded-md">Annuler</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};

export default DemandeConsulter;
