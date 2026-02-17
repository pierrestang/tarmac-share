import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const CommunicationLancement = () => {
  const navigate = useNavigate();

  return (
    <section className="flex flex-col gap-6 px-3 pt-6 pb-6">
      <div className="flex justify-center px-4">
        <h1 className="text-[24px] font-semibold w-full max-w-[42rem] text-heading">Zone de service actuelle</h1>
      </div>

      <div className="flex flex-col gap-3 items-center px-4">
        <Card className="w-full max-w-[42rem] border-0 rounded-md">
          <CardContent className="p-4 text-card-foreground text-[14px] leading-relaxed">
            <p className="text-[18px] font-semibold mb-2">Bordeaux, notre point de départ</p>
            <p>
              Pour notre lancement, Tarmac se concentre sur un trajet unique. L'idée est simple : en nous focalisant sur un seul secteur, nous vous garantissons de trouver un partenaire de partage en un clin d'œil à la sortie de votre avion.
            </p>
            <p className="mt-3">
              <strong>Départ :</strong> Aéroport de Bordeaux (BOD)
            </p>
            <p>
              <strong>Arrivée :</strong> Bordeaux Intra-muros
            </p>
            <p className="mt-3">
              En restant sur le centre-ville pour le moment, nous maximisons vos chances de diviser la facture avec un autre voyageur plutôt que de rentrer seul.
            </p>
          </CardContent>
        </Card>

        <Card className="w-full max-w-[42rem] border-0 rounded-md">
          <CardContent className="p-4 text-card-foreground text-[14px] leading-relaxed">
            <p className="text-[18px] font-semibold mb-2">On s'agrandit très vite</p>
            <p>
              Nous préparons déjà nos prochains arrêts pour élargir la communauté et couvrir davantage de besoins :
            </p>
            <p className="mt-3">
              <strong>Prochainement :</strong> Ouverture des trajets vers Mérignac, Pessac et Talence.
            </p>
            <p className="mt-1">
              <strong>Et après :</strong> Déploiement prévu dans les autres grands aéroports de France.
            </p>
          </CardContent>
        </Card>

        <Button
          className="w-full max-w-[42rem] rounded-full h-auto py-4 mt-2"
          onClick={() => navigate("/tarmac-dans-ma-ville")}
        >
          Me prévenir quand ma ville est disponible
        </Button>
      </div>
    </section>
  );
};

export default CommunicationLancement;
