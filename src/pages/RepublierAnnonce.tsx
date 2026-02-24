import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useProfiles } from "@/hooks/use-profiles";
import { useDemandes } from "@/hooks/use-demandes";
import { useTrajets } from "@/hooks/use-trajets";
import { useRepublications } from "@/hooks/use-republications";
import { useAppSettings } from "@/hooks/use-app-settings";
import { ArrowLeft } from "lucide-react";

const RepublierAnnonce = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const demandeId = searchParams.get("demandeId");

  const { getActiveProfile } = useProfiles();
  const { getDemandeById, saveDemandeSnapshot } = useDemandes();
  const { getTrajetById, createTrajet } = useTrajets();
  const { getFreeRepublications } = useRepublications();
  const { isFreeMode } = useAppSettings();

  const activeProfile = getActiveProfile();
  const currentProfileId = activeProfile?.id || "";
  const freeRepublicationsRemaining = currentProfileId ? getFreeRepublications(currentProfileId) : 0;

  // Guard: redirect if params are missing
  useEffect(() => {
    if (!demandeId) {
      navigate("/trajets", { replace: true });
    }
  }, [demandeId, navigate]);

  const handleRepublish = async () => {
    if (!demandeId || !currentProfileId) {
      navigate("/trajets", { replace: true });
      return;
    }

    const demande = getDemandeById(demandeId);
    if (!demande) {
      navigate("/trajets", { replace: true });
      return;
    }

    // Determine which trajet to republish (the user's own trajet)
    const isFromUser = demande.fromProfileId === currentProfileId;
    const trajetId = isFromUser ? demande.fromTrajetId : demande.toTrajetId;
    const originalTrajet = getTrajetById(trajetId);

    if (!originalTrajet) {
      navigate("/trajets", { replace: true });
      return;
    }

    // Save snapshot to preserve historical data
    await saveDemandeSnapshot(demandeId);

    // Create a new trajet copy with isRepublished flag
    // Keep the original trajet so the completed demande (and historique) remains intact
    const { id: _oldId, createdAt: _oldCreatedAt, ...trajetData } = originalTrajet;
    const newTrajet = await createTrajet({
      ...trajetData,
      isRepublished: true,
    });
    // Update lastPublishedTrajetId to point to new trajet
    localStorage.setItem("lastPublishedTrajetId", newTrajet.id);

    // Mark this demande as already republished
    const republished = JSON.parse(localStorage.getItem("republishedDemandeIds") || "[]");
    if (!republished.includes(demandeId)) {
      republished.push(demandeId);
      localStorage.setItem("republishedDemandeIds", JSON.stringify(republished));
    }

    toast({
      title: "Trajet republié ! Votre annonce est de nouveau visible.",
      className: "bg-transparent border-0 shadow-none",
      style: { backgroundColor: '#7BA87B', color: '#F0EEE9' },
    });
    navigate("/trajets", { replace: true });
  };

  const handleCancel = () => {
    if (demandeId) {
      const declined = JSON.parse(localStorage.getItem("declinedRepublishDemandeIds") || "[]");
      if (!declined.includes(demandeId)) {
        declined.push(demandeId);
        localStorage.setItem("declinedRepublishDemandeIds", JSON.stringify(declined));
      }
    }
    navigate("/trajets", { replace: true });
  };

  // Don't render if params are missing
  if (!demandeId) {
    return null;
  }

  return (
    <section className="flex flex-col gap-4 pb-6">
      {/* Header with back arrow + title */}
      <div className="flex flex-col px-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="self-start text-foreground mb-1"
          aria-label="Retour"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-[24px] font-semibold w-full max-w-[42rem] text-heading">
          Republier cette annonce ?
        </h1>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-4 items-center px-4">
        <Card className="border-0 rounded-md w-full max-w-[42rem]">
          <CardContent className="p-6 flex flex-col gap-4">
            <p className="text-[16px] font-semibold text-card-foreground">
              Votre trajet a été annulé ?
            </p>
            <p className="text-[14px] text-card-foreground">
              Vous pouvez choisir de le republier immédiatement pour retrouver un partenaire. Pour vous aider à repartir sans frais, nous vous offrons 2 actions gratuites (envois ou acceptations de demandes) valables uniquement sur ce trajet.
            </p>
          </CardContent>
        </Card>

        {/* Buttons outside the card */}
        <div className="flex flex-col gap-2 w-full max-w-[42rem]">
          <Button
            onClick={handleRepublish}
            className="rounded-full"
          >
            Republier
          </Button>

          <Button
            variant="outline"
            onClick={handleCancel}
            className="rounded-full"
          >
            Non merci
          </Button>
        </div>
      </div>
    </section>
  );
};

export default RepublierAnnonce;
