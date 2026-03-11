import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

import { ArrowLeft } from "lucide-react";
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
import { useTrajets, calculateMatchScore } from "@/hooks/use-trajets";
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
function getScoreColor(_score: number): string {
  return "text-[#D3E4D1] border-[#D3E4D1]";
}

const DemandeConsulter = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const demandeId = searchParams.get("demandeId");
  
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  
  const { getTrajetById, isLoaded: trajetsLoaded } = useTrajets();
  const { getActiveProfile, getProfileById, isLoaded: profilesLoaded } = useProfiles();
  const { getDemandeById, withdrawDemande, isLoaded: demandesLoaded } = useDemandes();
  const { createNotification } = useNotifications();

  const isLoaded = trajetsLoaded && profilesLoaded && demandesLoaded;

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

  // Calculate score (detourMin not available here, use 0 as fallback)
  const compatibilityScore = myTrajet && voyageurTrajet
    ? calculateMatchScore(myTrajet, voyageurTrajet, 0)
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

  if (!isLoaded || !demande || !voyageurTrajet || !voyageurProfile || !myTrajet || !myProfile) {
    return null;
  }

  // Build EnrichedMatchedTraveler for VoyageurCard
  const voyageurMatch: EnrichedMatchedTraveler = {
    trajet: voyageurTrajet,
    profile: voyageurProfile,
    detourMin: 0,
    compatibilityScore,
    receivedDemandeId: null,
    sentDemandeId: demande.id,
  };

  return (
    <section className="flex flex-col gap-4 pb-6 items-center">
      <div className="w-full max-w-[42rem] flex flex-col gap-2">
        <button onClick={handleBack} className="text-foreground self-start">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-[24px] font-semibold w-full">Consulter le trajet.</h1>
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


      {/* Carte Mon trajet */}
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
              <div className="flex items-center gap-2">
                <span className="text-[16px] font-medium">
                  {myProfile.firstName}
                </span>
                {demande.status === "refused" && isSender && (
                  <Badge className="bg-success text-success-foreground border-success-foreground/20 text-[10px] px-1.5 py-0.5 hover:bg-success">
                    Demande envoyée
                  </Badge>
                )}
                {demande.status === "refused" && !isSender && (
                  <Badge className="bg-[#e34454]/15 text-[#e34454] border-[#e34454]/30 text-[10px] px-1.5 py-0.5 hover:bg-[#e34454]/15">
                    Demande refusée
                  </Badge>
                )}
                {demande.status === "accepted" && !isSender && (
                  <Badge className="bg-success text-success-foreground border-success-foreground/20 text-[10px] px-1.5 py-0.5 hover:bg-success">
                    Demande acceptée
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
      <h2 className="text-[18px] font-semibold text-foreground w-full max-w-[42rem]">Voyageur(s)</h2>
      <VoyageurCard 
        match={voyageurMatch} 
        showButton={demande.status === "pending"}
        buttonLabel="Retirer ma demande"
        onButtonClick={() => setShowWithdrawDialog(true)}
        messagesDemandeId={demande.status === "accepted" ? demande.id : undefined}
        customBadge={demande.status === "refused" ? (
          isSender ? (
            <Badge className="bg-[#e34454]/15 text-[#e34454] border-[#e34454]/30 text-[10px] px-1.5 py-0.5 hover:bg-[#e34454]/15">
              Demande refusée
            </Badge>
          ) : (
            <Badge className="bg-success text-success-foreground border-success-foreground/20 text-[10px] px-1.5 py-0.5 hover:bg-success">
              Demande envoyée
            </Badge>
          )
        ) : demande.status === "accepted" && isSender ? (
          <Badge className="bg-success text-success-foreground border-success-foreground/20 text-[10px] px-1.5 py-0.5 hover:bg-success">
            Demande acceptée
          </Badge>
        ) : undefined}
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
