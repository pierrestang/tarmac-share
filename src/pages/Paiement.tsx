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

const Paiement = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const voyageurId = searchParams.get("voyageurId");
  const demandeId = searchParams.get("demandeId");
  const trajetId = searchParams.get("trajetId");
  const type = searchParams.get("type") || "envoi";

  const { createDemande, acceptDemande, getDemandeById, saveDemandeSnapshot } = useDemandes();
  const { getTrajetById, updateTrajet } = useTrajets();
  const { getActiveProfile, getProfileById } = useProfiles();
  const { createConversation } = useMessages();
  const { canRepublishFree, useRepublication } = useRepublications();
  const { createNotification } = useNotifications();

  // Get my trajet to check if it's republished
  const lastTrajetId = localStorage.getItem("lastPublishedTrajetId");
  const myTrajet = lastTrajetId ? getTrajetById(lastTrajetId) : null;

  // For acceptation, get the demande and find user's trajet
  const demande = demandeId ? getDemandeById(demandeId) : null;
  const myProfile = getActiveProfile();
  
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

  const handlePay = async () => {
    // Consume the republication bonus if applicable
    if (isFreeFromRepublication && userTrajetId && myProfile) {
      useRepublication(myProfile.id);  // Consume the free credit
      await updateTrajet(userTrajetId, { isRepublished: false });
    }

    if (type === "acceptation" && demandeId) {
      // Accept existing demande
      const demande = getDemandeById(demandeId);
      if (demande && myProfile) {
        // CRITICAL: Save snapshot BEFORE acceptDemande to guarantee data capture
        await saveDemandeSnapshot(demandeId);
        
        await acceptDemande(demandeId, getProfileById);
        
        // Create conversation
        await createConversation(demandeId, [demande.fromProfileId, demande.toProfileId]);
        
        // Create notification for the requester (demandeur A)
        await createNotification({
          profileId: demande.fromProfileId,
          type: "demande_accepted",
          title: "Demande acceptée",
          message: `${myProfile.firstName} a accepté votre demande`,
          demandeId: demande.id,
          relatedProfileId: myProfile.id,
        });
      }
      navigate("/messages");
    } else if (type === "envoi" && voyageurId) {
      // Create new demande
      const voyageurTrajet = getTrajetById(voyageurId);
      const myProfile = getActiveProfile();

      if (voyageurTrajet && myTrajet && myProfile) {
        const newDemande = await createDemande({
          type: "sent",
          fromProfileId: myProfile.id,
          toProfileId: voyageurTrajet.profileId,
          fromTrajetId: myTrajet.id,
          toTrajetId: voyageurTrajet.id,
        });
        
        // Create notification for the recipient (destinataire B)
        await createNotification({
          profileId: voyageurTrajet.profileId,
          type: "demande_received",
          title: "Nouvelle demande",
          message: `${myProfile.firstName} souhaite voyager avec vous`,
          demandeId: newDemande.id,
          relatedProfileId: myProfile.id,
        });
      }
      navigate("/trajets");
    } else {
      navigate("/trajets");
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
    explanatoryText = "En acceptant cette demande, vous acceptez que 1,99 € soit débité de votre compte.";
  } else {
    explanatoryText = "En envoyant cette demande, vous acceptez qu'un prélèvement de 1,99 € soit effectué sur votre compte si le voyageur accepte votre proposition.";
  }

  return (
    <section className="flex flex-col items-center px-4 pb-6">
      <div className="w-full max-w-[42rem]">
        <h1 className="text-[24px] font-semibold mb-4">Paiement.</h1>

        <Card className="border-0">
          <CardContent className="flex flex-col gap-4 p-4">
            <p className="text-[14px] text-muted-foreground">
              {explanatoryText}
            </p>

            <p className="text-[18px] font-semibold">
              Montant : {amount}
            </p>

            <div className="flex gap-3">
              <Button onClick={handlePay} className="flex-1 rounded-md">
                {isFreeFromRepublication ? "Confirmer" : "Payer"}
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
