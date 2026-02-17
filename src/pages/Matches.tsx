import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useTrajets } from "@/hooks/use-trajets";
import { useProfiles } from "@/hooks/use-profiles";
import { useDemandes } from "@/hooks/use-demandes";
import { VoyageurCardSmall } from "@/components/VoyageurCardSmall";
import { format, parse } from "date-fns";
import { fr } from "date-fns/locale";
import type { Trajet, MatchedTraveler, EnrichedMatchedTraveler } from "@/types/trajet";
import type { Profile } from "@/types/profile";

function formatBaggage(baggage: { small: number; medium: number; large: number }): string {
  const parts: string[] = [];
  if (baggage.small > 0) parts.push(`${baggage.small} petit${baggage.small > 1 ? "s" : ""}`);
  if (baggage.medium > 0) parts.push(`${baggage.medium} moyen${baggage.medium > 1 ? "s" : ""}`);
  if (baggage.large > 0) parts.push(`${baggage.large} grand${baggage.large > 1 ? "s" : ""}`);
  return parts.length > 0 ? parts.join(", ") : "Aucun bagage";
}

const Matches = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const trajetId = searchParams.get("trajetId");
  const { trajets, getTrajetById, findMatches } = useTrajets();
  const { getActiveProfile, getProfileById } = useProfiles();
  const { demandes } = useDemandes();

  const [trajet, setTrajet] = useState<Trajet | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [matches, setMatches] = useState<EnrichedMatchedTraveler[]>([]);

  const activeProfile = getActiveProfile();
  
  // Trajets "en cours" de l'utilisateur actif (pour la liste sans trajetId)
  const userTrajets = trajets.filter((t) => {
    if (t.profileId !== activeProfile?.id) return false;
    const hasCompletedDemande = demandes.some(
      (d) => d.status === "completed" && (d.fromTrajetId === t.id || d.toTrajetId === t.id)
    );
    return !hasCompletedDemande;
  });

  useEffect(() => {
    if (trajetId) {
      const t = getTrajetById(trajetId);
      setTrajet(t);
      if (t) {
        (async () => {
          const rawMatches = await findMatches(trajetId);
          const allMatches = rawMatches.map((match) => ({
            ...match,
            profile: getProfileById(match.trajet.profileId) || match.profile,
          }));
          
          // Filtrer les trajets qui ont une demande clôturée ou acceptée
          const filteredMatches = allMatches.filter((match) => {
            const hasCompletedDemande = demandes.some(
              (d) =>
                d.status === "completed" &&
                (d.fromTrajetId === match.trajet.id || d.toTrajetId === match.trajet.id)
            );
            if (hasCompletedDemande) return false;

            const hasAcceptedDemande = demandes.some(
              (d) =>
                d.status === "accepted" &&
                (d.fromProfileId === match.profile.id || d.toProfileId === match.profile.id)
            );
            if (hasAcceptedDemande) return false;

            return true;
          });
          
          const activeProfileId = getActiveProfile()?.id;
          const enrichedMatches = filteredMatches.map((match) => {
            const receivedDemande = demandes.find(
              (d) => d.fromProfileId === match.profile.id && d.toTrajetId === trajetId && d.status === "pending"
            );
            const sentDemande = demandes.find(
              (d) => d.fromProfileId === activeProfileId && d.toTrajetId === match.trajet.id && d.status === "pending"
            );
            return { 
              ...match, 
              receivedDemandeId: receivedDemande?.id || null,
              sentDemandeId: sentDemande?.id || null,
            };
          });
          setMatches(enrichedMatches);
        })();
      }
    }
    setProfile(getActiveProfile());
  }, [trajetId, getTrajetById, findMatches, getActiveProfile, demandes]);

  // Affichage de la liste des trajets si pas de trajetId
  if (!trajetId) {
    return (
      <section className="flex flex-col gap-4 pb-6 items-center px-4">
        <h1 className="text-[24px] font-semibold w-full max-w-[42rem] text-heading">Matches.</h1>
        
        {userTrajets.length === 0 ? (
          <Card className="w-full max-w-[42rem] border-0">
            <CardContent className="p-4">
              <p className="text-muted-foreground font-semibold">
                Aucun trajet publié pour le moment
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-4 w-full max-w-[42rem]">
            {userTrajets.map((t) => (
              <div key={t.id} className="flex flex-col gap-4">
                {/* Date au-dessus de la carte */}
                <p className="text-[16px] font-medium">
                  {(() => {
                    try {
                      const parsed = parse(t.date, "dd/MM/yyyy", new Date());
                      return format(parsed, "EEE d MMMM", { locale: fr }).replace(/^\w/, c => c.toUpperCase());
                    } catch {
                      return t.date;
                    }
                  })()}
                </p>

                <Card className="w-full border-0 overflow-hidden">
                  <CardContent className="flex flex-col gap-3 p-4 relative">
                    {/* Edit/Delete buttons - top right */}
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button
                        type="button"
                        aria-label="Modifier"
                        onClick={() => navigate(`/publier?edit=${t.id}`)}
                        className="p-1 text-muted-foreground hover:text-card-foreground"
                      >
                        <Pencil className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        aria-label="Supprimer"
                        className="p-1 text-destructive hover:text-destructive/80"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>

                    
                    
                    {/* Profile row */}
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        {activeProfile?.photo ? (
                          <AvatarImage src={activeProfile.photo} alt={activeProfile.firstName} />
                        ) : null}
                        <AvatarFallback className="text-[14px]">
                          {activeProfile?.firstName.charAt(0)}
                          {activeProfile?.lastName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-[16px] font-medium">
                          {activeProfile?.firstName}
                          {t.companions > 1 && (
                            <span className="text-muted-foreground font-normal">
                              {" "}et {t.companions === 2 ? "un" : t.companions === 3 ? "deux" : t.companions - 1} voyageur{t.companions > 2 ? "s" : ""}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex flex-col gap-1 text-[14px]">
                      <p>
                        <span className="text-muted-foreground">Départ : </span>
                        {t.departureStation}, {t.departureTime}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Arrivée : </span>
                        {t.destination}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Bagages : </span>
                        {formatBaggage(t.baggage)}
                      </p>
                      {t.additionalInfo && (
                        <p>
                          <span className="text-muted-foreground">Infos complémentaires : </span>
                          "{t.additionalInfo}"
                        </p>
                      )}
                    </div>
                  </CardContent>
                  
                  <Button
                    className="w-full rounded-t-none rounded-b-md h-12 text-[16px]"
                    onClick={() => navigate(`/matches?trajetId=${t.id}`)}
                  >
                    Voir les matches
                  </Button>
                </Card>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  }

  if (!trajet || !profile) {
    return (
      <section className="flex flex-col gap-4 pb-6 items-center px-4">
        <h1 className="text-[24px] font-semibold w-full max-w-[42rem] text-heading">Matches.</h1>
        <p className="text-muted-foreground">Trajet non trouvé.</p>
      </section>
    );
  }

  const formattedDate = (() => {
    try {
      const parsed = parse(trajet.date, "dd/MM/yyyy", new Date());
      return format(parsed, "EEE d MMMM", { locale: fr }).replace(/^\w/, c => c.toUpperCase());
    } catch {
      return trajet.date;
    }
  })();

  return (
    <section className="flex flex-col gap-4 pb-6 items-center px-4">
      <h1 className="text-[24px] font-semibold w-full max-w-[42rem] text-heading">Matches.</h1>

      {/* Accordion principal avec la date */}
      <Accordion type="multiple" defaultValue={["date-section"]} className="w-full max-w-[42rem]">
        <AccordionItem value="date-section" className="border-0">
          <AccordionTrigger className="text-[18px] font-semibold hover:no-underline text-heading">
            {formattedDate}
          </AccordionTrigger>
          <AccordionContent className="pt-3 flex flex-col gap-4">
            
            {/* Titre Mon trajet (blanc sur fond bleu) */}
            
            
            {/* Carte Mon trajet */}
            <div className="bg-card rounded-md shadow-[0_8px_24px_rgba(0,0,0,0.06)] p-4 flex flex-col gap-3">
              {/* Profile row */}
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  {profile.photo ? (
                    <AvatarImage src={profile.photo} alt={profile.firstName} />
                  ) : null}
                  <AvatarFallback className="text-[14px]">
                    {profile.firstName.charAt(0)}
                    {profile.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-[16px] font-medium text-card-foreground">
                    {profile.firstName}
                    {trajet.companions > 1 && (
                      <span className="text-muted-foreground font-normal">
                        {" "}et {trajet.companions === 2 ? "un" : trajet.companions === 3 ? "deux" : trajet.companions - 1} voyageur{trajet.companions > 2 ? "s" : ""}
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Details */}
              <div className="flex flex-col gap-1 text-[14px] text-card-foreground">
                <p>
                  <span className="text-muted-foreground">Départ : </span>
                  {trajet.departureStation}, {trajet.departureTime}
                </p>
                <p>
                  <span className="text-muted-foreground">Arrivée : </span>
                  {trajet.destination}
                </p>
                <p>
                  <span className="text-muted-foreground">Bagages : </span>
                  {formatBaggage(trajet.baggage)}
                </p>
                {trajet.additionalInfo && (
                  <p>
                    <span className="text-muted-foreground">Infos complémentaires : </span>
                    "{trajet.additionalInfo}"
                  </p>
                )}
              </div>
            </div>
            
            {/* Titre Voyageur(s) (blanc sur fond bleu) */}
            <h2 className="text-[18px] font-semibold text-heading">Voyageur(s)</h2>
            
            {/* Cartes voyageurs */}
            {matches.length === 0 ? (
              <p className="text-center text-heading py-4">
                Aucun voyageur pour l'instant...
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {matches.map((match) => (
                  <VoyageurCardSmall key={match.trajet.id} match={match} myTrajetId={trajetId!} />
                ))}
              </div>
            )}
            
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
};

export default Matches;
