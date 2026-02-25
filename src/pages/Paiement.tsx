import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDemandes } from "@/hooks/use-demandes";
import { useTrajets } from "@/hooks/use-trajets";
import { useProfiles } from "@/hooks/use-profiles";
import { useMessages } from "@/hooks/use-messages";
import { useRepublications } from "@/hooks/use-republications";
import { useNotifications } from "@/hooks/use-notifications";
import { incrementUnreadMessages } from "@/hooks/use-unread-messages";
import { toast } from "@/hooks/use-toast";

const Paiement = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const voyageurId = searchParams.get("voyageurId");
  const demandeId = searchParams.get("demandeId");
  const trajetId = searchParams.get("trajetId");
  const type = searchParams.get("type") || "envoi";

  const { createDemande, acceptDemande, getDemandeById, saveDemandeSnapshot, getPendingDemandeByTrajetIds } = useDemandes();
  const { trajets, getTrajetById, updateTrajet } = useTrajets();
  const { getActiveProfile, getProfileById } = useProfiles();
  const { createConversation } = useMessages();
  const { canRepublishFree, useRepublication } = useRepublications();
  const { createNotification } = useNotifications();

  const myProfile = getActiveProfile();

  // Find my trajet: try localStorage first, then find by matching profile + voyageur context
  const lastTrajetId = localStorage.getItem("lastPublishedTrajetId");
  let myTrajet = lastTrajetId ? getTrajetById(lastTrajetId) : null;
  
  // Fallback: find user's trajet that matches the voyageur's date & station
  if (!myTrajet && myProfile && voyageurId && type === "envoi") {
    const voyageurTrajet = getTrajetById(voyageurId);
    if (voyageurTrajet) {
      myTrajet = trajets.find(
        (t) => t.profileId === myProfile.id && t.date === voyageurTrajet.date && t.departureStation.toLowerCase() === voyageurTrajet.departureStation.toLowerCase()
      ) || null;
    }
  }
  // For acceptation, get the demande and find user's trajet
  const demande = demandeId ? getDemandeById(demandeId) : null;
  
  // Determine if the user's trajet is republished AND they have free credits
  let isFreeFromRepublication = false;
  let userTrajetId: string | null = null;

  if (type === "envoi" && myTrajet && myProfile) {
    const isRepublished = myTrajet.isRepublished === true;
    isFreeFromRepublication = isRepublished && canRepublishFree(myProfile.id);
    userTrajetId = myTrajet.id;
  } else if (type === "acceptation" && demande && myProfile) {
    // Find user's trajet in the demande
    const isToUser = demande.toProfileId === myProfile.id;
    userTrajetId = isToUser ? demande.toTrajetId : demande.fromTrajetId;
    const userTrajet = userTrajetId ? getTrajetById(userTrajetId) : null;
    const isRepublished = userTrajet?.isRepublished === true;
    isFreeFromRepublication = isRepublished && canRepublishFree(myProfile.id);
  }

  const [isLoading, setIsLoading] = useState(false);

  const handlePay = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      // Consume the republication bonus if applicable
      if (isFreeFromRepublication && userTrajetId && myProfile) {
        useRepublication(myProfile.id);
        await updateTrajet(userTrajetId, { isRepublished: false });
      }

      if (type === "acceptation" && demandeId) {
        const demande = getDemandeById(demandeId);
        if (!demande || !myProfile) {
          toast({ title: "Impossible de trouver la demande ou votre profil.", variant: "destructive" });
          setIsLoading(false);
          return;
        }

        await saveDemandeSnapshot(demandeId);
        await acceptDemande(demandeId, getProfileById);
        await createConversation(demandeId, [demande.fromProfileId, demande.toProfileId]);
        try {
          await createNotification({
            profileId: demande.fromProfileId,
            type: "demande_accepted",
            title: "Demande acceptée",
            message: `${myProfile.firstName} a accepté votre demande`,
            demandeId: demande.id,
            relatedProfileId: myProfile.id,
          });
        } catch (e) {
          console.error("Erreur notification:", e);
        }

        navigate("/messages");
      } else if (type === "envoi" && voyageurId) {
        const voyageurTrajet = getTrajetById(voyageurId);

        if (!voyageurTrajet) {
          toast({ title: "Le trajet du voyageur n'a pas été trouvé. Veuillez réessayer.", variant: "destructive" });
          setIsLoading(false);
          return;
        }
        if (!myTrajet) {
          toast({ title: "Votre trajet n'a pas été trouvé. Veuillez publier un trajet d'abord.", variant: "destructive" });
          setIsLoading(false);
          return;
        }
        if (!myProfile) {
          toast({ title: "Votre profil n'a pas été trouvé.", variant: "destructive" });
          setIsLoading(false);
          return;
        }

        // Check for existing pending demande to prevent duplicates
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

        navigate("/trajets");
      } else {
        navigate("/trajets");
      }
    } catch (error: any) {
      console.error("Erreur lors du paiement:", error);
      toast({ title: error?.message || "Une erreur est survenue. Veuillez réessayer.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  // Determine amount and explanatory text
  let amount = "1,99 €";
  let explanatoryText = "";

  if (isFreeFromRepublication) {
    amount = "0 €";
    explanatoryText = "Suite à la republication de votre annonce, cette demande est offerte.";
  } else if (type === "acceptation") {
    explanatoryText = "En acceptant cette demande, vous acceptez d'être débité de 1,99 €.";
  } else {
    explanatoryText = "En envoyant cette demande, vous acceptez d'être débité de 1,99 € au titre des frais de mise en relation, uniquement si l'autre voyageur accepte.";
  }

  return (
    <section className="flex flex-col items-center pb-6">
      <div className="w-full max-w-[42rem]">
        <h1 className="text-[24px] font-semibold mb-4">Paiement.</h1>

        <Card className="border-0">
          <CardContent className="flex flex-col gap-4 p-4">
            <p className="text-[14px] text-muted-foreground">
              {explanatoryText}
            </p>
            <p className="text-[14px] text-muted-foreground italic">
              Les frais correspondent exclusivement au service de mise en relation. Le transport est organisé librement entre voyageurs.
            </p>

            <p className="text-[18px] font-semibold">
              Montant : {amount}
            </p>

            <div className="flex gap-3">
              <Button onClick={handlePay} className="flex-1 rounded-md" disabled={isLoading}>
                {isLoading ? "Traitement..." : isFreeFromRepublication ? "Confirmer" : "Payer"}
              </Button>
              <Button onClick={handleCancel} variant="outline" className="flex-1 rounded-md">
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default Paiement;
