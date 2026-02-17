import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const CommunicationLancement = () => {
  const navigate = useNavigate();

  return (
    <section className="flex flex-col gap-6 px-3 pt-6 pb-6">
      <div className="flex justify-center px-4">
        <h1 className="text-[24px] font-semibold w-full max-w-[42rem] text-heading">Bordeaux, notre point de départ</h1>
      </div>

      <div className="flex flex-col gap-3 items-center px-4">
        <Card className="w-full max-w-[42rem] border-0 rounded-md">
          <CardContent className="p-4 text-card-foreground text-[14px] leading-relaxed">
            <p className="text-[18px] font-semibold mb-2">Où nous trouver ?</p>
            <p>
              Pour vous garantir un maximum de partenaires dès la sortie de l'avion, Tarmac se concentre sur un trajet unique pour son lancement :
            </p>
            <p className="mt-3">
              <strong>Départ :</strong> Aéroport de Bordeaux (BOD)
            </p>
            <p>
              <strong>Destination :</strong> Bordeaux Intra-muros
            </p>
            <p className="mt-3">
              En nous focalisant sur ce secteur, nous maximisons vos chances de trouver immédiatement un voyageur avec qui diviser la facture.
            </p>
          </CardContent>
        </Card>

        <Card className="w-full max-w-[42rem] border-0 rounded-md">
          <CardContent className="p-4 text-card-foreground text-[14px] leading-relaxed">
            <p className="text-[18px] font-semibold mb-2">On s'agrandit déjà !</p>
            <p>
              Nous préparons activement l'ouverture de nouvelles zones pour répondre à vos demandes :
            </p>
            <p className="mt-3">
              <strong>Très bientôt :</strong> Bègles, Pessac et Talence.
            </p>
            <p className="mt-1">
              <strong>Prochaine étape :</strong> Les autres grands aéroports de France.
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
