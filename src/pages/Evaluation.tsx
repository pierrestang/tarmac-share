import { useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useMessages } from "@/hooks/use-messages";
import { useProfiles } from "@/hooks/use-profiles";
import { useDemandes } from "@/hooks/use-demandes";
import { useNotifications } from "@/hooks/use-notifications";
import { supabase } from "@/integrations/supabase/client";


const Evaluation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const conversationId = searchParams.get("conversationId");
  const ratedProfileId = searchParams.get("ratedProfileId");

  const { closeConversation, addSystemMessage, saveRating } = useMessages();
  const { getActiveProfile } = useProfiles();
  const { completeDemande, saveDemandeSnapshot } = useDemandes();
  const { markReadByDemandeId } = useNotifications();

  const activeProfile = getActiveProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasRedirected = useRef(false);

  if (!conversationId || !ratedProfileId) {
    navigate("/messages", { replace: true });
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

    hasRedirected.current = true;
    navigate("/trajets", { replace: true });
  };

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex flex-col gap-2 px-4 pt-6 pb-4">
        <button onClick={() => navigate(-1)} className="p-1 self-start">
          <ArrowLeft className="h-6 w-6 text-heading" />
        </button>
        <h1 className="text-[22px] font-semibold text-heading whitespace-nowrap">
          Le trajet a-t-il eu lieu ?
        </h1>
      </div>

      <div className="flex-1 px-4 pb-6">
        <div className="max-w-[42rem] mx-auto">
          <Card className="border-0 rounded-md shadow-none bg-transparent">
            <CardContent className="p-0 flex flex-col gap-6">
              <div className="flex gap-3">
                <Button
                  onClick={() => handleAnswer(true)}
                  disabled={isSubmitting}
                  className="flex-1 rounded-full text-[24px]"
                >
                  {isSubmitting ? "Envoi..." : "👍"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleAnswer(false)}
                  disabled={isSubmitting}
                  className="flex-1 rounded-full text-[24px]"
                >
                  👎
                </Button>
              </div>

              {!activeProfile && (
                <p className="text-sm text-destructive text-center">
                  Profil non chargé. Veuillez patienter ou rafraîchir la page.
                </p>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default Evaluation;