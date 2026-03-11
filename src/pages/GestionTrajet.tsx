import { useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useMessages } from "@/hooks/use-messages";
import { useProfiles } from "@/hooks/use-profiles";
import { useDemandes } from "@/hooks/use-demandes";
import { useNotifications } from "@/hooks/use-notifications";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const GestionTrajet = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const conversationId = searchParams.get("conversationId") || "";
  const demandeId = searchParams.get("demandeId") || "";
  const ratedProfileId = searchParams.get("ratedProfileId") || "";
  const isClosed = searchParams.get("closed") === "true";

  const { closeConversation, addSystemMessage, saveRating, getConversationById, sendMessage } = useMessages();
  const { getActiveProfile } = useProfiles();
  const { completeDemande, saveDemandeSnapshot } = useDemandes();
  const { markReadByDemandeId, createNotification } = useNotifications();

  const activeProfile = getActiveProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const hasRedirected = useRef(false);

  const handleAnswer = async (wasUseful: boolean) => {
    if (isSubmitting || hasRedirected.current) return;
    if (!activeProfile || !conversationId) return;

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

    await saveRating({
      conversationId,
      raterId: activeProfile.id,
      ratedProfileId: ratedProfileId,
      score: wasUseful ? 5 : 1,
      wasUseful,
      comment: "",
    });

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
    <div className="p-4">
      <button onClick={() => navigate(-1)} className="p-1 self-start mb-2">
        <ArrowLeft className="h-6 w-6 text-heading" />
      </button>

      <h1 className="text-[24px] font-semibold mb-4 w-full text-heading">Mon trajet.</h1>

      {demandeId && (
        <button
          onClick={() => navigate(`/demande-consulter?demandeId=${demandeId}`)}
          className="flex items-center justify-center gap-2 w-full rounded-md px-4 py-3 text-[16px] font-semibold border-0 mb-4"
          style={{ backgroundColor: "#4E657A", color: "#F0EEE9" }}>
          <span>Voir le trajet</span>
        </button>
      )}

      <div className="rounded-md p-4 mb-4" style={{ backgroundColor: "#F0EEE9" }}>
        <p className="text-[14px] font-semibold mb-1" style={{ color: "#4E657A" }}>Votre feuille de route</p>
        <ul className="text-[14px] list-disc pl-4 space-y-1" style={{ color: "#4E657A" }}>
          <li>Retrouvez vos informations de trajet pour vous coordonner.</li>
          <li>Une fois à destination, cliquez sur <span className="font-bold">Terminer le trajet</span> pour confirmer son bon déroulement (ou signaler un rendez-vous manqué).</li>
          <li>Pour un empêchement avant le départ, utilisez <span className="font-bold">Annuler le trajet</span>.</li>
        </ul>
      </div>

      {!isClosed && (
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setShowEndDialog(true)}
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 w-full rounded-md px-4 py-3 text-[16px] font-semibold border-0"
            style={{ backgroundColor: "#7BA87B", color: "#F0EEE9" }}>
            <span>Terminer le trajet</span>
          </button>

          <button
            onClick={() => setShowCancelDialog(true)}
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 w-full rounded-md px-4 py-3 text-[16px] font-semibold border-0"
            style={{ backgroundColor: "#E34454", color: "#F0EEE9" }}>
            <span>Annuler le trajet</span>
          </button>
        </div>
      )}

      {/* End trip dialog */}
      <AlertDialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <AlertDialogContent className="rounded-md">
          <button onClick={() => setShowEndDialog(false)} className="p-1 self-start">
            <ArrowLeft className="h-6 w-6 text-heading" />
          </button>
          <AlertDialogHeader>
            <AlertDialogTitle>Le trajet a-t-il eu lieu ?</AlertDialogTitle>
            <AlertDialogDescription className="hidden" />
          </AlertDialogHeader>
          <AlertDialogFooter className="flex !flex-row gap-3 items-center mt-0">
            <AlertDialogAction
              onClick={() => handleAnswer(true)}
              disabled={isSubmitting}
              className="flex-1 rounded-md border-0 text-[16px] font-semibold py-3"
              style={{ backgroundColor: "#7BA87B", color: "#F0EEE9" }}>
              {isSubmitting ? "Envoi..." : "Oui"}
            </AlertDialogAction>
            <AlertDialogCancel
              onClick={() => handleAnswer(false)}
              disabled={isSubmitting}
              className="flex-1 rounded-md border-0 text-[16px] font-semibold py-3 mt-0"
              style={{ backgroundColor: "#E34454", color: "#F0EEE9" }}>
              Non
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel trip dialog */}
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

export default GestionTrajet;
