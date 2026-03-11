import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DemandeCard } from "@/components/DemandeCard";
import { MonTrajetCard } from "@/components/MonTrajetCard";
import { useDemandes } from "@/hooks/use-demandes";
import { useTrajets } from "@/hooks/use-trajets";
import { useProfiles } from "@/hooks/use-profiles";
import { useMessages } from "@/hooks/use-messages";
import { supabase } from "@/integrations/supabase/client";
import { format, parse } from "date-fns";
import { fr } from "date-fns/locale";

const Trajets = () => {
  const navigate = useNavigate();
  const { demandes, refuseDemande, hasDemandesForTrajet, isLoaded: demandesLoaded } = useDemandes();
  const { trajets, getTrajetById, deleteTrajet, isLoaded: trajetsLoaded } = useTrajets();
  const { profiles, getActiveProfile, isLoaded: profilesLoaded } = useProfiles();
  const { getConversationByDemandeId } = useMessages();

  // Ratings for completed demandes: demandeId -> tripRealized (true = both yes, false = at least one no)
  const [tripRealizedMap, setTripRealizedMap] = useState<Record<string, boolean>>({});
  const [ratingsLoaded, setRatingsLoaded] = useState(false);

  const activeProfile = getActiveProfile();
  const currentProfileId = activeProfile?.id || "";

  // Get my published trajets (trajets I created)
  const myPublishedTrajets = useMemo(() => {
    return trajets.filter((t) => t.profileId === currentProfileId);
  }, [trajets, currentProfileId]);

  // Filter demandes for current profile
  const myDemandes = useMemo(() => {
    return demandes.filter(
      (d) => d.fromProfileId === currentProfileId || d.toProfileId === currentProfileId
    );
  }, [demandes, currentProfileId]);

  // Categorize demandes
  const enCours = useMemo(() => {
    return myDemandes.filter((d) => d.status === "accepted");
  }, [myDemandes]);

  const enAttenteDemandes = useMemo(() => {
    return myDemandes.filter((d) => d.status === "pending");
  }, [myDemandes]);

  const historique = useMemo(() => {
    return myDemandes.filter((d) => d.status === "refused" || d.status === "completed");
  }, [myDemandes]);

  // Fetch ratings for completed demandes to determine tripRealized
  useEffect(() => {
    const completedDemandes = historique.filter((d) => d.status === "completed" && !d.wasCancelled);
    if (completedDemandes.length === 0) { setRatingsLoaded(true); return; }

    const fetchRatings = async () => {
      const map: Record<string, boolean> = {};
      for (const d of completedDemandes) {
        const conv = getConversationByDemandeId(d.id);
        if (!conv) continue;
        const { data } = await supabase
          .from("conversation_ratings")
          .select("was_useful")
          .eq("conversation_id", conv.id);
        if (data && data.length > 0) {
          const allYes = data.every((r: any) => r.was_useful === true);
          map[d.id] = allYes;
        }
      }
      setTripRealizedMap(map);
      setRatingsLoaded(true);
    };
    fetchRatings();
  }, [historique, getConversationByDemandeId]);

  // Get trajet IDs that have accepted demandes (exclude from "en attente" section)
  const trajetsWithAcceptedDemandes = useMemo(() => {
    const trajetIds = new Set<string>();
    enCours.forEach((d) => {
      trajetIds.add(d.fromTrajetId);
      trajetIds.add(d.toTrajetId);
    });
    return trajetIds;
  }, [enCours]);

  // Get trajet IDs that have completed demandes (exclude from "en attente" section)
  const trajetsWithCompletedDemandes = useMemo(() => {
    const trajetIds = new Set<string>();
    historique.filter((d) => d.status === "completed").forEach((d) => {
      trajetIds.add(d.fromTrajetId);
      trajetIds.add(d.toTrajetId);
    });
    return trajetIds;
  }, [historique]);

  // Vérifier si l'utilisateur a un trajet en cours (demande acceptée)
  const hasActiveTrip = enCours.length > 0;

  // Trajet IDs that already have a pending demande involving the current user
  const trajetsWithPendingDemandes = useMemo(() => {
    const trajetIds = new Set<string>();
    enAttenteDemandes.forEach((d) => {
      trajetIds.add(d.fromTrajetId);
      trajetIds.add(d.toTrajetId);
    });
    return trajetIds;
  }, [enAttenteDemandes]);

  // Trajets publiés à afficher dans "En attente"
  const myPendingTrajets = useMemo(() => {
    return myPublishedTrajets.filter((t) => {
      // Exclure les trajets directement liés à une demande accepted ou completed
      if (trajetsWithAcceptedDemandes.has(t.id) || trajetsWithCompletedDemandes.has(t.id)) {
        return false;
      }
      // Exclure les trajets qui ont déjà une demande pending (affichés comme DemandeCard)
      if (trajetsWithPendingDemandes.has(t.id)) {
        return false;
      }
      return true;
    });
  }, [myPublishedTrajets, trajetsWithAcceptedDemandes, trajetsWithCompletedDemandes, trajetsWithPendingDemandes]);
  // Get profile for a demande (the other person)
  const getOtherProfile = (demande: typeof demandes[0]) => {
    const otherId =
      demande.fromProfileId === currentProfileId
        ? demande.toProfileId
        : demande.fromProfileId;
    return profiles.find((p) => p.id === otherId) || null;
  };

  // Get trajet for display
  const getTrajet = (demande: typeof demandes[0]) => {
    // Show the trajet of the other person
    const trajetId =
      demande.fromProfileId === currentProfileId
        ? demande.toTrajetId
        : demande.fromTrajetId;
    return getTrajetById(trajetId);
  };

  const handleRefuse = async (id: string) => {
    await refuseDemande(id);
  };

  const renderDemandeList = (list: typeof demandes) => {
    if (list.length === 0) {
      return null;
    }

    return (
      <div className="flex flex-col gap-3">
        {list.map((demande) => (
          <DemandeCard
            key={demande.id}
            demande={demande}
            otherProfile={getOtherProfile(demande)}
            trajet={getTrajet(demande)}
            currentProfileId={currentProfileId}
            onRefuse={handleRefuse}
          />
        ))}
      </div>
    );
  };

  const handleDelete = async (id: string) => {
    await deleteTrajet(id);
  };

  const hasEnAttenteContent = myPendingTrajets.length > 0 || enAttenteDemandes.length > 0;

  if (!demandesLoaded || !trajetsLoaded || !profilesLoaded || !ratingsLoaded) return null;

  return (
    <section aria-label="Trajets" className="flex flex-col gap-4 pb-6">
      <div className="flex justify-center">
        <h1 className="text-[24px] font-semibold w-full max-w-[42rem] text-heading">Consulter mes trajets.</h1>
      </div>

      <div className="flex flex-col gap-4 items-center">
        {/* En cours */}
        <Accordion type="multiple" defaultValue={enCours.length > 0 ? ["en-cours"] : []} className="w-full max-w-[42rem]">
          <AccordionItem value="en-cours" className="border-0">
            <div className="bg-card rounded-md overflow-hidden">
              <AccordionTrigger className="font-semibold hover:no-underline px-4 text-card-foreground">
                <span className="flex items-center gap-2">
                  En cours
                  <span className="inline-flex min-w-5 h-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold border border-[hsl(var(--button-border))] bg-[hsl(var(--button-bg))] text-[hsl(var(--button-fg))]">
                    {enCours.length}
                  </span>
                </span>
              </AccordionTrigger>
            </div>
            <AccordionContent className="pt-3">
              {enCours.length === 0 ? (
                <div className="pb-2">
                   <span className="text-[14px] text-foreground">
                    Aucune demande pour le moment
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {enCours.map((demande) => {
                    const myTrajetId = demande.fromProfileId === currentProfileId
                      ? demande.fromTrajetId
                      : demande.toTrajetId;
                    const myTrajet = getTrajetById(myTrajetId);
                    const formattedDate = (() => {
                      if (!myTrajet) return null;
                      try {
                        const parsed = parse(myTrajet.date, "dd/MM/yyyy", new Date());
                        return format(parsed, "EEE d MMMM", { locale: fr }).replace(/^\w/, c => c.toUpperCase());
                      } catch {
                        return myTrajet.date;
                      }
                    })();

                    return (
                      <div key={demande.id} className="flex flex-col gap-2">
                        {formattedDate && (
                          <p className="text-[16px] font-semibold text-heading">{formattedDate}</p>
                        )}
                        <DemandeCard
                          demande={demande}
                          otherProfile={getOtherProfile(demande)}
                          trajet={getTrajet(demande)}
                          currentProfileId={currentProfileId}
                          onRefuse={handleRefuse}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* En attente */}
        <Accordion type="multiple" defaultValue={hasEnAttenteContent ? ["en-attente"] : []} className="w-full max-w-[42rem]">
          <AccordionItem value="en-attente" className="border-0">
            <div className="bg-card rounded-md overflow-hidden">
              <AccordionTrigger className="font-semibold hover:no-underline px-4 text-card-foreground">
                <span className="flex items-center gap-2">
                  En attente
                  {(enAttenteDemandes.length + myPendingTrajets.length) > 0 && (
                    <span className="inline-flex min-w-5 h-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold border border-[hsl(var(--button-border))] bg-[hsl(var(--button-bg))] text-[hsl(var(--button-fg))]">
                      {enAttenteDemandes.length + myPendingTrajets.length}
                    </span>
                  )}
                </span>
              </AccordionTrigger>
            </div>
            <AccordionContent className="pt-3 pb-0">
              {!hasEnAttenteContent ? (
                <div className="pb-2">
                   <span className="text-[14px] text-foreground">
                    Aucune demande pour le moment
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {/* Demandes en attente */}
                  {enAttenteDemandes.map((demande) => {
                    const myTrajetId = demande.fromProfileId === currentProfileId
                      ? demande.fromTrajetId
                      : demande.toTrajetId;
                    const myTrajet = getTrajetById(myTrajetId);
                    const formattedDate = (() => {
                      if (!myTrajet) return null;
                      try {
                        const parsed = parse(myTrajet.date, "dd/MM/yyyy", new Date());
                        return format(parsed, "EEE d MMMM", { locale: fr }).replace(/^\w/, c => c.toUpperCase());
                      } catch {
                        return myTrajet.date;
                      }
                    })();

                    return (
                      <div key={demande.id} className="flex flex-col gap-2">
                        {formattedDate && (
                          <p className="text-[16px] font-semibold text-heading">{formattedDate}</p>
                        )}
                        <DemandeCard
                          demande={demande}
                          otherProfile={getOtherProfile(demande)}
                          trajet={getTrajet(demande)}
                          currentProfileId={currentProfileId}
                          onRefuse={handleRefuse}
                        />
                      </div>
                    );
                  })}

                  {/* Mes trajets publiés sans demande */}
                  {myPendingTrajets.map((trajet) => {
                    const formattedDate = (() => {
                      try {
                        const parsed = parse(trajet.date, "dd/MM/yyyy", new Date());
                        return format(parsed, "EEE d MMMM", { locale: fr }).replace(/^\w/, c => c.toUpperCase());
                      } catch {
                        return trajet.date;
                      }
                    })();
                    
                    return (
                      <div key={trajet.id} className="flex flex-col gap-2">
                        <p className="text-[16px] font-semibold text-heading">{formattedDate}</p>
                        <MonTrajetCard
                          trajet={trajet}
                          profile={activeProfile!}
                          canEditOrDelete={!hasDemandesForTrajet(trajet.id)}
                          onDelete={handleDelete}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Historique */}
        <Accordion type="multiple" className="w-full max-w-[42rem]">
          <AccordionItem value="historique" className="border-0">
            <div className="bg-card rounded-md overflow-hidden">
              <AccordionTrigger className="font-semibold hover:no-underline px-4 text-card-foreground">
                <span className="flex items-center gap-2">
                  Historique
                  {historique.length > 0 && (
                    <span className="inline-flex min-w-5 h-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold border border-[hsl(var(--button-border))] bg-[hsl(var(--button-bg))] text-[hsl(var(--button-fg))]">
                      {historique.length}
                    </span>
                  )}
                </span>
              </AccordionTrigger>
            </div>
            <AccordionContent className="pt-3">
              {historique.length === 0 ? (
                <div className="pb-2">
                  <span className="text-[14px] text-foreground">
                    Aucune demande pour le moment
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {historique.map((demande) => {
                    const trajetId = demande.fromProfileId === currentProfileId
                      ? demande.fromTrajetId
                      : demande.toTrajetId;
                    const trajet = getTrajetById(trajetId);
                    const formattedDate = (() => {
                      if (!trajet) return null;
                      try {
                        const parsed = parse(trajet.date, "dd/MM/yyyy", new Date());
                        return format(parsed, "EEE d MMMM", { locale: fr }).replace(/^\w/, c => c.toUpperCase());
                      } catch {
                        return trajet.date;
                      }
                    })();

                    return (
                      <div key={demande.id} className="flex flex-col gap-2">
                        {formattedDate && (
                          <p className="text-[16px] font-semibold text-heading">{formattedDate}</p>
                        )}
                        <DemandeCard
                          demande={demande}
                          otherProfile={getOtherProfile(demande)}
                          trajet={getTrajet(demande)}
                          currentProfileId={currentProfileId}
                          tripRealized={demande.id in tripRealizedMap ? tripRealizedMap[demande.id] : undefined}
                          onRefuse={handleRefuse}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

    </section>
  );
};

export default Trajets;
