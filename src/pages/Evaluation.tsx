import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { useMessages } from "@/hooks/use-messages";
import { useProfiles } from "@/hooks/use-profiles";
import { useDemandes } from "@/hooks/use-demandes";
import { useNotifications } from "@/hooks/use-notifications";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";


const Evaluation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const conversationId = searchParams.get("conversationId");
  const ratedProfileId = searchParams.get("ratedProfileId");

  const { closeConversation, addSystemMessage, saveRating, getConversationById, sendMessage } = useMessages();
  const { getActiveProfile } = useProfiles();
  const { completeDemande, saveDemandeSnapshot } = useDemandes();
  const { markReadByDemandeId, createNotification } = useNotifications();

  const activeProfile = getActiveProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (!conversationId || !ratedProfileId) {
      navigate("/messages", { replace: true });
    }
  }, [conversationId, ratedProfileId, navigate]);

  if (!conversationId || !ratedProfileId) {
    return null;
  }

  if (!activeProfile) {
    return null;
  }

  const handleAnswer = async (wasUseful: boolean) => {
    if (isSubmitting || hasRedirected.current) return;
    if (!activeProfile) return;

    // Fetch conversation directly from DB to get fresh state
    const { data: convRow } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .single();

    if (!convRow) {
      navigate("/trajets", { replace: true });
      return;
    }

    const closedBy: string[] = convRow.closed_by || [];
    if (closedBy.includes(activeProfile.id)) {
      navigate("/trajets", { replace: true });
      return;
    }

    setIsSubmitting(true);

    await closeConversation(conversationId, activeProfile.id);

    // Save the evaluation rating
    await saveRating({
      conversationId,
      raterId: activeProfile.id,
      ratedProfileId: ratedProfileId,
      score: wasUseful ? 5 : 1,
      wasUseful,
      comment: "",
    });

    // Query DB directly to get fresh closed_by (state may not be updated yet)
    const { data: freshRow } = await supabase
      .from("conversations")
      .select("closed_by")
      .eq("id", conversationId)
      .single();

    const bothClosed = freshRow && Array.isArray(freshRow.closed_by) && freshRow.closed_by.length >= 2;

    if (bothClosed) {
      await completeDemande(convRow.demande_id);
      await addSystemMessage(conversationId, "Le trajet est terminé");
    }

    await saveDemandeSnapshot(convRow.demande_id);
    await markReadByDemandeId(convRow.demande_id);

    if (wasUseful) {
      toast({
        title: "Super ! Ravi que vous ayez pu partager ce trajet.",
        className: "bg-transparent border-0 shadow-none",
        style: { backgroundColor: '#7BA87B', color: '#F0EEE9' },
      });
    } else {
      toast({
        title: "Retour enregistré. Nous sommes désolés que ce trajet n'ait pas abouti.",
        className: "bg-transparent border-0 shadow-none",
        style: { backgroundColor: '#E34454', color: '#F0EEE9' },
      });
    }

    hasRedirected.current = true;
    navigate("/trajets", { replace: true });
  };

  const handleCancel = async () => {
    if (isSubmitting || hasRedirected.current) return;
    if (!activeProfile || !conversationId) return;

    const conversation = getConversationById(conversationId);
    if (!conversation) return;

    const otherProfileId = conversation.participants.find((p) => p !== activeProfile.id);
    if (!otherProfileId) return;

    setIsSubmitting(true);

    await sendMessage(conversationId, activeProfile.id, "Je dois annuler");

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

    await closeConversation(conversationId, activeProfile.id, otherProfileId);
    await addSystemMessage(conversationId, `[CANCELLED_BY:${activeProfile.id}] ${activeProfile.firstName} a annulé le trajet. Le trajet est considéré comme terminé.`);

    const ratingBase = {
      conversationId,
      score: 0,
      wasUseful: false,
      comment: "",
    };
    await saveRating({ ...ratingBase, raterId: activeProfile.id, ratedProfileId: otherProfileId });
    await saveRating({ ...ratingBase, raterId: otherProfileId, ratedProfileId: activeProfile.id });

    await completeDemande(conversation.demandeId);
    await supabase.from("demandes").update({ was_cancelled: true } as any).eq("id", conversation.demandeId);
    await saveDemandeSnapshot(conversation.demandeId);
    await markReadByDemandeId(conversation.demandeId);

    hasRedirected.current = true;
    navigate("/messages", { replace: true });
  };

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex flex-col gap-2 pt-6 pb-4">
        <button onClick={() => navigate(-1)} className="p-1 self-start">
          <ArrowLeft className="h-6 w-6 text-heading" />
        </button>
         <h1 className="text-[22px] font-semibold text-heading whitespace-nowrap">
          Clôturer le trajet
        </h1>
      </div>

      <div className="flex-1 pb-6">
        <div className="max-w-[42rem] mx-auto">
          <Card className="border-0 rounded-md shadow-none" style={{ backgroundColor: "#FFFFFF" }}>
            <CardContent className="p-4 flex flex-col gap-4">
              <p className="text-[16px] font-semibold" style={{ color: "#4E657A" }}>
                Le trajet a-t-il eu lieu ?
              </p>

              <p className="text-[14px]" style={{ color: "#4E657A" }}>
                Confirmez si votre trajet a bien eu lieu pour finaliser la mise en relation et mettre à jour votre historique, ou signalez tout imprévu.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => handleAnswer(true)}
                  disabled={isSubmitting}
                   className="flex-1 text-[16px] font-semibold border-0"
                  style={{ backgroundColor: "#7BA87B", color: "#F0EEE9" }}
                >
                  {isSubmitting ? "Envoi..." : "Oui"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleAnswer(false)}
                  disabled={isSubmitting}
                  className="flex-1 text-[16px] font-semibold border-0"
                  style={{ backgroundColor: "#E34454", color: "#F0EEE9" }}
                >
                  Non
                </Button>
              </div>
            </CardContent>
          </Card>
          <button
            onClick={() => setShowCancelDialog(true)}
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 w-full rounded-md px-4 py-3 text-[16px] font-semibold border-0 mt-3"
            style={{ backgroundColor: "#E34454", color: "#F0EEE9" }}>
            <span>Annuler le trajet</span>
          </button>
        </div>
      </div>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="rounded-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer l'annulation ?</AlertDialogTitle>
            <AlertDialogDescription className="hidden" />
          </AlertDialogHeader>
          <AlertDialogFooter className="flex !flex-row gap-3 items-center mt-0">
            <AlertDialogAction
              onClick={handleCancel}
              className="flex-1 rounded-md border-0 text-[16px] font-semibold py-3"
              style={{ backgroundColor: "#7BA87B", color: "#F0EEE9" }}>
              Oui
            </AlertDialogAction>
            <AlertDialogCancel
              className="flex-1 rounded-md border-0 text-[16px] font-semibold py-3 mt-0"
              style={{ backgroundColor: "#E34454", color: "#F0EEE9" }}>
              Non
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Evaluation;