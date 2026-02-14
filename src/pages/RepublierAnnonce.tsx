import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useProfiles } from "@/hooks/use-profiles";
import { useDemandes } from "@/hooks/use-demandes";
import { useTrajets } from "@/hooks/use-trajets";
import { useRepublications } from "@/hooks/use-republications";

const RepublierAnnonce = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const demandeId = searchParams.get("demandeId");

  const { getActiveProfile } = useProfiles();
  const { getDemandeById, saveDemandeSnapshot } = useDemandes();
  const { getTrajetById, deleteTrajet, createTrajet } = useTrajets();
  const { getFreeRepublications } = useRepublications();

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

    // CRITICAL: Save snapshot BEFORE deleting the trajet
    await saveDemandeSnapshot(demandeId);

    // Republication is always free - just recreate the trajet with isRepublished flag
    await deleteTrajet(originalTrajet.id);
    const newTrajet = await createTrajet({
      ...originalTrajet,
      isRepublished: true,
    });
    // Update lastPublishedTrajetId to point to new trajet
    localStorage.setItem("lastPublishedTrajetId", newTrajet.id);

    navigate("/trajets", { replace: true });
  };

  const handleCancel = () => {
    navigate("/trajets", { replace: true });
  };

  // Don't render if params are missing
  if (!demandeId) {
    return null;
  }

  return (
    <section className="flex flex-col gap-4 pb-6">
      {/* Header */}
      <div className="flex justify-center px-4">
        <h1 className="text-[24px] font-semibold w-full max-w-[42rem] text-heading">
          Republier cette annonce ?
        </h1>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-4 items-center px-4">
          <Card className="border-0 rounded-md w-full max-w-[42rem]">
            <CardContent className="p-6 flex flex-col gap-6">
              {/* Explanation */}
              <p className="text-[14px] text-card-foreground">
                {freeRepublicationsRemaining > 0
                  ? `Votre prochaine demande sera offerte. Il vous reste ${freeRepublicationsRemaining} demande${freeRepublicationsRemaining > 1 ? "s" : ""} gratuite${freeRepublicationsRemaining > 1 ? "s" : ""}.`
                  : "Votre prochaine demande sera au tarif normal de 1,99 €."}
              </p>

              {/* Buttons */}
              <div className="flex flex-col gap-2">
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
            </CardContent>
          </Card>
      </div>
    </section>
  );
};

export default RepublierAnnonce;
