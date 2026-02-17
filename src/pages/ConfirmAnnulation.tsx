import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useMessages } from "@/hooks/use-messages";
import { useProfiles } from "@/hooks/use-profiles";
import { useNotifications } from "@/hooks/use-notifications";
import { useDemandes } from "@/hooks/use-demandes";

const ConfirmAnnulation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const conversationId = searchParams.get("conversationId");

  const { getConversationById, sendMessage, closeConversation, addSystemMessage, saveRating } = useMessages();
  const { getActiveProfile } = useProfiles();
  const { createNotification } = useNotifications();
  const { completeDemande, saveDemandeSnapshot } = useDemandes();

  const activeProfile = getActiveProfile();

  if (!conversationId) {
    navigate("/messages", { replace: true });
    return null;
  }

  const handleConfirm = async () => {
    if (!activeProfile) return;
    const conversation = getConversationById(conversationId);
    if (!conversation) return;

    const otherProfileId = conversation.participants.find((p) => p !== activeProfile.id);
    if (!otherProfileId) return;

    // Send the cancellation message
    await sendMessage(conversationId, activeProfile.id, "Je dois annuler");

    // Send notification to the other person
    try {
      await createNotification({
        profileId: otherProfileId,
        type: "cancellation",
        title: "Trajet annulé",
        message: "Votre voyageur a annulé. Souhaitez-vous republier votre annonce ?",
        demandeId: conversation.demandeId,
        relatedProfileId: activeProfile.id,
      });
    } catch (e) {
      console.error("Erreur notification:", e);
    }

    // Close conversation for both participants
    await closeConversation(conversationId, activeProfile.id, otherProfileId);

    // Add system message
    await addSystemMessage(conversationId, `[CANCELLED_BY:${activeProfile.id}] ${activeProfile.firstName} a annulé le trajet. Le trajet est considéré comme terminé.`);

    const ratingBase = {
      conversationId,
      score: 0,
      wasUseful: false,
      comment: "",
    };
    await saveRating({
      ...ratingBase,
      raterId: activeProfile.id,
      ratedProfileId: otherProfileId,
    });
    await saveRating({
      ...ratingBase,
      raterId: otherProfileId,
      ratedProfileId: activeProfile.id,
    });

    // Complete demande and save snapshot
    await completeDemande(conversation.demandeId);
    await saveDemandeSnapshot(conversation.demandeId);

    navigate("/messages", { replace: true });
  };

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <h1 className="text-[22px] font-semibold text-heading whitespace-nowrap">
          Confirmer l'annulation
        </h1>
      </div>

      <div className="flex-1 px-4 pb-6">
        <div className="max-w-[42rem] mx-auto">
          <Card className="border-0 rounded-md shadow-none">
            <CardContent className="p-6 flex flex-col gap-6">
              <p className="text-[16px] text-card-foreground text-center">
                Êtes-vous sûr de vouloir annuler ce trajet ?
              </p>

              <div className="flex gap-3">
                <Button
                  onClick={handleConfirm}
                  className="flex-1 rounded-full"
                >
                  Oui
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="flex-1 rounded-full"
                >
                  Non
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ConfirmAnnulation;
